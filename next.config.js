/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  webpack: (config, { isServer }) => {
    // Allow WASM files to be loaded as static assets
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Don't resolve wasm imports in server-side code
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }

    return config;
  },
  turbopack: {},
};

module.exports = nextConfig;
