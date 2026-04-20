import { Link } from 'react-router-dom'

function CallSheetNewPage() {
  return (
    <div className="page-frame">
      <section className="page-header">
        <p className="kicker">Phase One</p>
        <h1 className="serif-display">Create a new call sheet</h1>
        <p className="page-subtext">
          This will become the quick-starting entry point for ADs. For now, use the
          editor shell to shape the workflow and preview layout.
        </p>
      </section>

      <section className="new-sheet-grid">
        <article className="panel new-sheet-card">
          <h2>Blank production day</h2>
          <p>Start from a clean draft with empty structured sections.</p>
          <Link className="primary-pill" to="/callsheets/draft-test-shoot/edit">
            Open builder shell
          </Link>
        </article>

        <article className="panel new-sheet-card">
          <h2>Duplicate previous format</h2>
          <p>Later this will duplicate a recent day, preserving structure and contacts.</p>
          <button className="secondary-pill" type="button">
            Coming soon
          </button>
        </article>
      </section>
    </div>
  )
}

export default CallSheetNewPage
