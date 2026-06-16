import type { CallSheetStatus } from '../data/mockCallSheet'
import { callSheetStatusLabels, callSheetStatuses } from '../data/mockCallSheet'

type SidebarSection = {
  key: string
  label: string
  icon: string
}

type Props = {
  activeSection: string
  sections: SidebarSection[]
  status: CallSheetStatus
  workflowActionLabel: string
  workflowActionNextStatus: string
  onSectionChange: (section: string) => void
  onWorkflowAction: () => void
  onStatusChange: (status: CallSheetStatus) => void
}

function EditorSidebar({
  activeSection,
  sections,
  status,
  workflowActionLabel,
  workflowActionNextStatus,
  onSectionChange,
  onWorkflowAction,
  onStatusChange,
}: Props) {
  return (
    <aside className="editor-sidebar panel">
      <p className="kicker">Call Sheet Builder</p>
      <h2 className="sidebar-title">Workflow</h2>

      <div className="workflow-action-panel">
        <p className="workflow-action-copy">Next step</p>
        <button className="vw-btn vw-btn-primary workflow-action-btn" type="button" onClick={onWorkflowAction}>
          {workflowActionLabel}
        </button>
        <p className="workflow-action-note">Moves this sheet to {workflowActionNextStatus}.</p>
      </div>

      <label className="status-control status-control-compact">
        <span>Manual status</span>
        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value as CallSheetStatus)}
        >
          {callSheetStatuses.map((option) => (
            <option key={option} value={option}>
              {callSheetStatusLabels[option]}
            </option>
          ))}
        </select>
      </label>

      <div className="sidebar-list">
        {sections.map((section, index) => (
          <button
            key={section.key}
            type="button"
            className={`sidebar-item ${activeSection === section.key ? 'is-active' : ''}`}
            onClick={() => onSectionChange(section.key)}
          >
            <span className="sidebar-index">{String(index + 1).padStart(2, '0')}</span>
            <span className="section-switcher-icon" aria-hidden="true">{section.icon}</span>
            <span>{section.label}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}

export default EditorSidebar
