/** @type {import('next').NextConfig} */
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    turbopackFileSystemCacheForBuild: process.env.CI !== "true",
    // Activé par défaut depuis Next 16.4 : le bootstrap Turbopack est inliné dans le HTML.
    // Les pages pré-rendues au build n'ont pas de nonce, la CSP de `proxy.ts` le bloque et
    // la page ne s'hydrate pas. https://github.com/vercel/next.js/issues/99800 est close,
    // mais ne couvre que l'App Router : toujours cassé en Pages Router en 16.4.3.
    turbopackSharedRuntime: false,
  },
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, '../..'),
  bundlePagesRouterDependencies: true,
  pageExtensions: ["js", "jsx", "ts", "tsx"],
  allowedDevOrigins: [
    "*.pilote.modernisation.localhost",
    "pilote.modernisation.localhost",
  ],
  turbopack: {
    rules: {
      "*.yaml": {
        loaders: ["js-yaml-loader"],
        as: "*.js",
      },
      "*.yml": {
        loaders: ["js-yaml-loader"],
        as: "*.js",
      },
    },
    resolveAlias: {
      "react-hook-form": "react-hook-form/dist/index.esm.mjs",
    },
  },
  async rewrites() {
    return [
      {
        source: "/.well-known/acme-challenge/:token",
        destination: "/api/acme-challenge/:token",
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/centreaide/:slug*",
        destination: "/centre-aide-pilote",
        permanent: true,
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

export default nextConfig;
