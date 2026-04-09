/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  webpack: (config) => {
    config.module.rules.push({ test: /\.(glsl|vs|fs)$/, use: 'raw-loader' });
    return config;
  },
  transpilePackages: ['deck.gl', '@deck.gl/core', '@deck.gl/layers', '@deck.gl/react', '@deck.gl/geo-layers', '@deck.gl/aggregation-layers'],
};

module.exports = nextConfig;
