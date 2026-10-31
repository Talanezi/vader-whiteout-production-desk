import { useEffect, useMemo, useState } from 'react'
import { useBlocker } from 'react-router-dom'
import type { RosterCategory, RosterPerson } from '../data/mockCallSheet'
import { rosterCategories, rosterCategoryLabels } from '../data/mockCallSheet'
import {
  createRosterPerson,
  deleteRosterPerson,
  getAuthToken,
  listRosterPeople,
  updateRosterPerson,
} from '../lib/api'
import {
  emptyRosterForm,
  parseRosterLines,
  type RosterForm,
} from '../lib/rosterImport'
import { Button, type ActionState } from '../components/whiteout/Button'
import Icon from '../components/whiteout/Icon'
import Menu from '../components/whiteout/Menu'
import { Confirm, Overlay } from '../components/whiteout/Overlay'
import {
  EmptyState,
  ErrorNotice,
  LoadingRows,
  RetryButton,
  SessionState,
  useToast,
} from '../components/whiteout/Feedback'
import {
  PageHeader,
  SearchField,
  Status,
} from '../components/whiteout/Workspace'

const categories = rosterCategories.map((value) => ({
  value,
  label: rosterCategoryLabels[value],
}))
function RosterPage() {
  const token = getAuthToken(),
    notify = useToast()
  const [people, setPeople] = useState<RosterPerson[]>([]),
    [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState<string | null>(null),
    [attempt, setAttempt] = useState(0)
  const [search, setSearch] = useState(''),
    [category, setCategory] = useState<'all' | RosterCategory>('all')
  const [form, setForm] = useState<RosterForm>({ ...emptyRosterForm }),
    [baseline, setBaseline] = useState(JSON.stringify(emptyRosterForm)),
    [editingId, setEditingId] = useState<string | null>(null),
    [editorOpen, setEditorOpen] = useState(false)
  const [saveState, setSaveState] = useState<ActionState>('idle'),
    [formError, setFormError] = useState<string | null>(null),
    [discard, setDiscard] = useState(false)
  const [deleting, setDeleting] = useState<RosterPerson | null>(null),
    [deleteBusy, setDeleteBusy] = useState(false),
    [deleteError, setDeleteError] = useState<string | null>(null)
  const [toggling, setToggling] = useState<Record<string, boolean>>({}),
    [actionError, setActionError] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false),
    [paste, setPaste] = useState(''),
    [importState, setImportState] = useState<ActionState>('idle'),
    [importError, setImportError] = useState<string | null>(null),
    [progress, setProgress] = useState({ done: 0, total: 0 })
  const parsed = useMemo(() => parseRosterLines(paste), [paste])
  const dirty = JSON.stringify(form) !== baseline
  const hasDraft = (editorOpen && dirty) || !!paste.trim()
  const blocker = useBlocker(hasDraft || importState === 'pending')
  useEffect(() => {
    if (blocker.state === 'blocked' && !hasDraft && importState !== 'pending')
      blocker.proceed()
  }, [blocker, hasDraft, importState])
  useEffect(() => {
    let active = true
    if (!token) {
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError(null)
    listRosterPeople()
      .then((data) => {
        if (active) setPeople(data.items)
      })
      .catch((error) => {
        if (active)
          setLoadError(
            error instanceof Error
              ? error.message
              : 'Could not load the roster.',
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [token, attempt])
  useEffect(() => {
    if (!hasDraft && importState !== 'pending') return
    const prevent = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', prevent)
    return () => window.removeEventListener('beforeunload', prevent)
  }, [hasDraft, importState])
  const unauthorized = !token || loadError === 'UNAUTHORIZED'
  const filtered = people.filter(
    (person) =>
      (category === 'all' || person.category === category) &&
      [
        person.name,
        person.roleOrDepartment,
        person.email,
        person.phone,
        rosterCategoryLabels[person.category],
      ].some((value) =>
        (value || '').toLowerCase().includes(search.trim().toLowerCase()),
      ),
  )
  const clear = () => {
    setSearch('')
    setCategory('all')
  }
  const readableError = (error: unknown, fallback: string) =>
    error instanceof Error && error.message === 'UNAUTHORIZED'
      ? 'Your session has expired. Sign in again.'
      : error instanceof Error
        ? error.message
        : fallback
  function openEditor(person?: RosterPerson) {
    const next = person
      ? {
          name: person.name,
          category: person.category,
          roleOrDepartment: person.roleOrDepartment,
          email: person.email,
          phone: person.phone,
          notes: person.notes,
          active: person.active,
        }
      : { ...emptyRosterForm }
    setForm(next)
    setBaseline(JSON.stringify(next))
    setEditingId(person?.id || null)
    setFormError(null)
    setSaveState('idle')
    setEditorOpen(true)
  }
  function requestClose() {
    if (saveState === 'pending') return
    if (dirty) setDiscard(true)
    else setEditorOpen(false)
  }
  function change<K extends keyof RosterForm>(key: K, value: RosterForm[K]) {
    setForm((old) => ({ ...old, [key]: value }))
    setSaveState('idle')
    setFormError(null)
  }
  async function save() {
    if (!form.name.trim() || saveState === 'pending' || saveState === 'success')
      return
    setSaveState('pending')
    setFormError(null)
    try {
      const saved = editingId
        ? await updateRosterPerson(editingId, form)
        : await createRosterPerson(form)
      setPeople((old) =>
        editingId
          ? old.map((x) => (x.id === saved.id ? saved : x))
          : [saved, ...old],
      )
      const { id, ...next } = saved
      setForm(next)
      setBaseline(JSON.stringify(next))
      setEditingId(id)
      setSaveState('success')
      notify('Person saved to the roster.')
    } catch (error) {
      setFormError(readableError(error, 'Could not save this person.'))
      setSaveState('error')
    }
  }
  async function remove() {
    if (!deleting || deleteBusy) return
    setDeleteBusy(true)
    setDeleteError(null)
    try {
      await deleteRosterPerson(deleting.id)
      setPeople((old) => old.filter((x) => x.id !== deleting.id))
      setDeleting(null)
      notify('Person removed from the roster.')
    } catch (error) {
      setDeleteError(readableError(error, 'Could not delete this person.'))
    } finally {
      setDeleteBusy(false)
    }
  }
  async function toggle(person: RosterPerson) {
    if (toggling[person.id]) return
    setToggling((old) => ({ ...old, [person.id]: true }))
    setActionError(null)
    try {
      const saved = await updateRosterPerson(person.id, {
        active: !person.active,
      })
      setPeople((old) => old.map((x) => (x.id === saved.id ? saved : x)))
      notify(`${saved.name} marked ${saved.active ? 'active' : 'inactive'}.`)
    } catch (error) {
      setActionError(readableError(error, 'Could not update active state.'))
    } finally {
      setToggling((old) => {
        const next = { ...old }
        delete next[person.id]
        return next
      })
    }
  }
  async function importPeople() {
    if (!parsed.length || importState === 'pending') return
    const rows = [...parsed],
      failed: string[] = []
    let savedCount = 0
    setImportState('pending')
    setImportError(null)
    setProgress({ done: 0, total: rows.length })
    // Individual create requests, with each confirmed result reflected immediately.
    for (let i = 0; i < rows.length; i++) {
      try {
        const saved = await createRosterPerson(rows[i].person)
        setPeople((old) => [saved, ...old])
        savedCount++
      } catch {
        failed.push(rows[i].source)
      }
      setProgress({ done: i + 1, total: rows.length })
    }
    setPaste(failed.join('\n'))
    if (failed.length) {
      setImportState('error')
      setImportError(
        `${savedCount} saved; ${failed.length} could not be confirmed. Only the unconfirmed rows remain below. Check the directory before retrying to avoid duplicates.`,
      )
    } else {
      setImportState('success')
      notify(
        `${savedCount} ${savedCount === 1 ? 'person' : 'people'} imported.`,
      )
    }
  }
  return (
    <div className="pd-page">
      {!unauthorized && (
        <>
          <PageHeader title="Production roster">
            <Button
              icon="import"
              onClick={() => {
                setImportOpen(true)
                if (importState !== 'error') setImportState('idle')
              }}
              disabled={unauthorized}
            >
              Paste import
            </Button>
            <Button
              variant="primary"
              icon="plus"
              onClick={() => openEditor()}
              disabled={unauthorized}
            >
              Add person
            </Button>
          </PageHeader>
        </>
      )}
      {actionError && (
        <ErrorNotice onDismiss={() => setActionError(null)}>
          {actionError}
        </ErrorNotice>
      )}
      {unauthorized ? (
        <SessionState />
      ) : (
        <>
          <div className="pd-toolbar">
            <SearchField
              label="Search roster"
              value={search}
              onChange={setSearch}
              placeholder="Search name, role, email, or phone…"
            />
            <div className="pd-toolbar-options">
              <Menu
                label={
                  category === 'all'
                    ? 'All categories'
                    : rosterCategoryLabels[category]
                }
                icon="people"
                items={[
                  { value: 'all', label: 'All categories' },
                  ...categories,
                ]}
                value={category}
                onChange={(v) => setCategory(v as typeof category)}
              />
            </div>
          </div>
          {loading ? (
            <LoadingRows label="Loading production roster…" />
          ) : loadError ? (
            <EmptyState
              kind="error"
              title="The roster couldn’t be loaded"
              action={<RetryButton onClick={() => setAttempt((x) => x + 1)} />}
            >
              {loadError}
            </EmptyState>
          ) : !people.length ? (
            <EmptyState
              title="No people yet"
              action={
                <Button
                  variant="primary"
                  icon="plus"
                  onClick={() => openEditor()}
                >
                  Add your first person
                </Button>
              }
            ></EmptyState>
          ) : !filtered.length ? (
            <EmptyState
              kind="search"
              title="No people match this view"
              action={<Button onClick={clear}>Clear search and filters</Button>}
            ></EmptyState>
          ) : (
            <>
              <div className="pd-table-wrap">
                <table className="pd-table pd-roster">
                  <caption className="pd-sr-only">Production roster</caption>
                  <thead>
                    <tr>
                      <th scope="col">Person / department</th>
                      <th scope="col">Category</th>
                      <th scope="col">Contact</th>
                      <th scope="col">Active</th>
                      <th scope="col">
                        <span className="pd-sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((person) => (
                      <tr
                        key={person.id}
                        className={person.active ? '' : 'pd-row-inactive'}
                      >
                        <td className="pd-person-name">
                          <button
                            type="button"
                            className="pd-name-link"
                            onClick={() => openEditor(person)}
                          >
                            {person.name}
                          </button>
                          <small>
                            {person.roleOrDepartment || 'Role not set'}
                          </small>
                          {person.notes && (
                            <small className="pd-note-preview">
                              {person.notes}
                            </small>
                          )}
                        </td>
                        <td data-label="Category">
                          <span className="pd-category">
                            <Icon
                              name={
                                person.category === 'cast'
                                  ? 'people'
                                  : person.category === 'emergency'
                                    ? 'phone'
                                    : 'file'
                              }
                            />
                            {rosterCategoryLabels[person.category]}
                          </span>
                        </td>
                        <td data-label="Contact" className="pd-contact">
                          {person.email && (
                            <a href={`mailto:${person.email}`}>
                              <Icon name="mail" />
                              {person.email}
                            </a>
                          )}
                          {person.phone && (
                            <a href={`tel:${person.phone}`}>
                              <Icon name="phone" />
                              {person.phone}
                            </a>
                          )}
                          {!person.email && !person.phone && (
                            <span className="pd-muted">No contact details</span>
                          )}
                        </td>
                        <td data-label="Active">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={person.active}
                            aria-label={`${person.active ? 'Deactivate' : 'Activate'} ${person.name}`}
                            aria-busy={toggling[person.id] || undefined}
                            disabled={toggling[person.id]}
                            className="pd-switch-control"
                            onClick={() => void toggle(person)}
                          >
                            <span
                              className={`pd-switch ${person.active ? 'is-on' : ''}`}
                            >
                              <span />
                            </span>
                            <span>
                              {toggling[person.id]
                                ? 'Updating…'
                                : person.active
                                  ? 'Active'
                                  : 'Inactive'}
                            </span>
                          </button>
                        </td>
                        <td className="pd-row-actions">
                          <Menu
                            compact
                            label={`Actions for ${person.name}`}
                            icon="more"
                            disabled={toggling[person.id]}
                            items={[
                              {
                                value: 'edit',
                                label: 'Edit person',
                                icon: 'edit',
                                onSelect: () => openEditor(person),
                              },
                              {
                                value: 'active',
                                label: person.active
                                  ? 'Mark inactive'
                                  : 'Mark active',
                                icon: 'check',
                                onSelect: () => void toggle(person),
                              },
                              {
                                value: 'delete',
                                label: 'Delete person',
                                icon: 'trash',
                                danger: true,
                                onSelect: () => {
                                  setDeleteError(null)
                                  setDeleting(person)
                                },
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pd-list-footer">
                <span>
                  {filtered.length === people.length
                    ? `${people.length} people`
                    : `${filtered.length} of ${people.length} people`}
                </span>
                {(search || category !== 'all') && (
                  <Button variant="quiet" onClick={clear}>
                    Clear filters
                  </Button>
                )}
                <span>
                  {people.filter((x) => x.active).length} active in directory
                </span>
              </div>
            </>
          )}
        </>
      )}
      {editorOpen && (
        <Overlay
          kind="drawer"
          title={editingId ? 'Edit person' : 'Add person'}
          onClose={requestClose}
          busy={saveState === 'pending'}
          footer={
            <>
              <Button onClick={requestClose} disabled={saveState === 'pending'}>
                {saveState === 'success' ? 'Done' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                form="pd-person-form"
                variant="primary"
                icon="check"
                className="pd-save-button"
                state={saveState}
                disabled={!form.name.trim() || saveState === 'success'}
              >
                Save person
              </Button>
            </>
          }
        >
          <form
            id="pd-person-form"
            onSubmit={(event) => {
              event.preventDefault()
              void save()
            }}
          >
            <fieldset
              className="pd-form-fields"
              disabled={saveState === 'pending'}
            >
              <label className="pd-field" htmlFor="person-name">
                Name <span className="pd-field-hint">Required</span>
                <input
                  data-initial-focus
                  id="person-name"
                  autoComplete="name"
                  value={form.name}
                  required
                  aria-describedby={formError ? 'person-error' : undefined}
                  onChange={(e) => change('name', e.target.value)}
                />
              </label>
              <div className="pd-field">
                <span id="person-category-label">Category</span>
                <Menu
                  ariaLabel={`Category: ${rosterCategoryLabels[form.category]}`}
                  label={rosterCategoryLabels[form.category]}
                  icon="people"
                  items={categories}
                  value={form.category}
                  onChange={(v) => change('category', v as RosterCategory)}
                />
              </div>
              <label className="pd-field" htmlFor="person-role">
                Role / department
                <input
                  id="person-role"
                  value={form.roleOrDepartment}
                  onChange={(e) => change('roleOrDepartment', e.target.value)}
                  placeholder="e.g. Director of photography"
                />
              </label>
              <div className="pd-form-columns">
                <label className="pd-field" htmlFor="person-email">
                  Email
                  <input
                    id="person-email"
                    inputMode="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => change('email', e.target.value)}
                    placeholder="name@example.com"
                  />
                </label>
                <label className="pd-field" htmlFor="person-phone">
                  Phone
                  <input
                    id="person-phone"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => change('phone', e.target.value)}
                    placeholder="Phone number"
                  />
                </label>
              </div>
              <label className="pd-field" htmlFor="person-notes">
                Notes
                <textarea
                  id="person-notes"
                  rows={4}
                  value={form.notes}
                  onChange={(e) => change('notes', e.target.value)}
                />
              </label>
              <div className="pd-form-active">
                <div>
                  <strong>Active in the directory</strong>
                  <p>Inactive contacts stay saved for future reference.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-label="Active in the directory"
                  aria-checked={form.active}
                  className={`pd-switch ${form.active ? 'is-on' : ''}`}
                  onClick={() => change('active', !form.active)}
                >
                  <span />
                </button>
              </div>
            </fieldset>
          </form>
          {formError && (
            <div id="person-error">
              <ErrorNotice>{formError}</ErrorNotice>
            </div>
          )}
          {saveState === 'success' && (
            <p className="pd-saved-message" role="status">
              <Icon name="check" />
              Saved to the production roster.
            </p>
          )}
        </Overlay>
      )}
      {blocker.state === 'blocked' &&
        (importState === 'pending' ? (
          <Overlay
            title="Import in progress"
            description="People are being saved individually. Wait for the results before leaving."
            onClose={() => blocker.reset()}
            footer={
              <Button variant="primary" onClick={() => blocker.reset()}>
                Return to import
              </Button>
            }
          >
            <p className="pd-help">
              {progress.done} of {progress.total} requests completed. Confirmed
              contacts stay saved.
            </p>
          </Overlay>
        ) : hasDraft ? (
          <Confirm
            destructive={false}
            title="Leave the roster?"
            description={
              editorOpen && dirty
                ? 'The person editor has unsaved changes. Discard them and leave this page?'
                : 'Some pasted people have not been imported. Discard the remaining input and leave this page?'
            }
            confirmLabel="Discard and leave"
            onCancel={() => blocker.reset()}
            onConfirm={() => blocker.proceed()}
          />
        ) : null)}
      {discard && (
        <Confirm
          destructive={false}
          title="Discard unsaved changes?"
          description="The person editor has changes that haven’t been saved."
          confirmLabel="Discard changes"
          onCancel={() => setDiscard(false)}
          onConfirm={() => {
            setDiscard(false)
            setEditorOpen(false)
          }}
        />
      )}
      {deleting && (
        <Confirm
          title="Delete this person?"
          description={`“${deleting.name}” will be removed from the production roster. Existing call sheet entries are unchanged.`}
          pending={deleteBusy}
          error={deleteError}
          onCancel={() => setDeleting(null)}
          onConfirm={() => void remove()}
        />
      )}
      {importOpen && (
        <Overlay
          className="pd-import-dialog"
          title="Paste people into the roster"
          onClose={() => {
            if (importState !== 'pending') setImportOpen(false)
          }}
          busy={importState === 'pending'}
          footer={
            <>
              <Button
                disabled={importState === 'pending'}
                onClick={() => setImportOpen(false)}
              >
                {importState === 'success' ? 'Done' : 'Close'}
              </Button>
              <Button
                variant="primary"
                icon="import"
                className="pd-save-button"
                state={importState}
                pendingLabel={`Importing ${progress.done}/${progress.total}`}
                successLabel="Imported"
                errorLabel="Retry remaining"
                disabled={!parsed.length || importState === 'success'}
                onClick={() => void importPeople()}
              >
                Import {parsed.length || ''}{' '}
                {parsed.length === 1 ? 'person' : 'people'}
              </Button>
            </>
          }
        >
          <label className="pd-field" htmlFor="roster-paste">
            One person per line
            <textarea
              data-initial-focus
              id="roster-paste"
              rows={5}
              value={paste}
              disabled={importState === 'pending'}
              onChange={(e) => {
                setPaste(e.target.value)
                setImportState('idle')
                setImportError(null)
              }}
              placeholder="Name | Category | Role | Email | Phone | Notes"
              aria-describedby="roster-format"
            />
          </label>
          <p id="roster-format" className="pd-help">
            Use pipes or simple comma-separated values in the order shown.
            Unknown categories become Other. Quoted CSV and headers are not
            supported.
          </p>
          <div className="pd-import-preview">
            <h3>
              Preview{' '}
              <span>
                {parsed.length} {parsed.length === 1 ? 'person' : 'people'}
              </span>
            </h3>
            {parsed.length ? (
              <ul>
                {parsed.slice(0, 6).map((row, i) => (
                  <li key={i}>
                    <span>
                      <strong>{row.person.name}</strong>
                      <small>
                        {row.person.roleOrDepartment ||
                          row.person.email ||
                          'No role or email'}
                      </small>
                    </span>
                    <Status value="draft">
                      {rosterCategoryLabels[row.person.category]}
                    </Status>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No people to preview.</p>
            )}
            {parsed.length > 6 && <p>And {parsed.length - 6} more people.</p>}
          </div>
          <p className="pd-help pd-import-caution">
            <Icon name="alert" />
            People are saved individually. An import may partially succeed;
            confirmed records appear in your roster immediately.
          </p>
          {importError && <ErrorNotice>{importError}</ErrorNotice>}
          {importState === 'success' && (
            <p className="pd-saved-message" role="status">
              <Icon name="check" />
              All {progress.total} people were saved.
            </p>
          )}
        </Overlay>
      )}
    </div>
  )
}
export default RosterPage
