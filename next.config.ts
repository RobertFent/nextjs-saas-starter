import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	reactCompiler: true,
	serverExternalPackages: ['pino', 'pino-pretty']
};

export default nextConfig;
