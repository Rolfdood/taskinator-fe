import proxy, { config } from '../api/[...path]';

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

    const response = await proxy.fetch(new Request('https://example.vercel.app/api/v1/projects'));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: 'The API proxy is not configured.' });
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

    const response = await proxy.fetch(
      new Request('https://example.vercel.app/api/v1/projects?active=true', {
        method: 'POST',
        headers: {
          authorization: 'Bearer access-token',
          cookie: 'refresh=old',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ name: 'Launch' }),
      }),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/v1/projects?active=true',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Launch' }),
      }),
    );
    expect(response.status).toBe(201);
    expect(response.headers.get('content-type')).toBe('application/json');
    expect(response.headers.get('set-cookie')).toBe('refresh=abc; HttpOnly; Path=/');
    expect(await response.text()).toBe(JSON.stringify({ ok: true }));
  });

  it('does not forward the Vercel rewrite path query param to the upstream', async () => {
    process.env['RAILWAY_API_ORIGIN'] = 'https://api.example.test/';
    const upstreamResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
    const fetchMock = vi.fn().mockResolvedValue(upstreamResponse);
    globalThis.fetch = fetchMock;

    await proxy.fetch(new Request('https://example.vercel.app/api/v1/projects?path=v1/projects&active=true'));

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/v1/projects?active=true',
      expect.anything(),
    );
  });

  it('returns 500 when the upstream cannot be reached', async () => {
    process.env['RAILWAY_API_ORIGIN'] = 'https://api.example.test/';
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network failure'));

    const response = await proxy.fetch(new Request('https://example.vercel.app/api/v1/projects'));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: 'Failed to reach the upstream API.' });
  });
});
