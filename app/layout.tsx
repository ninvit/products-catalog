import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { CartProvider } from "@/contexts/CartContext"
import { AuthProvider } from "@/contexts/AuthContext"
import { SecurityProvider } from "@/components/SecurityProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Alkaim Store - Products Catalog",
  description: "A modern e-commerce catalog with shopping cart functionality",
  generator: 'v0.dev',
  applicationName: 'Alkaim Store',
  keywords: ['ecommerce', 'products', 'shopping', 'catalog', 'jiu-jitsu'],
  authors: [{ name: 'Vinicius Alkaim' }],
  creator: 'Vinicius Alkaim',
  icons: {
    icon: '/alkaim.jpg',
    apple: '/alkaim.jpg',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Alkaim Store - Products Catalog',
    description: 'A modern e-commerce catalog with shopping cart functionality',
    siteName: 'Alkaim Store',
    type: 'website',
    images: ['/alkaim.jpg'],
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} antialiased`}>
        <SecurityProvider>
          <AuthProvider>
            <CartProvider>
              <div className="safe-area-padding">
                {children}
              </div>
              <Toaster />
            </CartProvider>
          </AuthProvider>
        </SecurityProvider>
      </body>
    </html>
  )
}
