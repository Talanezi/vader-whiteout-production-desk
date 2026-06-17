import type { CallSheetDraft } from '../data/mockCallSheet'

type Props = {
  draft: CallSheetDraft
}

function CallSheetPreview({ draft }: Props) {
  const crewMessage = draft.distributionMessage || draft.emailIntro

  return (
    <section className="preview-wrap">
      <div className="pdf-preview panel">
        <div className="pdf-page">
          <div className="pdf-header">
            <div>
              <div className="pdf-brand">VADER: WHITEOUT</div>
              <div className="pdf-doc-title">{(draft.title || 'UNTITLED CALL SHEET').toUpperCase()}</div>
              <div className="pdf-subline">
                {draft.productionDate ? `${draft.productionDate} • ` : ''}Primary Crew Call: {draft.primaryCallTime || '—'}
              </div>
            </div>
          </div>

          <div className="pdf-card-grid">
            <div className="pdf-card">
              <div className="pdf-card-title">Emergency Contact</div>
              {draft.emergencyContacts.map((contact) => (
                <div key={contact.id} className="pdf-line">
                  <span>{contact.label || 'Contact'}</span>
                  <span>{[contact.name, contact.phone].filter(Boolean).join(' / ') || '—'}</span>
                </div>
              ))}
            </div>

            <div className="pdf-card center">
              <div className="pdf-card-title">Call</div>
              <div className="pdf-call-big">{draft.primaryCallTime || '—'}</div>
              <div className="pdf-date-small">{draft.productionDate || 'No date set'}</div>
            </div>

            <div className="pdf-card">
              <div className="pdf-card-title">Weather</div>
              <div className="pdf-stack-line">At call: {draft.weatherTempAtCall || '—'}</div>
              <div className="pdf-stack-line">High: {draft.weatherHigh || '—'}</div>
              <div className="pdf-stack-line">Low: {draft.weatherLow || '—'}</div>
              <div className="pdf-stack-line">{draft.weatherSummary || '—'}</div>
            </div>

            <div className="pdf-card">
              <div className="pdf-card-title">Main Set</div>
              <div className="pdf-stack-line strong">{draft.mainSetName || '—'}</div>
              {draft.mainSetAddress.map((line) => (
                <div key={line} className="pdf-stack-line">{line}</div>
              ))}
            </div>

            <div className="pdf-card">
              <div className="pdf-card-title">Nearest Hospital</div>
              <div className="pdf-stack-line strong">{draft.nearestHospitalName || '—'}</div>
              {draft.nearestHospitalAddress.map((line) => (
                <div key={line} className="pdf-stack-line">{line}</div>
              ))}
            </div>
          </div>

          {draft.generalNotes ? (
            <div className="pdf-notes-block">
              <div className="pdf-section-title">General Notes</div>
              <div className="pdf-notes-copy">{draft.generalNotes}</div>
            </div>
          ) : null}

          {draft.distributionNotes ? (
            <div className="pdf-notes-block">
              <div className="pdf-section-title">Revision / Distribution Notes</div>
              <div className="pdf-notes-copy">{draft.distributionNotes}</div>
            </div>
          ) : null}

          {crewMessage ? (
            <div className="pdf-notes-block">
              <div className="pdf-section-title">Message to Crew</div>
              <div className="pdf-notes-copy">{crewMessage}</div>
            </div>
          ) : null}

          <div className="pdf-table-block">
            <div className="pdf-section-title">Scenes / Set Breakdown</div>
            <table className="pdf-table">
              <thead>
                <tr>
                  <th>Scene</th>
                  <th>Set and Description</th>
                  <th>Cast</th>
                  <th>D/N</th>
                  <th>Pages</th>
                  <th>Location / Notes</th>
                </tr>
              </thead>
              <tbody>
                {draft.scenes.map((scene) => (
                  <tr key={scene.id}>
                    <td>{scene.sceneNumber}</td>
                    <td>{scene.setDescription}</td>
                    <td>{scene.castSummary}</td>
                    <td>{scene.dayNight}</td>
                    <td>{scene.pageCount}</td>
                    <td>{scene.locationNotes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pdf-table-block">
            <div className="pdf-section-title">Cast Calls</div>
            <table className="pdf-table">
              <thead>
                <tr>
                  <th>Cast</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Call</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {draft.castCalls.map((cast) => (
                  <tr key={cast.id}>
                    <td>{cast.castName}</td>
                    <td>{cast.roleName}</td>
                    <td>{cast.email}</td>
                    <td>{cast.callTime}</td>
                    <td>{cast.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pdf-table-block">
            <div className="pdf-section-title">Crew Calls</div>
            <table className="pdf-table">
              <thead>
                <tr>
                  <th>Department / Role</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Call</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {draft.crewCalls.map((crew) => (
                  <tr key={crew.id}>
                    <td>{crew.departmentRole}</td>
                    <td>{crew.crewName}</td>
                    <td>{crew.email}</td>
                    <td>{crew.callTime}</td>
                    <td>{crew.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CallSheetPreview
