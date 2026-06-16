import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CallSheetPreview from '../components/CallSheetPreview'
import EditorSidebar from '../components/EditorSidebar'
import type {
  CallSheetDraft,
  CallSheetStatus,
  CastCallRow,
  CrewCallRow,
  EmergencyContact,
  SceneRow,
} from '../data/mockCallSheet'
import { callSheetStatusLabels } from '../data/mockCallSheet'
import { deleteCallSheet, downloadPdfFile, duplicateCallSheet, getCallSheet, updateCallSheet } from '../lib/api'

type SectionKey =
  | 'overview'
  | 'contacts'
  | 'weather'
  | 'locations'
  | 'scenes'
  | 'cast'
  | 'crew'

type SaveMode = 'manual' | 'autosave'
type SaveState = 'saved' | 'unsaved' | 'manual-saving' | 'autosaving' | 'autosave-failed' | 'save-failed'
type ReadinessItem = {
  label: string
  complete: boolean
  severity: 'critical' | 'recommended'
}

const saveStateLabels: Record<SaveState, string> = {
  saved: 'Saved',
  unsaved: 'Unsaved changes',
  'manual-saving': 'Saving…',
  autosaving: 'Autosaving…',
  'autosave-failed': 'Autosave failed',
  'save-failed': 'Save failed',
}

const AUTOSAVE_DELAY_MS = 1200

const workflowActions: Record<CallSheetStatus, { label: string; nextStatus: CallSheetStatus }> = {
  draft: {
    label: 'Send for AD Review',
    nextStatus: 'ready_for_review',
  },
  ready_for_review: {
    label: 'Approve Call Sheet',
    nextStatus: 'approved',
  },
  approved: {
    label: 'Publish Call Sheet',
    nextStatus: 'published',
  },
  published: {
    label: 'Create Revision',
    nextStatus: 'revised',
  },
  revised: {
    label: 'Send Revised Sheet for Review',
    nextStatus: 'ready_for_review',
  },
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function hasText(value: string) {
  return value.trim().length > 0
}

function joinParts(parts: string[]) {
  return parts.filter(Boolean).join(' • ')
}

function insertAfter<T extends { id: string }>(items: T[], idValue: string, item: T) {
  const index = items.findIndex((candidate) => candidate.id === idValue)
  const next = [...items]
  next.splice(index >= 0 ? index + 1 : next.length, 0, item)
  return next
}

function getReadinessItems(draft: CallSheetDraft, status: CallSheetStatus): ReadinessItem[] {
  return [
    { label: 'Title', complete: hasText(draft.title), severity: 'critical' },
    { label: 'Production date', complete: hasText(draft.productionDate), severity: 'critical' },
    { label: 'Primary crew call', complete: hasText(draft.primaryCallTime), severity: 'critical' },
    { label: 'Main set name', complete: hasText(draft.mainSetName), severity: 'critical' },
    { label: 'Nearest hospital name', complete: hasText(draft.nearestHospitalName), severity: 'critical' },
    { label: 'Emergency contacts', complete: draft.emergencyContacts.length > 0, severity: 'critical' },
    { label: 'Scenes', complete: draft.scenes.length > 0, severity: 'recommended' },
    { label: 'Cast calls', complete: draft.castCalls.length > 0, severity: 'recommended' },
    { label: 'Crew calls', complete: draft.crewCalls.length > 0, severity: 'recommended' },
    { label: 'General notes', complete: hasText(draft.generalNotes), severity: 'recommended' },
    {
      label: 'Revision / distribution notes',
      complete: status === 'revised' || status === 'published' ? hasText(draft.distributionNotes) : true,
      severity: 'recommended',
    },
  ]
}

function parsePeopleLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.includes('|') ? '|' : ','
      const [name = '', role = '', email = '', callTime = '', notes = ''] = line
        .split(separator)
        .map((part) => part.trim())

      return { name, role, email, callTime, notes }
    })
    .filter((person) => person.name || person.role || person.email || person.callTime || person.notes)
}

