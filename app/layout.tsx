import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Wise Family Expenses',
  description: 'Track and manage your family expenses, savings, and finances',
  manifest: '/manifest.json',
  themeColor: '#6366f1',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Wise Expenses',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Wise Expenses" />
      </head>
      <body className="bg-gray-50 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}


