import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
	// Enable strict mode for better hot reload and development experience
	reactStrictMode: true,
	
	// Optimize for development
	swcMinify: !isDev, // Only minify in production
	
	// Experimental features for better performance
	experimental: {
		optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
		// Turbopack optimizations
		turbo: {
			rules: {
				'*.svg': {
					loaders: ['@svgr/webpack'],
					as: '*.js',
				},
			},
		},
	},
	
	// Development-specific webpack optimizations
	webpack: (config, { dev, isServer }) => {
		if (dev) {
			// Optimize for faster rebuilds
			config.cache = {
				type: 'filesystem',
				cacheDirectory: '.next/cache/webpack',
				buildDependencies: {
					config: [__filename],
				},
			};
			
			// Reduce bundle splitting for faster dev builds
			config.optimization = {
				...config.optimization,
				splitChunks: {
					chunks: 'all',
					cacheGroups: {
						default: false,
						vendors: false,
						// Bundle vendor packages together
						vendor: {
							name: 'vendor',
							chunks: 'all',
							test: /node_modules/,
							priority: 20,
						},
						// Bundle common modules
						common: {
							name: 'common',
							minChunks: 2,
							priority: 10,
							reuseExistingChunk: true,
						},
					},
				},
			};
		}
		
		return config;
	},
	
	// Optimize images and static assets
	images: {
		domains: [],
		unoptimized: isDev, // Skip optimization in dev for faster builds
	},
	
	// Reduce unnecessary logging in development
	logging: {
		fetches: {
			fullUrl: false,
		},
	},
};

export default nextConfig;
