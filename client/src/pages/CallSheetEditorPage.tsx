import EditorSidebar from '../components/EditorSidebar'
import CallSheetPreview from '../components/CallSheetPreview'
import { mockCallSheet } from '../data/mockCallSheet'

function CallSheetEditorPage() {
  return (
    <div className="editor-layout">
      <EditorSidebar />

      <section className="editor-main">
        <div className="editor-header panel">
          <div>
            <p className="kicker">Editing Draft</p>
            <h1 className="editor-title">{mockCallSheet.title}</h1>
            <p className="editor-subtext">
              {mockCallSheet.productionDate} • Primary Crew Call {mockCallSheet.primaryCallTime}
            </p>
          </div>

          <div className="editor-actions">
            <button className="secondary-pill" type="button">Save Draft</button>
            <button className="primary-pill" type="button">Generate PDF</button>
          </div>
        </div>

        <div className="builder-grid">
          <section className="builder-form panel">
            <div className="form-section">
              <p className="kicker">Overview</p>
              <h2>Production day basics</h2>

              <div className="field-grid">
                <label className="field">
                  <span>Document title</span>
                  <input defaultValue={mockCallSheet.title} />
                </label>

                <label className="field">
                  <span>Production date</span>
                  <input defaultValue={mockCallSheet.productionDate} />
                </label>

                <label className="field">
                  <span>Primary crew call</span>
                  <input defaultValue={mockCallSheet.primaryCallTime} />
                </label>

                <label className="field">
                  <span>Main set</span>
                  <input defaultValue={mockCallSheet.mainSetName} />
                </label>
              </div>
            </div>

            <div className="form-section">
              <p className="kicker">Next</p>
              <h2>Builder sections</h2>
              <div className="section-chip-row">
                <span className="section-chip is-active">Header Cards</span>
                <span className="section-chip">Scenes</span>
                <span className="section-chip">Cast Calls</span>
                <span className="section-chip">Crew Calls</span>
                <span className="section-chip">Notes / Publish</span>
              </div>
              <p className="muted-copy">
                Next patch will replace this shell with real row editors and autosaved state.
              </p>
            </div>
          </section>

          <CallSheetPreview draft={mockCallSheet} />
        </div>
      </section>
    </div>
  )
}

export default CallSheetEditorPage
