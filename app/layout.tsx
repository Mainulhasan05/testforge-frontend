import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import StoreProvider from "@/lib/StoreProvider"
import { Suspense } from "react"
import toast, { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: "Test Session Platform",
  description: "Collaborative test session management platform",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
      <Toaster />
        <Suspense fallback={<div>Loading...</div>}>
          <StoreProvider>{children}</StoreProvider>
        </Suspense>
      </body>
    </html>
  )
}
