# Navigate Al-Balad — Admin Panel

A modern admin dashboard for managing the **Navigate Al-Balad** heritage tourism app. Built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, and **Supabase**.

![Next.js](https://img.shields.io/badge/Next.js-14.1-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3-38B2AC?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-2.39-3ECF8E?logo=supabase)

## Features

- 🏛️ **Landmarks Management** — Add, edit, and delete historical sites with bilingual (Arabic/English) support
- 🗺️ **Routes Management** — Create walking tours by ordering landmarks into routes
- 👥 **Users Management** — View all app users, toggle admin roles, and inspect user details
- 📊 **Dashboard** — Overview stats with landmarks count, routes, users, and category breakdown
- 🔐 **Admin Authentication** — Only users with `role: 'admin'` in the database can access the panel
- 🧊 **3D Model Generation** — Auto-generates GLB sign models for AR display when saving landmarks

---

## Prerequisites

- [Node.js](https://nodejs.org/) **v18** or later
- [npm](https://www.npmjs.com/) (comes with Node.js)
- A [Supabase](https://supabase.com/) project with the Navigate Al-Balad schema

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/navigatealbalad-jpg/admin_panel.git
cd admin_panel
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the project root:

```bash
cp .env.local.example .env.local
```

Or create it manually with the following content:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> Replace the values with your actual Supabase project URL and anon key. You can find these in your [Supabase Dashboard](https://app.supabase.com/) → **Settings** → **API**.

### 4. Run the development server

```bash
npm run dev
```

The app will be available at **[http://localhost:3000](http://localhost:3000)**.

### 5. Sign in

Use an email/password account that exists in your Supabase Auth **and** has `role: 'admin'` in the `public.users` table. Non-admin users will be rejected.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server on `localhost:3000` |
| `npm run build` | Create an optimized production build |
| `npm run start` | Serve the production build locally |
| `npm run lint` | Run ESLint to check for code issues |

---

## Project Structure

```
admin_panel/
├── app/
│   ├── globals.css          # Global styles & Tailwind component layer
│   ├── layout.tsx           # Root layout with AuthProvider
│   ├── page.tsx             # Dashboard page
│   ├── login/
│   │   └── page.tsx         # Admin login page
│   ├── landmarks/
│   │   └── page.tsx         # Landmarks CRUD page
│   ├── routes/
│   │   └── page.tsx         # Routes CRUD page
│   └── users/
│       └── page.tsx         # Users management page
├── lib/
│   ├── auth.tsx             # Auth context & admin role guard
│   ├── supabase.ts          # Supabase client initialization
│   └── glb-generator.ts     # 3D GLB sign model generator
├── .env.local               # Environment variables (not committed)
├── tailwind.config.js       # Al-Balad brand colors & custom theme
├── postcss.config.js        # PostCSS configuration
├── tsconfig.json            # TypeScript configuration
├── next.config.js           # Next.js configuration
└── package.json             # Dependencies & scripts
```

---

## Database Requirements

This admin panel expects the following Supabase tables:

- **`users`** — `id`, `email`, `username`, `avatar_url`, `role`, `language_code`, `high_contrast_mode`, `voice_guidance_enabled`, `created_at`
- **`landmarks`** — `id`, `name_ar`, `name_en`, `description_ar`, `description_en`, `latitude`, `longitude`, `elevation`, `category`, `created_at`
- **`routes`** — `id`, `name_ar`, `name_en`, `description_ar`, `description_en`, `estimated_duration_minutes`, `difficulty_level`, `created_by`, `created_at`
- **`route_landmarks`** — `route_id`, `landmark_id`, `sequence_order`
- **`landmark_media`** — `landmark_id`, `media_type`, `url`, `caption_ar`, `is_primary`

> The full schema is available in the main project repository at `supabase/schema.sql`.

---

## Deployment

This app can be deployed to [Vercel](https://vercel.com/):

1. Import the GitHub repository in Vercel
2. Add environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the Vercel project settings
3. Deploy — Vercel automatically detects Next.js

---

## License

This project is part of the Navigate Al-Balad heritage tourism platform.
