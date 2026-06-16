import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CallSheetDraft } from '../data/mockCallSheet'
import { createCallSheet } from '../lib/api'

type TemplateOption = {
  id: string
  title: string
  description: string
  payload: Partial<CallSheetDraft>
}

const templateOptions: TemplateOption[] = [
  {
    id: 'blank',
    title: 'Blank Call Sheet',
    description: 'Start clean and build the day from scratch.',
    payload: {
      title: 'Untitled Call Sheet',
      generalNotes: '',
      distributionNotes: '',
    },
  },
  {
    id: 'test-shoot',
    title: 'Test Shoot',
    description: 'Useful for camera, lighting, costume, and blocking tests.',
    payload: {
      title: 'Test Shoot Call Sheet',
      generalNotes: 'Confirm test goals, equipment needs, and review plan before crew call.',
      scenes: [
        {
          id: 'template-scene-test',
          sceneNumber: 'Test Setup',
          setDescription: 'Camera / lighting / movement test',
          castSummary: '',
          dayNight: 'D',
          pageCount: '',
          locationNotes: '',
        },
      ],
      crewCalls: [
        {
          id: 'template-crew-camera',
          departmentRole: 'Camera / Lighting',
          crewName: '',
          email: '',
          callTime: '',
          notes: 'Prep and test setup',
        },
      ],
    },
  },
  {
    id: 'studio-shoot',
    title: 'Studio Shoot',
    description: 'A contained studio day with controlled set notes.',
    payload: {
      title: 'Studio Shoot Call Sheet',
      mainSetName: 'Studio',
      generalNotes: 'Confirm studio access, load-in, sound restrictions, and wrap procedures.',
      scenes: [
        {
          id: 'template-scene-studio',
          sceneNumber: 'Studio Scene',
          setDescription: 'Studio setup',
          castSummary: '',
          dayNight: 'D',
          pageCount: '',
          locationNotes: 'Studio',
        },
      ],
    },
  },
  {
    id: 'location-shoot',
    title: 'Location Shoot',
    description: 'A field day with location, hospital, and movement details.',
    payload: {
      title: 'Location Shoot Call Sheet',
      generalNotes: 'Confirm parking, holding, restrooms, company moves, and location contact.',
      mainSetName: 'Location TBD',
      scenes: [
        {
          id: 'template-scene-location',
          sceneNumber: 'Location Scene',
          setDescription: 'Location work',
          castSummary: '',
          dayNight: '',
          pageCount: '',
          locationNotes: 'Confirm exact set address',
        },
      ],
    },
  },
  {
    id: 'pickup-shoot',
    title: 'Pickup Shoot',
    description: 'A compact day for inserts, pickups, and small crew work.',
    payload: {
      title: 'Pickup Shoot Call Sheet',
      generalNotes: 'Prioritize required pickups, continuity references, and minimum crew needs.',
      scenes: [
        {
          id: 'template-scene-pickup',
          sceneNumber: 'Pickup',
          setDescription: 'Insert / pickup work',
          castSummary: '',
          dayNight: '',
          pageCount: '',
          locationNotes: '',
        },
      ],
    },
  },
  {
    id: 'table-read',
    title: 'Rehearsal / Table Read',
    description: 'A lightweight sheet for rehearsal, read-through, or blocking.',
    payload: {
      title: 'Rehearsal / Table Read Call Sheet',
      generalNotes: 'Confirm script pages, rehearsal goals, room access, and arrival expectations.',
      scenes: [
        {
          id: 'template-scene-read',
          sceneNumber: 'Read / Rehearsal',
          setDescription: 'Table read or rehearsal block',
          castSummary: '',
          dayNight: '',
          pageCount: '',
          locationNotes: '',
        },
      ],
      castCalls: [
        {
          id: 'template-cast-read',
          castName: '',
          roleName: 'Cast',
          email: '',
          callTime: '',
          notes: 'Bring script and notes',
        },
      ],
    },
  },
]

function CallSheetNewPage() {
  const navigate = useNavigate()
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async (template: TemplateOption) => {
    try {
      setCreatingTemplateId(template.id)
      setError(null)
      const draft = await createCallSheet(template.payload)
      navigate(`/callsheets/${draft.id}/edit`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create call sheet')
    } finally {
      setCreatingTemplateId(null)
    }
  }

  return (
    <div className="vw-page-wrap">
      <section className="vw-section-card vw-dashboard-hero">
        <h1 className="vw-page-title">Start a Call Sheet</h1>
        <p className="vw-page-note">
          Choose a practical starting point, then finish the day in the editor.
        </p>
      </section>

      {error ? <p className="vw-inline-error">{error}</p> : null}

      <section className="template-grid">
        {templateOptions.map((template) => {
          const creating = creatingTemplateId === template.id

          return (
            <article key={template.id} className="vw-section-card vw-template-card">
              <h2 className="vw-card-title">{template.title}</h2>
              <p className="vw-card-copy">{template.description}</p>
              <div className="vw-actions-row">
                <button className="vw-btn vw-btn-primary" type="button" onClick={() => handleCreate(template)} disabled={creatingTemplateId !== null}>
                  {creating ? 'Creating…' : 'Use Template'}
                </button>
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}

export default CallSheetNewPage
