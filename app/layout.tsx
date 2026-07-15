import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Flowboard',
  description: 'Team boards for getting work moving.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-canvas text-ink font-body min-h-screen">
        {children}
      </body>
    </html>
  )
}
