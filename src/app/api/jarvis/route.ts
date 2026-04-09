import { NextResponse } from 'next/server';

async function parseModelOutputToJSON(text: string) {
  // Try direct JSON parse
  try {
    return JSON.parse(text);
  } catch (e) {}

  // Try to extract JSON between first { and last }
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    const substr = text.slice(first, last + 1);
    try {
      return JSON.parse(substr);
    } catch (e) {}
  }

  // Fallback: return the raw text as assistant message
  return { text };
}

async function callGemini(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.JARVIS_API_KEY;
  const model = process.env.GEMINI_MODEL || 'text-bison-001';
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  // NOTE: Google GenRL / Gemini endpoints and request shapes can change.
  // This implementation attempts a best-effort HTTP call; you may need to
  // adjust the URL / request body to match your Google Cloud setup.
  const url = `https://generativelanguage.googleapis.com/v1beta2/models/${model}:generateText?key=${apiKey}`;
  const body = {
    prompt: { text: `You are Jarvis, an assistant that controls the UI. Respond with a JSON object: { "text": "...", "actions": [ ... ] }. Actions allowed: "zoom" (longitude, latitude, zoom), "focus_nodes" (ids: string[]), "message" (text). Provide only a single JSON object.` },
    temperature: 0.2,
    maxOutputTokens: 512,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Gemini error: ${res.status} ${txt}`);
  }
  const json = await res.json();
  // try common candidate fields
  const candidate = (json?.candidates && json.candidates[0]) || json?.output || json?.generated_text;
  const text = candidate?.output || candidate?.content || candidate?.text || JSON.stringify(json);
  return text;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt = String(body?.prompt || '');

    // Choose provider
    const provider = (process.env.JARVIS_PROVIDER || 'stub').toLowerCase();

    let modelText: string | null = null;

    if (provider === 'gemini') {
      try {
        modelText = await callGemini(prompt);
      } catch (err) {
        // fall through to stub
        console.error('Gemini call failed:', err);
      }
    } else if (provider === 'http' && process.env.JARVIS_LLM_URL && process.env.JARVIS_API_KEY) {
      // Generic HTTP proxy to any LLM endpoint (expects bearer token)
      try {
        const res = await fetch(process.env.JARVIS_LLM_URL!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.JARVIS_API_KEY}` },
          body: JSON.stringify({ prompt }),
        });
        const json = await res.json();
        modelText = json?.text || json?.response || JSON.stringify(json);
      } catch (e) {
        console.error('Generic LLM call failed:', e);
      }
    }

    // If we didn't get a model response, return the stub
    if (!modelText) {
      const actions = [
        { type: 'message', text: `Received: ${prompt}` },
        { type: 'zoom', longitude: 8.6753, latitude: 9.0820, zoom: 6 },
      ];
      return NextResponse.json({ text: 'Jarvis stub executed', actions });
    }

    // Try parse model output as JSON (the model is instructed to return JSON)
    const parsed = await parseModelOutputToJSON(modelText);
    // Validate minimal shape
    const text = parsed?.text || modelText;
    const actions = Array.isArray(parsed?.actions) ? parsed.actions : [];

    return NextResponse.json({ text, actions });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
