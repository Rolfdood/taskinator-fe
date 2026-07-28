describe('Vercel deployment config', () => {
  it('builds the Angular browser bundle for Vercel static hosting', async () => {
    const { config } = await import('../vercel');

    expect(config.framework).toBe('angular');
    expect(config.buildCommand).toBe('npm run build');
    expect(config.outputDirectory).toBe('dist/taskinator-fe/browser');
  });

  it('uses a static SPA fallback that Vercel can schema-validate without env vars', async () => {
    const { config } = await import('../vercel');

    expect(config.rewrites).toEqual([{ source: '/(.*)', destination: '/index.html' }]);
  });
});
