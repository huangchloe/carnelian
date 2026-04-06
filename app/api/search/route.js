import { searchArtifacts } from '@/lib/artifacts';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? '';

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ query: q, exact: null, suggestions: [], noMatch: false });
  }

  const result = searchArtifacts(q);
  return NextResponse.json(result);
}
