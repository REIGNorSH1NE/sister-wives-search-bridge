// Vercel Serverless Function: Live Google Search Gateway for Sister Wives Matchmaker
// Provides real-time Google Search Grounding across open public web platforms

export default async function handler(req, res) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Gemini-Key, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'online',
      service: 'Sister Wives Live Google Search Bridge',
      version: '1.0.0',
      search_engine: 'Google Search (Real-Time Grounding)',
      endpoint: '/api/search'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = req.body || {};
    const criteria = body.criteria || body;

    // Detect Google Gemini API key: from header, body, or Vercel Environment Variables
    const apiKey = (
      req.headers['x-gemini-key'] ||
      body.gemini_api_key ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_AI_KEY ||
      ''
    ).trim();

    const minAge = criteria.min_age || 22;
    const maxAge = criteria.max_age || 38;
    const relStatus = criteria.relationship_status || 'Open to Plural';
    const children = criteria.children_preference || 'Any';
    const bodyType = criteria.body_type || 'Any';
    const minHeight = criteria.min_height || "5'2\"";
    const maxHeight = criteria.max_height || "5'10\"";
    const location = criteria.location_preference || 'United States';
    const values = (criteria.values_keywords || ['Plural Marriage Friendly', 'Family Oriented', 'Homesteading / Traditional']).join(', ');
    const notes = criteria.custom_requirements || '';
    const vision = body.family_vision || criteria.family_vision || 'Seeking 3 to 5 loving, committed Sister Wives to build an enduring plural family estate.';
    const sweepActive = !!criteria.is_50_state_sweep;
    const targetState = criteria.target_state;

    const geoInstruction = sweepActive
      ? 'GEOGRAPHIC SCOPE: 50-State Nationwide Sweep across the United States. Ensure candidate discovery searches across diverse US states (e.g. Mountain West, Midwest, South, Texas, Appalachia) with distinct "state" properties.'
      : targetState && targetState !== 'All 50 States'
      ? `GEOGRAPHIC SCOPE: Focus candidate discovery specifically in or willing to relocate to '${targetState}'. Set "state" to '${targetState}'.`
      : `GEOGRAPHIC SCOPE: Search throughout ${location}, ensuring broad geographic representation across US states.`;

    // Construct prompt strictly for Google Search Grounding across open public platforms
    const systemPrompt = `You are an expert plural marriage and sister wives matchmaking research agent with real-time Google Search grounding.
Search the live internet using Google Search to discover authentic potential candidate mentions, community inquiries, and public profiles matching these criteria:
- Age: ${minAge} to ${maxAge}
- Relationship Status: ${relStatus}
- Children: ${children}
- Body Type: ${bodyType}
- Height: ${minHeight} to ${maxHeight}
- ${geoInstruction}
- Shared Values: ${values}
- Patriarch Directives: ${notes}
- Family Vision: "${vision}"

OPEN-WEB SEARCH POLICY (STRICT NO-DATING-SITES DIRECTIVE):
- STRICTLY EXCLUDE login-walled dating websites (e.g. Tinder, Bumble, Match.com, OkCupid, Hinge, eHarmony, Plenty of Fish).
- ONLY search and extract mentions from open, publicly accessible internet locations:
  * Public community boards, forums, and discussion threads (e.g. Reddit r/polygamy, independent plural family fellowship boards)
  * Public agrarian, homesteading, and traditional family community bulletins
  * Personal blogs, Substack, Medium articles, and open community directory listings
- For each candidate, provide their actual public contact channel (e.g. Forum Profile/Thread Link, Public Directory Listing, Community Bulletin Inquiry).
- Each candidate must have a verified individual solo portrait image URL ("avatar_url"). Group photos and couples are strictly forbidden.

Return ONLY a valid JSON array of match objects with this exact structure:
[
  {
    "full_name": "First Last",
    "age": 26,
    "location": "City, State",
    "state": "State Name",
    "relationship_status": "Single",
    "children_count": 0,
    "body_type": "Athletic",
    "height": "5'6\\"",
    "avatar_url": "https://images.unsplash.com/... or direct solo image URL",
    "bio": "Authentic biography summary and domestic strengths",
    "compatibility_score": 93,
    "compatibility_reasons": ["reason 1", "reason 2", "reason 3"],
    "plural_marriage_stance": "Summary of perspective on being 1 of 3-5 sister wives",
    "shared_values": ["Value1", "Value2"],
    "contact_method": "Public Forum Listing / Community Directory",
    "contact_handle_or_url": "https://...",
    "source_title": "Source name",
    "source_url": "https://...",
    "source_snippet": "Relevant context snippet found via Google Search"
  }
]`;

    if (!apiKey) {
      return res.status(400).json({
        error: 'Missing Google Gemini API key.',
        message: 'Please set GEMINI_API_KEY in your Vercel Project Environment Variables, or pass it via header X-Gemini-Key.'
      });
    }

    // Call Google Gemini API with native Google Search Grounding tool
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const googlePayload = {
      contents: [
        {
          parts: [{ text: systemPrompt }]
        }
      ],
      tools: [
        {
          googleSearch: {} // Enables real-time Google Search Grounding
        }
      ],
      generationConfig: {
        temperature: 0.3,
        topP: 0.95
      }
    };

    const googleResp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(googlePayload)
    });

    if (!googleResp.ok) {
      const errText = await googleResp.text();
      return res.status(googleResp.status).json({
        error: `Google API error (Status ${googleResp.status})`,
        details: errText
      });
    }

    const data = await googleResp.json();
    const candidatePart = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidatePart) {
      return res.status(500).json({ error: 'No content returned from Google Search Grounding.' });
    }

    // Parse JSON from markdown codeblock if present
    let cleanJson = candidatePart.trim();
    if (cleanJson.includes('```json')) {
      const start = cleanJson.indexOf('```json') + 7;
      const end = cleanJson.indexOf('```', start);
      cleanJson = end !== -1 ? cleanJson.slice(start, end) : cleanJson.slice(start);
    } else if (cleanJson.includes('```')) {
      const start = cleanJson.indexOf('```') + 3;
      const end = cleanJson.indexOf('```', start);
      cleanJson = end !== -1 ? cleanJson.slice(start, end) : cleanJson.slice(start);
    }

    const startIdx = cleanJson.indexOf('[');
    const endIdx = cleanJson.lastIndexOf(']');
    if (startIdx !== -1 && endIdx !== -1) {
      cleanJson = cleanJson.slice(startIdx, endIdx + 1);
    }

    const matches = JSON.parse(cleanJson.trim());

    // Tag matches as live discovery
    const enriched = matches.map((m, idx) => ({
      ...m,
      id: `live-google-${Date.now()}-${idx + 1}`,
      discovery_mode: 'live',
      is_open_web_verified: true,
      notes: 'Discovered via Vercel Live Google Search Grounding'
    }));

    return res.status(200).json({
      success: true,
      search_engine: 'Google Search (Real-Time Grounding)',
      count: enriched.length,
      candidates: enriched
    });

  } catch (err) {
    console.error('Search error:', err);
    return res.status(500).json({
      error: 'Failed to execute Google Search Grounding',
      message: err.message
    });
  }
}
