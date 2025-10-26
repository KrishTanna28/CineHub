import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import Navigation from "@/components/navigation"
import { Toaster } from "@/components/ui/toaster"
import { Providers } from "@/components/providers"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata = {
  title: "CineHub - Movies & TV Shows",
  description: "Discover, watch, and discuss your favorite movies and TV shows",
  generator: "v0.app",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <Providers>
          <Navigation />
          <div className="pt-16">
            {children}
          </div>
          <Toaster />
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
