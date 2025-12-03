/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  // React 19 and Next.js 15 optimizations
  experimental: {
    // Optimize package imports for better tree shaking
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'framer-motion'
    ],

    // Webpack build worker for faster builds
    webpackBuildWorker: true,

    // Server Components optimizations
    serverComponentsExternalPackages: ['zustand', '@tanstack/react-query'],
  },

  // Performance optimizations
  swcMinify: true,

  // Bundle splitting and optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders }) => {
    // Enhanced bundle splitting in production
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,

        // React ecosystem
        'react-vendor': {
          test: /[\\/]node_modules[\\/](react|react-dom|@tanstack|zustand)[\\/]/,
          name: 'react-vendor',
          chunks: 'all',
          priority: 20,
        },

        // UI libraries
        'ui-vendor': {
          test: /[\\/]node_modules[\\/](@radix-ui|lucide-react|framer-motion|tailwindcss)[\\/]/,
          name: 'ui-vendor',
          chunks: 'all',
          priority: 15,
        },

        // Utility libraries
        'utils-vendor': {
          test: /[\\/]node_modules[\\/](clsx|class-variance-authority|date-fns)[\\/]/,
          name: 'utils-vendor',
          chunks: 'all',
          priority: 10,
        },
      }
    }

    return config
  },

  // Image optimization settings
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400, // 24 hours
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
