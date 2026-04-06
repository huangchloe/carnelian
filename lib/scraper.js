import { XMLParser } from 'fast-xml-parser';

const CACHE = new Map();
const CACHE_TTL = 60 * 60 * 1000;

function isCacheFresh(key) {
  const entry = CACHE.get(key);
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL;
}
function setCache(key, data) { CACHE.set(key, { data, timestamp: Date.now() }); }
function getCache(key) { return CACHE.get(key)?.data ?? null; }

function isRelevant(title, requiredTerms) {
  if (!requiredTerms || requiredTerms.length === 0) return true;
  const lower = title.toLowerCase();
  return requiredTerms.some(term => lower.includes(term.toLowerCase()));
}

async function fetchReddit(query, requiredTerms = []) {
  // Use quoted exact-phrase search + relevance sort to avoid broad keyword matches
  const exactQuery = `"${query}"`;
  const encoded = encodeURIComponent(exactQuery);
  const url = `https://www.reddit.com/search.json?q=${encoded}&sort=relevance&t=all&limit=15&type=link`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'carnelian-cultural-platform/1.0' },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const posts = json?.data?.children ?? [];

    return posts
      .map(p => p.data)
      .filter(p => isRelevant(p.title, requiredTerms))
      .map(p => ({
        title: p.title,
        url: `https://reddit.com${p.permalink}`,
        subreddit: p.subreddit,
        score: p.score,
        comments: p.num_comments,
        preview: p.selftext?.slice(0, 160) || null,
        source: 'reddit',
      }))
      .slice(0, 4);
  } catch { return []; }
}

async function fetchGoogleNews(query) {
  const encoded = encodeURIComponent(query);
  const url = `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xml);
    const items = parsed?.rss?.channel?.item ?? [];
    const arr = Array.isArray(items) ? items : [items];
    return arr
      .slice(0, 4)
      .map(item => ({
        title: item.title?.replace(/ - [^-]+$/, '') ?? '',
        url: item.link ?? '',
        publishedAt: item.pubDate ?? null,
        source: 'news',
      }))
      .filter(i => i.title && i.url);
  } catch { return []; }
}

async function fetchGeniusAnnotations(query) {
  const token = process.env.GENIUS_TOKEN;
  if (!token) return [];
  try {
    const encoded = encodeURIComponent(query);
    const res = await fetch(
      `https://api.genius.com/search?q=${encoded}&per_page=3`,
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return (json?.response?.hits ?? []).map(h => ({
      title: h.result.full_title,
      url: h.result.url,
      artist: h.result.primary_artist?.name,
      source: 'genius',
    }));
  } catch { return []; }
}

export async function fetchImageCandidates(query) {
  const googleKey = process.env.GOOGLE_CSE_KEY;
  const googleCx = process.env.GOOGLE_CSE_ID;
  if (googleKey && googleCx) {
    try {
      const encoded = encodeURIComponent(query);
      const url = `https://www.googleapis.com/customsearch/v1?key=${googleKey}&cx=${googleCx}&q=${encoded}&searchType=image&num=5&imgSize=large&safe=active`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        return (json.items ?? []).map(item => ({
          url: item.link,
          width: item.image?.width,
          height: item.image?.height,
          context: item.image?.contextLink,
          title: item.title,
          source: 'google',
        }));
      }
    } catch { }
  }

  const bingKey = process.env.BING_IMAGE_KEY;
  if (bingKey) {
    try {
      const encoded = encodeURIComponent(query);
      const url = `https://api.bing.microsoft.com/v7.0/images/search?q=${encoded}&count=5&imageType=Photo&size=Large&safeSearch=Moderate`;
      const res = await fetch(url, { headers: { 'Ocp-Apim-Subscription-Key': bingKey } });
      if (res.ok) {
        const json = await res.json();
        return (json.value ?? []).map(item => ({
          url: item.contentUrl,
          width: item.width,
          height: item.height,
          context: item.hostPageUrl,
          title: item.name,
          source: 'bing',
        }));
      }
    } catch { }
  }
  return [];
}

export async function getArtifactContext(artifact) {
  const cacheKey = `ctx:${artifact.slug}`;
  if (isCacheFresh(cacheKey)) return getCache(cacheKey);

  const redditQuery = artifact.redditQueries?.[0] ?? artifact.title;
  const newsQuery = artifact.newsQueries?.[0] ?? artifact.title;
  const requiredTerms = artifact.redditRequiredTerms ?? [];

  const [reddit, news, genius] = await Promise.allSettled([
    fetchReddit(redditQuery, requiredTerms),
    fetchGoogleNews(newsQuery),
    fetchGeniusAnnotations(artifact.title),
  ]);

  const result = {
    reddit: reddit.status === 'fulfilled' ? reddit.value : [],
    news: news.status === 'fulfilled' ? news.value : [],
    genius: genius.status === 'fulfilled' ? genius.value : [],
    fetchedAt: new Date().toISOString(),
  };

  setCache(cacheKey, result);
  return result;
}

export async function getTrendingContext(query) {
  const [reddit, news] = await Promise.allSettled([
    fetchReddit(query, [query]),
    fetchGoogleNews(query),
  ]);
  return {
    reddit: reddit.status === 'fulfilled' ? reddit.value : [],
    news: news.status === 'fulfilled' ? news.value : [],
    fetchedAt: new Date().toISOString(),
  };
}
