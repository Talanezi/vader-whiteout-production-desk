import { Navigate, RouterProvider, createHashRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import AppShell from './components/AppShell'
import DashboardPage from './pages/DashboardPage'
import CallSheetNewPage from './pages/CallSheetNewPage'
import CallSheetEditorPage from './pages/CallSheetEditorPage'
import RosterPage from './pages/RosterPage'
import ShotListsPage from './pages/ShotListsPage'
import DotsLoader from './components/whiteout/DotsLoader'
const FlowsPage = lazy(() => import('./pages/FlowsPage'))
const FlowPage = lazy(() => import('./pages/FlowPage'))
const StoryboardsPage = lazy(() => import('./pages/StoryboardsPage'))
const StoryboardPage = lazy(() => import('./pages/StoryboardPage'))
const ShotListPage = lazy(() => import('./pages/ShotListPage'))

// The existing hash URLs are unchanged. The data router enables a native
// navigation blocker for unsaved roster edits and unfinished imports.
const storyboardFallback = (
  <div className="pd-loading" role="status">
    <DotsLoader />
    <span className="pd-sr-only">Loading storyboards</span>
  </div>
)
const router = createHashRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/shotlists', element: <ShotListsPage /> },
      { path: '/shotlists/new', element: <ShotListsPage /> },
      {
        path: '/shotlists/:id',
        element: (
          <Suspense
            fallback={
              <div role="status" className="pd-loading">
                Loading shot list…
              </div>
            }
          >
            <ShotListPage />
          </Suspense>
        ),
      },
      {
        path: '/storyboards',
        element: (
          <Suspense fallback={storyboardFallback}>
            <StoryboardsPage />
          </Suspense>
        ),
      },
      {
        path: '/storyboards/new',
        element: (
          <Suspense fallback={storyboardFallback}>
            <StoryboardsPage />
          </Suspense>
        ),
      },
      {
        path: '/storyboards/:id',
        element: (
          <Suspense fallback={storyboardFallback}>
            <StoryboardPage />
          </Suspense>
        ),
      },
      ...['/flows', '/flows/new', '/flows/:id'].map(path => ({path, element: <Suspense fallback={storyboardFallback}>{path === '/flows/:id' ? <FlowPage/> : <FlowsPage/>}</Suspense>})),
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
