import { Navigate, RouterProvider, createHashRouter } from 'react-router-dom'
import AppShell from './components/AppShell'
import DashboardPage from './pages/DashboardPage'
import CallSheetNewPage from './pages/CallSheetNewPage'
import CallSheetEditorPage from './pages/CallSheetEditorPage'
import RosterPage from './pages/RosterPage'

// The existing hash URLs are unchanged. The data router enables a native
// navigation blocker for unsaved roster edits and unfinished imports.
const router = createHashRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/roster', element: <RosterPage /> },
      { path: '/callsheets/new', element: <CallSheetNewPage /> },
      { path: '/callsheets/:id/edit', element: <CallSheetEditorPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
function App() {
  return <RouterProvider router={router} />
}
export default App