function CallSheetEditorPage() {
  const navigate = useNavigate()
  const { id = '' } = useParams()

  const [draft, setDraft] = useState<CallSheetDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [autosaveEnabled, setAutosaveEnabled] = useState(true)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [dirtyRevision, setDirtyRevision] = useState(0)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [deleting, setDeleting] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<SectionKey>('overview')
  const [openRows, setOpenRows] = useState<Record<string, boolean>>({})
  const [castQuickAddText, setCastQuickAddText] = useState('')
  const [crewQuickAddText, setCrewQuickAddText] = useState('')
  const dirtyRevisionRef = useRef(0)
  const lastAutosaveAttemptRevision = useRef(0)

  useEffect(() => {
    let active = true

    setLoading(true)
    getCallSheet(id)
      .then((data) => {
        if (!active) return
        setDraft(data)
        dirtyRevisionRef.current = 0
        lastAutosaveAttemptRevision.current = 0
        setDirtyRevision(0)
        setHasUnsavedChanges(false)
        setSaveState('saved')
        setError(null)
      })
      .catch((err: unknown) => {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Failed to load call sheet')
      })
      .finally(() => {
        if (!active) return
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [id])

  const markDraftUnsaved = () => {
    dirtyRevisionRef.current += 1
    setDirtyRevision(dirtyRevisionRef.current)
    setHasUnsavedChanges(true)
    setSaveState('unsaved')
  }

  const saveDraft = useCallback(async (mode: SaveMode) => {
    if (!draft || saving) return

    const draftToSave = draft
    const revisionAtStart = dirtyRevisionRef.current

    try {
      setSaving(true)
      setSaveState(mode === 'autosave' ? 'autosaving' : 'manual-saving')
      setError(null)
      const saved = await updateCallSheet(draftToSave.id, draftToSave)

      if (dirtyRevisionRef.current === revisionAtStart) {
        setDraft(saved)
        setHasUnsavedChanges(false)
        setSaveState('saved')
      } else {
        setSaveState('unsaved')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save call sheet')
      setHasUnsavedChanges(true)
      setSaveState(mode === 'autosave' ? 'autosave-failed' : 'save-failed')
    } finally {
      setSaving(false)
    }
  }, [draft, saving])

  useEffect(() => {
    if (!autosaveEnabled || loading || !draft || !hasUnsavedChanges || saving) return
    if (lastAutosaveAttemptRevision.current === dirtyRevision) return

    const timer = window.setTimeout(() => {
      if (lastAutosaveAttemptRevision.current === dirtyRevisionRef.current) return
      lastAutosaveAttemptRevision.current = dirtyRevisionRef.current
      void saveDraft('autosave')
    }, AUTOSAVE_DELAY_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [autosaveEnabled, dirtyRevision, draft, hasUnsavedChanges, loading, saveDraft, saving])

  useEffect(() => {
    if (!hasUnsavedChanges) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedChanges])

  const title = useMemo(() => draft?.title || 'Untitled Call Sheet', [draft])

  const sections: { key: SectionKey; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: '◫' },
    { key: 'contacts', label: 'Contacts', icon: '✆' },
    { key: 'weather', label: 'Weather', icon: '☼' },
    { key: 'locations', label: 'Locations', icon: '⌂' },
    { key: 'scenes', label: 'Scenes', icon: '◈' },
    { key: 'cast', label: 'Cast', icon: '★' },
    { key: 'crew', label: 'Crew', icon: '☰' },
  ]

  const patchDraft = (patch: Partial<CallSheetDraft>) => {
    if (!draft) return
    setDraft({
      ...draft,
      ...patch,
    })
    markDraftUnsaved()
  }

  const updateField = (field: keyof CallSheetDraft, value: string) => {
    if (!draft) return
    setDraft({
      ...draft,
      [field]: value,
    })
    markDraftUnsaved()
  }

  const updateStringArrayItem = (
    field: 'mainSetAddress' | 'nearestHospitalAddress',
    index: number,
    value: string,
  ) => {
    if (!draft) return
    const next = [...draft[field]]
    next[index] = value
    patchDraft({ [field]: next } as Partial<CallSheetDraft>)
  }

  const addStringArrayItem = (field: 'mainSetAddress' | 'nearestHospitalAddress') => {
    if (!draft) return
    patchDraft({ [field]: [...draft[field], ''] } as Partial<CallSheetDraft>)
  }

  const removeStringArrayItem = (
    field: 'mainSetAddress' | 'nearestHospitalAddress',
    index: number,
  ) => {
    if (!draft) return
    patchDraft({
      [field]: draft[field].filter((_, i) => i !== index),
    } as Partial<CallSheetDraft>)
  }

  const updateArrayItem = <T extends { id: string }>(
    field: 'emergencyContacts' | 'scenes' | 'castCalls' | 'crewCalls',
    idValue: string,
    patch: Partial<T>,
  ) => {
    if (!draft) return
    const next = ((draft[field] as unknown) as T[]).map((item) =>
      item.id === idValue ? { ...item, ...patch } : item,
    )
    patchDraft({ [field]: next } as Partial<CallSheetDraft>)
  }

  const removeArrayItem = (
    field: 'emergencyContacts' | 'scenes' | 'castCalls' | 'crewCalls',
    idValue: string,
  ) => {
    if (!draft) return
    patchDraft({
      [field]: draft[field].filter((item) => item.id !== idValue),
    } as Partial<CallSheetDraft>)
  }

  const toggleRow = (idValue: string) => {
    setOpenRows((prev) => ({
      ...prev,
      [idValue]: !prev[idValue],
    }))
  }

  const addEmergencyContact = () => {
    if (!draft) return
    const next: EmergencyContact = {
      id: uid('ec'),
      label: '',
      name: '',
      phone: '',
    }
    patchDraft({ emergencyContacts: [...draft.emergencyContacts, next] })
    setActiveSection('contacts')
    setOpenRows((prev) => ({ ...prev, [next.id]: true }))
  }

  const duplicateEmergencyContact = (contact: EmergencyContact) => {
    if (!draft) return
    const next = {
      ...contact,
      id: uid('ec'),
      label: contact.label ? `${contact.label} Copy` : contact.label,
    }
    patchDraft({ emergencyContacts: insertAfter(draft.emergencyContacts, contact.id, next) })
    setOpenRows((prev) => ({ ...prev, [next.id]: true }))
  }

  const addScene = () => {
    if (!draft) return
    const next: SceneRow = {
      id: uid('scene'),
      sceneNumber: '',
      setDescription: '',
      castSummary: '',
      dayNight: '',
      pageCount: '',
      locationNotes: '',
    }
    patchDraft({ scenes: [...draft.scenes, next] })
    setActiveSection('scenes')
    setOpenRows((prev) => ({ ...prev, [next.id]: true }))
  }

  const duplicateScene = (scene: SceneRow) => {
    if (!draft) return
    const next = {
      ...scene,
      id: uid('scene'),
      sceneNumber: scene.sceneNumber ? `${scene.sceneNumber} Copy` : scene.sceneNumber,
    }
    patchDraft({ scenes: insertAfter(draft.scenes, scene.id, next) })
    setOpenRows((prev) => ({ ...prev, [next.id]: true }))
  }

  const addCastCall = () => {
    if (!draft) return
    const next: CastCallRow = {
      id: uid('cast'),
      castName: '',
      roleName: '',
      email: '',
      callTime: '',
      notes: '',
    }
    patchDraft({ castCalls: [...draft.castCalls, next] })
    setActiveSection('cast')
    setOpenRows((prev) => ({ ...prev, [next.id]: true }))
  }

  const duplicateCastCall = (cast: CastCallRow) => {
    if (!draft) return
    const next = {
      ...cast,
      id: uid('cast'),
      castName: cast.castName ? `${cast.castName} Copy` : cast.castName,
    }
    patchDraft({ castCalls: insertAfter(draft.castCalls, cast.id, next) })
    setOpenRows((prev) => ({ ...prev, [next.id]: true }))
  }

  const addCrewCall = () => {
    if (!draft) return
    const next: CrewCallRow = {
      id: uid('crew'),
      departmentRole: '',
      crewName: '',
      email: '',
      callTime: '',
      notes: '',
    }
    patchDraft({ crewCalls: [...draft.crewCalls, next] })
    setActiveSection('crew')
    setOpenRows((prev) => ({ ...prev, [next.id]: true }))
  }

  const duplicateCrewCall = (crew: CrewCallRow) => {
    if (!draft) return
    const next = {
      ...crew,
      id: uid('crew'),
      crewName: crew.crewName ? `${crew.crewName} Copy` : crew.crewName,
    }
    patchDraft({ crewCalls: insertAfter(draft.crewCalls, crew.id, next) })
    setOpenRows((prev) => ({ ...prev, [next.id]: true }))
  }

  const quickAddCastCalls = () => {
    if (!draft) return
    const rows = parsePeopleLines(castQuickAddText)
    if (rows.length === 0) return

    const nextRows: CastCallRow[] = rows.map((row) => ({
      id: uid('cast'),
      castName: row.name,
      roleName: row.role,
      email: row.email,
      callTime: row.callTime,
      notes: row.notes,
    }))

    patchDraft({ castCalls: [...draft.castCalls, ...nextRows] })
    setCastQuickAddText('')
    setOpenRows((prev) => ({
      ...prev,
      ...Object.fromEntries(nextRows.map((row) => [row.id, true])),
    }))
  }

  const quickAddCrewCalls = () => {
    if (!draft) return
    const rows = parsePeopleLines(crewQuickAddText)
    if (rows.length === 0) return

    const nextRows: CrewCallRow[] = rows.map((row) => ({
      id: uid('crew'),
      departmentRole: row.role,
      crewName: row.name,
      email: row.email,
      callTime: row.callTime,
      notes: row.notes,
    }))

    patchDraft({ crewCalls: [...draft.crewCalls, ...nextRows] })
    setCrewQuickAddText('')
    setOpenRows((prev) => ({
      ...prev,
      ...Object.fromEntries(nextRows.map((row) => [row.id, true])),
    }))
  }

  const handleSave = () => {
    void saveDraft('manual')
  }

  const handleDelete = async () => {
    if (!draft) return
    const ok = window.confirm(`Delete "${draft.title || 'Untitled Call Sheet'}"?`)
    if (!ok) return

    try {
      setDeleting(true)
      setError(null)
      await deleteCallSheet(draft.id)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete call sheet')
    } finally {
      setDeleting(false)
    }
  }


  const handleDuplicate = async () => {
    if (!draft) return
    try {
      setDuplicating(true)
      setError(null)
      const copied = await duplicateCallSheet(draft.id)
      navigate(`/callsheets/${copied.id}/edit`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate call sheet')
    } finally {
      setDuplicating(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!draft) return
    try {
      setDownloadingPdf(true)
      setError(null)
      await downloadPdfFile(draft.id, draft.title)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to download PDF')
    } finally {
      setDownloadingPdf(false)
    }
  }

  if (loading) {
    return <div className="vw-empty-block">Loading call sheet...</div>
  }

  if (!draft) {
    return <div className="vw-empty-block">Call sheet not found.</div>
  }

  const currentStatus = draft.status || 'draft'
  const statusLabel = callSheetStatusLabels[currentStatus]
  const saveStateLabel = saveStateLabels[saveState]
  const workflowAction = workflowActions[currentStatus]
  const readinessItems = getReadinessItems(draft, currentStatus)
  const missingReadinessItems = readinessItems.filter((item) => !item.complete)
  const missingCriticalItems = missingReadinessItems.filter((item) => item.severity === 'critical')
  const readinessCompleteCount = readinessItems.length - missingReadinessItems.length

  const confirmStatusChange = (nextStatus: CallSheetStatus) => {
    if (nextStatus === currentStatus) return false

    if (nextStatus === 'published') {
      const missingList = missingCriticalItems.map((item) => `- ${item.label}`).join('\n')
      const message = missingCriticalItems.length > 0
        ? `This call sheet is missing critical publishing details:\n\n${missingList}\n\nPublish anyway?`
        : 'Publish this call sheet for distribution?'
      const ok = window.confirm(message)
      if (!ok) return false
    }

    if (currentStatus === 'published' && nextStatus === 'revised') {
      const note = hasText(draft.distributionNotes)
        ? 'Create a revision from this published call sheet?'
        : 'Create a revision from this published call sheet?\n\nConsider adding Revision / Distribution Notes so the crew can see what changed.'
      const ok = window.confirm(
        note,
      )
      if (!ok) return false
    }

    return true
  }

  const handleStatusChange = (nextStatus: CallSheetStatus) => {
    if (!confirmStatusChange(nextStatus)) return
    patchDraft({ status: nextStatus })
  }

  const handleWorkflowAction = () => {
    handleStatusChange(workflowAction.nextStatus)
  }

  const renderProductionSummary = () => (
    <section className="production-summary panel">
      <div className="summary-item">
        <span>Status</span>
        <strong>{statusLabel}</strong>
      </div>
      <div className="summary-item">
        <span>Production Date</span>
        <strong>{draft.productionDate || 'No production date set'}</strong>
      </div>
      <div className="summary-item">
        <span>Primary Crew Call</span>
        <strong>{draft.primaryCallTime || 'Not set'}</strong>
      </div>
      <div className="summary-item">
        <span>Scenes</span>
        <strong>{draft.scenes.length}</strong>
      </div>
      <div className="summary-item">
        <span>Cast / Crew</span>
        <strong>{draft.castCalls.length} / {draft.crewCalls.length}</strong>
      </div>
      <div className="summary-item">
        <span>Readiness</span>
        <strong>{readinessCompleteCount}/{readinessItems.length} complete</strong>
      </div>
      <div className="summary-item">
        <span>Autosave</span>
        <strong>{autosaveEnabled ? saveStateLabel : 'Off'}</strong>
      </div>
    </section>
  )

  const renderReadinessCheck = () => (
    <section className="readiness-panel panel">
      <div className="readiness-head">
        <div>
          <h2>Readiness Check</h2>
          <p>{readinessCompleteCount} of {readinessItems.length} essentials complete before publishing.</p>
        </div>
        <span className={`readiness-score ${missingCriticalItems.length === 0 ? 'is-ready' : ''}`}>
          {missingCriticalItems.length === 0 ? 'Critical ready' : `${missingCriticalItems.length} critical`}
        </span>
      </div>

      {(['critical', 'recommended'] as const).map((severity) => {
        const items = readinessItems.filter((item) => item.severity === severity)
        const missingCount = items.filter((item) => !item.complete).length

        return (
          <div key={severity} className="readiness-group">
            <div className="readiness-group-title">
              <span>{severity === 'critical' ? 'Critical' : 'Recommended'}</span>
              <span>{missingCount === 0 ? 'Complete' : `${missingCount} missing`}</span>
            </div>
            <div className="readiness-list">
              {items.map((item) => (
                <div key={item.label} className={`readiness-item ${item.complete ? 'is-complete' : 'is-missing'}`}>
                  <span className="readiness-dot" aria-hidden="true" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </section>
  )

  const renderSection = () => {
    if (!draft) return null

    if (activeSection === 'overview') {
      return (
        <section className="builder-form panel">
          <div className="form-section">
            <h2>Overview</h2>
            <div className="field-grid">
              <label className="field">
                <span>Document title</span>
                <input value={draft.title} onChange={(e) => updateField('title', e.target.value)} />
              </label>

              <label className="field">
                <span>Production date</span>
                <input value={draft.productionDate} onChange={(e) => updateField('productionDate', e.target.value)} />
              </label>

              <label className="field">
                <span>Primary crew call</span>
                <input value={draft.primaryCallTime} onChange={(e) => updateField('primaryCallTime', e.target.value)} />
              </label>

              <label className="field">
                <span>General notes</span>
                <textarea value={draft.generalNotes} onChange={(e) => updateField('generalNotes', e.target.value)} />
              </label>

              <label className="field">
                <span>Revision / Distribution Notes</span>
                <textarea value={draft.distributionNotes} onChange={(e) => updateField('distributionNotes', e.target.value)} />
              </label>
            </div>
          </div>
        </section>
      )
    }

    if (activeSection === 'contacts') {
      return (
        <section className="builder-form panel">
          <div className="section-head">
            <div>
              <h2>Emergency Contacts</h2>
            </div>
            <button className="vw-btn" type="button" onClick={addEmergencyContact}>Add Emergency Contact</button>
          </div>

          <div className="stack-list">
            {draft.emergencyContacts.map((contact) => {
              const open = !!openRows[contact.id]
              const contactTitle = contact.label || contact.name || 'Untitled emergency contact'
              const contactMeta = joinParts([contact.name, contact.phone])
              return (
                <div key={contact.id} className="compact-row-card">
                  <button
                    type="button"
                    className={`compact-row-toggle ${open ? 'is-open' : ''}`}
                    onClick={() => toggleRow(contact.id)}
                  >
                    <span className="compact-row-title">{contactTitle}</span>
                    {contactMeta ? <span className="compact-row-meta">{contactMeta}</span> : null}
                  </button>

                  {open ? (
                    <div className="compact-row-body">
                      <div className="field-grid field-grid-3">
                        <label className="field">
                          <span>Label</span>
                          <input
                            value={contact.label}
                            onChange={(e) =>
                              updateArrayItem<EmergencyContact>('emergencyContacts', contact.id, { label: e.target.value })
                            }
                          />
                        </label>

                        <label className="field">
                          <span>Name</span>
                          <input
                            value={contact.name}
                            onChange={(e) =>
                              updateArrayItem<EmergencyContact>('emergencyContacts', contact.id, { name: e.target.value })
                            }
                          />
                        </label>

                        <label className="field">
                          <span>Phone</span>
                          <input
                            value={contact.phone}
                            onChange={(e) =>
                              updateArrayItem<EmergencyContact>('emergencyContacts', contact.id, { phone: e.target.value })
                            }
                          />
                        </label>
                      </div>

                      <div className="row-actions">
                        <button
                          className="vw-btn"
                          type="button"
                          onClick={() => duplicateEmergencyContact(contact)}
                        >
                          Duplicate
                        </button>
                        <button
                          className="vw-btn vw-btn-danger"
                          type="button"
                          onClick={() => removeArrayItem('emergencyContacts', contact.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </section>
      )
    }

    if (activeSection === 'weather') {
      return (
        <section className="builder-form panel">
          <div className="form-section">
            <h2>Weather</h2>
            <div className="field-grid field-grid-2">
              <label className="field">
                <span>Summary</span>
                <input value={draft.weatherSummary} onChange={(e) => updateField('weatherSummary', e.target.value)} />
              </label>
              <label className="field">
                <span>At call</span>
                <input value={draft.weatherTempAtCall} onChange={(e) => updateField('weatherTempAtCall', e.target.value)} />
              </label>
              <label className="field">
                <span>High</span>
                <input value={draft.weatherHigh} onChange={(e) => updateField('weatherHigh', e.target.value)} />
              </label>
              <label className="field">
                <span>Low</span>
                <input value={draft.weatherLow} onChange={(e) => updateField('weatherLow', e.target.value)} />
              </label>
              <label className="field">
                <span>Sunrise</span>
                <input value={draft.sunrise} onChange={(e) => updateField('sunrise', e.target.value)} />
              </label>
              <label className="field">
                <span>Sunset</span>
                <input value={draft.sunset} onChange={(e) => updateField('sunset', e.target.value)} />
              </label>
            </div>
          </div>
        </section>
      )
    }

    if (activeSection === 'locations') {
      return (
        <section className="builder-form panel">
          <div className="form-section">
            <h2>Locations</h2>

            <div className="field-grid field-grid-2">
              <label className="field field-full">
                <span>Main set name</span>
                <input value={draft.mainSetName} onChange={(e) => updateField('mainSetName', e.target.value)} />
              </label>

              <div className="field field-full">
                <span>Main set address lines</span>
                <div className="stack-list compact-top">
                  {draft.mainSetAddress.map((line, index) => (
                    <div key={`main-${index}`} className="inline-row">
                      <input
                        className="inline-input"
                        value={line}
                        onChange={(e) => updateStringArrayItem('mainSetAddress', index, e.target.value)}
                      />
                      <button className="vw-btn vw-btn-danger" type="button" onClick={() => removeStringArrayItem('mainSetAddress', index)}>
                        Remove
                      </button>
                    </div>
                  ))}
                  <button className="vw-btn" type="button" onClick={() => addStringArrayItem('mainSetAddress')}>
                    Add Address Line
                  </button>
                </div>
              </div>

              <label className="field field-full">
                <span>Nearest hospital name</span>
                <input value={draft.nearestHospitalName} onChange={(e) => updateField('nearestHospitalName', e.target.value)} />
              </label>

              <div className="field field-full">
                <span>Nearest hospital address lines</span>
                <div className="stack-list compact-top">
                  {draft.nearestHospitalAddress.map((line, index) => (
                    <div key={`hospital-${index}`} className="inline-row">
                      <input
                        className="inline-input"
                        value={line}
                        onChange={(e) => updateStringArrayItem('nearestHospitalAddress', index, e.target.value)}
                      />
                      <button className="vw-btn vw-btn-danger" type="button" onClick={() => removeStringArrayItem('nearestHospitalAddress', index)}>
                        Remove
                      </button>
                    </div>
                  ))}
                  <button className="vw-btn" type="button" onClick={() => addStringArrayItem('nearestHospitalAddress')}>
                    Add Address Line
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )
    }

    if (activeSection === 'scenes') {
      return (
        <section className="builder-form panel">
          <div className="section-head">
            <div>
              <h2>Scenes</h2>
            </div>
            <button className="vw-btn" type="button" onClick={addScene}>Add Scene</button>
          </div>

          <div className="stack-list">
            {draft.scenes.map((scene) => {
              const open = !!openRows[scene.id]
              const sceneTitle = scene.sceneNumber || scene.setDescription || 'Untitled scene'
              const sceneMeta = joinParts([scene.setDescription, scene.castSummary, scene.locationNotes])
              return (
                <div key={scene.id} className="compact-row-card">
                  <button type="button" className={`compact-row-toggle ${open ? 'is-open' : ''}`} onClick={() => toggleRow(scene.id)}>
                    <span className="compact-row-title">{sceneTitle}</span>
                    {sceneMeta ? <span className="compact-row-meta">{sceneMeta}</span> : null}
                  </button>

                  {open ? (
                    <div className="compact-row-body">
                      <div className="field-grid field-grid-2">
                        <label className="field">
                          <span>Scene</span>
                          <input value={scene.sceneNumber} onChange={(e) => updateArrayItem<SceneRow>('scenes', scene.id, { sceneNumber: e.target.value })} />
                        </label>
                        <label className="field">
                          <span>Cast</span>
                          <input value={scene.castSummary} onChange={(e) => updateArrayItem<SceneRow>('scenes', scene.id, { castSummary: e.target.value })} />
                        </label>
                        <label className="field">
                          <span>Set and description</span>
                          <input value={scene.setDescription} onChange={(e) => updateArrayItem<SceneRow>('scenes', scene.id, { setDescription: e.target.value })} />
                        </label>
                        <label className="field">
                          <span>Location / notes</span>
                          <input value={scene.locationNotes} onChange={(e) => updateArrayItem<SceneRow>('scenes', scene.id, { locationNotes: e.target.value })} />
                        </label>
                        <label className="field">
                          <span>D/N</span>
                          <input value={scene.dayNight} onChange={(e) => updateArrayItem<SceneRow>('scenes', scene.id, { dayNight: e.target.value })} />
                        </label>
                        <label className="field">
                          <span>Pages</span>
                          <input value={scene.pageCount} onChange={(e) => updateArrayItem<SceneRow>('scenes', scene.id, { pageCount: e.target.value })} />
                        </label>
                      </div>

                      <div className="row-actions">
                        <button className="vw-btn" type="button" onClick={() => duplicateScene(scene)}>
                          Duplicate
                        </button>
                        <button className="vw-btn vw-btn-danger" type="button" onClick={() => removeArrayItem('scenes', scene.id)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </section>
      )
    }

    if (activeSection === 'cast') {
      return (
        <section className="builder-form panel">
          <div className="section-head">
            <div>
              <h2>Cast Calls</h2>
            </div>
            <button className="vw-btn" type="button" onClick={addCastCall}>Add Cast Call</button>
          </div>

          <div className="quick-add-panel">
            <label className="field">
              <span>Quick Add Cast</span>
              <textarea
                value={castQuickAddText}
                onChange={(event) => setCastQuickAddText(event.target.value)}
                placeholder="Name, Role, Email, Call Time, Notes"
              />
            </label>
            <div className="quick-add-actions">
              <p>Paste one person per line. Commas or pipes both work.</p>
              <button className="vw-btn" type="button" onClick={quickAddCastCalls} disabled={!castQuickAddText.trim()}>
                Add Pasted Cast
              </button>
            </div>
          </div>

          <div className="stack-list">
            {draft.castCalls.map((cast) => {
              const open = !!openRows[cast.id]
              const castTitle = cast.castName || cast.roleName || 'Untitled cast call'
              const castMeta = joinParts([cast.roleName, cast.callTime ? `Call ${cast.callTime}` : '', cast.email])
              return (
                <div key={cast.id} className="compact-row-card">
                  <button type="button" className={`compact-row-toggle ${open ? 'is-open' : ''}`} onClick={() => toggleRow(cast.id)}>
                    <span className="compact-row-title">{castTitle}</span>
                    {castMeta ? <span className="compact-row-meta">{castMeta}</span> : null}
                  </button>

                  {open ? (
                    <div className="compact-row-body">
                      <div className="field-grid field-grid-2">
                        <label className="field">
                          <span>Cast</span>
                          <input value={cast.castName} onChange={(e) => updateArrayItem<CastCallRow>('castCalls', cast.id, { castName: e.target.value })} />
                        </label>
                        <label className="field">
                          <span>Role</span>
                          <input value={cast.roleName} onChange={(e) => updateArrayItem<CastCallRow>('castCalls', cast.id, { roleName: e.target.value })} />
                        </label>
                        <label className="field">
                          <span>Email</span>
                          <input value={cast.email} onChange={(e) => updateArrayItem<CastCallRow>('castCalls', cast.id, { email: e.target.value })} />
                        </label>
                        <label className="field">
                          <span>Call</span>
                          <input value={cast.callTime} onChange={(e) => updateArrayItem<CastCallRow>('castCalls', cast.id, { callTime: e.target.value })} />
                        </label>
                        <label className="field field-full">
                          <span>Notes</span>
                          <input value={cast.notes} onChange={(e) => updateArrayItem<CastCallRow>('castCalls', cast.id, { notes: e.target.value })} />
                        </label>
                      </div>

                      <div className="row-actions">
                        <button className="vw-btn" type="button" onClick={() => duplicateCastCall(cast)}>
                          Duplicate
                        </button>
                        <button className="vw-btn vw-btn-danger" type="button" onClick={() => removeArrayItem('castCalls', cast.id)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </section>
      )
    }

    return (
      <section className="builder-form panel">
        <div className="section-head">
          <div>
            <h2>Crew Calls</h2>
          </div>
          <button className="vw-btn" type="button" onClick={addCrewCall}>Add Crew Call</button>
        </div>

        <div className="quick-add-panel">
          <label className="field">
            <span>Quick Add Crew</span>
            <textarea
              value={crewQuickAddText}
              onChange={(event) => setCrewQuickAddText(event.target.value)}
              placeholder="Name, Role, Email, Call Time, Notes"
            />
          </label>
          <div className="quick-add-actions">
            <p>Paste one crew member per line. Commas or pipes both work.</p>
            <button className="vw-btn" type="button" onClick={quickAddCrewCalls} disabled={!crewQuickAddText.trim()}>
              Add Pasted Crew
            </button>
          </div>
        </div>

        <div className="stack-list">
          {draft.crewCalls.map((crew) => {
            const open = !!openRows[crew.id]
            const crewTitle = crew.crewName || crew.departmentRole || 'Unnamed crew call'
            const crewMeta = joinParts([crew.departmentRole, crew.callTime ? `Call ${crew.callTime}` : '', crew.email])
            return (
              <div key={crew.id} className="compact-row-card">
                <button type="button" className={`compact-row-toggle ${open ? 'is-open' : ''}`} onClick={() => toggleRow(crew.id)}>
                  <span className="compact-row-title">{crewTitle}</span>
                  {crewMeta ? <span className="compact-row-meta">{crewMeta}</span> : null}
                </button>

                {open ? (
                  <div className="compact-row-body">
                    <div className="field-grid field-grid-2">
                      <label className="field">
                        <span>Department / role</span>
                        <input value={crew.departmentRole} onChange={(e) => updateArrayItem<CrewCallRow>('crewCalls', crew.id, { departmentRole: e.target.value })} />
                      </label>
                      <label className="field">
                        <span>Name</span>
                        <input value={crew.crewName} onChange={(e) => updateArrayItem<CrewCallRow>('crewCalls', crew.id, { crewName: e.target.value })} />
                      </label>
                      <label className="field">
                        <span>Email</span>
                        <input value={crew.email} onChange={(e) => updateArrayItem<CrewCallRow>('crewCalls', crew.id, { email: e.target.value })} />
                      </label>
                      <label className="field">
                        <span>Call</span>
                        <input value={crew.callTime} onChange={(e) => updateArrayItem<CrewCallRow>('crewCalls', crew.id, { callTime: e.target.value })} />
                      </label>
                      <label className="field field-full">
                        <span>Notes</span>
                        <input value={crew.notes} onChange={(e) => updateArrayItem<CrewCallRow>('crewCalls', crew.id, { notes: e.target.value })} />
                      </label>
                    </div>

                    <div className="row-actions">
                      <button className="vw-btn" type="button" onClick={() => duplicateCrewCall(crew)}>
                        Duplicate
                      </button>
                      <button className="vw-btn vw-btn-danger" type="button" onClick={() => removeArrayItem('crewCalls', crew.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </section>
    )
  }

  return (
    <div className="editor-layout">
      <EditorSidebar
        activeSection={activeSection}
        sections={sections}
        status={currentStatus}
        workflowActionLabel={workflowAction.label}
        workflowActionNextStatus={callSheetStatusLabels[workflowAction.nextStatus]}
        onSectionChange={(section) => setActiveSection(section as SectionKey)}
        onWorkflowAction={handleWorkflowAction}
        onStatusChange={handleStatusChange}
      />

      <section className="editor-main">
        <div className="editor-header panel">
          <div>
            <div className="editor-title-row">
              <p className="kicker">Editing Call Sheet</p>
              <span className="status-badge">{statusLabel}</span>
            </div>
            <h1 className="editor-title">{title}</h1>
            <p className="editor-subtext">
              {draft.productionDate || 'No date set'} • Primary Crew Call {draft.primaryCallTime || '—'}
            </p>
          </div>

          <div className="editor-actions">
            <label className="autosave-toggle">
              <input
                type="checkbox"
                checked={autosaveEnabled}
                onChange={(event) => setAutosaveEnabled(event.target.checked)}
              />
              <span>Autosave</span>
            </label>
            <span className={`save-state-badge save-state-badge-${saveState}`} aria-live="polite">
              {saveStateLabel}
            </span>
            <button className="vw-btn" type="button" onClick={handleSave} disabled={saving}>
              {saveState === 'manual-saving' ? 'Saving…' : 'Save Draft'}
            </button>
            <button className="vw-btn vw-btn-primary" type="button" onClick={handleDownloadPdf} disabled={downloadingPdf}>
              {downloadingPdf ? 'Preparing…' : 'Download PDF'}
            </button>
            <button className="vw-btn" type="button" onClick={handleDuplicate} disabled={duplicating}>
              {duplicating ? 'Duplicating…' : 'Duplicate'}
            </button>
            <button className="vw-btn vw-btn-danger" type="button" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>

        {error ? <div className="vw-inline-error">{error}</div> : null}

        <div className="section-switcher section-switcher-compact">
          {sections.map((section) => (
            <button
              key={section.key}
              type="button"
              className={`section-switcher-item ${activeSection === section.key ? 'is-active' : ''}`}
              onClick={() => setActiveSection(section.key)}
            >
              <span className="section-switcher-icon" aria-hidden="true">{section.icon}</span>
              <span className="section-switcher-title">{section.label}</span>
            </button>
          ))}
        </div>

        {renderProductionSummary()}

        {renderReadinessCheck()}

        {renderSection()}

        <CallSheetPreview draft={draft} />
      </section>
    </div>
  )
}

export default CallSheetEditorPage
