import { lazy, Suspense } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar.jsx'
import Player from './components/layout/Player.jsx'
import TopBar from './components/layout/TopBar.jsx'
import MobileNav from './components/layout/MobileNav.jsx'
import SearchOverlay from './components/layout/SearchOverlay.jsx'

import { motion, AnimatePresence } from 'framer-motion'
import { haptics } from './utils/haptics.js'

const HomePage = lazy(() => import('./pages/HomePage.jsx'))
const SearchPage = lazy(() => import('./pages/SearchPage.jsx'))
const LibraryPage = lazy(() => import('./pages/LibraryPage.jsx'))

const YourEpisodesPage = lazy(() => import('./pages/YourEpisodesPage.jsx'))
const ArtistPage = lazy(() => import('./pages/ArtistPage.jsx'))
const ChartsPage = lazy(() => import('./pages/ChartsPage.jsx'))
const LandingPage = lazy(() => import('./pages/LandingPage.jsx'))
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { usePlayer } from './context/PlayerContext.jsx'

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-lavender/20 border-t-lavender rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  const { isGuestMode } = usePlayer()
  const location = useLocation()

  return (
    <Suspense fallback={<PageLoader />}>
      <SignedOut>
        {!isGuestMode ? <LandingPage /> : <SignedInUI />}
      </SignedOut>
      
      <SignedIn>
        <SignedInUI />
      </SignedIn>
    </Suspense>
  )
}

function SignedInUI() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isSearchOpen } = usePlayer()

  return (
    <div className="h-screen flex flex-col overflow-hidden text-white relative" style={{ background: 'var(--luxury-black)' }}>
      {/* Ambient glow orbs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#A78BFA]/[0.03] rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#7C3AED]/[0.025] rounded-full blur-[80px]" style={{ animationDelay: '3s', animationDuration: '8s' }} />
      </div>

      <div className="flex flex-1 min-h-0 relative z-10 p-1 md:p-2 gap-2">
        <div className="hidden md:block">
          <Sidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0 relative z-10 glass-panel rounded-none md:rounded-2xl overflow-hidden">
          <div className="flex-1 overflow-y-auto relative hide-scrollbar scroll-smooth">
            <TopBar />
            <div className="pb-32 md:pb-24">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                >
                  <Routes location={location}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/library" element={<LibraryPage />} />

                    <Route path="/episodes" element={<YourEpisodesPage />} />
                    <Route path="/artist/:id" element={<ArtistPage />} />
                    <Route path="/charts/:id" element={<ChartsPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <Player />
      <MobileNav />
      <SearchOverlay />
    </div>
  )
}
