import { lazy, Suspense } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar.jsx'
import Player from './components/layout/Player.jsx'
import TopBar from './components/layout/TopBar.jsx'
import MobileNav from './components/layout/MobileNav.jsx'
import SearchOverlay from './components/layout/SearchOverlay.jsx'

const HomePage = lazy(() => import('./pages/HomePage.jsx'))
const SearchPage = lazy(() => import('./pages/SearchPage.jsx'))
const LibraryPage = lazy(() => import('./pages/LibraryPage.jsx'))
const PlaylistPage = lazy(() => import('./pages/PlaylistPage.jsx'))
const YourEpisodesPage = lazy(() => import('./pages/YourEpisodesPage.jsx'))
const ArtistPage = lazy(() => import('./pages/ArtistPage.jsx'))
const ChartsPage = lazy(() => import('./pages/ChartsPage.jsx'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <div className="h-screen flex flex-col overflow-hidden text-white bg-black relative">
      <div className="flex flex-1 min-h-0 relative z-10 p-1 md:p-2 gap-2">
        <div className="hidden md:block">
          <Sidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0 relative z-10 bg-[#121212] rounded-none md:rounded-xl overflow-hidden">
          <div className="flex-1 overflow-y-auto relative hide-scrollbar">
            <TopBar />
            <div className="pb-32 md:pb-24">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/library" element={<LibraryPage />} />
                  <Route path="/playlist/:id" element={<PlaylistPage />} />
                  <Route path="/episodes" element={<YourEpisodesPage />} />
                  <Route path="/artist/:id" element={<ArtistPage />} />
                  <Route path="/charts/:id" element={<ChartsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
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
