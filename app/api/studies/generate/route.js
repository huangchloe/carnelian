import { createClient } from '@/lib/supabase/server';
import { STUDY_SYSTEM_PROMPT, buildStudyPrompt } from '@/lib/voice';

export const runtime = 'nodejs';
export const maxDuration = 60;

function sse(event) {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  let body;
  try { body = await request.json(); }
  catch { return new Response('Bad request', { status: 400 }); }

  const { findIds } = body;
  if (!Array.isArray(findIds) || findIds.length < 2) {
    return new Response('Need at least 2 finds', { status: 400 });
  }

  const { data: finds, error: findsError } = await supabase
    .from('finds')
    .select('*')
    .in('id', findIds)
    .eq('user_id', user.id);

  if (findsError || !finds || finds.length < 2) {
    return new Response('Finds not found', { status: 404 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event) => controller.enqueue(encoder.encode(sse(event)));

      try {
        send({ type: 'status', stage: 'composing' });

        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-opus-4-7',
            max_tokens: 2000,
            stream: true,
            system: STUDY_SYSTEM_PROMPT,
            messages: [{ role: 'user', content: buildStudyPrompt(finds) }],
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Claude API: ${res.status} ${errText.slice(0, 200)}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6).trim();
            if (!payload || payload === '[DONE]') continue;
            try {
              const event = JSON.parse(payload);
              if (event.type === 'content_block_delta' && event.delta?.text) {
                fullText += event.delta.text;
                send({ type: 'delta', text: event.delta.text });
              }
            } catch {}
          }
        }

        let parsed;
        try {
          const cleaned = fullText.trim().replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '').trim();
          parsed = JSON.parse(cleaned);
        } catch (e) {
          throw new Error('Failed to parse Claude response as JSON');
        }

        const { data: inserted, error: insertError } = await supabase
          .from('studies')
          .insert({
            user_id: user.id,
            title: parsed.title,
            kicker: parsed.kicker,
            dek: parsed.dek,
            body: { body: parsed.body, punch: parsed.punch },
            waypoints: parsed.waypoints,
          })
          .select('id')
          .single();

        if (insertError) throw insertError;

        const joins = finds.map((f, i) => ({
          study_id: inserted.id,
          find_id: f.id,
          position: i,
        }));
        await supabase.from('study_finds').insert(joins);

        send({ type: 'complete', studyId: inserted.id });
      } catch (err) {
        send({ type: 'error', message: err.message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
