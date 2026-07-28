export const config = {
  framework: 'angular',
  buildCommand: 'npm run build',
  outputDirectory: 'dist/taskinator-fe/browser',
  rewrites: [
    {
      source: '/api/:path*',
      destination: 'https://taskinator-production-040f.up.railway.app/api/:path*',
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
