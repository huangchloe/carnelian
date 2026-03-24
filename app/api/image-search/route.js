export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  if (!query) return Response.json({ error: 'No query' }, { status: 400 });
  const res = await fetch('https://google.serper.dev/images', {
    method: 'POST',
    headers: {
      'X-API-KEY': process.env.SERPER_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query, num: 1 }),
  });
  const data = await res.json();
  const img = data?.images?.[0]?.imageUrl || null;
  return Response.json({ url: img });
}
