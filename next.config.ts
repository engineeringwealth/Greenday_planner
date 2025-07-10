import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Adding server configuration directly here.
  // This is a more robust way to set the port and hostname.
  port: 9003,
  hostname: '0.0.0.0',
};

export default nextConfig;
