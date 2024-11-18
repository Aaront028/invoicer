import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton
} from '@clerk/nextjs'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Invoicer',
  description: 'Create and manage invoices easily',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      appearance={{
        elements: {
          formButtonPrimary: 'bg-blue-500 hover:bg-blue-600',
          footerActionLink: 'text-blue-500 hover:text-blue-600',
        }
      }}
    >
      <html lang="en">
        <body className={inter.className}>
          <header className="p-4 bg-white shadow-md">
            <div className="container mx-auto flex justify-between items-center">
              <div className="flex gap-4 items-center">
                <h1 className="text-2xl font-bold">Invoicer</h1>
                <SignedIn>
                  <nav className="flex gap-4">
                    <Link href="/" className="hover:text-blue-600">Create Invoice</Link>
                    <Link href="/clients" className="hover:text-blue-600">Clients</Link>
                    <Link href="/invoices" className="hover:text-blue-600">Invoice History</Link>
                    <Link href="/settings" className="hover:text-blue-600">Company Settings</Link>
                  </nav>
                </SignedIn>
              </div>
              <div>
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
                      Sign In
                    </button>
                  </SignInButton>
                </SignedOut>
              </div>
            </div>
          </header>
          <main className="container mx-auto py-10">
            <div>
              <SignedIn>
                {children}
              </SignedIn>
              <SignedOut>
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-4">Welcome to Invoicer</h2>
                  <p className="text-gray-600 mb-8">Please sign in to create and manage your invoices.</p>
                  <SignInButton mode="modal">
                    <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg">
                      Get Started
                    </button>
                  </SignInButton>
                </div>
              </SignedOut>
            </div>
          </main>
        </body>
      </html>
    </ClerkProvider>
  )
}