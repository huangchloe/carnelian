import { NextResponse } from 'next/server';

async function tryWikipedia(query) {
  // Search Wikipedia for the page
  const searchRes = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=3&format=json&origin=*`
  );
  const searchData = await searchRes.json();
  const results = searchData?.query?.search || [];

  for (const result of results) {
    const pageTitle = result.title;
    const imgRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&pithumbsize=800&format=json&origin=*`
    );
    const imgData = await imgRes.json();
    const pages = imgData?.query?.pages || {};
    const page = Object.values(pages)[0];
    const url = page?.thumbnail?.source || null;
    // Skip images that are flags, icons, or tiny decorative graphics
    if (url && !url.includes('Flag_of') && !url.includes('icon') && !url.includes('logo') && !url.includes('Logo')) {
      return { url, title: pageTitle };
    }
  }
  return null;
}

async function tryWikimediaCommons(query) {
  // Search Wikimedia Commons for images directly
  const res = await fetch(
    `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&prop=imageinfo&iiprop=url|size&iiurlwidth=800&gsrlimit=5&format=json&origin=*`
  );
  const data = await res.json();
  const pages = data?.query?.pages || {};
  const imagePages = Object.values(pages);

  for (const p of imagePages) {
    const url = p?.imageinfo?.[0]?.thumburl || p?.imageinfo?.[0]?.url;
    const title = p.title?.replace('File:', '') || '';
    // Skip SVGs, icons, flags
    if (url && !url.endsWith('.svg') && !title.toLowerCase().includes('flag') && !title.toLowerCase().includes('icon')) {
      return { url, title };
    }
  }
  return null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  if (!q) return NextResponse.json({ url: null });

  try {
    // Try Wikipedia first (most authoritative)
    const wikiResult = await tryWikipedia(q);
    if (wikiResult) return NextResponse.json(wikiResult);

    // Fall back to Wikimedia Commons
    const commonsResult = await tryWikimediaCommons(q);
    if (commonsResult) return NextResponse.json(commonsResult);

    return NextResponse.json({ url: null });
  } catch {
    return NextResponse.json({ url: null });
  }
}
