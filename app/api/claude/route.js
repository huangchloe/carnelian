export async function POST(request) {
  const body = await request.json();
  const { useWebSearch, ...rest } = body;

  const requestBody = { ...rest };

  // Convert plain string system prompt to a cacheable content block.
  // This tells Anthropic to cache the (large, static) system prompt so it
  // doesn't count against your input-token-per-minute rate limit on
  // subsequent calls with the same prompt.
  if (typeof requestBody.system === "string") {
    requestBody.system = [
      {
        type: "text",
        text: requestBody.system,
        cache_control: { type: "ephemeral" },
      },
    ];
  }

  if (useWebSearch) {
    requestBody.tools = [{ type: "web_search_20250305", name: "web_search" }];
  }

  let messages = requestBody.messages;
  let finalText = "";

  while (true) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        // prompt-caching-2024-07-31 is required for cache_control support.
        // Combine both betas as a comma-separated list.
        "anthropic-beta": "prompt-caching-2024-07-31,web-search-2025-03-05",
      },
      body: JSON.stringify({ ...requestBody, messages }),
    });

    const data = await response.json();
    if (data.error) return Response.json(data);

    const assistantContent = data.content || [];
    const textBlocks = assistantContent.filter(b => b.type === "text").map(b => b.text).join("");
    finalText += textBlocks;

    if (data.stop_reason !== "tool_use") {
      const cleanText = finalText.replace(/<cite[^>]*>|<\/cite>/g, '');
return Response.json({ content: [{ type: "text", text: cleanText }] });
    }

    const toolUseBlocks = assistantContent.filter(b => b.type === "tool_use");
    const toolResults = toolUseBlocks.map(b => ({
      type: "tool_result",
      tool_use_id: b.id,
      content: b.type === "web_search_tool_result" ? b.content : "search completed",
    }));

    messages = [
      ...messages,
      { role: "assistant", content: assistantContent },
      { role: "user", content: toolResults },
    ];
  }
}
