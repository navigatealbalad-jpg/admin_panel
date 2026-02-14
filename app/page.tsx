'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import Link from 'next/link'

interface Stats {
    landmarks: number
    routes: number
    users: number
    categories: Record<string, number>
}

export default function DashboardPage() {
    const { user, signOut } = useAuth()
    const [stats, setStats] = useState<Stats>({ landmarks: 0, routes: 0, users: 0, categories: {} })
    const [loading, setLoading] = useState(true)

    useEffect(() => { fetchStats() }, [])

    async function fetchStats() {
        setLoading(true)

        const [lmRes, rtRes, usRes] = await Promise.all([
            supabase.from('landmarks').select('id, category'),
            supabase.from('routes').select('id'),
            supabase.from('users').select('id'),
        ])

        const landmarks = lmRes.data || []
        const categories: Record<string, number> = {}
        landmarks.forEach(lm => {
            const cat = (lm as any).category || 'other'
            categories[cat] = (categories[cat] || 0) + 1
        })

        setStats({
            landmarks: landmarks.length,
            routes: rtRes.data?.length || 0,
            users: usRes.data?.length || 0,
            categories,
        })
        setLoading(false)
    }

    const statCards = [
        { label: 'Landmarks', value: stats.landmarks, icon: '🏛️', color: 'bg-primary', href: '/landmarks' },
        { label: 'Routes', value: stats.routes, icon: '🧭', color: 'bg-gold', href: '/routes' },
        { label: 'Users', value: stats.users, icon: '👥', color: 'bg-accent-blue', href: '/users' },
        { label: 'Categories', value: Object.keys(stats.categories).length, icon: '📂', color: 'bg-accent-purple', href: '/landmarks' },
    ]

    const quickLinks = [
        { label: 'Manage Landmarks', desc: 'Add, edit, or remove historical sites', icon: '📍', href: '/landmarks' },
        { label: 'Manage Routes', desc: 'Create and organize walking tours', icon: '🗺️', href: '/routes' },
        { label: 'Manage Users', desc: 'View users and assign roles', icon: '👤', href: '/users' },
    ]

    return (
        <div className="min-h-screen">
            <div className="flex">
                {/* Sidebar */}
                <aside className="hidden lg:flex flex-col w-72 min-h-screen bg-white border-r border-sand-200/60 p-6">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
                            <span className="text-white text-lg font-black">N</span>
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-gray-900 leading-tight">Navigate</h1>
                            <p className="text-xs text-primary font-semibold tracking-wide">AL-BALAD</p>
                        </div>
                    </div>
                    <nav className="flex-1 space-y-1">
                        <Link href="/" className="nav-link active">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                            Dashboard
                        </Link>
                        <Link href="/landmarks" className="nav-link text-gray-600">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            Landmarks
                        </Link>
                        <Link href="/routes" className="nav-link text-gray-600">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                            Routes
                        </Link>
                        <Link href="/users" className="nav-link text-gray-600">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            Users
                        </Link>
                    </nav>

                    {/* Admin User & Sign Out */}
                    {user && (
                        <div className="pt-4 border-t border-sand-200/60">
                            <div className="flex items-center gap-3 mb-3 px-2">
                                <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary font-bold text-sm">
                                    {user.email?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{user.username || 'Admin'}</p>
                                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                </div>
                            </div>
                            <button onClick={signOut} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                Sign Out
                            </button>
                        </div>
                    )}
                </aside>

                {/* Main */}
                <main className="flex-1 p-6 lg:p-10">
                    {/* Header */}
                    <div className="mb-8 animate-fade-in">
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard</h2>
                        <p className="text-sand-dark mt-1">Welcome to Navigate Al-Balad Admin Panel</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10 animate-slide-up">
                        {statCards.map((s, i) => (
                            <Link key={i} href={s.href} className="stat-card group cursor-pointer">
                                <div className={`absolute top-0 left-0 right-0 h-1 ${s.color} rounded-t-2xl`}></div>
                                <p className="text-xs font-medium text-gray-500 group-hover:text-primary transition-colors">{s.label}</p>
                                <div className="flex items-center justify-between mt-1">
                                    {loading ? (
                                        <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
                                    ) : (
                                        <p className="text-2xl font-black text-gray-900">{s.value}</p>
                                    )}
                                    <span className="text-2xl">{s.icon}</span>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Quick Links */}
                    <div className="mb-10 animate-slide-up" style={{ animationDelay: '100ms' }}>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            {quickLinks.map((link, i) => (
                                <Link key={i} href={link.href} className="card p-6 group cursor-pointer">
                                    <div className="text-3xl mb-3">{link.icon}</div>
                                    <h4 className="text-base font-bold text-gray-900 group-hover:text-primary transition-colors mb-1">{link.label}</h4>
                                    <p className="text-sm text-gray-500">{link.desc}</p>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Categories Breakdown */}
                    {!loading && Object.keys(stats.categories).length > 0 && (
                        <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Landmarks by Category</h3>
                            <div className="card p-6">
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {Object.entries(stats.categories).map(([cat, count], i) => (
                                        <div key={cat} className="flex items-center justify-between p-3 bg-sand-50/60 rounded-xl">
                                            <span className="text-sm font-medium text-gray-700 capitalize">{cat}</span>
                                            <span className="badge bg-primary-50 text-primary">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}
