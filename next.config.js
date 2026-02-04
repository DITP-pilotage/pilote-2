/** @type {import('next').NextConfig} */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const submodulePath = path.join(__dirname, "src/content");
const hasSubmodule =
  fs.existsSync(submodulePath) && fs.readdirSync(submodulePath).length > 0;

let withNextra = (config) => config;

if (hasSubmodule) {
  const nextra = (await import("nextra")).default;
  withNextra = nextra({
    contentDirBasePath: "/centre-aide-pilote-2",
  });
}

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingRoot: __dirname,
  bundlePagesRouterDependencies: true,
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  compiler: {
    emotion: true,
  },
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
      "*.pdf": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
      "*.ods": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
      "*.xlsx": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
    },
    resolveAlias: {
      "react-hook-form": "react-hook-form/dist/index.esm.mjs",
      "next-mdx-import-source-file": "./src/mdx-components.tsx",
    },
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
    config.module.rules.push({
      test: /\.(pdf|ods|xlsx)$/,
      type: "asset/resource",
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
