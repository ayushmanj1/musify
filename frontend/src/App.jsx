/**
 * MUSIFY — App Shell
 * 390px mobile container + black PC surround
 * Routes: Home, Search, Library, Artist, Charts
 */

import { lazy, Suspense, useState, useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Player from './components/layout/Player.jsx'
import MobileNav from './components/layout/MobileNav.jsx'

import HomePage from './pages/HomePage.jsx'
import SearchPage from './pages/SearchPage.jsx'
import LibraryPage from './pages/LibraryPage.jsx'

const ArtistPage = lazy(() => import('./pages/ArtistPage.jsx'))
const ChartsPage = lazy(() => import('./pages/ChartsPage.jsx'))

/* ─── Loading Spinner ─── */
function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
      <div style={{
        width: 24, height: 24,
        border: '2px solid rgba(0,201,255,0.2)',
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
      transform: visible ? 'translateY(0)' : 'translateY(8px)',
      transition: 'opacity 200ms ease-out, transform 200ms ease-out',
    }}>
      {children}
    </div>
  )
}

export default function App() {
  const location = useLocation()

  return (
    <Suspense fallback={<PageLoader />}>
      {/* ─── 390px Mobile Container ─── */}
      <div id="app-container">
        {/* Scrollable content area */}
        <div
          className="hide-scrollbar"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            overscrollBehaviorY: 'contain',
            paddingBottom: 'calc(var(--mini-player-h) + var(--bottom-nav-h) + 16px)',
          }}
        >
          <PageWrapper key={location.pathname}>
            <Routes location={location}>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/artist/:id" element={<ArtistPage />} />
              <Route path="/charts/:id" element={<ChartsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PageWrapper>
        </div>

        {/* Player + Bottom Nav — fixed at bottom */}
        <Player />
        <MobileNav />
      </div>
    </Suspense>
  )
}
