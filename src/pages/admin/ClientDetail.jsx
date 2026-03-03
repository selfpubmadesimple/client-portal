import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Clock, CalendarDays, CheckSquare, MessageSquare, Video, Link2, Plus, ArrowLeft, BookOpen } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { PageHeader, StageIndicator, StatusBadge, PriorityBadge, HoursGauge, ProgressBar, Spinner, Modal, EmptyState } from '../../components/UI'
import { format } from 'date-fns'

export default function ClientDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [client, setClient] = useState(null)
  const [project, setProject] = useState(null)
  const [packages, setPackages] = useState([])
  const [timeEntries, setTimeEntries] = useState([])
  const [milestones, setMilestones] = useState([])
  const [tasks, setTasks] = useState([])
  const [actionItems, setActionItems] = useState([])
  const [sessions, setSessions] = useState([])
  const [links, setLinks] = useState([])
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showModal, setShowModal] = useState(null) // 'time', 'milestone', 'action', 'link', 'session', 'comment', 'package'

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const { data: c } = await supabase.from('clients').select('*').eq('id', id).single()
    setClient(c)

    const { data: p } = await supabase.from('projects').select('*').eq('client_id', id).order('created_at', { ascending: false }).limit(1)
    const proj = p?.[0]
    setProject(proj)

    if (proj) {
      const [pkgs, entries, ms, ts, ai, sess, lnks, cmts] = await Promise.all([
        supabase.from('hours_packages').select('*').eq('client_id', id).order('purchase_date', { ascending: false }),
        supabase.from('time_entries').select('*, profiles(full_name)').eq('project_id', proj.id).order('date', { ascending: false }).limit(50),
        supabase.from('milestones').select('*').eq('project_id', proj.id).order('due_date'),
        supabase.from('tasks').select('*').eq('project_id', proj.id).order('sort_order'),
        supabase.from('action_items').select('*, assigned_to_profile:profiles!action_items_assigned_to_fkey(full_name)').eq('project_id', proj.id).order('created_at', { ascending: false }),
        supabase.from('coaching_sessions').select('*').eq('project_id', proj.id).order('session_date', { ascending: false }),
        supabase.from('project_links').select('*').eq('project_id', proj.id).order('sort_order'),
        supabase.from('comments').select('*, profiles(full_name, role)').eq('project_id', proj.id).order('created_at', { ascending: false }).limit(30),
      ])
      setPackages(pkgs.data || [])
      setTimeEntries(entries.data || [])
      setMilestones(ms.data || [])
      setTasks(ts.data || [])
      setActionItems(ai.data || [])
      setSessions(sess.data || [])
      setLinks(lnks.data || [])
      setComments(cmts.data || [])
    }
    setLoading(false)
  }, [id])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Form states
  const [timeForm, setTimeForm] = useState({ date: new Date().toISOString().split('T')[0], hours: '', category: 'coaching', description: '', fathom_link: '', package_id: '' })
  const [milestoneForm, setMilestoneForm] = useState({ title: '', due_date: '', milestone_type: 'custom', notify_days_before: 7 })
  const [actionForm, setActionForm] = useState({ title: '', description: '', due_date: '', priority: 'medium' })
  const [linkForm, setLinkForm] = useState({ label: '', url: '', link_type: 'other', description: '' })
  const [sessionForm, setSessionForm] = useState({ title: '', session_date: '', fathom_link: '', notes: '' })
  const [commentText, setCommentText] = useState('')
  const [packageForm, setPackageForm] = useState({ package_name: '', type: 'package', hours_purchased: '', rate_per_hour: '' })

  async function submitTime(e) {
    e.preventDefault()
    const pkgId = timeForm.package_id || packages.find(p => p.is_active)?.id
    if (!pkgId) return alert('No active hours package. Add one first.')
    await supabase.from('time_entries').insert({ ...timeForm, hours: parseFloat(timeForm.hours), package_id: pkgId, project_id: project.id, logged_by: user.id })
    setShowModal(null); setTimeForm({ date: new Date().toISOString().split('T')[0], hours: '', category: 'coaching', description: '', fathom_link: '', package_id: '' }); fetchAll()
  }

  async function submitMilestone(e) {
    e.preventDefault()
    await supabase.from('milestones').insert({ ...milestoneForm, project_id: project.id, status: 'upcoming' })
    setShowModal(null); setMilestoneForm({ title: '', due_date: '', milestone_type: 'custom', notify_days_before: 7 }); fetchAll()
  }

  async function submitAction(e) {
    e.preventDefault()
    await supabase.from('action_items').insert({ ...actionForm, project_id: project.id, assigned_to: user.id, assigned_by: user.id, status: 'open', is_visible_to_client: true })
    setShowModal(null); setActionForm({ title: '', description: '', due_date: '', priority: 'medium' }); fetchAll()
  }

  async function submitLink(e) {
    e.preventDefault()
    await supabase.from('project_links').insert({ ...linkForm, project_id: project.id, is_visible_to_client: true })
    setShowModal(null); setLinkForm({ label: '', url: '', link_type: 'other', description: '' }); fetchAll()
  }

  async function submitSession(e) {
    e.preventDefault()
    await supabase.from('coaching_sessions').insert({ ...sessionForm, project_id: project.id })
    setShowModal(null); setSessionForm({ title: '', session_date: '', fathom_link: '', notes: '' }); fetchAll()
  }

  async function submitComment(e) {
    e.preventDefault()
    if (!commentText.trim()) return
    await supabase.from('comments').insert({ body: commentText, project_id: project.id, author_id: user.id, context_type: 'general' })
    setCommentText(''); fetchAll()
  }

  async function submitPackage(e) {
    e.preventDefault()
    await supabase.from('hours_packages').insert({ ...packageForm, hours_purchased: parseFloat(packageForm.hours_purchased), rate_per_hour: packageForm.rate_per_hour ? parseFloat(packageForm.rate_per_hour) : null, client_id: id, project_id: project?.id })
    setShowModal(null); setPackageForm({ package_name: '', type: 'package', hours_purchased: '', rate_per_hour: '' }); fetchAll()
  }

  async function toggleTask(taskId, isComplete) {
    await supabase.from('tasks').update({ is_complete: !isComplete, completed_at: !isComplete ? new Date().toISOString() : null, completed_by: !isComplete ? user.id : null }).eq('id', taskId)
    fetchAll()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  if (!client) return <EmptyState title="Client not found" />

  const activePkgs = packages.filter(p => p.is_active)
  const totalPurchased = activePkgs.reduce((s, p) => s + parseFloat(p.hours_purchased), 0)
  const totalUsed = activePkgs.reduce((s, p) => s + parseFloat(p.hours_used), 0)
  const completedTasks = tasks.filter(t => t.is_complete).length
  const tasksByStage = tasks.reduce((acc, t) => { acc[t.stage] = acc[t.stage] || []; acc[t.stage].push(t); return acc }, {})

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'time', label: 'Hours', icon: Clock },
    { id: 'milestones', label: 'Milestones', icon: CalendarDays },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'actions', label: 'Action Items', icon: BookOpen },
    { id: 'sessions', label: 'Coaching', icon: Video },
    { id: 'links', label: 'Links', icon: Link2 },
    { id: 'comments', label: 'Comments', icon: MessageSquare },
  ]

  return (
    <div>
      <Link to="/admin/clients" className="text-sm text-gray-500 hover:text-brand-600 flex items-center gap-1 mb-4">
        <ArrowLeft size={14} /> Back to Clients
      </Link>

      <PageHeader title={client.name} subtitle={project?.title || 'No project yet'} />

      {project && <div className="mb-6"><StageIndicator current={project.stage} /></div>}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <HoursGauge used={totalUsed} total={totalPurchased} />
          <div className="card-padded">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Task Progress</h3>
            <p className="text-2xl font-bold">{completedTasks} / {tasks.length}</p>
            <ProgressBar value={completedTasks} max={tasks.length} label="Completed" />
          </div>
          <div className="card-padded">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Open Action Items</h3>
            <p className="text-2xl font-bold">{actionItems.filter(a => a.status === 'open').length}</p>
            <p className="text-sm text-gray-400 mt-1">{milestones.filter(m => m.status === 'upcoming').length} upcoming milestones</p>
          </div>
        </div>
      )}

      {activeTab === 'time' && (
        <div>
          <div className="flex gap-3 mb-4">
            <button onClick={() => setShowModal('time')} className="btn-primary flex items-center gap-2"><Plus size={16} /> Log Time</button>
            <button onClick={() => setShowModal('package')} className="btn-secondary flex items-center gap-2"><Plus size={16} /> Add Package</button>
          </div>
          <HoursGauge used={totalUsed} total={totalPurchased} />
          <div className="card overflow-hidden mt-4">
            <table className="w-full">
              <thead><tr className="bg-gray-50 border-b"><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Date</th><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Hours</th><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Category</th><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Description</th><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Logged By</th></tr></thead>
              <tbody className="divide-y divide-gray-50">
                {timeEntries.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-sm">{format(new Date(e.date), 'MMM d, yyyy')}</td>
                    <td className="px-4 py-2.5 text-sm font-medium">{e.hours}h</td>
                    <td className="px-4 py-2.5"><span className="badge-blue">{e.category}</span></td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{e.description}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-500">{e.profiles?.full_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {timeEntries.length === 0 && <EmptyState title="No time logged yet" />}
          </div>
        </div>
      )}

      {activeTab === 'milestones' && (
        <div>
          <button onClick={() => setShowModal('milestone')} className="btn-primary flex items-center gap-2 mb-4"><Plus size={16} /> Add Milestone</button>
          <div className="space-y-3">
            {milestones.map(m => (
              <div key={m.id} className="card p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{m.title}</h4>
                  <p className="text-sm text-gray-500">Due: {format(new Date(m.due_date), 'MMM d, yyyy')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge-gray">{m.milestone_type}</span>
                  <StatusBadge status={m.status} />
                </div>
              </div>
            ))}
            {milestones.length === 0 && <EmptyState icon={CalendarDays} title="No milestones yet" />}
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="space-y-6">
          {['CREATE', 'BUILD', 'SHARE'].map(stage => {
            const stageTasks = tasksByStage[stage] || []
            if (stageTasks.length === 0) return null
            const phases = [...new Set(stageTasks.map(t => t.phase))]
            const stageCompleted = stageTasks.filter(t => t.is_complete).length
            const stageColor = stage === 'CREATE' ? 'stage-create' : stage === 'BUILD' ? 'stage-build' : 'stage-share'
            return (
              <div key={stage} className="card-padded">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2"><span className={`badge ${stageColor}`}>{stage}</span></h3>
                  <span className="text-sm text-gray-500">{stageCompleted}/{stageTasks.length}</span>
                </div>
                <ProgressBar value={stageCompleted} max={stageTasks.length} />
                {phases.map(phase => {
                  const phaseTasks = stageTasks.filter(t => t.phase === phase)
                  return (
                    <div key={phase} className="mt-4">
                      <h4 className="text-sm font-medium text-gray-600 mb-2">{phase}</h4>
                      <div className="space-y-1">
                        {phaseTasks.map(task => (
                          <label key={task.id} className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer">
                            <input type="checkbox" checked={task.is_complete} onChange={() => toggleTask(task.id, task.is_complete)}
                              className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                            <span className={`text-sm ${task.is_complete ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                              {task.checklist_item}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'actions' && (
        <div>
          <button onClick={() => setShowModal('action')} className="btn-primary flex items-center gap-2 mb-4"><Plus size={16} /> Add Action Item</button>
          <div className="space-y-3">
            {actionItems.map(a => (
              <div key={a.id} className="card p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{a.title}</h4>
                  {a.description && <p className="text-sm text-gray-500 mt-0.5">{a.description}</p>}
                  {a.due_date && <p className="text-xs text-gray-400 mt-1">Due: {format(new Date(a.due_date), 'MMM d, yyyy')}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={a.priority} />
                  <StatusBadge status={a.status} />
                </div>
              </div>
            ))}
            {actionItems.length === 0 && <EmptyState icon={BookOpen} title="No action items yet" />}
          </div>
        </div>
      )}

      {activeTab === 'sessions' && (
        <div>
          <button onClick={() => setShowModal('session')} className="btn-primary flex items-center gap-2 mb-4"><Plus size={16} /> Add Session</button>
          <div className="space-y-3">
            {sessions.map(s => (
              <div key={s.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{s.title}</h4>
                    <p className="text-sm text-gray-500">{format(new Date(s.session_date), 'MMM d, yyyy h:mm a')}</p>
                    {s.notes && <p className="text-sm text-gray-600 mt-2">{s.notes}</p>}
                  </div>
                  {s.fathom_link && (
                    <a href={s.fathom_link} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm flex items-center gap-1">
                      <Video size={14} /> Replay
                    </a>
                  )}
                </div>
              </div>
            ))}
            {sessions.length === 0 && <EmptyState icon={Video} title="No coaching sessions yet" />}
          </div>
        </div>
      )}

      {activeTab === 'links' && (
        <div>
          <button onClick={() => setShowModal('link')} className="btn-primary flex items-center gap-2 mb-4"><Plus size={16} /> Add Link</button>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {links.map(l => (
              <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer"
                className="card p-4 hover:shadow-md hover:border-brand-200 transition-all">
                <div className="flex items-center gap-2 mb-1">
                  <Link2 size={14} className="text-brand-500" />
                  <span className="badge-gray text-[10px]">{l.link_type.replace(/_/g, ' ')}</span>
                </div>
                <h4 className="font-medium text-sm">{l.label}</h4>
                {l.description && <p className="text-xs text-gray-500 mt-1">{l.description}</p>}
              </a>
            ))}
            {links.length === 0 && <EmptyState icon={Link2} title="No project links yet" />}
          </div>
        </div>
      )}

      {activeTab === 'comments' && (
        <div>
          <form onSubmit={submitComment} className="card-padded mb-4">
            <textarea value={commentText} onChange={e => setCommentText(e.target.value)} className="input-field" rows={3} placeholder="Add a comment or update..." />
            <button type="submit" className="btn-primary btn-sm mt-2">Post Comment</button>
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
            {comments.length === 0 && <EmptyState icon={MessageSquare} title="No comments yet" />}
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal open={showModal === 'time'} onClose={() => setShowModal(null)} title="Log Time">
        <form onSubmit={submitTime} className="space-y-4">
          <div><label className="label">Date</label><input type="date" value={timeForm.date} onChange={e => setTimeForm(p => ({ ...p, date: e.target.value }))} className="input-field" required /></div>
          <div><label className="label">Hours</label><input type="number" step="0.25" min="0.25" value={timeForm.hours} onChange={e => setTimeForm(p => ({ ...p, hours: e.target.value }))} className="input-field" required /></div>
          <div><label className="label">Category</label>
            <select value={timeForm.category} onChange={e => setTimeForm(p => ({ ...p, category: e.target.value }))} className="select-field">
              <option value="coaching">Coaching</option><option value="editing">Editing</option><option value="design">Design</option><option value="marketing">Marketing</option><option value="admin">Admin</option><option value="other">Other</option>
            </select></div>
          <div><label className="label">Description</label><textarea value={timeForm.description} onChange={e => setTimeForm(p => ({ ...p, description: e.target.value }))} className="input-field" rows={2} required /></div>
          <div><label className="label">Fathom Link (optional)</label><input type="url" value={timeForm.fathom_link} onChange={e => setTimeForm(p => ({ ...p, fathom_link: e.target.value }))} className="input-field" /></div>
          {packages.length > 1 && <div><label className="label">Package</label>
            <select value={timeForm.package_id} onChange={e => setTimeForm(p => ({ ...p, package_id: e.target.value }))} className="select-field">
              {activePkgs.map(p => <option key={p.id} value={p.id}>{p.package_name} ({(p.hours_purchased - p.hours_used).toFixed(1)}h left)</option>)}
            </select></div>}
          <button type="submit" className="btn-primary w-full">Log Time</button>
        </form>
      </Modal>

      <Modal open={showModal === 'milestone'} onClose={() => setShowModal(null)} title="Add Milestone">
        <form onSubmit={submitMilestone} className="space-y-4">
          <div><label className="label">Title</label><input type="text" value={milestoneForm.title} onChange={e => setMilestoneForm(p => ({ ...p, title: e.target.value }))} className="input-field" required /></div>
          <div><label className="label">Due Date</label><input type="date" value={milestoneForm.due_date} onChange={e => setMilestoneForm(p => ({ ...p, due_date: e.target.value }))} className="input-field" required /></div>
          <div><label className="label">Type</label>
            <select value={milestoneForm.milestone_type} onChange={e => setMilestoneForm(p => ({ ...p, milestone_type: e.target.value }))} className="select-field">
              <option value="manuscript">Manuscript</option><option value="review">Review</option><option value="publishing">Publishing</option><option value="coaching">Coaching</option><option value="contract">Contract</option><option value="custom">Custom</option>
            </select></div>
          <button type="submit" className="btn-primary w-full">Add Milestone</button>
        </form>
      </Modal>

      <Modal open={showModal === 'action'} onClose={() => setShowModal(null)} title="Add Action Item">
        <form onSubmit={submitAction} className="space-y-4">
          <div><label className="label">Title</label><input type="text" value={actionForm.title} onChange={e => setActionForm(p => ({ ...p, title: e.target.value }))} className="input-field" required /></div>
          <div><label className="label">Description</label><textarea value={actionForm.description} onChange={e => setActionForm(p => ({ ...p, description: e.target.value }))} className="input-field" rows={2} /></div>
          <div><label className="label">Due Date</label><input type="date" value={actionForm.due_date} onChange={e => setActionForm(p => ({ ...p, due_date: e.target.value }))} className="input-field" /></div>
          <div><label className="label">Priority</label>
            <select value={actionForm.priority} onChange={e => setActionForm(p => ({ ...p, priority: e.target.value }))} className="select-field">
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
            </select></div>
          <button type="submit" className="btn-primary w-full">Add Action Item</button>
        </form>
      </Modal>

      <Modal open={showModal === 'link'} onClose={() => setShowModal(null)} title="Add Project Link">
        <form onSubmit={submitLink} className="space-y-4">
          <div><label className="label">Label</label><input type="text" value={linkForm.label} onChange={e => setLinkForm(p => ({ ...p, label: e.target.value }))} className="input-field" required placeholder="e.g., Google Drive Folder" /></div>
          <div><label className="label">URL</label><input type="url" value={linkForm.url} onChange={e => setLinkForm(p => ({ ...p, url: e.target.value }))} className="input-field" required /></div>
          <div><label className="label">Type</label>
            <select value={linkForm.link_type} onChange={e => setLinkForm(p => ({ ...p, link_type: e.target.value }))} className="select-field">
              <option value="google_drive">Google Drive</option><option value="fathom">Fathom</option><option value="amazon">Amazon</option><option value="ingram">Ingram</option><option value="canva">Canva</option><option value="website">Website</option><option value="other">Other</option>
            </select></div>
          <div><label className="label">Description</label><input type="text" value={linkForm.description} onChange={e => setLinkForm(p => ({ ...p, description: e.target.value }))} className="input-field" /></div>
          <button type="submit" className="btn-primary w-full">Add Link</button>
        </form>
      </Modal>

      <Modal open={showModal === 'session'} onClose={() => setShowModal(null)} title="Add Coaching Session">
        <form onSubmit={submitSession} className="space-y-4">
          <div><label className="label">Title</label><input type="text" value={sessionForm.title} onChange={e => setSessionForm(p => ({ ...p, title: e.target.value }))} className="input-field" required /></div>
          <div><label className="label">Date & Time</label><input type="datetime-local" value={sessionForm.session_date} onChange={e => setSessionForm(p => ({ ...p, session_date: e.target.value }))} className="input-field" required /></div>
          <div><label className="label">Fathom Replay Link</label><input type="url" value={sessionForm.fathom_link} onChange={e => setSessionForm(p => ({ ...p, fathom_link: e.target.value }))} className="input-field" /></div>
          <div><label className="label">Notes</label><textarea value={sessionForm.notes} onChange={e => setSessionForm(p => ({ ...p, notes: e.target.value }))} className="input-field" rows={3} /></div>
          <button type="submit" className="btn-primary w-full">Add Session</button>
        </form>
      </Modal>

      <Modal open={showModal === 'package'} onClose={() => setShowModal(null)} title="Add Hours Package">
        <form onSubmit={submitPackage} className="space-y-4">
          <div><label className="label">Package Name</label><input type="text" value={packageForm.package_name} onChange={e => setPackageForm(p => ({ ...p, package_name: e.target.value }))} className="input-field" required placeholder="e.g., Additional 10 Hours" /></div>
          <div><label className="label">Type</label>
            <select value={packageForm.type} onChange={e => setPackageForm(p => ({ ...p, type: e.target.value }))} className="select-field">
              <option value="package">Standalone Package</option><option value="publishing_bundle">Publishing Bundle</option><option value="pay_as_you_go">Pay As You Go</option>
            </select></div>
          <div><label className="label">Hours</label><input type="number" step="0.5" min="1" value={packageForm.hours_purchased} onChange={e => setPackageForm(p => ({ ...p, hours_purchased: e.target.value }))} className="input-field" required /></div>
          <div><label className="label">Rate Per Hour ($)</label><input type="number" step="0.01" value={packageForm.rate_per_hour} onChange={e => setPackageForm(p => ({ ...p, rate_per_hour: e.target.value }))} className="input-field" /></div>
          <button type="submit" className="btn-primary w-full">Add Package</button>
        </form>
      </Modal>
    </div>
  )
}
