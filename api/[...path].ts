export const config = { runtime: 'nodejs' };

const blockedRequestHeaders = new Set(['host', 'connection', 'content-length', 'accept-encoding']);
const blockedResponseHeaders = new Set(['connection', 'content-encoding', 'content-length', 'transfer-encoding']);

export default {
  async fetch(request: Request): Promise<Response> {
    const apiOrigin = configuredApiOrigin();

    if (!apiOrigin) {
      console.error('RAILWAY_API_ORIGIN is not configured.');
      return jsonResponse(500, { message: 'The API proxy is not configured.' });
    }

    const target = targetUrl(request, apiOrigin);
    const url = new URL(request.url);
    console.log(`Proxying ${request.method} ${url.pathname}${url.search} -> ${target}`);

    try {
      const upstream = await fetch(target, {
        method: request.method,
        headers: forwardedRequestHeaders(request.headers),
        body: await forwardedBody(request),
      });

      console.log(`Upstream response: ${upstream.status} ${target}`);
      return forwardedResponse(upstream);
    } catch (error) {
      console.error('Proxy failed to reach upstream API.', error);
      return jsonResponse(500, { message: 'Failed to reach the upstream API.' });
    }
  },
};

function configuredApiOrigin(): string | null {
  const origin = process.env['RAILWAY_API_ORIGIN']?.trim();
  return origin ? origin.replace(/\/+$/, '') : null;
}

function targetUrl(request: Request, apiOrigin: string): string {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\//, '');
  const params = new URLSearchParams(url.search);
  params.delete('path');
  const query = params.toString();

  return `${apiOrigin}/api/${path}${query ? `?${query}` : ''}`;
}

function forwardedRequestHeaders(headers: Headers): Headers {
  const forwarded = new Headers();

  headers.forEach((value, name) => {
    if (blockedRequestHeaders.has(name.toLowerCase())) {
      return;
    }
    forwarded.set(name, value);
  });

  return forwarded;
}

async function forwardedBody(request: Request): Promise<BodyInit | undefined> {
  const method = request.method.toUpperCase();

  if (method === 'GET' || method === 'HEAD') {
    return undefined;
  }

  return request.text();
}

async function forwardedResponse(upstream: Response): Promise<Response> {
  const headers = new Headers();

  upstream.headers.forEach((value, name) => {
    if (blockedResponseHeaders.has(name.toLowerCase())) {
      return;
    }
    headers.set(name, value);
  });

  const setCookie = (upstream.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.();
  if (setCookie?.length) {
    headers.set('set-cookie', setCookie.join(', '));
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
