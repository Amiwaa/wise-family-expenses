const withPWA = require('next-pwa')({
  dest: 'public',
  register: false, // We'll register manually in the component
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Disable PWA in development
  buildExcludes: [/app-build-manifest.json$/],
  sw: 'sw.js',
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
        },
        networkTimeoutSeconds: 15,
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Ensure public files are served correctly
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ]
  },
};

module.exports = withPWA(nextConfig);

