/**
 * MUSIFY v2.0 — App Component
 * ─────────────────────────────────────────────
 * CHANGES:
 * - Removed LockScreen entirely — app opens directly to Home
 * - Removed Clerk SignedIn/SignedOut gating
 * - Removed LandingPage route
 * - Removed playlist and history routes
 * - Removed YourEpisodesPage route
 * - Kept: Home, Search, Library (Liked), Artist, Charts
 * - Removed framer-motion page transitions (CSS-only now)
 * - 3 nav items only: Home, Search, Liked
 * - Simplified layout with no sidebar blur
 */

import { lazy, Suspense, useState, useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Player from './components/layout/Player.jsx'
import MobileNav from './components/layout/MobileNav.jsx'
import SearchOverlay from './components/layout/SearchOverlay.jsx'

import HomePage from './pages/HomePage.jsx'
import SearchPage from './pages/SearchPage.jsx'
import LibraryPage from './pages/LibraryPage.jsx'

const ArtistPage = lazy(() => import('./pages/ArtistPage.jsx'))
const ChartsPage = lazy(() => import('./pages/ChartsPage.jsx'))

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
      <div style={{ width: 24, height: 24, border: '2px solid rgba(124,58,237,0.2)', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function App() {
  const location = useLocation()

  return (
    <Suspense fallback={<PageLoader />}>
      <div
        className="flex flex-col overflow-hidden text-white relative"
        style={{
          height: '100dvh',
          width: '100dvw',
          background: 'linear-gradient(180deg, #0a0a0f 0%, #12121a 100%)'
        }}
      >
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto scroll-container hide-scrollbar relative">
          <div className="pb-36">
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
        </div>

        {/* Player + Nav */}
        <Player />
        <MobileNav />
        <SearchOverlay />
      </div>
    </Suspense>
  )
}

// CSS-only page transition wrapper
function PageWrapper({ children }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => {
      cancelAnimationFrame(raf)
      setVisible(false)
    }
  }, [])

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 200ms ease-out, transform 200ms ease-out',
      }}
    >
      {children}
    </div>
  )
}
