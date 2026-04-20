function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Vader Whiteout Team</p>
          <h1>AD Console</h1>
          <p className="subtext">Assistant Director operations workspace</p>
        </div>

        <div className="topbar-badge">Phase One • Call Sheets</div>
      </header>

      <main className="layout">
        <section className="panel hero-panel">
          <p className="panel-label">Dashboard</p>
          <h2>Call sheet builder is the first tool.</h2>
          <p>
            This app is being built as a broader AD workspace for printable
            production documents, revisions, and day-of operations.
          </p>

          <div className="hero-actions">
            <button className="primary-btn">New Call Sheet</button>
            <button className="secondary-btn">Open Recent</button>
          </div>
        </section>

        <section className="panel grid-panel">
          <div className="mini-card">
            <p className="panel-label">Planned</p>
            <h3>Builder</h3>
            <p>Structured forms for header cards, scenes, cast, crew, and notes.</p>
          </div>

          <div className="mini-card">
            <p className="panel-label">Planned</p>
            <h3>Preview</h3>
            <p>Fast document preview while editing, without exposing raw LaTeX.</p>
          </div>

          <div className="mini-card">
            <p className="panel-label">Planned</p>
            <h3>Export</h3>
            <p>Server-side PDF generation matching the production call sheet template.</p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
