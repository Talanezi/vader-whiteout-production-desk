import { useEffect, useMemo, useState } from 'react'
import type { RosterCategory, RosterPerson } from '../data/mockCallSheet'
import { rosterCategories, rosterCategoryLabels } from '../data/mockCallSheet'
import {
  createRosterPerson,
  deleteRosterPerson,
  getAuthToken,
  listRosterPeople,
  updateRosterPerson,
} from '../lib/api'

type RosterForm = Omit<RosterPerson, 'id'>

const emptyForm: RosterForm = {
  name: '',
  category: 'other',
  roleOrDepartment: '',
  email: '',
  phone: '',
  notes: '',
  active: true,
}

function normalizeCategory(value: string): RosterCategory {
  const normalized = value.trim().toLowerCase()

  if (normalized === 'cast' || normalized === 'actor' || normalized === 'actress') return 'cast'
  if (normalized === 'crew') return 'crew'
  if (normalized === 'emergency' || normalized === 'contact' || normalized === 'emergency contact') return 'emergency'
  return 'other'
}

function parseRosterLines(text: string): RosterForm[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.includes('|') ? '|' : ','
      const [name = '', category = '', roleOrDepartment = '', email = '', phone = '', notes = ''] = line
        .split(separator)
        .map((part) => part.trim())

      return {
        name,
        category: normalizeCategory(category),
        roleOrDepartment,
        email,
        phone,
        notes,
        active: true,
      }
    })
    .filter((person) => person.name)
}

