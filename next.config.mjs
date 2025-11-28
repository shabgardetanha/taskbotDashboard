/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',  # برای serverless در Netlify ضروری
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js', 'telegraf'],  # جلوگیری از bundling errors
  },
  images: {
    unoptimized: true,  # اگر next/image داری، این رو اضافه کن تا error نده
  }
}

export default nextConfig