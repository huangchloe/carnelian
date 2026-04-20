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

// Fetch the og:image (and fallback to twitter:image) from an article URL.
// Returns null on any failure — never throws, never blocks the pipeline.
async function fetchOgImage(url) {
  if (!url) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Carnelian/1.0)' },
      next: { revalidate: 3600 },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const html = await res.text();
    // Only read the head portion — OG tags always live there, and some article
    // pages are megabytes of scripts/ads/comments below the fold.
    const head = html.slice(0, 40000);
    const ogMatch = head.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
                 || head.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogMatch?.[1]) return ogMatch[1];
    const twMatch = head.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
                 || head.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
    if (twMatch?.[1]) return twMatch[1];
    return null;
  } catch { return null; }
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

    // Google News titles come back as "Real Title - Publisher". We were
    // stripping the publisher and losing the signal. Keep it.
    const base = arr
      .slice(0, 4)
      .map(item => {
        const rawTitle = item.title ?? '';
        const dashIdx = rawTitle.lastIndexOf(' - ');
        const cleanTitle = dashIdx > 0 ? rawTitle.slice(0, dashIdx) : rawTitle;
        const publisher = dashIdx > 0 ? rawTitle.slice(dashIdx + 3).trim() : null;
        return {
          title: cleanTitle,
          url: item.link ?? '',
          publishedAt: item.pubDate ?? null,
          publisher,
          source: 'news',
        };
      })
      .filter(i => i.title && i.url);

    // Fetch og:image for each in parallel. Individual failures just mean no
    // thumbnail for that card — the rest of the row still renders.
    const withThumbs = await Promise.all(
      base.map(async n => ({ ...n, thumbnail: await fetchOgImage(n.url) }))
    );
    return withThumbs;
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
