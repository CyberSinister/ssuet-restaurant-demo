import type { Metadata } from 'next'
import { Inter, Poppins, Roboto, Playfair_Display } from 'next/font/google'
import '../src/index.css'
import { RootProviders } from '@/lib/providers/root-providers'
import { Analytics } from '@vercel/analytics/react'
import { cn } from '@/lib/utils'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
})

const roboto = Roboto({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto',
})

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
})

export const metadata: Metadata = {
  title: 'Bistro Bay - Restaurant Ordering System',
  description: 'Order delicious food from Bistro Bay for delivery or pickup',
  keywords: ['restaurant', 'food delivery', 'online ordering', 'bistro'],
  authors: [{ name: 'Bistro Bay' }],
  openGraph: {
    title: 'Bistro Bay - Restaurant Ordering System',
    description: 'Order delicious food from Bistro Bay for delivery or pickup',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        inter.variable,
        poppins.variable,
        roboto.variable,
        playfair.variable,
        "font-sans antialiased"
      )}>
        <RootProviders>
          {children}
        </RootProviders>
        <Analytics />
      </body>
    </html>
  )
}
