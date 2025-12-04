/** @type {import('next').NextConfig} */
import nextra from "nextra";

const withNextra = nextra({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.centreaide.tsx",
  staticImage: true,
});

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: "standalone",
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  compiler: {
    emotion: true,
  },
  async rewrites() {
    return [
      {
        source: "/centreaide/:slug*",
        destination: "/centre-aide-pilote-2/centre-aide/:slug*",
      },
    ];
  },
  webpack: function (config) {
    config.module.rules.push({
      test: /\.ya?ml$/,
      use: "js-yaml-loader",
    });
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Referrer-Policy",
            value: "no-referrer",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "https://video.finances.gouv.fr/",
          },
        ],
      },
    ];
  },
};

export default withNextra(nextConfig);
