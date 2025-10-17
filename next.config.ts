import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	serverExternalPackages: ['pino', 'pino-pretty'],
	experimental: {
		ppr: true,
		clientSegmentCache: true,
		nodeMiddleware: true
	}
};

export default nextConfig;
