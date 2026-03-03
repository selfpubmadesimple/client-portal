import { useState, useEffect } from 'react'
import { Clock, CalendarDays, CheckSquare, MessageSquare, Video, Link2, BookOpen, Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { PageHeader, StageIndicator, StatusBadge, PriorityBadge, HoursGauge, ProgressBar, Spinner, EmptyState } from '../../components/UI'
import { format } from 'date-fns'

export default function ClientDashboard() {
  const { user } = useAuth()
  const [client, setClient] = useState(null)
  const [project, setProject] = useState(null)
  const [packages, setPackages] = useState([])
  const [milestones, setMilestones] = useState([])
  const [tasks, setTasks] = useState([])
  const [actionItems, setActionItems] = useState([])
  const [sessions, setSessions] = useState([])
  const [links, setLinks] = useState([])
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')

  useEffect(() => { if (user) fetchData() }, [user])

  async function fetchData() {
    setLoading(true)
    // Get client record for this user
    const { data: c } = await supabase.from('clients').select('*').eq('auth_user_id', user.id).single()
    if (!c) { setLoading(false); return }
    setClient(c)

    const { data: p } = await supabase.from('projects').select('*').eq('client_id', c.id).order('created_at', { ascending: false }).limit(1)
    const proj = p?.[0]
    setProject(proj)

    if (proj) {
      const [pkgs, ms, ts, ai, sess, lnks, cmts] = await Promise.all([
        supabase.from('hours_packages').select('*').eq('client_id', c.id).eq('is_active', true),
        supabase.from('milestones').select('*').eq('project_id', proj.id).order('due_date'),
        supabase.from('tasks').select('*').eq('project_id', proj.id).order('sort_order'),
        supabase.from('action_items').select('*').eq('project_id', proj.id).eq('is_visible_to_client', true).order('created_at', { ascending: false }),
        supabase.from('coaching_sessions').select('*').eq('project_id', proj.id).order('session_date', { ascending: false }),
        supabase.from('project_links').select('*').eq('project_id', proj.id).eq('is_visible_to_client', true).order('sort_order'),
        supabase.from('comments').select('*, profiles(full_name, role)').eq('project_id', proj.id).order('created_at', { ascending: false }).limit(20),
      ])
      setPackages(pkgs.data || [])
      setMilestones(ms.data || [])
      setTasks(ts.data || [])
      setActionItems(ai.data || [])
      setSessions(sess.data || [])
      setLinks(lnks.data || [])
      setComments(cmts.data || [])
    }
    setLoading(false)
  }

  async function submitComment(e) {
    e.preventDefault()
    if (!commentText.trim()) return
    await supabase.from('comments').insert({ body: commentText, project_id: project.id, author_id: user.id, context_type: 'general' })
    setCommentText('')
    fetchData()
  }

  async function completeAction(id) {
    await supabase.from('action_items').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', id)
    fetchData()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  if (!client) return (
    <EmptyState title="No project found" description="Your account hasn't been linked to a client project yet. Please contact your project manager." />
  )

  const totalPurchased = packages.reduce((s, p) => s + parseFloat(p.hours_purchased), 0)
  const totalUsed = packages.reduce((s, p) => s + parseFloat(p.hours_used), 0)
  const completedTasks = tasks.filter(t => t.is_complete).length
  const myActions = actionItems.filter(a => a.assigned_to === user.id && a.status !== 'completed')
  const upcomingMilestones = milestones.filter(m => m.status === 'upcoming' || m.status === 'in_progress')

  return (
    <div>
      <PageHeader title={`Welcome, ${client.name}`} subtitle={project?.title} />

      {project && <div className="mb-6"><StageIndicator current={project.stage} /></div>}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <HoursGauge used={totalUsed} total={totalPurchased} />
        <div className="card-padded">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Overall Progress</h3>
          <p className="text-2xl font-bold mb-2">{completedTasks} / {tasks.length} <span className="text-sm text-gray-400 font-normal">tasks</span></p>
          <ProgressBar value={completedTasks} max={tasks.length} />
        </div>
        <div className="card-padded">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Next Milestone</h3>
          {upcomingMilestones[0] ? (
            <>
              <p className="font-semibold">{upcomingMilestones[0].title}</p>
              <p className="text-sm text-gray-500 mt-1">{format(new Date(upcomingMilestones[0].due_date), 'MMMM d, yyyy')}</p>
            </>
          ) : <p className="text-gray-400 text-sm">No upcoming milestones</p>}
        </div>
      </div>

      {/* Your Action Items */}
      {myActions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><BookOpen size={18} /> Your To-Dos</h2>
          <div className="space-y-2">
            {myActions.map(a => (
              <div key={a.id} className="card p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{a.title}</h4>
                  {a.due_date && <p className="text-xs text-gray-500">Due: {format(new Date(a.due_date), 'MMM d, yyyy')}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={a.priority} />
                  <button onClick={() => completeAction(a.id)} className="btn-secondary btn-sm">Mark Done</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Milestones */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><CalendarDays size={18} /> Milestones</h2>
        <div className="space-y-2">
          {milestones.map(m => (
            <div key={m.id} className="card p-4 flex items-center justify-between">
              <div>
                <h4 className="font-medium">{m.title}</h4>
                <p className="text-sm text-gray-500">{format(new Date(m.due_date), 'MMM d, yyyy')}</p>
              </div>
              <StatusBadge status={m.status} />
            </div>
          ))}
          {milestones.length === 0 && <p className="text-sm text-gray-400">No milestones set yet</p>}
        </div>
      </div>

      {/* Coaching Sessions */}
      {sessions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Video size={18} /> Recent Coaching Sessions</h2>
          <div className="space-y-2">
            {sessions.slice(0, 5).map(s => (
              <div key={s.id} className="card p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{s.title}</h4>
                  <p className="text-sm text-gray-500">{format(new Date(s.session_date), 'MMM d, yyyy')}</p>
                </div>
                {s.fathom_link && (
                  <a href={s.fathom_link} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm flex items-center gap-1">
                    <Video size={14} /> Watch Replay
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Project Links */}
      {links.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Link2 size={18} /> Project Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {links.map(l => (
              <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer"
                className="card p-4 hover:shadow-md hover:border-brand-200 transition-all">
                <span className="badge-gray text-[10px] mb-1 inline-block">{l.link_type.replace(/_/g, ' ')}</span>
                <h4 className="font-medium text-sm">{l.label}</h4>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><MessageSquare size={18} /> Comments & Updates</h2>
        <form onSubmit={submitComment} className="card-padded mb-4">
          <textarea value={commentText} onChange={e => setCommentText(e.target.value)} className="input-field" rows={3} placeholder="Add a comment or question..." />
          <button type="submit" className="btn-primary btn-sm mt-2">Post</button>
        </form>
        <div className="space-y-3">
          {comments.map(c => (
            <div key={c.id} className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{c.profiles?.full_name}</span>
                <span className="badge-gray text-[10px]">{c.profiles?.role?.replace('_', ' ')}</span>
                <span className="text-xs text-gray-400">{format(new Date(c.created_at), 'MMM d, h:mm a')}</span>
              </div>
              <p className="text-sm text-gray-700">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
