import { useState } from 'react'
import { Overlay } from '../whiteout/Overlay'
import { Button } from '../whiteout/Button'
import DrawCheckbox from '../whiteout/DrawCheckbox'
import { ErrorNotice } from '../whiteout/Feedback'
import {
  localParts,
  localCandidates,
  parseDuration,
  type FlowEvent,
} from '../../lib/flow/model'
export default function TimeEditor({
  event,
  zone,
  date,
  inherited,
  onSave,
  onClose,
}: {
  event: FlowEvent
  zone: string
  date: string
  inherited: number | null
  onSave: (v: Partial<FlowEvent>) => void
  onClose: () => void
}) {
  const [start, setStart] = useState(
      event.start ? localParts(event.start, zone) : date ? date + ' ' : '',
    ),
    [minutes, setMinutes] = useState(
      event.duration == null ? '' : String(event.duration),
    ),
    [fixed, setFixed] = useState(event.fixed),
    [error, setError] = useState(''),
    [fold, setFold] = useState<string[]>([]),
    [choice, setChoice] = useState('')
  function save() {
    try {
      const candidates = start.trim() ? localCandidates(start.trim(), zone) : []
      if (start.trim() && !candidates.length)
        throw Error(
          'This local time does not exist because of a daylight-saving transition. Choose another time.',
        )
      if (candidates.length > 1 && !candidates.includes(choice)) {
        setFold(candidates)
        throw Error(
          'This local time occurs twice. Choose the intended UTC offset.',
        )
      }
      onSave({
        start: candidates.length ? choice || candidates[0] : null,
        duration: parseDuration(minutes),
        fixed,
      })
      onClose()
    } catch (e) {
      setError((e as Error).message)
    }
  }
  return (
    <Overlay
      title="Event timing"
      onClose={onClose}
      className="flow-time-dialog"
      footer={
        <Button variant="primary" icon="check" onClick={save}>
          Apply timing
        </Button>
      }
    >
      <div className="flow-form">
        <label>
          Planned start · {zone}
          <input
            data-initial-focus
            placeholder="YYYY-MM-DD HH:mm"
            value={start}
            onChange={(e) => {
              setStart(e.target.value)
              setFold([])
              setChoice('')
            }}
          />
        </label>
        <p className="flow-muted">
          Use the next calendar date for work after midnight. Leave blank for an
          unscheduled event.
        </p>
        <label>
          Duration
          <input
            value={minutes}
            placeholder={
              inherited != null
                ? `${inherited} min · inherited`
                : 'Unknown · e.g. 1h 20m'
            }
            onChange={(e) => setMinutes(e.target.value)}
          />
        </label>
        <label className="flow-check">
          <DrawCheckbox
            checked={fixed}
            onChange={(e) => setFixed(e.target.checked)}
          />
          Fixed time · keep anchored when shifting
        </label>
        {fold.map((v) => (
          <label className="flow-check" key={v}>
            <input
              type="radio"
              name="offset"
              checked={choice === v}
              onChange={() => setChoice(v)}
            />
            {v}
          </label>
        ))}
        {error && <ErrorNotice>{error}</ErrorNotice>}
      </div>
    </Overlay>
  )
}
