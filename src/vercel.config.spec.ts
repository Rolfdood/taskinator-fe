import { config } from '../vercel';

describe('Vercel deployment config', () => {
  it('builds the Angular browser bundle for Vercel static hosting', () => {
    expect(config.framework).toBe('angular');
    expect(config.buildCommand).toBe('npm run build');
    expect(config.outputDirectory).toBe('dist/taskinator-fe/browser');
  });

  it('proxies API calls to Railway and serves Angular routes through index.html', () => {
    expect(config.rewrites).toContainEqual({
      source: '/api/:path*',
      destination: 'https://taskinator-production-040f.up.railway.app/api/:path*',
    });
    expect(config.rewrites).toContainEqual({
      source: '/(.*)',
      destination: '/index.html',
    });
  });
});
