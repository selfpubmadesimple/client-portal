import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, Clock, CalendarDays, AlertTriangle, Plus, ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { PageHeader, StatCard, StageIndicator, Spinner, EmptyState } from '../../components/UI'
import { format } from 'date-fns'

export default function AdminDashboard() {
  const [clients, setClients] = useState([])
  const [stats, setStats] = useState({ totalClients: 0, totalHoursRemaining: 0, upcomingMilestones: 0, overdueItems: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchDashboard() }, [])

  async function fetchDashboard() {
    setLoading(true)
    const { data: clientsData } = await supabase
      .from('clients').select('*, projects(*), hours_packages(*)').eq('status', 'active').order('name')

    const { data: milestones } = await supabase
      .from('milestones').select('*').in('status', ['upcoming', 'in_progress', 'overdue']).limit(10)

    const { data: overdueActions } = await supabase
      .from('action_items').select('*').in('status', ['open', 'in_progress']).lt('due_date', new Date().toISOString().split('T')[0])

    const allPkgs = (clientsData || []).flatMap(c => c.hours_packages || []).filter(p => p.is_active)
    const totalRemaining = allPkgs.reduce((s, p) => s + (p.hours_purchased - p.hours_used), 0)

    setClients(clientsData || [])
    setStats({
      totalClients: (clientsData || []).length, totalHoursRemaining: totalRemaining,
      upcomingMilestones: (milestones || []).length, overdueItems: (overdueActions || []).length,
    })
    setLoading(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={`${stats.totalClients} active clients`}
        actions={<Link to="/admin/clients/new" className="btn-primary flex items-center gap-2"><Plus size={16} /> New Client</Link>} />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Clients" value={stats.totalClients} icon={Users} color="blue" />
        <StatCard label="Total Hours Remaining" value={stats.totalHoursRemaining.toFixed(1)} icon={Clock} color={stats.totalHoursRemaining < 10 ? 'red' : 'green'} />
        <StatCard label="Upcoming Milestones" value={stats.upcomingMilestones} icon={CalendarDays} color="amber" />
        <StatCard label="Overdue Items" value={stats.overdueItems} icon={AlertTriangle} color={stats.overdueItems > 0 ? 'red' : 'green'} />
      </div>

      <h2 className="text-lg font-semibold mb-4">Active Projects</h2>
      {clients.length === 0 ? (
        <EmptyState icon={Users} title="No active clients yet" description="Add your first client to get started"
          action={<Link to="/admin/clients/new" className="btn-primary">Add Client</Link>} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map(client => {
            const mainProject = (client.projects || []).find(p => p.status !== 'completed')
            const activePkgs = (client.hours_packages || []).filter(p => p.is_active)
            const hoursRemaining = activePkgs.reduce((s, p) => s + (p.hours_purchased - p.hours_used), 0)
            const isLow = hoursRemaining <= 3
            return (
              <Link key={client.id} to={`/admin/clients/${client.id}`}
                className="card p-5 hover:shadow-md hover:border-brand-200 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">{client.name}</h3>
                    {mainProject && <p className="text-sm text-gray-500 mt-0.5">{mainProject.title}</p>}
                  </div>
                  <ArrowRight size={16} className="text-gray-300 group-hover:text-brand-400 mt-1" />
                </div>
                {mainProject && <div className="mb-3"><StageIndicator current={mainProject.stage} /></div>}
                <div className="flex items-center gap-4 text-sm">
                  <div className={`flex items-center gap-1.5 ${isLow ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                    <Clock size={14} /> {hoursRemaining.toFixed(1)} hrs left {isLow && <AlertTriangle size={12} />}
                  </div>
                  {mainProject?.target_launch_date && (
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <CalendarDays size={14} /> {format(new Date(mainProject.target_launch_date), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
