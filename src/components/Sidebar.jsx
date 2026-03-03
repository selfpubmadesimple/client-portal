import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Clock, CheckSquare, CalendarDays,
  MessageSquare, Link2, Video, Settings, LogOut, BookOpen
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/clients', icon: Users, label: 'Clients' },
  { to: '/admin/time', icon: Clock, label: 'Time Tracking' },
  { to: '/admin/milestones', icon: CalendarDays, label: 'Milestones' },
  { to: '/admin/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/admin/actions', icon: BookOpen, label: 'Action Items' },
  { to: '/admin/comments', icon: MessageSquare, label: 'Comments' },
  { to: '/admin/sessions', icon: Video, label: 'Coaching Sessions' },
  { to: '/admin/links', icon: Link2, label: 'Project Links' },
]

const clientNav = [
  { to: '/portal', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/portal/milestones', icon: CalendarDays, label: 'Milestones' },
  { to: '/portal/tasks', icon: CheckSquare, label: 'Progress' },
  { to: '/portal/actions', icon: BookOpen, label: 'Action Items' },
  { to: '/portal/sessions', icon: Video, label: 'Coaching Sessions' },
  { to: '/portal/links', icon: Link2, label: 'Resources' },
  { to: '/portal/comments', icon: MessageSquare, label: 'Comments' },
]

export default function Sidebar() {
  const { profile, signOut, isTeam } = useAuth()
  const nav = isTeam ? adminNav : clientNav

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-brand-900 text-white flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <h1 className="font-display font-bold text-lg tracking-tight">
          <span className="text-brand-300">Author</span> PM
        </h1>
        <p className="text-xs text-brand-400 mt-0.5">Project Management</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-brand-300 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User info & sign out */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="px-3 py-2">
          <p className="text-sm font-medium truncate">{profile?.full_name}</p>
          <p className="text-xs text-brand-400 capitalize">{profile?.role?.replace('_', ' ')}</p>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-brand-300 hover:bg-white/10 hover:text-white w-full transition-colors mt-1"
        >
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </aside>
  )
}
