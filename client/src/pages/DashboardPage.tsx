import { Link } from 'react-router-dom'

function DashboardPage() {
  return (
    <div className="page-frame">
      <section className="hero-banner panel">
        <div className="hero-copy">
          <p className="kicker">AD Console</p>
          <h1 className="serif-display">Assistant Director workspace</h1>
          <p className="hero-text">
            Call sheet creation comes first, but this app is being built as a broader
            production-operations tool for document workflows, revisions, and day-of control.
          </p>
        </div>

        <div className="hero-cta">
          <Link className="primary-pill" to="/callsheets/new">
            New Call Sheet
          </Link>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-card panel">
          <p className="kicker">Phase One</p>
          <h2>Call sheet builder</h2>
          <p>
            Structured sections for header cards, scenes, cast calls, crew calls,
            notes, revisions, and PDF export.
          </p>
        </article>

        <article className="dashboard-card panel">
          <p className="kicker">Planned</p>
          <h2>Revision workflow</h2>
          <p>
            Save drafts, duplicate previous days, preserve version history, and
            track published outputs cleanly.
          </p>
        </article>

        <article className="dashboard-card panel">
          <p className="kicker">Planned</p>
          <h2>On-set tools</h2>
          <p>
            Check-ins, departmental tracking, utility references, and printable
            operations docs later in the same product.
          </p>
        </article>
      </section>
    </div>
  )
}

export default DashboardPage
