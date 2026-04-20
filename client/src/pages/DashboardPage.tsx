import { Link } from 'react-router-dom'

function DashboardPage() {
  return (
    <div className="vw-page-wrap">
      <section className="vw-section-card">
        <p className="vw-kicker">Production Desk</p>
        <h1 className="vw-page-title">Production Workspace</h1>
        <p className="vw-page-note">
          Internal production document workspace for call sheets, shot lists, and related set paperwork.
        </p>
      </section>

      <section className="vw-dashboard-grid">
        <article className="vw-section-card vw-module-card">
          <div className="vw-module-header">
            <div>
              <p className="vw-kicker">Documents</p>
              <h2 className="vw-card-title">Call Sheets</h2>
            </div>
            <Link className="vw-btn vw-btn-primary" to="/callsheets/new">
              New
            </Link>
          </div>

          <p className="vw-card-copy">
            Build, edit, preview, and export production call sheets.
          </p>

          <div className="vw-list-block">
            <div className="vw-list-row">
              <div>
                <div className="vw-list-title">Test Shoot Call Sheet</div>
                <div className="vw-list-meta">Sunday, April 19, 2026</div>
              </div>
              <Link className="vw-inline-link" to="/callsheets/draft-test-shoot/edit">
                Open
              </Link>
            </div>
          </div>
        </article>

        <article className="vw-section-card vw-module-card">
          <div className="vw-module-header">
            <div>
              <p className="vw-kicker">Planning</p>
              <h2 className="vw-card-title">Shot Lists</h2>
            </div>
            <button className="vw-btn" type="button">
              Soon
            </button>
          </div>

          <p className="vw-card-copy">
            Shot planning and coverage organization will live here next.
          </p>

          <div className="vw-empty-block">
            Shot list workspace not added yet.
          </div>
        </article>
      </section>

      <section className="vw-dashboard-grid vw-dashboard-grid-secondary">
        <article className="vw-section-card vw-mini-card">
          <p className="vw-kicker">Library</p>
          <h2 className="vw-card-title">Contacts</h2>
          <p className="vw-card-copy">
            Saved cast, crew, emergency contacts, and department references later.
          </p>
        </article>

        <article className="vw-section-card vw-mini-card">
          <p className="vw-kicker">Library</p>
          <h2 className="vw-card-title">Locations</h2>
          <p className="vw-card-copy">
            Main set addresses, hospitals, parking notes, and location packets later.
          </p>
        </article>
      </section>
    </div>
  )
}

export default DashboardPage
