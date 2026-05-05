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
import MobileNav from './components/layout/MobileNav.jsx'

import HomePage from './pages/HomePage.jsx'
import SearchPage from './pages/SearchPage.jsx'
import LibraryPage from './pages/LibraryPage.jsx'

const ArtistPage = lazy(() => import('./pages/ArtistPage.jsx'))
const ChartsPage = lazy(() => import('./pages/ChartsPage.jsx'))
const PlaylistPage = lazy(() => import('./pages/PlaylistPage.jsx'))

/* ─── Loading Spinner ─── */
function PageLoader() {
  return (
    <div style={{ 
      position: 'fixed',
      top: 0, left: 0,
      width: '100vw', height: '100vh',
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#000',
      zIndex: 10000,
      cursor: 'wait'
    }}>
      <div className="premium-spinner" />
      <div style={{ 
        marginTop: '24px',
        color: '#fff', 
        fontSize: '12px', 
        fontWeight: 800, 
        letterSpacing: '4px',
        textTransform: 'uppercase',
        opacity: 0.8,
        animation: 'pulse 2s ease-in-out infinite'
      }}>
        Musify
      </div>
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
      transition: 'opacity 300ms cubic-bezier(0.4, 0, 0.2, 1), transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
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
  const { isRightSidebarOpen, isFullScreenPlayer, isLeftSidebarCollapsed, setIsLeftSidebarCollapsed } = usePlayer()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth
      setIsMobile(w < 768)
      if (w >= 768 && w <= 1024) {
        setIsLeftSidebarCollapsed(true)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div id="app-container" style={{
      '--right-w': isRightSidebarOpen ? '280px' : '40px',
      '--left-w': isLeftSidebarCollapsed ? '56px' : '220px',
      '--nav-h': isMobile ? 'var(--mobile-nav-h)' : '0px',
      transition: 'grid-template-columns 0.35s cubic-bezier(0.4,0,0.2,1)',
      display: isFullScreenPlayer ? 'block' : 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'var(--left-w) 1fr var(--right-w)',
      gridTemplateRows: isMobile ? '1fr' : '1fr var(--bottom-bar-h)',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden'
    }}>
      <div style={{ display: isFullScreenPlayer ? 'none' : 'contents' }}>
        {!isMobile && <LeftSidebar />}

        {/* Center Panel (Scrollable content area) */}
        <div className="center-panel hide-scrollbar" style={{ 
          margin: isMobile ? '0' : '8px 0', 
          borderRadius: isMobile ? '0' : '8px',
          paddingBottom: isMobile ? 'calc(var(--mobile-player-h) + var(--mobile-nav-h) + var(--safe-bottom) + 20px)' : '0'
        }}>
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

        {!isMobile && <RightSidebar />}
        <Player />
        {isMobile && <MobileNav />}
      </div>

      <FullScreenPlayer />
      <GlobalModals />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.4; transform: scale(0.98); } 50% { opacity: 1; transform: scale(1); } }
        
        .premium-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(139, 92, 246, 0.1);
          border-top: 3px solid #8B5CF6;
          border-radius: 50%;
          animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          position: relative;
        }
        .premium-spinner::after {
          content: '';
          position: absolute;
          top: -3px; left: -3px; right: -3px; bottom: -3px;
          border: 3px solid transparent;
          border-left: 3px solid #A78BFA;
          border-radius: 50%;
          animation: spin 1.5s linear infinite reverse;
          opacity: 0.5;
        }

        #app-container {
          background: #000;
          color: #fff;
        }
      `}</style>
    </div>
  )
}
