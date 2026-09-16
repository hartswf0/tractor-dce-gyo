// Cloudflare Worker broker for builders-game.html
// Secrets: OPENAI_API_KEY
// Optional vars: ALLOWED_ORIGIN (defaults to the GitHub Pages site)
// Route this Worker at any HTTPS URL and paste that URL into Builders Game → Settings.

export default {
  async fetch(request, env) {
    const allowed = env.ALLOWED_ORIGIN || 'https://hartswf0.github.io';
    const origin = request.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': origin === allowed ? origin : allowed,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== 'POST') {
      return new Response('POST only', { status: 405, headers: cors });
    }
    if (!env.OPENAI_API_KEY) {
      return new Response('OPENAI_API_KEY is not configured', { status: 500, headers: cors });
    }
    if (origin && origin !== allowed) {
      return new Response('origin not allowed', { status: 403, headers: cors });
    }

    let body;
    try { body = await request.json(); }
    catch { return new Response('invalid JSON', { status: 400, headers: cors }); }

    const sdp = String(body && body.sdp || '');
    const session = body && body.session;
    if (!sdp.startsWith('v=0') || !session || session.type !== 'realtime') {
      return new Response('missing SDP or realtime session config', { status: 400, headers: cors });
    }

    // The browser never receives the API key. The Worker exchanges its SDP offer
    // for OpenAI's SDP answer using the current Realtime Calls endpoint.
    const form = new FormData();
    form.append('sdp', new Blob([sdp], { type: 'application/sdp' }), 'offer.sdp');
    form.append('session', new Blob([JSON.stringify(session)], { type: 'application/json' }), 'session.json');

    const upstream = await fetch('https://api.openai.com/v1/realtime/calls', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
      body: form,
    });

    const answer = await upstream.text();
    const headers = new Headers(cors);
    headers.set('Content-Type', upstream.headers.get('Content-Type') || 'application/sdp');
    return new Response(answer, { status: upstream.status, headers });
  }
};
