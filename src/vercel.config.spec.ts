describe('Vercel deployment config', () => {
  it('builds the Angular browser bundle for Vercel static hosting', async () => {
    const { config } = await import('../vercel');

    expect(config.framework).toBe('angular');
    expect(config.buildCommand).toBe('npm run build');
    expect(config.outputDirectory).toBe('dist/taskinator-fe/browser');
  });

  it('routes API requests to the proxy function before the SPA fallback', async () => {
    const { config } = await import('../vercel');

    expect(config.rewrites).toEqual([
      { source: '/api/:path*', destination: '/api/[...path]' },
      { source: '/(.*)', destination: '/index.html' },
    ]);
  });
});
