import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { DataProvider } from '@/lib/data-provider'
import { ResizeObserverFix } from '@/components/resize-observer-fix'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'BOSSBoarding - Laundry Boss Onboarding',
  description: 'Comprehensive onboarding platform for Laundry Boss customers',
  generator: 'v0.app',
  icons: {
    icon: '/icon-light-32x32.png',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <ResizeObserverFix />
        <DataProvider>
          {children}
        </DataProvider>
        <Analytics />
      </body>
    </html>
  )
}
