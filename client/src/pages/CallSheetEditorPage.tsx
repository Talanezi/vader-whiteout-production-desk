import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import EditorSidebar from '../components/EditorSidebar'
import CallSheetPreview from '../components/CallSheetPreview'
import type { CallSheetDraft } from '../data/mockCallSheet'
import { getCallSheet, updateCallSheet } from '../lib/api'

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

  const updateField = (field: keyof CallSheetDraft, value: string) => {
    if (!draft) return
    setDraft({
      ...draft,
      [field]: value,
    })
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
            <div className="form-section">
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
                  <span>Main set</span>
                  <input value={draft.mainSetName} onChange={(e) => updateField('mainSetName', e.target.value)} />
                </label>
              </div>
            </div>

            <div className="form-section">
              <p className="kicker">Next</p>
              <h2>Builder sections</h2>
              <div className="section-chip-row">
                <span className="section-chip is-active">Header Cards</span>
                <span className="section-chip">Scenes</span>
                <span className="section-chip">Cast Calls</span>
                <span className="section-chip">Crew Calls</span>
                <span className="section-chip">Notes / Publish</span>
              </div>
              <p className="muted-copy">
                Next patch will replace this shell with real row editors and autosaved state.
              </p>
            </div>
          </section>

          <CallSheetPreview draft={draft} />
        </div>
      </section>
    </div>
  )
}

export default CallSheetEditorPage
