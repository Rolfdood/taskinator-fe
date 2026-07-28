declare const process: { env: Record<string, string | undefined> };

describe('Vercel deployment config', () => {
  const originalEnv = process.env['RAILWAY_API_ORIGIN'];

  beforeEach(() => {
    vi.resetModules();
    process.env['RAILWAY_API_ORIGIN'] = 'https://api.example.test/';
  });

  afterEach(() => {
    vi.resetModules();
    if (originalEnv === undefined) {
      delete process.env['RAILWAY_API_ORIGIN'];
    } else {
      process.env['RAILWAY_API_ORIGIN'] = originalEnv;
    }
  });

  it('builds the Angular browser bundle for Vercel static hosting', async () => {
    const { config } = await import('../vercel');

    expect(config.framework).toBe('angular');
    expect(config.buildCommand).toBe('npm run build');
    expect(config.outputDirectory).toBe('dist/taskinator-fe/browser');
  });

  it('proxies API calls through the configured backend origin and serves Angular routes through index.html', async () => {
    const { config } = await import('../vercel');

    expect(config.rewrites).toContainEqual({
      source: '/api/:path*',
      destination: 'https://api.example.test/api/:path*',
    });
    expect(config.rewrites).toContainEqual({
      source: '/(.*)',
      destination: '/index.html',
    });
  });

  it('fails config loading when the backend origin is missing', async () => {
    delete process.env['RAILWAY_API_ORIGIN'];
    vi.resetModules();

    await expect(import('../vercel')).rejects.toThrow('RAILWAY_API_ORIGIN is required');
  });
});
