import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { PageHeader, StatusBadge, Spinner, EmptyState, Modal } from '../../components/UI'

export default function ClientsList() {
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('clients').select('*, projects(id, title, stage, status)').order('name')
      .then(({ data }) => { setClients(data || []); setLoading(false) })
  }, [])

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  return (
    <div>
      <PageHeader title="Clients" subtitle={`${clients.length} total`}
        actions={<Link to="/admin/clients/new" className="btn-primary flex items-center gap-2"><Plus size={16} /> New Client</Link>} />

      <div className="mb-4 relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)}
          className="input-field pl-10 max-w-sm" />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Project</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stage</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(client => {
              const project = (client.projects || [])[0]
              return (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{client.name}</div>
                    <div className="text-sm text-gray-500">{client.email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{project?.title || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={client.status} /></td>
                  <td className="px-4 py-3">
                    {project && <span className={`badge ${project.stage === 'CREATE' ? 'stage-create' : project.stage === 'BUILD' ? 'stage-build' : 'stage-share'}`}>{project.stage}</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/clients/${client.id}`} className="text-brand-600 hover:text-brand-700">
                      <ArrowRight size={16} />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState title="No clients found" description="Try adjusting your search" />}
      </div>
    </div>
  )
}
