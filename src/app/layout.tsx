import { Providers } from '@/components/providers'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

export const dynamic = 'force-dynamic'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'TaskBot Persian - مدیریت وظایف هوشمند',
  description: 'پلتفرم مدیریت وظایف با ربات تلگرام و سیستم کانبان پیشرفته. تجربه‌ای بی‌نظیر از بهره‌وری و سازماندهی کارها.',
  keywords: ['مدیریت وظایف', 'کانبان', 'تلگرام', 'TaskBot', 'برنامه‌ریزی', 'بهره‌وری'],
  authors: [{ name: 'TaskBot Team' }],
  creator: 'TaskBot Persian',
  publisher: 'TaskBot Persian',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://taskbot.ir'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'TaskBot Persian - مدیریت وظایف هوشمند',
    description: 'پلتفرم مدیریت وظایف با ربات تلگرام و سیستم کانبان پیشرفته',
    url: 'https://taskbot.ir',
    siteName: 'TaskBot Persian',
    locale: 'fa_IR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TaskBot Persian - مدیریت وظایف هوشمند',
    description: 'پلتفرم مدیریت وظایف با ربات تلگرام و سیستم کانبان پیشرفته',
    creator: '@taskbot_persian',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#3b82f6" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
