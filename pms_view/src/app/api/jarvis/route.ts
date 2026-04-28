import { NextResponse } from 'next/server';

// Allow longer serverless runtime so cold-started backend requests can complete.
export const maxDuration = 180;

const DEFAULT_JARVIS_BACKEND_URL = 'https://cerebro-mj9g.onrender.com/';
const DEFAULT_BACKEND_PATHS = ['/api/research/synthesize'];

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

    // Common error payloads from upstream providers or proxy wrappers.
    const directError =
      (typeof obj.error === 'string' && obj.error) ||
      (obj.error && typeof obj.error === 'object' && typeof (obj.error as Record<string, unknown>).message === 'string'
        ? ((obj.error as Record<string, unknown>).message as string)
        : '');
    if (directError) {
      return { text: `Backend error: ${directError}`, actions: [] };
    }

    // Cerebro research/synthesize response shape.
    if (obj.synthesis && typeof obj.synthesis === 'object') {
      const synthesis = obj.synthesis as Record<string, unknown>;
      const synthesisOutput =
        synthesis.synthesis_output && typeof synthesis.synthesis_output === 'object'
          ? (synthesis.synthesis_output as Record<string, unknown>)
          : null;

      const textCandidate =
        synthesis.one_paragraph_summary ??
        synthesis.executive_summary ??
        synthesis.brief ??
        synthesis.summary ??
        synthesisOutput?.one_paragraph_summary ??
        synthesisOutput?.executive_summary ??
        synthesisOutput?.brief ??
        synthesisOutput?.summary ??
        synthesisOutput?.synthesis;

      const text =
        typeof textCandidate === 'string'
          ? textCandidate
          : textCandidate != null
            ? String(textCandidate)
            : '';
      if (text) {
        return { text, actions: [] };
      }

      // If synthesis exists but is empty, surface provider failures instead of returning an empty payload.
      if (Array.isArray(obj.provider_failures) && obj.provider_failures.length) {
        const firstFailure = obj.provider_failures[0] as Record<string, unknown>;
        const provider = typeof firstFailure?.provider === 'string' ? firstFailure.provider : 'provider';
        const reason =
          typeof firstFailure?.reason === 'string'
            ? firstFailure.reason
            : typeof firstFailure?.error === 'string'
              ? firstFailure.error
              : 'request failed';

        return {
          text: `Backend research provider issue (${provider}): ${reason}. Check backend provider credentials/configuration.`,
          actions: [],
        };
      }

      return {
        text: 'Backend returned synthesis payload, but no summary text was produced. Check provider credentials and model settings on Cerebro backend.',
        actions: [],
      };
    }

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

    return {
      text: `Backend returned an unrecognized response shape: ${JSON.stringify(obj).slice(0, 260)}`,
      actions: [],
    };
  }

  return { text: String(payload), actions: [] };
}

function buildBackendCandidateUrls(): string[] {
  const configuredUrl = (
    process.env.JARVIS_BACKEND_URL ||
    process.env.JARVIS_LLM_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
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

function buildPayloadCandidates(prompt: string) {
  const base = {
    thinking_mode: false,
    max_attempts: 6,
  };

  return [
    { ...base, query: prompt },
    { ...base, prompt },
    { ...base, message: prompt },
    { query: prompt },
    { prompt },
    { message: prompt },
  ];
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

  const payloadCandidates = buildPayloadCandidates(prompt);

  let lastError: unknown = null;

  for (const url of buildBackendCandidateUrls()) {
    for (const payload of payloadCandidates) {
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
          const errBody = await res.text().catch(() => '');
          lastError = `HTTP ${res.status} from ${url} body=${errBody.slice(0, 180)}`;
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
    const prompt = String(body?.prompt || body?.query || body?.message || '');

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
      const backendHints = {
        provider,
        hasBackendUrl: Boolean(
          process.env.JARVIS_BACKEND_URL || process.env.JARVIS_LLM_URL || process.env.NEXT_PUBLIC_API_URL
        ),
        candidateUrls: buildBackendCandidateUrls(),
      };

      console.error('Jarvis proxy unavailable', backendHints);
      return NextResponse.json({
        text: 'I could not reach the Cerebro backend right now. Please retry in a few seconds.',
        actions: [{ type: 'message', text: 'Backend connection failed.' }],
        debug: process.env.NODE_ENV === 'production' ? undefined : backendHints,
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
