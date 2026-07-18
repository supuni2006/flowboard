import type { Metadata, Viewport } from 'next'
// @ts-ignore: allow CSS side-effect import when type declarations are unavailable
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

export const metadata: Metadata = {
  title: 'Flowboard',
  description: 'Team boards for getting work moving.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-canvas text-ink font-body min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}