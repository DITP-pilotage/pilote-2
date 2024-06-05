/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  async rewrites() {
    return [
      {
        source: '/centreaide/:slug*',
        destination: '/centreaide/:slug*/index.html', 
      },
    ]
  },
  compiler: {
    emotion: true,
  },
  webpack: function (config) {
    config.module.rules.push(
        {
          test: /\.ya?ml$/,
          use: 'js-yaml-loader',
        },
    )
    return config
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Referrer-Policy',
            value: 'no-referrer',
          },
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self' data: 'unsafe-inline'; frame-src https://video.finances.gouv.fr/ https://app.livestorm.co/; connect-src https://api.validata.etalab.studio/ https://stats.beta.gouv.fr/ 'self' data: 'unsafe-inline' ws:; script-src 'self' https://stats.beta.gouv.fr/ 'unsafe-eval' 'unsafe-inline';`,
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
