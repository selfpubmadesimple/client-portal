import { ArrowRight } from 'lucide-react'

// Stage progress indicator (CREATE → BUILD → SHARE)
export function StageIndicator({ current }) {
  const stages = ['CREATE', 'BUILD', 'SHARE']
  const currentIdx = stages.indexOf(current)

  return (
    <div className="flex items-center gap-2">
      {stages.map((stage, i) => (
        <div key={stage} className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
            i < currentIdx ? 'bg-emerald-100 text-emerald-700' :
            i === currentIdx ? (stage === 'CREATE' ? 'stage-create' : stage === 'BUILD' ? 'stage-build' : 'stage-share') :
            'bg-gray-100 text-gray-400'
          }`}>
            {i < currentIdx && <span>✓</span>}
            {stage}
          </div>
          {i < stages.length - 1 && <ArrowRight size={14} className="text-gray-300" />}
        </div>
      ))}
    </div>
  )
}

// Stat card for dashboards
export function StatCard({ label, value, subtitle, icon: Icon, color = 'blue', trend }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <div className="card-padded">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend && (
            <p className={`text-xs mt-1 font-medium ${trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </p>
          )}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  )
}

// Progress bar with label
export function ProgressBar({ value, max, label, showPercentage = true, color = 'brand' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  const colorMap = {
    brand: 'bg-brand-500',
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  }
  const barColor = pct > 80 ? colorMap.red : pct > 60 ? colorMap.amber : colorMap[color] || colorMap.brand

  return (
    <div>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm text-gray-600">{label}</span>}
          {showPercentage && <span className="text-sm font-medium text-gray-700">{pct}%</span>}
        </div>
      )}
      <div className="progress-bar">
        <div className={`progress-fill ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  )
}

// Hours gauge
export function HoursGauge({ used, total }) {
  const remaining = total - used
  const pct = total > 0 ? (used / total) * 100 : 0
  const isLow = remaining <= 3

  return (
    <div className="card-padded">
      <h3 className="text-sm font-medium text-gray-500 mb-3">Hours Summary</h3>
      <div className="flex items-end gap-4 mb-3">
        <div>
          <span className={`text-3xl font-bold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
            {remaining.toFixed(1)}
          </span>
          <span className="text-sm text-gray-400 ml-1">remaining</span>
        </div>
        <span className="text-sm text-gray-400 mb-1">of {total.toFixed(1)} total</span>
      </div>
      <div className="progress-bar h-3">
        <div
          className={`progress-fill ${isLow ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-brand-500'}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-400">
        <span>{used.toFixed(1)} used</span>
        <span>{remaining.toFixed(1)} left</span>
      </div>
      {isLow && (
        <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
          ⚠ Hours running low — consider purchasing more
        </div>
      )}
    </div>
  )
}

// Priority badge
export function PriorityBadge({ priority }) {
  const map = {
    low: 'badge-gray',
    medium: 'badge-blue',
    high: 'badge-yellow',
    urgent: 'badge-red',
  }
  return <span className={map[priority] || 'badge-gray'}>{priority}</span>
}

// Status badge
export function StatusBadge({ status }) {
  const map = {
    active: 'badge-green',
    paused: 'badge-yellow',
    completed: 'badge-blue',
    archived: 'badge-gray',
    not_started: 'badge-gray',
    in_progress: 'badge-blue',
    on_hold: 'badge-yellow',
    open: 'badge-blue',
    cancelled: 'badge-gray',
    upcoming: 'badge-purple',
    overdue: 'badge-red',
  }
  return <span className={map[status] || 'badge-gray'}>{status?.replace(/_/g, ' ')}</span>
}

// Empty state
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center py-12">
      {Icon && <Icon size={40} className="mx-auto text-gray-300 mb-3" />}
      <h3 className="text-sm font-medium text-gray-900">{title}</h3>
      {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// Loading spinner
export function Spinner({ size = 'md' }) {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
  return (
    <div className={`${sizeMap[size]} border-2 border-brand-600 border-t-transparent rounded-full animate-spin`} />
  )
}

// Page header
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  )
}

// Modal
export function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl ${wide ? 'max-w-2xl' : 'max-w-lg'} w-full mx-4 max-h-[85vh] overflow-y-auto`}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
          <h2 className="font-semibold text-lg">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
