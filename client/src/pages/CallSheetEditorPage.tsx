import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import EditorSidebar from '../components/EditorSidebar'
import CallSheetPreview from '../components/CallSheetPreview'
import type {
  CallSheetDraft,
  CastCallRow,
  CrewCallRow,
  EmergencyContact,
  SceneRow,
} from '../data/mockCallSheet'
import { getCallSheet, updateCallSheet } from '../lib/api'

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function CallSheetEditorPage() {
  const { id = '' } = useParams()
  const [draft, setDraft] = useState<CallSheetDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const updateEmergencyContact = (id: string, patch: Partial<EmergencyContact>) => {
    if (!draft) return
    patchDraft({
      emergencyContacts: draft.emergencyContacts.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    })
  }

  const updateScene = (id: string, patch: Partial<SceneRow>) => {
    if (!draft) return
    patchDraft({
      scenes: draft.scenes.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    })
  }

  const updateCastCall = (id: string, patch: Partial<CastCallRow>) => {
    if (!draft) return
    patchDraft({
      castCalls: draft.castCalls.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    })
  }

  const updateCrewCall = (id: string, patch: Partial<CrewCallRow>) => {
    if (!draft) return
    patchDraft({
      crewCalls: draft.crewCalls.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    })
  }

  const removeEmergencyContact = (id: string) => {
    if (!draft) return
    patchDraft({
      emergencyContacts: draft.emergencyContacts.filter((item) => item.id !== id),
    })
  }

  const removeScene = (id: string) => {
    if (!draft) return
    patchDraft({
      scenes: draft.scenes.filter((item) => item.id !== id),
    })
  }

  const removeCastCall = (id: string) => {
    if (!draft) return
    patchDraft({
      castCalls: draft.castCalls.filter((item) => item.id !== id),
    })
  }

  const removeCrewCall = (id: string) => {
    if (!draft) return
    patchDraft({
      crewCalls: draft.crewCalls.filter((item) => item.id !== id),
    })
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

  if (loading) {
    return <div className="vw-empty-block">Loading call sheet...</div>
  }

  if (!draft) {
    return <div className="vw-empty-block">Call sheet not found.</div>
  }

  return (
    <div className="editor-layout">
      <EditorSidebar />

      <section className="editor-main">
        <div className="editor-header panel">
          <div>
            <p className="kicker">Editing Draft</p>
            <h1 className="editor-title">{title}</h1>
            <p className="editor-subtext">
              {draft.productionDate || 'No date set'} • Primary Crew Call {draft.primaryCallTime || '—'}
            </p>
          </div>

          <div className="editor-actions">
            <button className="vw-btn" type="button" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button className="vw-btn vw-btn-primary" type="button">Generate PDF</button>
          </div>
        </div>

        {error ? <div className="vw-inline-error">{error}</div> : null}

        <div className="builder-grid">
          <section className="builder-form panel">
            <div className="form-section" id="overview">
              <p className="kicker">Overview</p>
              <h2>Production day basics</h2>

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

            <div className="form-section" id="contacts">
              <div className="section-head">
                <div>
                  <p className="kicker">Header Cards</p>
                  <h2>Emergency contacts</h2>
                </div>
                <button className="vw-btn" type="button" onClick={addEmergencyContact}>Add contact</button>
              </div>

              <div className="stack-list">
                {draft.emergencyContacts.map((contact) => (
                  <div key={contact.id} className="row-card">
                    <div className="field-grid field-grid-3">
                      <label className="field">
                        <span>Label</span>
                        <input
                          value={contact.label}
                          onChange={(e) =>
                            updateEmergencyContact(contact.id, {
                              label: e.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="field">
                        <span>Name</span>
                        <input
                          value={contact.name}
                          onChange={(e) =>
                            updateEmergencyContact(contact.id, {
                              name: e.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="field">
                        <span>Phone</span>
                        <input
                          value={contact.phone}
                          onChange={(e) =>
                            updateEmergencyContact(contact.id, {
                              phone: e.target.value,
                            })
                          }
                        />
                      </label>
                    </div>
                    <div className="row-actions">
                      <button className="vw-btn vw-btn-danger" type="button" onClick={() => removeEmergencyContact(contact.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-section" id="weather">
              <p className="kicker">Header Cards</p>
              <h2>Weather and timing</h2>

              <div className="field-grid">
                <label className="field">
                  <span>Weather summary</span>
                  <input value={draft.weatherSummary} onChange={(e) => updateField('weatherSummary', e.target.value)} />
                </label>
                <label className="field">
                  <span>Temp at call</span>
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

            <div className="form-section" id="locations">
              <p className="kicker">Header Cards</p>
              <h2>Main set</h2>

              <div className="field-grid">
                <label className="field">
                  <span>Main set name</span>
                  <input value={draft.mainSetName} onChange={(e) => updateField('mainSetName', e.target.value)} />
                </label>
              </div>

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
              </div>

              <div className="row-actions">
                <button className="vw-btn" type="button" onClick={() => addStringArrayItem('mainSetAddress')}>Add line</button>
              </div>
            </div>

            <div className="form-section">
              <p className="kicker">Header Cards</p>
              <h2>Nearest hospital</h2>

              <div className="field-grid">
                <label className="field">
                  <span>Hospital name</span>
                  <input value={draft.nearestHospitalName} onChange={(e) => updateField('nearestHospitalName', e.target.value)} />
                </label>
              </div>

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
              </div>

              <div className="row-actions">
                <button className="vw-btn" type="button" onClick={() => addStringArrayItem('nearestHospitalAddress')}>Add line</button>
              </div>
            </div>

            <div className="form-section" id="scenes">
              <div className="section-head">
                <div>
                  <p className="kicker">Scenes</p>
                  <h2>Scene breakdown</h2>
                </div>
                <button className="vw-btn" type="button" onClick={addScene}>Add scene</button>
              </div>

              <div className="stack-list">
                {draft.scenes.map((scene) => (
                  <div key={scene.id} className="row-card">
                    <div className="field-grid field-grid-2">
                      <label className="field">
                        <span>Scene</span>
                        <input value={scene.sceneNumber} onChange={(e) => updateScene(scene.id, { sceneNumber: e.target.value })} />
                      </label>
                      <label className="field">
                        <span>Cast</span>
                        <input value={scene.castSummary} onChange={(e) => updateScene(scene.id, { castSummary: e.target.value })} />
                      </label>
                      <label className="field">
                        <span>Set and description</span>
                        <input value={scene.setDescription} onChange={(e) => updateScene(scene.id, { setDescription: e.target.value })} />
                      </label>
                      <label className="field">
                        <span>Location / notes</span>
                        <input value={scene.locationNotes} onChange={(e) => updateScene(scene.id, { locationNotes: e.target.value })} />
                      </label>
                      <label className="field">
                        <span>D/N</span>
                        <input value={scene.dayNight} onChange={(e) => updateScene(scene.id, { dayNight: e.target.value })} />
                      </label>
                      <label className="field">
                        <span>Pages</span>
                        <input value={scene.pageCount} onChange={(e) => updateScene(scene.id, { pageCount: e.target.value })} />
                      </label>
                    </div>
                    <div className="row-actions">
                      <button className="vw-btn vw-btn-danger" type="button" onClick={() => removeScene(scene.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-section" id="cast">
              <div className="section-head">
                <div>
                  <p className="kicker">Cast Calls</p>
                  <h2>Cast rows</h2>
                </div>
                <button className="vw-btn" type="button" onClick={addCastCall}>Add cast</button>
              </div>

              <div className="stack-list">
                {draft.castCalls.map((cast) => (
                  <div key={cast.id} className="row-card">
                    <div className="field-grid field-grid-2">
                      <label className="field">
                        <span>Cast name</span>
                        <input value={cast.castName} onChange={(e) => updateCastCall(cast.id, { castName: e.target.value })} />
                      </label>
                      <label className="field">
                        <span>Role</span>
                        <input value={cast.roleName} onChange={(e) => updateCastCall(cast.id, { roleName: e.target.value })} />
                      </label>
                      <label className="field">
                        <span>Email</span>
                        <input value={cast.email} onChange={(e) => updateCastCall(cast.id, { email: e.target.value })} />
                      </label>
                      <label className="field">
                        <span>Call time</span>
                        <input value={cast.callTime} onChange={(e) => updateCastCall(cast.id, { callTime: e.target.value })} />
                      </label>
                      <label className="field field-full">
                        <span>Notes</span>
                        <input value={cast.notes} onChange={(e) => updateCastCall(cast.id, { notes: e.target.value })} />
                      </label>
                    </div>
                    <div className="row-actions">
                      <button className="vw-btn vw-btn-danger" type="button" onClick={() => removeCastCall(cast.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-section" id="crew">
              <div className="section-head">
                <div>
                  <p className="kicker">Crew Calls</p>
                  <h2>Crew rows</h2>
                </div>
                <button className="vw-btn" type="button" onClick={addCrewCall}>Add crew</button>
              </div>

              <div className="stack-list">
                {draft.crewCalls.map((crew) => (
                  <div key={crew.id} className="row-card">
                    <div className="field-grid field-grid-2">
                      <label className="field">
                        <span>Department / role</span>
                        <input value={crew.departmentRole} onChange={(e) => updateCrewCall(crew.id, { departmentRole: e.target.value })} />
                      </label>
                      <label className="field">
                        <span>Name</span>
                        <input value={crew.crewName} onChange={(e) => updateCrewCall(crew.id, { crewName: e.target.value })} />
                      </label>
                      <label className="field">
                        <span>Email</span>
                        <input value={crew.email} onChange={(e) => updateCrewCall(crew.id, { email: e.target.value })} />
                      </label>
                      <label className="field">
                        <span>Call time</span>
                        <input value={crew.callTime} onChange={(e) => updateCrewCall(crew.id, { callTime: e.target.value })} />
                      </label>
                      <label className="field field-full">
                        <span>Notes</span>
                        <input value={crew.notes} onChange={(e) => updateCrewCall(crew.id, { notes: e.target.value })} />
                      </label>
                    </div>
                    <div className="row-actions">
                      <button className="vw-btn vw-btn-danger" type="button" onClick={() => removeCrewCall(crew.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <CallSheetPreview draft={draft} />
        </div>
      </section>
    </div>
  )
}

export default CallSheetEditorPage
