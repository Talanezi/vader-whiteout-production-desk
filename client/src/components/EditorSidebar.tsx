const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'contacts', label: 'Emergency Contacts' },
  { id: 'weather', label: 'Weather' },
  { id: 'locations', label: 'Locations' },
  { id: 'scenes', label: 'Scenes' },
  { id: 'cast', label: 'Cast Calls' },
  { id: 'crew', label: 'Crew Calls' },
]

function EditorSidebar() {
  return (
    <aside className="editor-sidebar panel">
      <p className="kicker">Call Sheet Builder</p>
      <h2 className="sidebar-title">Sections</h2>

      <div className="sidebar-list">
        {sections.map((section, index) => (
          <a key={section.id} href={`#${section.id}`} className={`sidebar-item ${index === 0 ? 'is-active' : ''}`}>
            <span className="sidebar-index">{String(index + 1).padStart(2, '0')}</span>
            <span>{section.label}</span>
          </a>
        ))}
      </div>
    </aside>
  )
}

export default EditorSidebar
