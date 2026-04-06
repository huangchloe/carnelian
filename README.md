# Carnelian v2

**The story behind everything you love.**

Cultural knowledge platform — artifact entries with layered depth, strict fuzzy search, and live context scraped from Reddit, news, and Genius.

---

## Stack

- **Next.js 14** App Router
- **Tailwind CSS**
- **Fuse.js** — fuzzy search with confidence scoring
- **fast-xml-parser** — Google News RSS parsing
- **Reddit JSON API** — no auth required
- Fonts: Cormorant Garamond (display) + DM Sans (body)

---

## Local development

```bash
# 1. Clone this repo
git clone https://github.com/YOUR_USERNAME/carnelian-v2.git
cd carnelian-v2

# 2. Install dependencies
npm install

# 3. (Optional) Add API keys for richer sources
cp .env.example .env.local
# Edit .env.local and add GENIUS_TOKEN if you have one

# 4. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Adding artifacts

All artifact data lives in `data/artifacts.json`. Each entry follows this schema:

```json
{
  "id": "unique-id",
  "slug": "url-slug",
  "title": "Display Title",
  "aliases": ["alternate name", "common misspelling"],
  "type": "Object | Painting | Performance | Movement | ...",
  "medium": "Specific medium",
  "origin": "Country or City",
  "year": 1947,
  "era": "Era name",
  "tabLabels": ["Know", "See", "Trace", "Read"],
  "hook": "One or two sentences. The entry point.",
  "carnelianReads": "Carnelian's interpretive framing of this artifact.",
  "know": {
    "paragraphs": ["paragraph 1", "paragraph 2"],
    "relatedNodes": ["Related concept", "Person name"]
  },
  "see": {
    "type": "motifs | analysis | references",
    "label": "Section label",
    "items": [...]
  },
  "trace": {
    "type": "lineage | threads",
    "label": "Section label",
    "items": [...]
  },
  "read": {
    "sources": [
      { "outlet": "Name", "year": "2023", "title": "Article title", "url": "https://...", "abbr": "4chr" }
    ]
  },
  "constellation": [
    { "label": "Short", "x": 80, "y": 12, "color": "#378ADD", "fullLabel": "Full name" }
  ],
  "tags": ["tag1", "tag2"],
  "searchTerms": ["alias 1", "related search term"],
  "redditQueries": ["query for reddit search"],
  "newsQueries": ["query for google news"]
}
```

### `see` type variants

| type | use for |
|------|---------|
| `motifs` | Visual/material objects — shows colored tile grid |
| `analysis` | Paintings, films — compositional/formal analysis cards |
| `references` | Interdisciplinary works — categorized reference list with tags |

### `trace` type variants

| type | use for |
|------|---------|
| `lineage` | Clear chronological lineage — vertical timeline |
| `threads` | Interdisciplinary connections — colored left-border cards |

### Constellation node positions (viewBox 0 0 160 120, center at 80,60)

Suggested positions for 5 nodes:
- Top center: `x: 80, y: 12`
- Right: `x: 148, y: 48`
- Bottom right: `x: 142, y: 96`
- Bottom left: `x: 14, y: 96`
- Left: `x: 10, y: 48`

---

## Environment variables

Create `.env.local`:

```
# Optional — enables Genius annotations in live context
GENIUS_TOKEN=your_genius_api_token_here
```

Reddit and Google News work without any keys.

---

## Deploy to Vercel

```bash
# Push to GitHub first
git init
git add .
git commit -m "carnelian v2 — initial"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/carnelian-v2.git
git push -u origin main
```

Then go to [vercel.com](https://vercel.com), import the repo, and deploy. No additional configuration needed. Add `GENIUS_TOKEN` to Vercel environment variables if you have one.

To point `carnelian.org` at the new deployment: update the domain in Vercel project settings and add the DNS records your registrar needs.

---

## Scraping notes

- **Reddit**: public JSON API, no auth, rate limited to ~60 req/min. Results cached 1 hour server-side.
- **Google News RSS**: completely free, no rate limit documented.
- **Genius**: free tier, requires token from [genius.com/api-clients](https://genius.com/api-clients).
- **Twitter/X**: $100/month minimum (Basic API tier). Not included — add later.
- **TikTok**: no stable public API. Not included.

---

## Roadmap

- [ ] Real artifact images (Cloudinary or `/public` folder)
- [ ] Full graph view (D3 or vis.js force layout)
- [ ] Trending detection (Reddit rising + Google Trends RSS)
- [ ] Admin interface to add artifacts without editing JSON
- [ ] Waitlist / "request an artifact" form
- [ ] Twitter/X integration when budget allows
