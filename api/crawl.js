// Vercel Serverless Function: Cloud Web Crawler for Sister Wives Matchmaker
// Executes targeted search queries across public open-web sources and extracts authentic candidate discussions

export default async function handler(req, res) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'online',
      service: 'Sister Wives Cloud Crawler Worker',
      version: '1.0.0',
      description: 'Executes live web searches and extracts authentic forum, bulletin, and community discussions for local LLMs'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = req.body || {};
    let queries = body.queries || [];
    if (typeof queries === 'string') queries = [queries];
    if (body.query) queries.push(body.query);

    if (queries.length === 0) {
      queries = [
        'site:reddit.com/r/polygamy "sister wife" OR "plural marriage"',
        '"sister wife" homestead traditional agrarian "plural marriage"'
      ];
    }

    const maxResults = Math.min(body.max_results || 12, 25);
    const allResults = [];
    const seenUrls = new Set();

    for (const q of queries.slice(0, 5)) {
      try {
        const searchResults = await searchOpenWeb(q);
        for (const r of searchResults) {
          if (!seenUrls.has(r.url)) {
            seenUrls.add(r.url);
            allResults.push({ ...r, query: q });
            if (allResults.length >= maxResults) break;
          }
        }
      } catch (err) {
        console.error(`Error searching for query "${q}":`, err.message);
      }
      if (allResults.length >= maxResults) break;
    }

    // Optionally fetch snippets or brief page content for top results
    const fetchContent = body.fetch_page_content !== false;
    if (fetchContent) {
      const topFew = allResults.slice(0, 4);
      await Promise.all(
        topFew.map(async (item) => {
          try {
            item.page_excerpt = await fetchPageExcerpt(item.url);
          } catch {
            item.page_excerpt = '';
          }
        })
      );
    }

    return res.status(200).json({
      success: true,
      count: allResults.length,
      queries: queries,
      results: allResults
    });

  } catch (err) {
    console.error('Crawler error:', err);
    return res.status(500).json({
      error: 'Crawler execution failed',
      message: err.message
    });
  }
}

async function searchOpenWeb(query) {
  const res = await fetch('https://lite.duckduckgo.com/lite/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    },
    body: 'q=' + encodeURIComponent(query)
  });

  if (!res.ok) {
    throw new Error(`Search request failed with HTTP ${res.status}`);
  }

  const html = await res.text();
  const results = [];
  
  // DDG Lite returns:
  // <a rel="nofollow" href="https://..." class='result-link'>Title</a>
  // <td class='result-snippet'>Snippet text...</td>
  const linkRegex = /<a[^>]*href="([^"]+)"[^>]*class=['"]result-link['"][^>]*>([\s\S]*?)<\/a>/gi;
  const snippetRegex = /<td[^>]*class=['"]result-snippet['"][^>]*>([\s\S]*?)<\/td>/gi;

  let linkMatch;
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    let url = linkMatch[1];
    // Strip DDG redirect wrapper if present
    if (url.includes('duckduckgo.com/l/?uddg=')) {
      try {
        const parsed = new URL(url);
        const target = parsed.searchParams.get('uddg');
        if (target) url = decodeURIComponent(target);
      } catch {}
    }

    const title = linkMatch[2]
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&#x27;/g, "'")
      .replace(/&quot;/g, '"')
      .trim();

    try {
      const uObj = new URL(url);
      results.push({
        title,
        url,
        domain: uObj.hostname.replace('www.', ''),
        snippet: ''
      });
    } catch {}
  }

  let sIdx = 0;
  let snippetMatch;
  while ((snippetMatch = snippetRegex.exec(html)) !== null) {
    if (results[sIdx]) {
      results[sIdx].snippet = snippetMatch[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&#x27;/g, "'")
        .replace(/&quot;/g, '"')
        .trim();
    }
    sIdx++;
  }

  // Filter out login-walled dating websites
  const blockedDomains = ['tinder.com', 'bumble.com', 'match.com', 'okcupid.com', 'hinge.co', 'eharmony.com', 'pof.com'];
  return results.filter(r => !blockedDomains.some(d => r.domain.includes(d)));
}

async function fetchPageExcerpt(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });
    clearTimeout(timeoutId);
    if (!res.ok) return '';
    const html = await res.text();
    // Clean text: strip script, style, comments, and tags
    const clean = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return clean.slice(0, 1000);
  } catch {
    clearTimeout(timeoutId);
    return '';
  }
}
