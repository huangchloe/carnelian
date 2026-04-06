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

  // Graceful fallback if no API key
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
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
      max_tokens: 400,
      system: `You are a cultural knowledge graph. Given a concept and its context, return 4-5 closely related concepts as JSON.
Return ONLY valid JSON, no markdown, no explanation. Format:
{"connections": [{"label": "Short name", "type": "person|place|movement|work|concept", "color": "#hex"}]}

Use these colors: person=#378ADD, place=#1D9E75, movement=#BA7517, work=#7F77DD, concept=#993C1D
Keep labels under 12 characters. Be specific and culturally precise, not generic.`,
      messages: [{
        role: 'user',
        content: `Concept: "${concept}" (in the context of: "${context}")
Return 4-5 closely related concepts that would appear in a cultural knowledge graph.`,
      }],
    });

    const text = msg.content[0].text.trim();
    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ connections: [] });
  }
}
