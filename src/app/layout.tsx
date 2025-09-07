// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import MainNav from '@/components/MainNav'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CONNECT.IND',
  description: 'Internal dashboard',
}

export const viewport: Viewport = { themeColor: '#ffffff' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="id">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900`}>
          {/* Header */}
          <header className="border-b">
            <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
              <Link href="/" className="flex items-center gap-3">
                <div className="h-6 w-6 rounded bg-black" />
                <span className="font-semibold">CONNECT.IND</span>
              </Link>

              {/* Tab menu hanya saat sudah login */}
              <SignedIn>
                <MainNav />
              </SignedIn>

              {/* Kanan: tombol auth / user */}
              <div className="flex items-center gap-3">
                <SignedOut>
                  <SignInButton />
                  <SignUpButton>
                    <button className="bg-[#6c47ff] text-white rounded-full font-medium h-10 px-4">
                      Sign Up
                    </button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <UserButton appearance={{ elements: { avatarBox: 'h-8 w-8' } }} />
                </SignedIn>
              </div>
            </div>
          </header>

          {/* Konten */}
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  )
}
