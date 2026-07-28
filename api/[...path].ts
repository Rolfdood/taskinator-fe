export const config = { runtime: 'nodejs' };

type HeaderValue = string | string[] | undefined;

interface ProxyRequest {
  method?: string;
  url?: string;
  query?: {
    path?: string | string[];
  };
  headers?: Record<string, HeaderValue>;
  body?: unknown;
}

interface ProxyResponse {
  status(code: number): ProxyResponse;
  setHeader(name: string, value: string | string[]): ProxyResponse;
  json(body: unknown): ProxyResponse;
  send(body: unknown): ProxyResponse;
}

const blockedRequestHeaders = new Set(['host', 'connection', 'content-length', 'accept-encoding']);
const blockedResponseHeaders = new Set(['connection', 'content-encoding', 'content-length', 'transfer-encoding']);

export default async function handler(request: ProxyRequest, response: ProxyResponse): Promise<void> {
  const apiOrigin = configuredApiOrigin();

  if (!apiOrigin) {
    console.error('RAILWAY_API_ORIGIN is not configured.');
    response.status(500).json({ message: 'The API proxy is not configured.' });
    return;
  }

  const target = targetUrl(apiOrigin, request);
  console.log(`Proxying ${request.method ?? 'GET'} ${request.url ?? '<unknown>'} -> ${target}`);

  try {
    const upstream = await fetch(target, {
      method: request.method ?? 'GET',
      headers: requestHeaders(request.headers ?? {}),
      body: requestBody(request),
    });

    console.log(`Upstream response: ${upstream.status} ${target}`);
    applyResponseHeaders(upstream.headers, response);
    response.status(upstream.status).send(await upstream.text());
  } catch (error) {
    console.error('Proxy failed to reach upstream API.', error);
    response.status(500).json({ message: 'Failed to reach the upstream API.' });
  }
}

function configuredApiOrigin(): string | null {
  const origin = process.env['RAILWAY_API_ORIGIN']?.trim();

  return origin ? origin.replace(/\/+$/, '') : null;
}

function targetUrl(apiOrigin: string, request: ProxyRequest): string {
  const path = request.query?.path;
  const segments = Array.isArray(path) ? path : path ? [path] : [];
  const forwardedPath = segments.map(encodeURIComponent).join('/');
  const queryString = forwardedQueryString(request.url);

  return `${apiOrigin}/api/${forwardedPath}${queryString}`;
}

function forwardedQueryString(url: string | undefined): string {
  if (!url || !url.includes('?')) {
    return '';
  }

  const params = new URLSearchParams(url.split('?')[1]);
  params.delete('path');

  const query = params.toString();
  return query ? `?${query}` : '';
}

function requestHeaders(headers: Record<string, HeaderValue>): Headers {
  const forwardedHeaders = new Headers();

  for (const [name, value] of Object.entries(headers)) {
    if (blockedRequestHeaders.has(name.toLowerCase()) || value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      forwardedHeaders.set(name, value.join(', '));
    } else {
      forwardedHeaders.set(name, value);
    }
  }

  return forwardedHeaders;
}

function requestBody(request: ProxyRequest): BodyInit | undefined {
  const method = request.method?.toUpperCase() ?? 'GET';

  if (method === 'GET' || method === 'HEAD' || request.body === undefined) {
    return undefined;
  }

  return typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
}

function applyResponseHeaders(headers: Headers, response: ProxyResponse): void {
  const setCookie = (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.();

  headers.forEach((value, name) => {
    const normalizedName = name.toLowerCase();

    if (blockedResponseHeaders.has(normalizedName) || normalizedName === 'set-cookie') {
      return;
    }

    response.setHeader(name, value);
  });

  if (setCookie?.length) {
    response.setHeader('set-cookie', setCookie);
  } else {
    const singleCookie = headers.get('set-cookie');
    if (singleCookie) {
      response.setHeader('set-cookie', singleCookie);
    }
  }
}
