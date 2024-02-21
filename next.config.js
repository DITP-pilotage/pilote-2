/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/abcd/index.html',
        destination: '/centreaide/index.html',
      },

      // {
      //   source: '/centreaide/:slug',
      //   destination: '/centreaide/index.html',
      // },
      {
        source: '/abcd/resources/:lang/:slug',
        destination: '/centreaide/resources/:lang/:slug',
      },
      {
        source: '/abcd/static/:slug',
        destination: '/centreaide/static/:slug',
      },
      {
        source: '/static/:slug',
        destination: '/centreaide/static/:slug',
      },
      {
        source: '/resources/:lang/:slug',
        destination: '/centreaide/resources/:lang/:slug',
      },
      {
        source: '/static/custom.css',
        destination: '/centreaide/static/custom.css',
      },
      {
        source: '/abcd/:slug1/:slug2',
        destination: '/centreaide/:slug1/:slug2/index.html',
      },
      {
        source: '/abcd/:slug1/:slug2/:slug3',
        destination: '/centreaide/:slug1/:slug2/:slug3/index.html',
      }
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
            value: `default-src 'self' data: 'unsafe-inline'; connect-src https://api.validata.etalab.studio/ 'self' data: 'unsafe-inline' ws:; script-src 'self' ${process.env.NODE_ENV !== 'production' && "'unsafe-eval'"};`,
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
