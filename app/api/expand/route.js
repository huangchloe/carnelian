import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const COLOR_MAP = {
  person: '#378ADD', place: '#1D9E75', movement: '#BA7517',
  work: '#7F77DD', concept: '#993C1D', default: '#888880',
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const concept = searchParams.get('concept') || '';
  const context = searchParams.get('context') || '';

  if (!concept) return NextResponse.json({ connections: [] });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      description: 'No API key configured.',
      connections: [
        { label: 'Related concept', color: COLOR_MAP.concept },
        { label: 'Historical context', color: COLOR_MAP.movement },
        { label: 'Cultural influence', color: COLOR_MAP.person },
      ]
    });
  }

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: `You are Carnelian — a cultural knowledge platform with a sharp editorial voice. You map symbolic and cultural significance between ideas, people, objects, and movements.

Return ONLY valid JSON, no markdown, no explanation:
{
  "description": "2-3 sentences. Do NOT describe what this concept is in isolation. Explain WHY this specific concept connects to the artifact — what does this connection reveal culturally, historically, or symbolically? Be interpretive and specific. Write with the authority of a cultural critic, not a textbook.",
  "connections": [{"label": "Short name", "type": "person|place|movement|work|concept", "color": "#hex"}]
}

Colors: person=#378ADD, place=#1D9E75, movement=#BA7517, work=#7F77DD, concept=#993C1D
Labels under 14 characters. Be specific, not generic.`,
      messages: [{
        role: 'user',
        content: `Concept: "${concept}"
Artifact: "${context}"

Explain the cultural/symbolic significance of why "${concept}" connects to "${context}". Then return 4-5 closely related concepts.`,
      }],
    });

    const text = msg.content[0].text.trim();
    const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const data = JSON.parse(cleaned);
    return NextResponse.json(data);
  } catch (err) {
    console.error('expand error:', err.message);
    return NextResponse.json({ connections: [] });
  }
}
