export async function POST(request) {
  const body = await request.json();
  const { useWebSearch, ...rest } = body;
  const requestBody = { ...rest };
  if (useWebSearch) {
    requestBody.tools = [{ type: "web_search_20250305", name: "web_search" }];
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      let messages = requestBody.messages;
      let finalText = "";

      try {
        while (true) {
          const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.ANTHROPIC_API_KEY,
              "anthropic-version": "2023-06-01",
              "anthropic-beta": "web-search-2025-03-05",
            },
            body: JSON.stringify({ ...requestBody, messages, stream: true }),
          });

          if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            send({ error: err.error || { message: `HTTP ${response.status}` } });
            controller.close();
            return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let assistantContent = [];
          let currentTextBlock = null;
          let currentToolBlock = null;
          let stopReason = null;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop();

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (!data || data === "[DONE]") continue;
              try {
                const event = JSON.parse(data);
                if (event.type === "content_block_start") {
                  if (event.content_block.type === "text") {
                    currentTextBlock = { type: "text", text: "" };
                    assistantContent.push(currentTextBlock);
                  } else if (event.content_block.type === "tool_use") {
                    currentToolBlock = { ...event.content_block, input: "" };
                    assistantContent.push(currentToolBlock);
                  }
                } else if (event.type === "content_block_delta") {
                  if (event.delta.type === "text_delta" && currentTextBlock) {
                    currentTextBlock.text += event.delta.text;
                    finalText += event.delta.text;
                    send({ type: "text_delta", text: event.delta.text });
                  } else if (event.delta.type === "input_json_delta" && currentToolBlock) {
                    currentToolBlock.input += event.delta.partial_json;
                  }
                } else if (event.type === "content_block_stop") {
                  if (currentToolBlock && typeof currentToolBlock.input === "string") {
                    try { currentToolBlock.input = JSON.parse(currentToolBlock.input); } catch {}
                  }
                  currentTextBlock = null;
                  currentToolBlock = null;
                } else if (event.type === "message_delta") {
                  stopReason = event.delta.stop_reason;
                } else if (event.type === "error") {
                  send({ error: event.error });
                  controller.close();
                  return;
                }
              } catch {}
            }
          }

          if (stopReason !== "tool_use") {
            send({ type: "done", content: [{ type: "text", text: finalText }] });
            controller.close();
            return;
          }

          const toolUseBlocks = assistantContent.filter(b => b.type === "tool_use");
          const toolResults = toolUseBlocks.map(b => ({
            type: "tool_result",
            tool_use_id: b.id,
            content: "search completed",
          }));
          messages = [
            ...messages,
            { role: "assistant", content: assistantContent },
            { role: "user", content: toolResults },
          ];
        }
      } catch (err) {
        send({ error: { message: err.message } });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    }
  });
}
