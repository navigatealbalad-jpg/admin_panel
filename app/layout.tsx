import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '../lib/auth'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
    title: 'Navigate Al-Balad Admin',
    description: 'Admin panel for Navigate Al-Balad — manage landmarks, routes, and users.',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    )
}
