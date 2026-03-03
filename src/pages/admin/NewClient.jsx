import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/UI'

export default function NewClient() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', email: '', company: '', notes: '',
    projectTitle: '', projectDescription: '', targetLaunchDate: '',
    packageName: '', hoursAmount: '', packageType: 'package', ratePerHour: '',
  })

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      // 1. Create client
      const { data: client, error: clientErr } = await supabase
        .from('clients').insert({ name: form.name, email: form.email, company: form.company, notes: form.notes })
        .select().single()
      if (clientErr) throw clientErr

      // 2. Create project
      const { data: project, error: projErr } = await supabase
        .from('projects').insert({
          client_id: client.id, title: form.projectTitle, description: form.projectDescription,
          target_launch_date: form.targetLaunchDate || null, stage: 'CREATE', status: 'not_started',
        }).select().single()
      if (projErr) throw projErr

      // 3. Create hours package
      if (form.hoursAmount) {
        const { error: pkgErr } = await supabase.from('hours_packages').insert({
          client_id: client.id, project_id: project.id, package_name: form.packageName || 'Initial Package',
          type: form.packageType, hours_purchased: parseFloat(form.hoursAmount),
          rate_per_hour: form.ratePerHour ? parseFloat(form.ratePerHour) : null,
        })
        if (pkgErr) throw pkgErr
      }

      // 4. Populate checklist (non-blocking — navigate even if this fails)
      try {
        await supabase.rpc('populate_project_checklist', { p_project_id: project.id })
      } catch (checklistErr) {
        console.warn('Checklist population failed:', checklistErr)
      }

      navigate(`/admin/clients/${client.id}`)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="New Client" subtitle="Set up a new author project" />

      {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Step 1: Client Info */}
        {step >= 1 && (
          <div className="card-padded mb-4">
            <h3 className="font-semibold mb-4">Client Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name *</label>
                <input type="text" value={form.name} onChange={update('name')} className="input-field" required />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" value={form.email} onChange={update('email')} className="input-field" required />
              </div>
              <div>
                <label className="label">Company / Imprint</label>
                <input type="text" value={form.company} onChange={update('company')} className="input-field" />
              </div>
              <div>
                <label className="label">Notes</label>
                <input type="text" value={form.notes} onChange={update('notes')} className="input-field" />
              </div>
            </div>
            {step === 1 && (
              <button type="button" onClick={() => setStep(2)} disabled={!form.name || !form.email}
                className="btn-primary mt-4">Next: Project Details</button>
            )}
          </div>
        )}

        {/* Step 2: Project */}
        {step >= 2 && (
          <div className="card-padded mb-4">
            <h3 className="font-semibold mb-4">Project Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Book / Project Title *</label>
                <input type="text" value={form.projectTitle} onChange={update('projectTitle')} className="input-field" required />
              </div>
              <div className="col-span-2">
                <label className="label">Description</label>
                <textarea value={form.projectDescription} onChange={update('projectDescription')} className="input-field" rows={3} />
              </div>
              <div>
                <label className="label">Target Launch Date</label>
                <input type="date" value={form.targetLaunchDate} onChange={update('targetLaunchDate')} className="input-field" />
              </div>
            </div>
            {step === 2 && (
              <button type="button" onClick={() => setStep(3)} disabled={!form.projectTitle}
                className="btn-primary mt-4">Next: Hours Package</button>
            )}
          </div>
        )}

        {/* Step 3: Hours */}
        {step >= 3 && (
          <div className="card-padded mb-4">
            <h3 className="font-semibold mb-4">Hours Package</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Package Name</label>
                <input type="text" value={form.packageName} onChange={update('packageName')} className="input-field" placeholder="e.g., Initial 20-Hour Package" />
              </div>
              <div>
                <label className="label">Package Type</label>
                <select value={form.packageType} onChange={update('packageType')} className="select-field">
                  <option value="package">Standalone Package</option>
                  <option value="publishing_bundle">Publishing Bundle</option>
                  <option value="pay_as_you_go">Pay As You Go</option>
                </select>
              </div>
              <div>
                <label className="label">Hours Purchased</label>
                <input type="number" step="0.5" min="0" value={form.hoursAmount} onChange={update('hoursAmount')} className="input-field" placeholder="e.g., 20" />
              </div>
              <div>
                <label className="label">Rate Per Hour ($)</label>
                <input type="number" step="0.01" min="0" value={form.ratePerHour} onChange={update('ratePerHour')} className="input-field" placeholder="e.g., 150.00" />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Creating...' : 'Create Client & Project'}
              </button>
              <button type="button" onClick={() => navigate('/admin/clients')} className="btn-secondary">Cancel</button>
            </div>
            <p className="text-xs text-gray-400 mt-2">The full publishing checklist will be auto-populated for the project.</p>
          </div>
        )}
      </form>
    </div>
  )
}
