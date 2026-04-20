import { Link } from 'react-router-dom'

function DashboardPage() {
  return (
    <div className="vw-page-wrap">
      <section className="vw-section-card">
        <p className="vw-kicker">AD Console</p>
        <h1 className="vw-page-title">Assistant Director Workspace</h1>
        <p className="vw-page-note">
          Call sheet creation comes first, but this app is being built as a broader
          production-operations tool for document workflows, revisions, and day-of control.
        </p>

        <div className="vw-actions-row">
          <Link className="vw-btn vw-btn-primary" to="/callsheets/new">
            New Call Sheet
          </Link>
        </div>
      </section>

      <section className="vw-card-grid">
        <article className="vw-section-card vw-mini-card">
          <p className="vw-kicker">Phase One</p>
          <h2 className="vw-card-title">Call sheet builder</h2>
          <p className="vw-card-copy">
            Structured sections for header cards, scenes, cast calls, crew calls, notes,
            revisions, and PDF export.
          </p>
        </article>

        <article className="vw-section-card vw-mini-card">
          <p className="vw-kicker">Planned</p>
          <h2 className="vw-card-title">Revision workflow</h2>
          <p className="vw-card-copy">
            Save drafts, duplicate previous days, preserve version history, and track
            published outputs cleanly.
          </p>
        </article>

        <article className="vw-section-card vw-mini-card">
          <p className="vw-kicker">Planned</p>
          <h2 className="vw-card-title">On-set tools</h2>
          <p className="vw-card-copy">
            Check-ins, departmental tracking, utility references, and printable operations
            docs later in the same product.
          </p>
        </article>
      </section>
    </div>
  )
}

export default DashboardPage
