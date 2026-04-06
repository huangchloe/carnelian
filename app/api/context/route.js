import { getArtifact } from '@/lib/artifacts';
import { getArtifactContext, getTrendingContext } from '@/lib/scraper';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const query = searchParams.get('q');

  if (slug) {
    const artifact = getArtifact(slug);
    if (!artifact) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const context = await getArtifactContext(artifact);
    return NextResponse.json(context);
  }

  if (query) {
    const context = await getTrendingContext(query);
    return NextResponse.json(context);
  }

  return NextResponse.json({ error: 'Provide slug or q param' }, { status: 400 });
}
