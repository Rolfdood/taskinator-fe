import handler, { config } from '../api/[...path]';

declare const process: { env: Record<string, string | undefined> };

describe('Vercel API proxy', () => {
  it('configures the function to run on the Node.js runtime', () => {
    expect(config).toEqual({ runtime: 'nodejs' });
  });

  const originalFetch = globalThis.fetch;
  const originalOrigin = process.env['RAILWAY_API_ORIGIN'];

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalOrigin === undefined) {
      delete process.env['RAILWAY_API_ORIGIN'];
    } else {
      process.env['RAILWAY_API_ORIGIN'] = originalOrigin;
    }
    vi.restoreAllMocks();
  });

  it('requires a Railway API origin at runtime', async () => {
    delete process.env['RAILWAY_API_ORIGIN'];
    const response = createResponse();

    await handler(createRequest({ url: '/api/v1/projects', query: { path: ['v1', 'projects'] } }), response);

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({ message: 'The API proxy is not configured.' });
  });

  it('forwards requests to the configured Railway origin', async () => {
    process.env['RAILWAY_API_ORIGIN'] = 'https://api.example.test/';
    const upstreamResponse = new Response(JSON.stringify({ ok: true }), {
      status: 201,
      headers: {
        'content-type': 'application/json',
        'set-cookie': 'refresh=abc; HttpOnly; Path=/',
      },
    });
    const fetchMock = vi.fn().mockResolvedValue(upstreamResponse);
    globalThis.fetch = fetchMock;
    const response = createResponse();

    await handler(
      createRequest({
        method: 'POST',
        url: '/api/v1/projects?active=true',
        query: { path: ['v1', 'projects'] },
        headers: { authorization: 'Bearer access-token', cookie: 'refresh=old' },
        body: JSON.stringify({ name: 'Launch' }),
      }),
      response,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/v1/projects?active=true',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Launch' }),
      }),
    );
    expect(response.statusCode).toBe(201);
    expect(response.headers['content-type']).toBe('application/json');
    expect(response.headers['set-cookie']).toEqual(['refresh=abc; HttpOnly; Path=/']);
    expect(response.body).toBe(JSON.stringify({ ok: true }));
  });

  it('does not forward the Vercel rewrite path query param to the upstream', async () => {
    process.env['RAILWAY_API_ORIGIN'] = 'https://api.example.test/';
    const upstreamResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
    const fetchMock = vi.fn().mockResolvedValue(upstreamResponse);
    globalThis.fetch = fetchMock;

    await handler(
      createRequest({
        url: '/api/[...path]?path=v1/projects&active=true',
        query: { path: ['v1', 'projects'] },
      }),
      createResponse(),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/v1/projects?active=true',
      expect.anything(),
    );
  });

  it('returns 500 when the upstream cannot be reached', async () => {
    process.env['RAILWAY_API_ORIGIN'] = 'https://api.example.test/';
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network failure'));
    const response = createResponse();

    await handler(createRequest({ url: '/api/v1/projects', query: { path: ['v1', 'projects'] } }), response);

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({ message: 'Failed to reach the upstream API.' });
  });
});

function createRequest(options: {
  method?: string;
  url: string;
  query: { path?: string[] | string };
  headers?: Record<string, string>;
  body?: unknown;
}) {
  return {
    method: options.method ?? 'GET',
    url: options.url,
    query: options.query,
    headers: options.headers ?? {},
    body: options.body,
  };
}

function createResponse() {
  return {
    statusCode: 200,
    headers: {} as Record<string, string | string[]>,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    setHeader(name: string, value: string | string[]) {
      this.headers[name.toLowerCase()] = value;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
    send(body: unknown) {
      this.body = body;
      return this;
    },
  };
}
