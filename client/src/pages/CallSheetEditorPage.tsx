import { useEffect, useMemo, useState } from 'react'
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

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function CallSheetEditorPage() {
  const navigate = useNavigate()
  const { id = '' } = useParams()

  const [draft, setDraft] = useState<CallSheetDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<SectionKey>('overview')
  const [openRows, setOpenRows] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let active = true

    setLoading(true)
    getCallSheet(id)
      .then((data) => {
        if (!active) return
        setDraft(data)
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
  }

  const updateField = (field: keyof CallSheetDraft, value: string) => {
    if (!draft) return
    setDraft({
      ...draft,
      [field]: value,
    })
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

  const handleSave = async () => {
    if (!draft) return
    try {
      setSaving(true)
      setError(null)
      const saved = await updateCallSheet(draft.id, draft)
      setDraft(saved)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save call sheet')
    } finally {
      setSaving(false)
    }
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
                <input value={draft.generalNotes} onChange={(e) => updateField('generalNotes', e.target.value)} />
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
            <button className="vw-btn" type="button" onClick={addEmergencyContact}>Add Contact</button>
          </div>

          <div className="stack-list">
            {draft.emergencyContacts.map((contact) => {
              const open = !!openRows[contact.id]
              return (
                <div key={contact.id} className="compact-row-card">
                  <button
                    type="button"
                    className={`compact-row-toggle ${open ? 'is-open' : ''}`}
                    onClick={() => toggleRow(contact.id)}
                  >
                    <span className="compact-row-title">{contact.label || contact.name || 'Untitled contact'}</span>
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
              return (
                <div key={scene.id} className="compact-row-card">
                  <button type="button" className={`compact-row-toggle ${open ? 'is-open' : ''}`} onClick={() => toggleRow(scene.id)}>
                    <span className="compact-row-title">{scene.sceneNumber || 'Untitled scene'}</span>
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

          <div className="stack-list">
            {draft.castCalls.map((cast) => {
              const open = !!openRows[cast.id]
              return (
                <div key={cast.id} className="compact-row-card">
                  <button type="button" className={`compact-row-toggle ${open ? 'is-open' : ''}`} onClick={() => toggleRow(cast.id)}>
                    <span className="compact-row-title">{cast.castName || cast.roleName || 'Untitled cast call'}</span>
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

        <div className="stack-list">
          {draft.crewCalls.map((crew) => {
            const open = !!openRows[crew.id]
            return (
              <div key={crew.id} className="compact-row-card">
                <button type="button" className={`compact-row-toggle ${open ? 'is-open' : ''}`} onClick={() => toggleRow(crew.id)}>
                  <span className="compact-row-title">{crew.crewName || crew.departmentRole || 'Untitled crew call'}</span>
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
        onSectionChange={(section) => setActiveSection(section as SectionKey)}
        onStatusChange={(status: CallSheetStatus) => patchDraft({ status })}
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
            <button className="vw-btn" type="button" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Draft'}
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

        {renderSection()}

        <CallSheetPreview draft={draft} />
      </section>
    </div>
  )
}

export default CallSheetEditorPage