function RosterPage() {
  const token = getAuthToken()
  const [people, setPeople] = useState<RosterPerson[]>([])
  const [form, setForm] = useState<RosterForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | RosterCategory>('all')
  const [pasteText, setPasteText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    if (!token) {
      setLoading(false)
      setPeople([])
      return
    }

    listRosterPeople()
      .then((data) => {
        if (!active) return
        setPeople(data.items)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Failed to load roster')
      })
      .finally(() => {
        if (!active) return
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [token])

  const parsedPastePeople = useMemo(() => parseRosterLines(pasteText), [pasteText])

  const filteredPeople = people.filter((person) => {
    const query = searchQuery.trim().toLowerCase()
    const matchesSearch = !query || [
      person.name,
      person.roleOrDepartment,
      person.email,
      person.phone,
      rosterCategoryLabels[person.category],
    ].some((value) => value.toLowerCase().includes(query))
    const matchesCategory = categoryFilter === 'all' || person.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) return

    try {
      setSaving(true)
      setError(null)
      setNotice(null)

      if (editingId) {
        const saved = await updateRosterPerson(editingId, form)
        setPeople((prev) => prev.map((person) => person.id === saved.id ? saved : person))
        setNotice('Roster person updated.')
      } else {
        const saved = await createRosterPerson(form)
        setPeople((prev) => [saved, ...prev])
        setNotice('Roster person added.')
      }

      resetForm()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save roster person')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (person: RosterPerson) => {
    setEditingId(person.id)
    setForm({
      name: person.name,
      category: person.category,
      roleOrDepartment: person.roleOrDepartment,
      email: person.email,
      phone: person.phone,
      notes: person.notes,
      active: person.active,
    })
    setNotice(null)
  }

  const handleDelete = async (person: RosterPerson) => {
    const ok = window.confirm(`Delete "${person.name}" from the production roster?`)
    if (!ok) return

    try {
      setDeletingId(person.id)
      setError(null)
      await deleteRosterPerson(person.id)
      setPeople((prev) => prev.filter((candidate) => candidate.id !== person.id))
      if (editingId === person.id) resetForm()
      setNotice('Roster person deleted.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete roster person')
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleActive = async (person: RosterPerson) => {
    try {
      setSaving(true)
      setError(null)
      const saved = await updateRosterPerson(person.id, { active: !person.active })
      setPeople((prev) => prev.map((candidate) => candidate.id === saved.id ? saved : candidate))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update roster person')
    } finally {
      setSaving(false)
    }
  }

  const handleImport = async () => {
    if (parsedPastePeople.length === 0) return

    try {
      setImporting(true)
      setError(null)
      const savedPeople = await Promise.all(parsedPastePeople.map((person) => createRosterPerson(person)))
      setPeople((prev) => [...savedPeople, ...prev])
      setPasteText('')
      setNotice(`${savedPeople.length} roster ${savedPeople.length === 1 ? 'person' : 'people'} imported.`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to import roster people')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="vw-page-wrap">
      <section className="vw-section-card vw-dashboard-hero">
        <div className="vw-dashboard-hero-inner">
          <div>
            <h1 className="vw-page-title">Production Roster</h1>
            <p className="vw-page-note">
              Keep cast, crew, and emergency contacts ready for fast call sheet builds.
            </p>
          </div>
        </div>
      </section>

      {error ? <div className="vw-inline-error">{error}</div> : null}
      {notice ? <div className="vw-inline-success">{notice}</div> : null}

      <section className="roster-layout">
        <div className="panel roster-form-panel">
          <div className="section-head">
            <div>
              <h2>{editingId ? 'Edit Person' : 'Add Person'}</h2>
            </div>
            {editingId ? (
              <button className="vw-btn" type="button" onClick={resetForm}>Cancel Edit</button>
            ) : null}
          </div>

          <div className="field-grid field-grid-2">
            <label className="field">
              <span>Name</span>
              <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
            </label>

            <label className="field">
              <span>Category</span>
              <select value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value as RosterCategory }))}>
                {rosterCategories.map((category) => (
                  <option key={category} value={category}>{rosterCategoryLabels[category]}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Role / Department</span>
              <input value={form.roleOrDepartment} onChange={(event) => setForm((prev) => ({ ...prev, roleOrDepartment: event.target.value }))} />
            </label>

            <label className="field">
              <span>Email</span>
              <input value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
            </label>

            <label className="field">
              <span>Phone</span>
              <input value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
            </label>

            <label className="field roster-active-toggle">
              <input type="checkbox" checked={form.active} onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))} />
              <span>Active</span>
            </label>

            <label className="field field-full">
              <span>Notes</span>
              <textarea value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
            </label>
          </div>

          <button className="vw-btn vw-btn-primary" type="button" onClick={handleSubmit} disabled={saving || !form.name.trim()}>
            {saving ? 'Saving…' : editingId ? 'Save Person' : 'Add Person'}
          </button>
        </div>

        <div className="panel roster-import-panel">
          <h2>Paste Roster</h2>
          <label className="field">
            <span>One person per line</span>
            <textarea
              value={pasteText}
              onChange={(event) => setPasteText(event.target.value)}
              placeholder="Name, Category, Role, Email, Phone, Notes"
            />
          </label>
          <div className="quick-add-actions">
            <p>Commas or pipes both work. Unknown categories become Other.</p>
            <button className="vw-btn" type="button" onClick={handleImport} disabled={importing || parsedPastePeople.length === 0}>
              {importing ? 'Importing…' : `Import ${parsedPastePeople.length || ''}`.trim()}
            </button>
          </div>
        </div>
      </section>

      <section className="panel roster-list-panel">
        <div className="section-head">
          <div>
            <h2>Roster People</h2>
            <p>{people.length} saved {people.length === 1 ? 'person' : 'people'}</p>
          </div>
        </div>

        <div className="dashboard-controls roster-controls">
          <label className="dashboard-control">
            <span>Search</span>
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Name, role, email, phone" />
          </label>
          <label className="dashboard-control">
            <span>Category</span>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as 'all' | RosterCategory)}>
              <option value="all">All categories</option>
              {rosterCategories.map((category) => (
                <option key={category} value={category}>{rosterCategoryLabels[category]}</option>
              ))}
            </select>
          </label>
          <button className="vw-btn" type="button" onClick={() => { setSearchQuery(''); setCategoryFilter('all') }} disabled={!searchQuery && categoryFilter === 'all'}>
            Clear
          </button>
        </div>

        {loading ? (
          <div className="vw-empty-block">Loading production roster...</div>
        ) : filteredPeople.length === 0 ? (
          <div className="vw-empty-block">
            {people.length === 0
              ? 'Your production roster is ready for the first cast, crew, or emergency contact.'
              : 'No roster people match the current search or category.'}
          </div>
        ) : (
          <div className="roster-card-grid">
            {filteredPeople.map((person) => (
              <article key={person.id} className={`roster-person-card ${person.active ? '' : 'is-inactive'}`}>
                <div className="roster-person-head">
                  <div>
                    <h3>{person.name}</h3>
                    <p>{person.roleOrDepartment || rosterCategoryLabels[person.category]}</p>
                  </div>
                  <span className={`status-badge roster-category-badge roster-category-${person.category}`}>
                    {rosterCategoryLabels[person.category]}
                  </span>
                </div>

                <div className="roster-person-meta">
                  {person.email ? <span>{person.email}</span> : null}
                  {person.phone ? <span>{person.phone}</span> : null}
                  {!person.active ? <span>Inactive</span> : null}
                </div>

                {person.notes ? <p className="roster-person-notes">{person.notes}</p> : null}

                <div className="vw-actions-row roster-card-actions">
                  <button className="vw-inline-action" type="button" onClick={() => handleEdit(person)}>Edit</button>
                  <button className="vw-inline-action" type="button" onClick={() => handleToggleActive(person)} disabled={saving}>
                    {person.active ? 'Mark Inactive' : 'Mark Active'}
                  </button>
                  <button className="vw-inline-action vw-inline-action-danger" type="button" onClick={() => handleDelete(person)} disabled={deletingId === person.id}>
                    {deletingId === person.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default RosterPage
