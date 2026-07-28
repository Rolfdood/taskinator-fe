function requireEnvironmentVariable(name: string): string {
  const value = (globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }).process
    ?.env?.[name];

  if (!value?.trim()) {
    throw new Error(`${name} is required to build Vercel rewrites.`);
  }

  return value.trim();
}

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/+$/, '');
}

const railwayApiOrigin = normalizeOrigin(requireEnvironmentVariable('RAILWAY_API_ORIGIN'));

export const config = {
  framework: 'angular',
  buildCommand: 'npm run build',
  outputDirectory: 'dist/taskinator-fe/browser',
  rewrites: [
    {
      source: '/api/:path*',
      destination: `${railwayApiOrigin}/api/:path*`,
    },
    {
      source: '/(.*)',
      destination: '/index.html',
    },
  ],
  headers: [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
      ],
    },
  ],
};
