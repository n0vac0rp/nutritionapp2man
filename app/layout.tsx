import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "./contexts/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GluGuide - Smart Nutrition Monitoring System",
  description: "Monitor your nutrition with smart portion guidance and personalized recommendations",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <Providers>
            <AuthProvider>{children}</AuthProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
