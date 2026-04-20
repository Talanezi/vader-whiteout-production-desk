import { NavLink } from 'react-router-dom'

const sections = [
  'Overview',
  'Header Cards',
  'Scenes',
  'Cast Calls',
  'Crew Calls',
  'Notes / Publish',
]

function EditorSidebar() {
  return (
    <aside className="editor-sidebar panel">
      <p className="kicker">Call Sheet Builder</p>
      <h2 className="sidebar-title">Sections</h2>

      <div className="sidebar-list">
        {sections.map((section, index) => (
          <NavLink
            key={section}
            to="#"
            className={({ isActive }) =>
              `sidebar-item ${index === 0 || isActive ? 'is-active' : ''}`
            }
          >
            <span className="sidebar-index">{String(index + 1).padStart(2, '0')}</span>
            <span>{section}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  )
}

export default EditorSidebar
