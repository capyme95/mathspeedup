import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

// Conditionally apply bundle analyzer
const withBundleAnalyzer = process.env.ANALYZE === 'true'
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ? require('@next/bundle-analyzer')({ enabled: true })
  : (config: NextConfig) => config;

export default withBundleAnalyzer(nextConfig);
