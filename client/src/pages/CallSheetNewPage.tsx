import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CallSheetDraft } from '../data/mockCallSheet'
import { createCallSheet, getAuthToken } from '../lib/api'
import { Link } from 'react-router-dom'
import Icon from '../components/whiteout/Icon'
import { ErrorNotice, SessionState } from '../components/whiteout/Feedback'
import { PageHeader } from '../components/whiteout/Workspace'

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
      generalNotes:
        'Confirm test goals, equipment needs, and review plan before crew call.',
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
      generalNotes:
        'Confirm studio access, load-in, sound restrictions, and wrap procedures.',
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
      generalNotes:
        'Confirm parking, holding, restrooms, company moves, and location contact.',
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
      generalNotes:
        'Prioritize required pickups, continuity references, and minimum crew needs.',
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
    description:
      'A lightweight sheet for rehearsal, read-through, or blocking.',
    payload: {
      title: 'Rehearsal / Table Read Call Sheet',
      generalNotes:
        'Confirm script pages, rehearsal goals, room access, and arrival expectations.',
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
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async (template: TemplateOption) => {
    try {
      setCreatingTemplateId(template.id)
      setError(null)
      const draft = await createCallSheet(template.payload)
      navigate(`/callsheets/${draft.id}/edit`)
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to create call sheet',
      )
    } finally {
      setCreatingTemplateId(null)
    }
  }

  return (
    <div className="pd-page">
      <Link className="pd-back" to="/">
        <Icon name="back" />
        Call sheets
      </Link>
      {getAuthToken() && error !== 'UNAUTHORIZED' && (
        <PageHeader title="New call sheet" />
      )}
      {!getAuthToken() || error === 'UNAUTHORIZED' ? (
        <SessionState />
      ) : (
        <>
          {error && <ErrorNotice>{error}</ErrorNotice>}
          <div className="pd-templates">
            {templateOptions.map((template, index) => (
              <button
                key={template.id}
                type="button"
                className={`pd-template ${creatingTemplateId === template.id ? 'is-pending' : ''}`}
                disabled={creatingTemplateId !== null}
                aria-busy={creatingTemplateId === template.id || undefined}
                onClick={() => void handleCreate(template)}
              >
                <div className="pd-template-drawing" aria-hidden="true">
                  <svg viewBox="0 0 160 100" fill="none">
                    <path d="M44 15h66v76H44z M48 11h66v76 M52 7h66v76" />
                    <path
                      className="pd-template-rules"
                      d="M54 31h46 M54 42h46 M54 53h46 M54 64h46 M54 75h46 M69 42v33"
                    />
                    {index > 0 && (
                      <path
                        className="pd-template-accent"
                        d={`M54 ${42 + index * 5}h${20 + index * 3}`}
                      />
                    )}
                  </svg>
                </div>
                <h2>{template.title}</h2>
                <p>{template.description}</p>
                <span className="pd-template-action">
                  {creatingTemplateId === template.id ? (
                    <>
                      <span className="pd-spinner" />
                      Creating…
                    </>
                  ) : (
                    <>
                      Use template
                      <Icon name="arrow" />
                    </>
                  )}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default CallSheetNewPage
