import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { SessionProvider } from 'next-auth/react'
import MobileBottomNav from '@/components/layout/MobileBottomNav'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Bakımla — Kişisel Bakım Randevu Platformu',
  description: 'Berberden spa\'ya, güzellik merkezinden pilatese kadar tüm bakım hizmetleri tek platformda.',
  icons: {
    icon: '/favicon-32.png',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={inter.variable}>
      <body>
        <SessionProvider>
          {children}
          <MobileBottomNav />
          <Toaster richColors position="top-right" />
        </SessionProvider>
      </body>
    </html>
  )
}
