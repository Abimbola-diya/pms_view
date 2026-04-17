import { NextResponse } from 'next/server';

// Allow longer serverless runtime so cold-started backend requests can complete.
export const maxDuration = 60;

const DEFAULT_JARVIS_BACKEND_URL = 'https://cerebro-mj9g.onrender.com/';
const DEFAULT_BACKEND_PATHS = ['/api/ask'];

function parseModelOutputToJSON(text: string) {
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

function normalizeResponsePayload(payload: unknown): { text: string; actions: unknown[] } | null {
  if (payload == null) return null;

  if (typeof payload === 'string') {
    const parsed = parseModelOutputToJSON(payload);
    const text = String(parsed?.text || payload);
    const actions = Array.isArray(parsed?.actions) ? parsed.actions : [];
    return { text, actions };
  }

  if (typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    const firstChoice = Array.isArray(obj.choices) ? (obj.choices[0] as Record<string, unknown>) : null;
    const firstMessage = firstChoice?.message as Record<string, unknown> | undefined;

    const textCandidate =
      obj.text ??
      obj.response ??
      obj.reply ??
      obj.answer ??
      obj.output ??
      obj.content ??
      obj.message ??
      firstMessage?.content ??
      firstChoice?.text;

    const text =
      typeof textCandidate === 'string'
        ? textCandidate
        : textCandidate != null
          ? String(textCandidate)
          : '';

    const actions = Array.isArray(obj.actions) ? obj.actions : [];
    if (text || actions.length) return { text, actions };

    if (obj.data) return normalizeResponsePayload(obj.data);

    return { text: '', actions: [] };
  }

  return { text: String(payload), actions: [] };
}

function buildBackendCandidateUrls(): string[] {
  const configuredUrl = (
    process.env.JARVIS_BACKEND_URL ||
    process.env.JARVIS_LLM_URL ||
    DEFAULT_JARVIS_BACKEND_URL
  ).trim();

  const configuredPaths = process.env.JARVIS_BACKEND_PATHS
    ? process.env.JARVIS_BACKEND_PATHS.split(',').map((p) => p.trim()).filter(Boolean)
    : DEFAULT_BACKEND_PATHS;

  const urls = new Set<string>();

  // If a full endpoint URL is configured (non-root path), try it first.
  if (configuredUrl) {
    try {
      const parsedConfigured = new URL(configuredUrl);
      if (parsedConfigured.pathname && parsedConfigured.pathname !== '/') {
        urls.add(configuredUrl);
      }
    } catch {
      // Non-URL values are accepted as-is.
      urls.add(configuredUrl);
    }
  }

  let originBase = configuredUrl;
  try {
    const parsed = new URL(configuredUrl);
    originBase = `${parsed.protocol}//${parsed.host}`;
  } catch {
    // Keep configuredUrl as-is when it is not parseable as a URL.
  }

  for (const path of configuredPaths) {
    try {
      const candidate = /^https?:\/\//i.test(path)
        ? path
        : new URL(path.startsWith('/') ? path : `/${path}`, originBase).toString();
      urls.add(candidate);
    } catch {
      // Skip malformed path entries.
    }
  }

  return Array.from(urls);
}

async function callHttpBackend(prompt: string) {
  const apiKey = process.env.JARVIS_API_KEY;
  const timeoutMsRaw = Number(process.env.JARVIS_BACKEND_TIMEOUT_MS || 45000);
  const timeoutMs = Number.isFinite(timeoutMsRaw) && timeoutMsRaw > 0 ? timeoutMsRaw : 45000;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const payload = { query: prompt };

  let lastError: unknown = null;

  for (const url of buildBackendCandidateUrls()) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        lastError = `HTTP ${res.status} from ${url}`;
        continue;
      }

      const contentType = res.headers.get('content-type') || '';
      const raw = contentType.includes('application/json') ? await res.json() : await res.text();
      const normalized = normalizeResponsePayload(raw);

      if (normalized && (normalized.text || normalized.actions.length)) {
        return normalized;
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        lastError = `Timeout after ${timeoutMs}ms for ${url}`;
      } else {
        lastError = err;
      }
    } finally {
      clearTimeout(timer);
    }
  }

  if (lastError) {
    console.error('Jarvis backend call failed:', lastError);
  }

  return null;
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
    const provider = (process.env.JARVIS_PROVIDER || 'http').toLowerCase();

    // Prefer your backend proxy path first unless explicitly forced to stub.
    const allowHttp = provider !== 'stub';
    const allowGemini = provider === 'gemini' || provider === 'gemini-only' || provider === 'auto';

    let modelResult: { text: string; actions: unknown[] } | null = null;

    if (allowHttp) {
      modelResult = await callHttpBackend(prompt);
    }

    if (!modelResult && allowGemini) {
      try {
        const modelText = await callGemini(prompt);
        modelResult = normalizeResponsePayload(modelText);
      } catch (err) {
        console.error('Gemini call failed:', err);
      }
    }

    if (!modelResult) {
      return NextResponse.json({
        text: 'I could not reach the Cerebro backend right now. Please retry in a few seconds.',
        actions: [{ type: 'message', text: 'Backend connection failed.' }],
      });
    }

    const text = modelResult.text;
    const actions = Array.isArray(modelResult.actions) ? modelResult.actions : [];

    return NextResponse.json({ text, actions });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
