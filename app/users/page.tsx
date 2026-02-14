'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import Link from 'next/link'

interface User {
    id: string
    email: string
    username: string | null
    avatar_url: string | null
    created_at: string
    language_code: string
    high_contrast_mode: boolean
    voice_guidance_enabled: boolean
    role: string
}

const roleStyles: Record<string, { bg: string; text: string }> = {
    admin: { bg: 'bg-purple-50', text: 'text-purple-700' },
    user: { bg: 'bg-primary-50', text: 'text-primary' },
}

export default function UsersPage() {
    const { user: adminUser, signOut } = useAuth()
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterRole, setFilterRole] = useState<string>('all')
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [stats, setStats] = useState({ total: 0, admins: 0, arabic: 0, english: 0 })

    useEffect(() => { fetchUsers() }, [])

    async function fetchUsers() {
        setLoading(true)
        const { data } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false })
        if (data) {
            setUsers(data)
            setStats({
                total: data.length,
                admins: data.filter(u => u.role === 'admin').length,
                arabic: data.filter(u => u.language_code === 'ar').length,
                english: data.filter(u => u.language_code === 'en').length,
            })
        }
        setLoading(false)
    }

    async function toggleRole(userId: string, currentRole: string) {
        const newRole = currentRole === 'admin' ? 'user' : 'admin'
        if (!confirm(`Change role to "${newRole}"?`)) return
        await supabase.from('users').update({ role: newRole }).eq('id', userId)
        fetchUsers()
    }

    const filtered = users.filter(u => {
        const matchSearch = !searchQuery ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.username?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchRole = filterRole === 'all' || u.role === filterRole
        return matchSearch && matchRole
    })

    function timeAgo(date: string) {
        const diff = Date.now() - new Date(date).getTime()
        const days = Math.floor(diff / 86400000)
        if (days === 0) return 'Today'
        if (days === 1) return 'Yesterday'
        if (days < 30) return `${days} days ago`
        if (days < 365) return `${Math.floor(days / 30)} months ago`
        return `${Math.floor(days / 365)} years ago`
    }

    function getInitials(user: User) {
        if (user.username) return user.username.charAt(0).toUpperCase()
        return user.email?.charAt(0).toUpperCase() || '?'
    }

    const avatarColors = ['bg-primary', 'bg-sand', 'bg-gold', 'bg-accent-blue', 'bg-accent-purple', 'bg-accent-orange']

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
                        <Link href="/" className="nav-link text-gray-600">
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
                        <Link href="/users" className="nav-link active">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            Users
                        </Link>
                    </nav>

                    {/* Admin User & Sign Out */}
                    {adminUser && (
                        <div className="pt-4 border-t border-sand-200/60">
                            <div className="flex items-center gap-3 mb-3 px-2">
                                <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary font-bold text-sm">
                                    {adminUser.email?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{adminUser.username || 'Admin'}</p>
                                    <p className="text-xs text-gray-400 truncate">{adminUser.email}</p>
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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 animate-fade-in">
                        <div>
                            <div className="flex items-center gap-3">
                                <Link href="/" className="text-gray-400 hover:text-primary transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </Link>
                                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Users</h2>
                                <span className="badge bg-primary-50 text-primary">{users.length}</span>
                            </div>
                            <p className="text-sand-dark mt-1 ml-8">Manage app users and roles</p>
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 animate-slide-up">
                        {[
                            { label: 'Total Users', value: stats.total, icon: '👥', color: 'bg-primary' },
                            { label: 'Admins', value: stats.admins, icon: '🛡️', color: 'bg-accent-purple' },
                            { label: 'Arabic', value: stats.arabic, icon: '🇸🇦', color: 'bg-gold' },
                            { label: 'English', value: stats.english, icon: '🇬🇧', color: 'bg-accent-blue' },
                        ].map((s, i) => (
                            <div key={i} className="stat-card">
                                <div className={`absolute top-0 left-0 right-0 h-1 ${s.color} rounded-t-2xl`}></div>
                                <p className="text-xs font-medium text-gray-500">{s.label}</p>
                                <div className="flex items-center justify-between mt-1">
                                    <p className="text-2xl font-black text-gray-900">{s.value}</p>
                                    <span className="text-xl">{s.icon}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Search & Filter */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        <div className="relative flex-1">
                            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input type="text" placeholder="Search by email or username..." value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)} className="input-field pl-11" />
                        </div>
                        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="input-field w-auto min-w-[140px]">
                            <option value="all">All Roles</option>
                            <option value="admin">Admin</option>
                            <option value="user">User</option>
                        </select>
                    </div>

                    {/* Users Table */}
                    <div className="card overflow-hidden animate-slide-up">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-sand-50/60">
                                        <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-6 py-4">User</th>
                                        <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-6 py-4">Role</th>
                                        <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-6 py-4">Language</th>
                                        <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-6 py-4">Settings</th>
                                        <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-6 py-4">Joined</th>
                                        <th className="text-right text-xs font-bold text-gray-500 uppercase tracking-wider px-6 py-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sand-200/40">
                                    {loading ? (
                                        [...Array(4)].map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gray-200"></div><div><div className="h-3 bg-gray-200 rounded w-32 mb-1"></div><div className="h-2 bg-gray-100 rounded w-24"></div></div></div></td>
                                                <td className="px-6 py-4"><div className="h-5 bg-gray-100 rounded-full w-14"></div></td>
                                                <td className="px-6 py-4"><div className="h-3 bg-gray-100 rounded w-8"></div></td>
                                                <td className="px-6 py-4"><div className="h-3 bg-gray-100 rounded w-20"></div></td>
                                                <td className="px-6 py-4"><div className="h-3 bg-gray-100 rounded w-16"></div></td>
                                                <td className="px-6 py-4"></td>
                                            </tr>
                                        ))
                                    ) : filtered.length === 0 ? (
                                        <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No users found.</td></tr>
                                    ) : (
                                        filtered.map((user, i) => {
                                            const style = roleStyles[user.role] || roleStyles.user
                                            return (
                                                <tr key={user.id} className="group hover:bg-sand-50/40 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                                                                {getInitials(user)}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold text-gray-900">{user.username || 'No username'}</p>
                                                                <p className="text-xs text-gray-400">{user.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`badge ${style.bg} ${style.text}`}>
                                                            {user.role === 'admin' ? '🛡️' : '👤'} {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-gray-600">{user.language_code === 'ar' ? '🇸🇦 AR' : '🇬🇧 EN'}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            {user.voice_guidance_enabled && (
                                                                <span className="badge bg-blue-50 text-blue-600 text-[10px]">🔊 Voice</span>
                                                            )}
                                                            {user.high_contrast_mode && (
                                                                <span className="badge bg-gray-100 text-gray-600 text-[10px]">◐ Contrast</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-gray-500">{timeAgo(user.created_at)}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => setSelectedUser(user)}
                                                                className="text-xs font-medium text-primary hover:text-primary-dark transition-colors">
                                                                View
                                                            </button>
                                                            <button onClick={() => toggleRole(user.id, user.role)}
                                                                className="text-xs font-medium text-sand-dark hover:text-accent-purple transition-colors">
                                                                Toggle Role
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* User Detail Modal */}
                    {selectedUser && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
                            <div className="bg-white rounded-3xl shadow-elevated w-full max-w-md m-4 animate-slide-up">
                                <div className="p-8">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white text-xl font-bold shadow-md">
                                                {getInitials(selectedUser)}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">{selectedUser.username || 'No username'}</h3>
                                                <p className="text-sm text-gray-400">{selectedUser.email}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedUser(null)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {[
                                            { label: 'Role', value: selectedUser.role, icon: '🛡️' },
                                            { label: 'Language', value: selectedUser.language_code === 'ar' ? 'Arabic 🇸🇦' : 'English 🇬🇧', icon: '🌐' },
                                            { label: 'Voice Guidance', value: selectedUser.voice_guidance_enabled ? 'Enabled ✅' : 'Disabled ❌', icon: '🔊' },
                                            { label: 'High Contrast', value: selectedUser.high_contrast_mode ? 'Enabled ✅' : 'Disabled ❌', icon: '◐' },
                                            { label: 'Joined', value: new Date(selectedUser.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), icon: '📅' },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center justify-between py-3 border-b border-sand-200/40 last:border-0">
                                                <span className="text-sm text-gray-500">{item.icon} {item.label}</span>
                                                <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-end mt-6">
                                        <button onClick={() => setSelectedUser(null)} className="btn-outline">Close</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}
