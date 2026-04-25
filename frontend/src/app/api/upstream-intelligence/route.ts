import { NextResponse } from 'next/server';

// Upstream requests can take longer due multi-source research.
export const maxDuration = 180;

const DEFAULT_BACKEND_BASE_URL = 'https://cerebro-mj9g.onrender.com/';
const DEFAULT_BACKEND_PATHS = ['/api/upstream/intelligence'];
const LOCAL_DEV_URL = 'http://127.0.0.1:8010/api/upstream/intelligence';

function normalizePayload(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const objectPayload = payload as Record<string, unknown>;

  if (objectPayload.dashboard && typeof objectPayload.dashboard === 'object') {
    return objectPayload as Record<string, unknown>;
  }

  if (objectPayload.data && typeof objectPayload.data === 'object') {
    return { dashboard: objectPayload.data };
  }

  if (objectPayload.metrics && typeof objectPayload.metrics === 'object') {
    return { dashboard: objectPayload };
  }

  return null;
}

function buildBackendCandidateUrls(): string[] {
  const configuredUrl = (
    process.env.UPSTREAM_INTEL_BACKEND_URL ||
    process.env.JARVIS_BACKEND_URL ||
    process.env.JARVIS_LLM_URL ||
    DEFAULT_BACKEND_BASE_URL
  ).trim();

  const configuredPaths = process.env.UPSTREAM_INTEL_BACKEND_PATHS
    ? process.env.UPSTREAM_INTEL_BACKEND_PATHS.split(',').map((path) => path.trim()).filter(Boolean)
    : DEFAULT_BACKEND_PATHS;

  const urls = new Set<string>();

  if (configuredUrl) {
    try {
      const parsed = new URL(configuredUrl);
      if (parsed.pathname && parsed.pathname !== '/') {
        urls.add(configuredUrl);
      }
    } catch {
      urls.add(configuredUrl);
    }
  }

  let originBase = configuredUrl;
  try {
    const parsed = new URL(configuredUrl);
    originBase = `${parsed.protocol}//${parsed.host}`;
  } catch {
    // Keep configuredUrl as-is when not parseable as URL.
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

  if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_LOCAL_UPSTREAM_FALLBACK === 'true') {
    urls.add(LOCAL_DEV_URL);
  }

  return Array.from(urls);
}

export async function POST(req: Request) {
  const requestBody = await req.json().catch(() => ({}));

  const timeoutRaw = Number(process.env.UPSTREAM_INTEL_TIMEOUT_MS || 180000);
  const timeoutMs = Number.isFinite(timeoutRaw) && timeoutRaw > 0 ? timeoutRaw : 180000;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const authToken = process.env.UPSTREAM_INTEL_API_KEY || process.env.JARVIS_API_KEY;
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let lastError: string | null = null;

  for (const candidateUrl of buildBackendCandidateUrls()) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(candidateUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok) {
        lastError = `HTTP ${response.status} from ${candidateUrl}`;
        continue;
      }

      const contentType = response.headers.get('content-type') || '';
      const rawPayload = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

      const normalized = normalizePayload(rawPayload);
      if (normalized) {
        return NextResponse.json(normalized);
      }

      lastError = `Invalid payload shape from ${candidateUrl}`;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        lastError = `Timeout after ${timeoutMs}ms for ${candidateUrl}`;
      } else {
        lastError = `Network error for ${candidateUrl}`;
      }
    } finally {
      clearTimeout(timer);
    }
  }

  return NextResponse.json(
    {
      error: 'upstream_intelligence_unavailable',
      detail: lastError || 'All backend candidates failed.',
      dashboard: null,
    },
    { status: 502 }
  );
}
