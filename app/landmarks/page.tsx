'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { createSignGlb, uploadGlbToStorage, saveLandmarkModel } from '../../lib/glb-generator'
import Link from 'next/link'

interface Landmark {
    id: string
    name_ar: string
    name_en: string
    description_ar: string
    description_en: string
    latitude: number
    longitude: number
    elevation: number
    category: string
    created_at: string
}

const CATEGORIES = ['historical', 'mosque', 'museum', 'market', 'gate', 'square', 'other']

const categoryStyles: Record<string, { bg: string; text: string; icon: string }> = {
    historical: { bg: 'bg-amber-50', text: 'text-amber-700', icon: '🏛️' },
    mosque: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: '🕌' },
    museum: { bg: 'bg-blue-50', text: 'text-blue-700', icon: '🏛️' },
    market: { bg: 'bg-orange-50', text: 'text-orange-700', icon: '🏪' },
    gate: { bg: 'bg-purple-50', text: 'text-purple-700', icon: '🚪' },
    square: { bg: 'bg-cyan-50', text: 'text-cyan-700', icon: '⬜' },
    other: { bg: 'bg-gray-50', text: 'text-gray-700', icon: '📍' },
}

export default function LandmarksPage() {
    const { user, signOut } = useAuth()
    const [landmarks, setLandmarks] = useState<Landmark[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterCategory, setFilterCategory] = useState<string>('all')
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [glbStatus, setGlbStatus] = useState<string>('')

    // Form state
    const [form, setForm] = useState({
        name_ar: '', name_en: '', description_ar: '', description_en: '',
        latitude: '', longitude: '', elevation: '1.6', category: 'historical',
    })

    useEffect(() => { fetchLandmarks() }, [])

    async function fetchLandmarks() {
        setLoading(true)
        const { data } = await supabase
            .from('landmarks')
            .select('*')
            .order('created_at', { ascending: false })
        if (data) setLandmarks(data)
        setLoading(false)
    }

    function resetForm() {
        setForm({
            name_ar: '', name_en: '', description_ar: '', description_en: '',
            latitude: '', longitude: '', elevation: '1.6', category: 'historical'
        })
        setEditingId(null)
        setGlbStatus('')
        setShowForm(false)
    }

    function startEdit(lm: Landmark) {
        setForm({
            name_ar: lm.name_ar || '', name_en: lm.name_en || '',
            description_ar: lm.description_ar || '', description_en: lm.description_en || '',
            latitude: String(lm.latitude), longitude: String(lm.longitude),
            elevation: String(lm.elevation || 1.6),
            category: lm.category || 'historical',
        })
        setEditingId(lm.id)
        setShowForm(true)
    }

    async function handleSave() {
        if (!form.name_en || !form.latitude || !form.longitude) return
        setSaving(true)
        setGlbStatus('')

        const payload = {
            name_ar: form.name_ar, name_en: form.name_en,
            description_ar: form.description_ar, description_en: form.description_en,
            latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude),
            elevation: parseFloat(form.elevation) || 1.6,
            category: form.category,
        }

        let landmarkId = editingId

        if (editingId) {
            await supabase.from('landmarks').update(payload).eq('id', editingId)
        } else {
            const { data } = await supabase.from('landmarks').insert(payload).select('id').single()
            if (data) landmarkId = data.id
        }

        // Generate and upload GLB 3D sign model
        if (landmarkId) {
            try {
                setGlbStatus('🔧 Generating 3D sign model...')

                const glbBuffer = await createSignGlb({
                    nameEn: form.name_en,
                    nameAr: form.name_ar,
                    descriptionEn: form.description_en,
                    descriptionAr: form.description_ar,
                    category: form.category,
                    landmarkId: landmarkId,
                    elevation: parseFloat(form.elevation) || 1.6,
                })

                setGlbStatus('☁️ Uploading to storage...')

                const filename = `signs/${landmarkId}.glb`
                const publicUrl = await uploadGlbToStorage(supabase, glbBuffer, filename)

                if (publicUrl) {
                    setGlbStatus('💾 Saving to database...')
                    await saveLandmarkModel(supabase, landmarkId, publicUrl)
                    setGlbStatus('✅ 3D model created successfully!')
                } else {
                    setGlbStatus('⚠️ GLB upload failed — landmark saved without 3D model')
                }
            } catch (err) {
                console.error('GLB generation error:', err)
                setGlbStatus('⚠️ 3D model generation failed — landmark saved without model')
            }
        }

        setSaving(false)
        setTimeout(() => {
            setGlbStatus('')
            resetForm()
            fetchLandmarks()
        }, 1500)
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this landmark?')) return
        setDeleting(id)
        await supabase.from('landmarks').delete().eq('id', id)
        setDeleting(null)
        fetchLandmarks()
    }

    const filtered = landmarks.filter(l => {
        const matchesSearch = l.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.name_ar.includes(searchQuery)
        const matchesCategory = filterCategory === 'all' || l.category === filterCategory
        return matchesSearch && matchesCategory
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
                        <Link href="/landmarks" className="nav-link active">
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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 animate-fade-in">
                        <div>
                            <div className="flex items-center gap-3">
                                <Link href="/" className="text-gray-400 hover:text-primary transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </Link>
                                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Landmarks</h2>
                                <span className="badge bg-primary-50 text-primary">{landmarks.length}</span>
                            </div>
                            <p className="text-sand-dark mt-1 ml-8">Manage historical sites and points of interest</p>
                        </div>
                        <button
                            onClick={() => { resetForm(); setShowForm(true) }}
                            className="btn-primary mt-4 sm:mt-0"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            Add Landmark
                        </button>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-slide-up">
                        <div className="relative flex-1">
                            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search landmarks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input-field pl-11"
                            />
                        </div>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="input-field w-auto min-w-[160px]"
                        >
                            <option value="all">All Categories</option>
                            {CATEGORIES.map(c => (
                                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                            ))}
                        </select>
                    </div>

                    {/* Add/Edit Form Modal Overlay */}
                    {showForm && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
                            <div className="bg-white rounded-3xl shadow-elevated w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto animate-slide-up">
                                <div className="p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-bold text-gray-900">
                                            {editingId ? '✏️ Edit Landmark' : '🆕 New Landmark'}
                                        </h3>
                                        <button onClick={resetForm} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name (English) *</label>
                                            <input className="input-field" value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })} placeholder="e.g. Nasseef House" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name (Arabic)</label>
                                            <input className="input-field text-right" dir="rtl" value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} placeholder="مثال: بيت نصيف" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description (English)</label>
                                            <textarea className="input-field min-h-[80px]" value={form.description_en} onChange={e => setForm({ ...form, description_en: e.target.value })} placeholder="Brief description..." />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description (Arabic)</label>
                                            <textarea className="input-field min-h-[80px] text-right" dir="rtl" value={form.description_ar} onChange={e => setForm({ ...form, description_ar: e.target.value })} placeholder="وصف مختصر..." />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Latitude *</label>
                                            <input className="input-field" type="number" step="any" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} placeholder="21.48..." />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Longitude *</label>
                                            <input className="input-field" type="number" step="any" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} placeholder="39.18..." />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category *</label>
                                            <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                                {CATEGORIES.map(c => (
                                                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Elevation (m) 📏</label>
                                            <input type="number" step="0.1" min="0.5" max="10" className="input-field" value={form.elevation} onChange={e => setForm({ ...form, elevation: e.target.value })} placeholder="1.6" />
                                            <p className="text-xs text-gray-400 mt-1">Height of the panel center from ground.</p>
                                        </div>
                                    </div>

                                    {/* GLB Status */}
                                    {glbStatus && (
                                        <div className="mt-4 p-3 bg-primary-50 border border-primary/20 rounded-xl text-sm text-primary font-medium animate-slide-up">
                                            {glbStatus}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between gap-3 mt-8 pt-6 border-t border-sand-200/60">
                                        <p className="text-xs text-gray-400 flex items-center gap-1">
                                            <span>🧊</span> A 3D sign model will be auto-generated
                                        </p>
                                        <div className="flex gap-3">
                                            <button onClick={resetForm} className="btn-outline">Cancel</button>
                                            <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
                                                {saving ? (
                                                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Saving...</>
                                                ) : (
                                                    <>{editingId ? 'Update' : 'Create'} Landmark</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Landmarks Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="card p-6 animate-pulse">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                                    <div className="h-3 bg-gray-100 rounded w-1/2 mb-4"></div>
                                    <div className="h-3 bg-gray-100 rounded w-full mb-2"></div>
                                    <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                                </div>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="card p-12 text-center">
                            <div className="text-5xl mb-4">🏛️</div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">No landmarks found</h3>
                            <p className="text-gray-500 mb-6">
                                {searchQuery || filterCategory !== 'all' ? 'Try adjusting your search or filters.' : 'Start by adding your first landmark.'}
                            </p>
                            <button onClick={() => { resetForm(); setShowForm(true) }} className="btn-primary mx-auto">
                                Add Landmark
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filtered.map(lm => (
                                <div key={lm.id} className="card group hover:shadow-xl transition-all duration-300">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${categoryStyles[lm.category]?.bg || 'bg-gray-100'} ${categoryStyles[lm.category]?.text || 'text-gray-600'}`}>
                                                <span>{categoryStyles[lm.category]?.icon || '📍'}</span>
                                                {lm.category.charAt(0).toUpperCase() + lm.category.slice(1)}
                                            </span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => startEdit(lm)} className="w-8 h-8 rounded-full hover:bg-primary-50 text-gray-400 hover:text-primary transition-colors flex items-center justify-center">
                                                    ✏️
                                                </button>
                                                <button onClick={() => handleDelete(lm.id)} className="w-8 h-8 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center">
                                                    {deleting === lm.id ? '⏳' : '🗑️'}
                                                </button>
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-bold text-gray-900 mb-1">{lm.name_en}</h3>
                                        <h4 className="text-lg text-gray-600 font-arabic mb-3">{lm.name_ar}</h4>

                                        <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">{lm.description_en}</p>

                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs text-gray-400 mt-auto">
                                            <div className="flex items-center gap-4">
                                                <span>📍 {lm.latitude.toFixed(4)}, {lm.longitude.toFixed(4)}</span>
                                                <span title="Elevation">📏 {lm.elevation || 1.6}m</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}
