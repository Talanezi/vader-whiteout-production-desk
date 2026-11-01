// Isolated Vite QA fixture; not imported by the application or built for release.
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import DrawCheckbox from '../../src/components/whiteout/DrawCheckbox'
import '../../src/App.css'
import '../../src/styles/whiteout.css'
import '../../src/styles/shotlists.css'
function States() {
  const [checked, setChecked] = useState(false)
  return (
    <main
      className="pd-ui"
      style={{
        padding: 40,
        minHeight: '100vh',
        background: '#080b12',
        color: '#eef6fc',
      }}
    >
      <h1>Shot List checkboxes</h1>
      <div style={{ display: 'grid', gap: 20, marginTop: 30 }}>
        <label>
          <DrawCheckbox
            aria-label="Unchecked"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />{' '}
          Unchecked / keyboard
        </label>
        <label>
          <DrawCheckbox aria-label="Checked" checked readOnly /> Checked
        </label>
        <label>
          <DrawCheckbox
            aria-label="Mixed"
            indeterminate
            checked={false}
            readOnly
          />{' '}
          Mixed
        </label>
        <label>
          <DrawCheckbox aria-label="Disabled" disabled checked readOnly />{' '}
          Disabled
        </label>
      </div>
    </main>
  )
}
createRoot(document.getElementById('root')!).render(<States />)
