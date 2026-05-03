/**
 * MUSIFY — App Shell
 * Fixed 3-panel Desktop & Tablet Layout
 * Routes: Home, Search, Library, Artist, Charts
 */

import { lazy, Suspense, useState, useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Player from './components/layout/Player.jsx'
import LeftSidebar from './components/layout/LeftSidebar.jsx'
import RightSidebar from './components/layout/RightSidebar.jsx'
import TopBar from './components/layout/TopBar.jsx'

import HomePage from './pages/HomePage.jsx'
import SearchPage from './pages/SearchPage.jsx'
import LibraryPage from './pages/LibraryPage.jsx'

const ArtistPage = lazy(() => import('./pages/ArtistPage.jsx'))
const ChartsPage = lazy(() => import('./pages/ChartsPage.jsx'))
const PlaylistPage = lazy(() => import('./pages/PlaylistPage.jsx'))

/* ─── Loading Spinner ─── */
function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{
        width: 24, height: 24,
        border: '2px solid rgba(139, 92, 246, 0.2)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
    </div>
  )
}

/* ─── Page Transition Wrapper ─── */
function PageWrapper({ children }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => { cancelAnimationFrame(raf); setVisible(false) }
  }, [])

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(4px)',
      transition: 'opacity 200ms ease-out, transform 200ms ease-out',
      minHeight: '100%'
    }}>
      {children}
    </div>
  )
}

export default function App() {
  const location = useLocation()

  return (
    <Suspense fallback={<PageLoader />}>
      <AppShell location={location} />
    </Suspense>
  )
}

import { usePlayer } from './context/PlayerContext.jsx'

import GlobalModals from './components/ui/GlobalModals.jsx'
import FullScreenPlayer from './components/layout/FullScreenPlayer.jsx'

function AppShell({ location }) {
  const { isRightSidebarOpen, isFullScreenPlayer, isLeftSidebarCollapsed } = usePlayer()

  return (
    <div id="app-container" style={{
      '--right-w': isRightSidebarOpen ? '280px' : '40px',
      '--left-w': isLeftSidebarCollapsed ? '56px' : '220px',
      transition: 'grid-template-columns 0.35s cubic-bezier(0.4,0,0.2,1)',
      display: isFullScreenPlayer ? 'block' : 'grid'
    }}>
      <div style={{ display: isFullScreenPlayer ? 'none' : 'contents' }}>
        <LeftSidebar />

        {/* Center Panel (Scrollable content area) */}
        <div className="center-panel hide-scrollbar">
          <TopBar />
          <PageWrapper key={location.pathname}>
            <Routes location={location}>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/artist/:id" element={<ArtistPage />} />
              <Route path="/charts/:id" element={<ChartsPage />} />
              <Route path="/playlist/:id" element={<PlaylistPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PageWrapper>
        </div>

        <RightSidebar />
        
        {/* Player becomes the fixed bottom bar */}
        <Player />
      </div>

      <FullScreenPlayer />
      <GlobalModals />
    </div>
  )
}
