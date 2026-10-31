// Dev-server fixture. Not imported by App or included in its production bundle.
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import DatePicker from '../../src/components/whiteout/DatePicker'
import { ToastProvider, useToast } from '../../src/components/whiteout/Feedback'
import { Button } from '../../src/components/whiteout/Button'
import '../../src/App.css'
import '../../src/styles/whiteout.css'
import '../../src/styles/shotlists.css'
function Controls() {
  const [date, setDate] = useState('2026-11-03'),
    notify = useToast()
  return (
    <main
      className="pd-ui"
      style={{
        minHeight: '100vh',
        background: '#080b12',
        padding: '64px 32px',
      }}
    >
      <div style={{ maxWidth: 400, margin: '0 auto' }}>
        <p style={{ color: '#91a8bd', fontSize: 11 }}>LOCAL UI FIXTURE</p>
        <h1 style={{ font: "400 38px 'Crimson Text',serif", marginBottom: 32 }}>
          Production date
        </h1>
        <DatePicker label="Production date" value={date} onChange={setDate} />
        <output
          style={{
            display: 'block',
            color: '#91a8bd',
            fontSize: 12,
            marginTop: 18,
          }}
        >
          {date || 'No date selected'}
        </output>
        <div style={{ display: 'flex', gap: 10, marginTop: 45 }}>
          <Button
            onClick={() =>
              void notify.promise(
                new Promise((resolve) => setTimeout(resolve, 1600)),
                {
                  pending: 'Importing reviewed shots…',
                  success: '8 shots imported into 3 scenes.',
                  error: 'Import failed.',
                },
              )
            }
          >
            Success transition
          </Button>
          <Button
            onClick={() =>
              void notify
                .promise(
                  new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('fixture')), 1600),
                  ),
                  {
                    pending: 'Saving changes…',
                    success: 'Saved.',
                    error: 'Connection interrupted. Changes retained.',
                  },
                )
                .catch(() => {})
            }
          >
            Error transition
          </Button>
        </div>
      </div>
    </main>
  )
}
createRoot(document.getElementById('root')!).render(
  <ToastProvider>
    <Controls />
  </ToastProvider>,
)
