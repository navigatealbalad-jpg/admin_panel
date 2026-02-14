'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from './supabase'
import { useRouter, usePathname } from 'next/navigation'

interface AdminUser {
    id: string
    email: string
    username: string | null
    role: string
}

interface AuthContextType {
    user: AdminUser | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<{ error: string | null }>
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signIn: async () => ({ error: null }),
    signOut: async () => { },
})

export function useAuth() {
    return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AdminUser | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        checkUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                fetchAdminUser(session.user.id)
            } else {
                setUser(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    // Redirect logic
    useEffect(() => {
        if (loading) return

        const isLoginPage = pathname === '/login'

        if (!user && !isLoginPage) {
            router.replace('/login')
        } else if (user && isLoginPage) {
            router.replace('/')
        }
    }, [user, loading, pathname, router])

    async function checkUser() {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
                await fetchAdminUser(session.user.id)
            } else {
                setUser(null)
                setLoading(false)
            }
        } catch {
            setUser(null)
            setLoading(false)
        }
    }

    async function fetchAdminUser(userId: string) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, email, username, role')
                .eq('id', userId)
                .single()

            if (error || !data) {
                // User exists in auth but not in public.users table
                setUser(null)
                setLoading(false)
                return
            }

            if (data.role !== 'admin') {
                // User is NOT an admin — sign them out
                await supabase.auth.signOut()
                setUser(null)
                setLoading(false)
                return
            }

            setUser({
                id: data.id,
                email: data.email,
                username: data.username,
                role: data.role,
            })
            setLoading(false)
        } catch {
            setUser(null)
            setLoading(false)
        }
    }

    async function signIn(email: string, password: string): Promise<{ error: string | null }> {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                return { error: error.message }
            }

            if (!data.user) {
                return { error: 'Sign in failed. Please try again.' }
            }

            // Check admin role
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, email, username, role')
                .eq('id', data.user.id)
                .single()

            if (userError || !userData) {
                await supabase.auth.signOut()
                return { error: 'User profile not found. Contact administrator.' }
            }

            if (userData.role !== 'admin') {
                await supabase.auth.signOut()
                return { error: 'Access denied. Admin privileges required.' }
            }

            setUser({
                id: userData.id,
                email: userData.email,
                username: userData.username,
                role: userData.role,
            })

            return { error: null }
        } catch (err: any) {
            return { error: err.message || 'An unexpected error occurred.' }
        }
    }

    async function signOut() {
        await supabase.auth.signOut()
        setUser(null)
        router.replace('/login')
    }

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}
