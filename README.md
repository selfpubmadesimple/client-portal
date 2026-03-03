# Author Project Management System

A full-stack React application for managing author publishing projects with client portal access.

## Quick Start

### Prerequisites
- Node.js 18+ installed ([download](https://nodejs.org))
- Supabase project set up with the migration SQL already run

### Setup

1. **Install dependencies:**
   ```bash
   cd author-pm
   npm install
   ```

2. **Configure environment:**
   The `.env` file is pre-configured with your Supabase URL and key.
   If the key looks truncated, update it:
   ```
   VITE_SUPABASE_URL=https://tfabmhxzrpdfensifyzo.supabase.co
   VITE_SUPABASE_ANON_KEY=your_full_publishable_key_here
   ```

3. **Enable Google OAuth (optional):**
   - Go to Supabase Dashboard → Authentication → Providers
   - Enable Google and add your Google OAuth client ID/secret
   - Set redirect URL to `http://localhost:3000`

4. **Start the dev server:**
   ```bash
   npm run dev
   ```
   Opens at `http://localhost:3000`

5. **Create your admin account:**
   - Sign up through the app
   - Go to Supabase Dashboard → Table Editor → profiles
   - Change your `role` from `client` to `admin`
   - Refresh the app

### First Steps After Setup
1. Log in as admin
2. Click "New Client" to add your first author
3. The full publishing checklist auto-populates
4. Log time, add milestones, coaching sessions, and links
5. To give a client portal access: create a Supabase user for them, then link their `auth_user_id` in the clients table

## Tech Stack
- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Real-time)
- **Routing:** React Router v6
- **Charts:** Recharts
- **Icons:** Lucide React

## Project Structure
```
src/
├── App.jsx              # Routes & auth wrapper
├── main.jsx             # Entry point
├── index.css            # Tailwind + custom styles
├── lib/supabase.js      # Supabase client
├── contexts/AuthContext  # Auth state management
├── hooks/useData.js     # Data fetching hooks
├── components/          # Shared UI components
│   ├── Layout.jsx       # Page layout with sidebar
│   ├── Sidebar.jsx      # Navigation sidebar
│   ├── NotificationBell # Real-time notifications
│   ├── ProtectedRoute   # Auth guard
│   └── UI.jsx           # Reusable UI components
└── pages/
    ├── Login.jsx        # Auth page
    ├── admin/           # Admin/team pages
    │   ├── Dashboard    # Portfolio overview
    │   ├── Clients      # Client list
    │   ├── NewClient    # Onboarding wizard
    │   └── ClientDetail # Full client hub
    └── client/          # Client portal
        └── Dashboard    # Client-facing dashboard
```

## Deployment
```bash
npm run build
```
Deploy the `dist/` folder to Vercel, Netlify, or any static hosting.
