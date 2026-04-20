import { Link } from 'react-router-dom'

function CallSheetNewPage() {
  return (
    <div className="vw-page-wrap">
      <section className="vw-section-card">
        <p className="vw-kicker">Phase One</p>
        <h1 className="vw-page-title">Create a New Call Sheet</h1>
        <p className="vw-page-note">
          This will become the quick-starting entry point for ADs. For now, use the editor
          shell to shape the workflow and preview layout.
        </p>
      </section>

      <section className="vw-card-grid vw-card-grid-two">
        <article className="vw-section-card vw-mini-card">
          <h2 className="vw-card-title">Blank production day</h2>
          <p className="vw-card-copy">
            Start from a clean draft with empty structured sections.
          </p>
          <div className="vw-actions-row">
            <Link className="vw-btn vw-btn-primary" to="/callsheets/draft-test-shoot/edit">
              Open builder shell
            </Link>
          </div>
        </article>

        <article className="vw-section-card vw-mini-card">
          <h2 className="vw-card-title">Duplicate previous format</h2>
          <p className="vw-card-copy">
            Later this will duplicate a recent day, preserving structure and contacts.
          </p>
          <div className="vw-actions-row">
            <button className="vw-btn" type="button">
              Coming soon
            </button>
          </div>
        </article>
      </section>
    </div>
  )
}

export default CallSheetNewPage
