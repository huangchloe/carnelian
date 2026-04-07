import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const num = Math.min(parseInt(searchParams.get('num') || '9'), 10);

  if (!q) return NextResponse.json({ images: [] });

  const key = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CSE_ID;

  if (!key || !cx) {
    return NextResponse.json({ images: [], error: 'Missing API keys' });
  }

  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${key}&cx=${cx}&q=${encodeURIComponent(q)}&searchType=image&num=${num}&safe=active&imgSize=large`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    const data = await res.json();

    const images = (data.items || []).map(item => ({
      url: item.link,
      title: item.title,
      contextLink: item.image?.contextLink,
      thumbnail: item.image?.thumbnailLink,
      width: item.image?.width,
      height: item.image?.height,
    }));

    return NextResponse.json({ images }, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' }
    });
  } catch (err) {
    return NextResponse.json({ images: [], error: err.message });
  }
}
