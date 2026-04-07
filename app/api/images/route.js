import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const num = Math.min(parseInt(searchParams.get('num') || '9'), 10);

  if (!q) return NextResponse.json({ images: [] });

  const key = process.env.SERPAPI_KEY;
  if (!key) return NextResponse.json({ images: [], error: 'Missing SERPAPI_KEY' });

  try {
    const url = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(q)}&num=${num}&api_key=${key}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    const data = await res.json();

    const images = (data.images_results || []).slice(0, num).map(img => ({
      url: img.original,
      title: img.title || '',
      contextLink: img.link,
      thumbnail: img.thumbnail,
      width: img.original_width,
      height: img.original_height,
    }));

    return NextResponse.json({ images }, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' }
    });
  } catch (err) {
    return NextResponse.json({ images: [], error: err.message });
  }
}
