/**
 * MUSIFY v2.0 — MobileNav
 * ─────────────────────────────────────────────
 * CHANGES:
 * - 3 items only: Home, Search, Liked
 * - ONLY element with backdrop-filter: blur(16px)
 * - Safe area padding for iPhone notch
 * - DM Sans font, violet accent
 */

import { NavLink } from 'react-router-dom'
import { FiHome, FiSearch, FiHeart } from 'react-icons/fi'
import { usePlayer } from '../../context/PlayerContext.jsx'

export default function MobileNav() {
  const { setIsSearchOpen } = usePlayer()

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-[70] flex items-center justify-around px-8 bottom-nav"
      style={{
        height: '68px',
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        background: 'rgba(10, 10, 15, 0.7)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-35'}`
        }
      >
        <FiHome size={20} />
        <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Home</span>
      </NavLink>

      <button
        onClick={() => setIsSearchOpen(true)}
        className="flex flex-col items-center gap-1 opacity-35 hover:opacity-60 transition-opacity duration-200"
      >
        <FiSearch size={20} />
        <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Search</span>
      </button>

      <NavLink
        to="/library"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-35'}`
        }
      >
        <FiHeart size={20} />
        <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Liked</span>
      </NavLink>
    </nav>
  )
}
