import { useState } from 'react'
import { Overlay } from '../whiteout/Overlay'
import { Button } from '../whiteout/Button'
import DrawCheckbox from '../whiteout/DrawCheckbox'
import { ErrorNotice } from '../whiteout/Feedback'
import ClockPicker from './ClockPicker'
import { parseDuration, type FlowEvent } from '../../lib/flow/model'
export default function TimeEditor({
  event,
  inherited,
  suggestedDuration,
  onSave,
  onSharedDuration,
  onClose,
}: {
  suggestedDuration?: number
  event: FlowEvent
  zone: string
  date: string
  inherited: number | null
  onSave: (v: Partial<FlowEvent>) => void
  onSharedDuration?: (v: number | null) => Promise<void>
  onClose: () => void
}) {
  const [start, setStart] = useState<number | null>(event.minute ?? null),
    [minutes, setMinutes] = useState(
      String(suggestedDuration ?? event.allottedMinutes ?? event.duration ?? ''),
    ),
    [editEstimate,setEditEstimate]=useState(false),
    [sourceMinutes,setSourceMinutes]=useState(String(inherited??'')),
    [fixed, setFixed] = useState(event.fixed),
    [sequence, setSequence] = useState(event.timing === 'sequence'),
    [error, setError] = useState(''),
    [clockValid, setClockValid] = useState(true),
    [busy, setBusy] = useState(false)
  async function save() {
    setBusy(true)
    try {
      const n = parseDuration(minutes)
      if (event.type === 'shot' && editEstimate && parseDuration(sourceMinutes) !== inherited) {
        if (!onSharedDuration)
          throw Error(
            'Reconnect the Shot List to update its shared estimate.',
          )
        await onSharedDuration(parseDuration(sourceMinutes))
      }
      onSave({
        clockStart: sequence ? null : start,
        timing: sequence
          ? 'sequence'
          : start == null
          ? 'unscheduled'
          : 'anchor',
        ...(event.type==='shot'?{allottedMinutes:n,duration:null}:{duration:n}),
        fixed,
      })
      onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Overlay
      title={event.label || event.description || 'Activity timing'}
      onClose={onClose}
      className="flow-time-dialog"
      footer={
        <Button
          variant="primary"
          disabled={!clockValid}
          icon="check"
          state={busy ? 'pending' : 'idle'}
          onClick={() => void save()}
        >
          Apply timing
        </Button>
      }
    >
      <div className="flow-form">
        <ClockPicker
          onValidityChange={setClockValid}
          label="Start time"
          value={start}
          onChange={(v) => {
            setStart(v)
            setSequence(false)
          }}
        />
        {event.type !== 'department' && (
          <label className="flow-check">
            <DrawCheckbox
              checked={sequence}
              onChange={(e) => {
                setSequence(e.target.checked)
                if (e.target.checked) setFixed(false)
              }}
            />
            Continue after the previous activity
          </label>
        )}
        {event.type==='shot'&&<div className="flow-estimate-readout"><span>DP estimate <strong>{inherited==null?'Unknown':inherited+' min'}</strong></span><Button icon="edit" onClick={()=>setEditEstimate(v=>!v)}>Edit DP estimate</Button></div>}
        {editEstimate&&<label>Shared DP estimate · min<input aria-label="DP estimate" value={sourceMinutes} onChange={e=>setSourceMinutes(e.target.value)} placeholder="Unknown"/></label>}
        <label>{event.type==='shot'?'AD allotted · min':'Duration · min'}<input aria-label="Shooting duration" value={minutes} placeholder={event.type==='shot'?'Use DP estimate':'Unknown'} onChange={e=>setMinutes(e.target.value)}/></label>
        <label className="flow-check">
          <DrawCheckbox
            checked={fixed}
            onChange={(e) => {
              setFixed(e.target.checked)
              if (e.target.checked) setSequence(false)
            }}
          />
          Keep this time fixed
        </label>
        {error && <ErrorNotice>{error}</ErrorNotice>}
      </div>
    </Overlay>
  )
}
