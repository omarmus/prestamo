import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@prestamos/shared'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4001/api/:path*',
      },
    ];
  },
};

export default nextConfig;
