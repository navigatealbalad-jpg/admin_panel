'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import Link from 'next/link'

interface Route {
    id: string
    name_ar: string
    name_en: string
    description_ar: string
    description_en: string
    estimated_duration_minutes: number | null
    difficulty_level: string
    created_by: string | null
    created_at: string
}

interface Landmark {
    id: string
    name_en: string
    name_ar: string
    category: string
}

interface RouteLandmark {
    landmark_id: string
    sequence_order: number
    landmarks?: Landmark
}

const DIFFICULTIES = ['easy', 'medium', 'hard']

const difficultyStyles: Record<string, { bg: string; text: string; icon: string; label: string }> = {
    easy: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: '🟢', label: 'Easy' },
    medium: { bg: 'bg-amber-50', text: 'text-amber-700', icon: '🟡', label: 'Medium' },
    hard: { bg: 'bg-red-50', text: 'text-red-700', icon: '🔴', label: 'Hard' },
}

export default function RoutesPage() {
    const { user, signOut } = useAuth()
    const [routes, setRoutes] = useState<Route[]>([])
    const [landmarks, setLandmarks] = useState<Landmark[]>([])
    const [routeLandmarks, setRouteLandmarks] = useState<Record<string, RouteLandmark[]>>({})
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterDifficulty, setFilterDifficulty] = useState('all')

    // Form state
    const [form, setForm] = useState({
        name_ar: '', name_en: '', description_ar: '', description_en: '',
        estimated_duration_minutes: '', difficulty_level: 'easy',
    })
    const [selectedLandmarks, setSelectedLandmarks] = useState<string[]>([])

    useEffect(() => { fetchAll() }, [])

    async function fetchAll() {
        setLoading(true)

        const [routeRes, lmRes] = await Promise.all([
            supabase.from('routes').select('*').order('created_at', { ascending: false }),
            supabase.from('landmarks').select('id, name_en, name_ar, category').order('name_en'),
        ])

        const routesData = routeRes.data || []
        setRoutes(routesData)
        setLandmarks(lmRes.data || [])

        // Fetch landmarks for each route
        if (routesData.length > 0) {
            const routeIds = routesData.map(r => r.id)
            const { data: rlData } = await supabase
                .from('route_landmarks')
                .select('route_id, landmark_id, sequence_order')
                .in('route_id', routeIds)
                .order('sequence_order')

            if (rlData) {
                const grouped: Record<string, RouteLandmark[]> = {}
                rlData.forEach((rl: any) => {
                    if (!grouped[rl.route_id]) grouped[rl.route_id] = []
                    grouped[rl.route_id].push(rl)
                })
                setRouteLandmarks(grouped)
            }
        }

        setLoading(false)
    }

    function resetForm() {
        setForm({ name_ar: '', name_en: '', description_ar: '', description_en: '', estimated_duration_minutes: '', difficulty_level: 'easy' })
        setSelectedLandmarks([])
        setEditingId(null)
        setShowForm(false)
    }

    function startEdit(route: Route) {
        setForm({
            name_ar: route.name_ar || '', name_en: route.name_en || '',
            description_ar: route.description_ar || '', description_en: route.description_en || '',
            estimated_duration_minutes: route.estimated_duration_minutes?.toString() || '',
            difficulty_level: route.difficulty_level || 'easy',
        })
        // Load existing landmarks
        const existing = routeLandmarks[route.id] || []
        setSelectedLandmarks(existing.map(rl => rl.landmark_id))
        setEditingId(route.id)
        setShowForm(true)
    }

    async function handleSave() {
        if (!form.name_en) return
        setSaving(true)

        const payload = {
            name_ar: form.name_ar, name_en: form.name_en,
            description_ar: form.description_ar, description_en: form.description_en,
            estimated_duration_minutes: form.estimated_duration_minutes ? parseInt(form.estimated_duration_minutes) : null,
            difficulty_level: form.difficulty_level,
        }

        let routeId = editingId

        if (editingId) {
            await supabase.from('routes').update(payload).eq('id', editingId)
        } else {
            const { data } = await supabase.from('routes').insert(payload).select('id').single()
            if (data) routeId = data.id
        }

        // Update route_landmarks
        if (routeId) {
            await supabase.from('route_landmarks').delete().eq('route_id', routeId)
            if (selectedLandmarks.length > 0) {
                const inserts = selectedLandmarks.map((lmId, i) => ({
                    route_id: routeId,
                    landmark_id: lmId,
                    sequence_order: i + 1,
                }))
                await supabase.from('route_landmarks').insert(inserts)
            }
        }

        setSaving(false)
        resetForm()
        fetchAll()
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this route?')) return
        setDeleting(id)
        await supabase.from('route_landmarks').delete().eq('route_id', id)
        await supabase.from('routes').delete().eq('id', id)
        setDeleting(null)
        fetchAll()
    }

    function toggleLandmarkSelection(lmId: string) {
        setSelectedLandmarks(prev =>
            prev.includes(lmId)
                ? prev.filter(id => id !== lmId)
                : [...prev, lmId]
        )
    }

    function moveLandmark(index: number, direction: 'up' | 'down') {
        const arr = [...selectedLandmarks]
        const newIndex = direction === 'up' ? index - 1 : index + 1
        if (newIndex < 0 || newIndex >= arr.length) return
            ;[arr[index], arr[newIndex]] = [arr[newIndex], arr[index]]
        setSelectedLandmarks(arr)
    }

    function getLandmarkName(id: string) {
        return landmarks.find(l => l.id === id)?.name_en || 'Unknown'
    }

    const filtered = routes.filter(r => {
        const matchSearch = !searchQuery ||
            r.name_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.name_ar?.includes(searchQuery)
        const matchDiff = filterDifficulty === 'all' || r.difficulty_level === filterDifficulty
        return matchSearch && matchDiff
    })

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
                        <Link href="/routes" className="nav-link active">
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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 animate-fade-in">
                        <div>
                            <div className="flex items-center gap-3">
                                <Link href="/" className="text-gray-400 hover:text-primary transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </Link>
                                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Routes</h2>
                                <span className="badge bg-primary-50 text-primary">{routes.length}</span>
                            </div>
                            <p className="text-sand-dark mt-1 ml-8">Curate walking tours through Jeddah's historic district</p>
                        </div>
                        <button onClick={() => { resetForm(); setShowForm(true) }} className="btn-primary mt-4 sm:mt-0">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            Create Route
                        </button>
                    </div>

                    {/* Search & Filter */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-slide-up">
                        <div className="relative flex-1">
                            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input type="text" placeholder="Search routes..." value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)} className="input-field pl-11" />
                        </div>
                        <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)} className="input-field w-auto min-w-[160px]">
                            <option value="all">All Difficulties</option>
                            {DIFFICULTIES.map(d => (
                                <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                            ))}
                        </select>
                    </div>

                    {/* Routes Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {[1, 2].map(i => (
                                <div key={i} className="card p-6 animate-pulse">
                                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
                                    <div className="h-3 bg-gray-100 rounded w-1/3 mb-4"></div>
                                    <div className="h-3 bg-gray-100 rounded w-full mb-2"></div>
                                    <div className="flex gap-3 mt-4">
                                        <div className="h-6 bg-gray-100 rounded-full w-16"></div>
                                        <div className="h-6 bg-gray-100 rounded-full w-20"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="card p-12 text-center">
                            <div className="text-5xl mb-4">🗺️</div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">No routes found</h3>
                            <p className="text-gray-500 mb-6">
                                {searchQuery || filterDifficulty !== 'all' ? 'Try adjusting your filters.' : 'Create your first walking tour route.'}
                            </p>
                            <button onClick={() => { resetForm(); setShowForm(true) }} className="btn-primary mx-auto">Create First Route</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {filtered.map((route, i) => {
                                const diff = difficultyStyles[route.difficulty_level] || difficultyStyles.easy
                                const rLandmarks = routeLandmarks[route.id] || []
                                return (
                                    <div key={route.id} className="card p-6 animate-slide-up group" style={{ animationDelay: `${i * 80}ms` }}>
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-2xl">
                                                    🧭
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-bold text-gray-900">{route.name_en}</h3>
                                                    {route.name_ar && <p className="text-sm text-gray-400" dir="rtl">{route.name_ar}</p>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => startEdit(route)} className="w-8 h-8 rounded-lg hover:bg-primary-50 flex items-center justify-center" title="Edit">
                                                    <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
                                                <button onClick={() => handleDelete(route.id)} disabled={deleting === route.id} className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center" title="Delete">
                                                    {deleting === route.id ? (
                                                        <svg className="w-4 h-4 animate-spin text-red-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                                    ) : (
                                                        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        {route.description_en && (
                                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{route.description_en}</p>
                                        )}

                                        {/* Metadata badges */}
                                        <div className="flex flex-wrap items-center gap-2 mb-4">
                                            <span className={`badge ${diff.bg} ${diff.text}`}>{diff.icon} {diff.label}</span>
                                            {route.estimated_duration_minutes && (
                                                <span className="badge bg-sand-50 text-sand-dark border border-sand-200">
                                                    ⏱️ {route.estimated_duration_minutes} min
                                                </span>
                                            )}
                                            <span className="badge bg-primary-50 text-primary">
                                                📍 {rLandmarks.length} stops
                                            </span>
                                        </div>

                                        {/* Landmarks Timeline */}
                                        {rLandmarks.length > 0 && (
                                            <div className="pt-3 border-t border-sand-200/40">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Route Stops</p>
                                                <div className="flex items-center gap-1 flex-wrap">
                                                    {rLandmarks.map((rl, j) => (
                                                        <div key={j} className="flex items-center gap-1">
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sand-50 rounded-md text-xs text-gray-600 font-medium">
                                                                <span className="text-primary font-bold">{j + 1}</span>
                                                                {getLandmarkName(rl.landmark_id)}
                                                            </span>
                                                            {j < rLandmarks.length - 1 && (
                                                                <svg className="w-3 h-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Create/Edit Route Modal */}
                    {showForm && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
                            <div className="bg-white rounded-3xl shadow-elevated w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto animate-slide-up">
                                <div className="p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-bold text-gray-900">
                                            {editingId ? '✏️ Edit Route' : '🆕 New Route'}
                                        </h3>
                                        <button onClick={resetForm} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Route Name (English) *</label>
                                            <input className="input-field" value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })} placeholder="e.g. Heritage Walk" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Route Name (Arabic)</label>
                                            <input className="input-field text-right" dir="rtl" value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} placeholder="مثال: جولة التراث" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description (English)</label>
                                            <textarea className="input-field min-h-[80px] resize-y" value={form.description_en} onChange={e => setForm({ ...form, description_en: e.target.value })} placeholder="Describe the walking tour..." />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description (Arabic)</label>
                                            <textarea className="input-field min-h-[80px] resize-y text-right" dir="rtl" value={form.description_ar} onChange={e => setForm({ ...form, description_ar: e.target.value })} placeholder="وصف الجولة..." />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Duration (minutes)</label>
                                            <input className="input-field" type="number" value={form.estimated_duration_minutes} onChange={e => setForm({ ...form, estimated_duration_minutes: e.target.value })} placeholder="60" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Difficulty</label>
                                            <select className="input-field" value={form.difficulty_level} onChange={e => setForm({ ...form, difficulty_level: e.target.value })}>
                                                {DIFFICULTIES.map(d => (
                                                    <option key={d} value={d}>{difficultyStyles[d].icon} {d.charAt(0).toUpperCase() + d.slice(1)}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Landmark Selection */}
                                    <div className="mt-6">
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">Route Stops (select & order landmarks)</label>

                                        {/* Selected landmarks with order */}
                                        {selectedLandmarks.length > 0 && (
                                            <div className="mb-4 space-y-2">
                                                {selectedLandmarks.map((lmId, idx) => (
                                                    <div key={lmId} className="flex items-center gap-3 p-3 bg-primary-50/50 rounded-xl border border-primary/10">
                                                        <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                                                        <span className="flex-1 text-sm font-medium text-gray-900">{getLandmarkName(lmId)}</span>
                                                        <div className="flex gap-1">
                                                            <button onClick={() => moveLandmark(idx, 'up')} disabled={idx === 0}
                                                                className="w-7 h-7 rounded-md hover:bg-white disabled:opacity-30 flex items-center justify-center text-xs">↑</button>
                                                            <button onClick={() => moveLandmark(idx, 'down')} disabled={idx === selectedLandmarks.length - 1}
                                                                className="w-7 h-7 rounded-md hover:bg-white disabled:opacity-30 flex items-center justify-center text-xs">↓</button>
                                                            <button onClick={() => toggleLandmarkSelection(lmId)}
                                                                className="w-7 h-7 rounded-md hover:bg-red-50 flex items-center justify-center text-xs text-red-500">✕</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Available landmarks */}
                                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                                            {landmarks.filter(lm => !selectedLandmarks.includes(lm.id)).map(lm => (
                                                <button key={lm.id} onClick={() => toggleLandmarkSelection(lm.id)}
                                                    className="text-left p-3 rounded-xl border-2 border-dashed border-sand-200 hover:border-primary/40 hover:bg-primary-50/30 transition-all text-sm">
                                                    <span className="font-medium text-gray-700">📍 {lm.name_en}</span>
                                                    <span className="block text-xs text-gray-400 mt-0.5">{lm.category}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-sand-200/60">
                                        <button onClick={resetForm} className="btn-outline">Cancel</button>
                                        <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
                                            {saving ? (
                                                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Saving...</>
                                            ) : (
                                                <>{editingId ? 'Update' : 'Create'} Route</>
                                            )}
                                        </button>
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
