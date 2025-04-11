/** @type {import('next').NextConfig} */
const https = require('https');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
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
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://video.finances.gouv.fr/',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
