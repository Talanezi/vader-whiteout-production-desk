import { useState } from 'react'
import type * as Y from 'yjs'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import { Overlay } from '../whiteout/Overlay'
import { Button } from '../whiteout/Button'
import DrawCheckbox from '../whiteout/DrawCheckbox'
import Combobox from '../whiteout/Combobox'
import Menu from '../whiteout/Menu'
import CollaborativeText from '../shots/CollaborativeText'
import ShotChoice from '../shots/ShotChoice'
import { ErrorNotice } from '../whiteout/Feedback'
import {
  change,
  displayShot,
  hasShotNumberConflict,
  type ShotField,
} from '../../lib/shotDocument'
import {
  put,
  text,
  departments,
  type FlowEvent,
} from '../../lib/flow/model'
export default function EventInspector({
  doc,
  event,
  provider,
  undo,
  source,
  sourceDoc,
  listId,
  onClose,
  onRelink,
}: {
  doc: Y.Doc
  event: FlowEvent
  provider: HocuspocusProvider
  undo: Y.UndoManager
  user: { id: number; name: string }
  source?: Y.Map<unknown>
  sourceDoc?: Y.Doc
  listId: string
  zone: string
  initialTab: string
  onClose: () => void
  onRelink: () => void
}) {
  const [error, setError] = useState('')
  const label =
    source && sourceDoc
      ? displayShot(sourceDoc, source)
      : event.reference || event.description || 'Activity'
  return (
    <Overlay
      kind="drawer"
      title={label}
      onClose={onClose}
      className="flow-event-inspector"
    >
      <div className="flow-form">
        {error && <ErrorNotice>{error}</ErrorNotice>}
        {source &&
          sourceDoc &&
          hasShotNumberConflict(sourceDoc, source) && (
            <ErrorNotice>
              This shot code is shared by distinct source records. Resolve
              the code in Shot Lists; both UUID links remain intact.
            </ErrorNotice>
          )}
        {event.type !== 'shot' && (
          <>
            <label>
              Category
              <Combobox
                label="Activity category"
                value={event.category || ''}
                options={[
                  ...new Set([
                    'Lunch',
                    'General Call',
                    'Safety Debrief',
                    'Rehearsal',
                    'Transport',
                    'Location Move',
                    'Equipment Strike',
                    'Wrap',
                    'Custom activity',
                    ...[...doc.getMap<Y.Map<unknown>>('events').values()]
                      .map((e) => String(e.get('category') || ''))
                      .filter(Boolean),
                  ]),
                ]}
                onChange={(category) =>
                  put(doc, 'events', event.id, { category })
                }
              />
            </label>
            <label className="flow-check">
              <DrawCheckbox
                checked={event.type === 'milestone'}
                onChange={(e) =>
                  put(doc, 'events', event.id, {
                    type: e.target.checked ? 'milestone' : 'custom',
                    fixed: e.target.checked,
                  })
                }
              />
              Shared milestone
            </label>
          </>
        )}
        <label>
          Current Action
          <CollaborativeText
            text={text(doc, 'events', event.id, 'description')}
            provider={provider}
            undo={undo}
            label="Current Action"
          />
        </label>
        <label>
          Production notes
          <CollaborativeText
            text={text(doc, 'events', event.id, 'notes')}
            provider={provider}
            undo={undo}
            label="Event notes"
          />
        </label>
        {event.type === 'department' && (
          <label>
            Department
            <Menu
              label={
                departments(doc).find(
                  (d) =>
                    d.id ===
                    doc
                      .getMap<Y.Map<unknown>>('events')
                      .get(event.id)
                      ?.get('departmentId'),
                )?.name || 'Choose department'
              }
              value={String(
                doc
                  .getMap<Y.Map<unknown>>('events')
                  .get(event.id)
                  ?.get('departmentId') || '',
              )}
              onChange={(departmentId) =>
                put(doc, 'events', event.id, { departmentId })
              }
              items={departments(doc).map((d) => ({
                value: d.id,
                label: d.name,
              }))}
            />
          </label>
        )}
        {event.type === 'shot' &&
          (!source ||
            Boolean(source.get('deleted')) ||
            Boolean(source.get('deletedAt'))) && (
            <Button onClick={onRelink}>Relink shot</Button>
          )}
        {source && sourceDoc && !source.get('deleted') && (
          <>
            <h3>Shot List</h3>
            {(['subject', 'camera', 'framing', 'lens'] as ShotField[]).map(
              (field) => (
                <label key={field}>
                  {field}
                  <ShotChoice
                    label={field}
                    field={field}
                    value={String(source.get(field) || '')}
                    doc={sourceDoc}
                    onChange={(value) => {
                      try {
                        change(sourceDoc, source, field, value)
                      } catch (e) {
                        setError((e as Error).message)
                      }
                    }}
                  />
                </label>
              ),
            )}
            <a
              className="pd-button"
              href={'#/shotlists/' + listId + '?shot=' + event.shotId}
              target="_blank"
              rel="noopener"
            >
              Open in Shot List
            </a>
          </>
        )}
      </div>
    </Overlay>
  )
}
