/**
 * MUSIFY v2.0 — TopBar (Simplified)
 * ─────────────────────────────────────────────
 * CHANGES:
 * - Removed notifications panel
 * - Removed settings/theme toggle  
 * - Removed Clerk UserButton/SignInButton
 * - Kept: Brand logo, Search button (mobile), back/forward nav
 * - No backdrop-filter blur
 */

import { useNavigate } from 'react-router-dom'
import { FiSearch } from 'react-icons/fi'
import { usePlayer } from '../../context/PlayerContext.jsx'

export default function TopBar() {
  const navigate = useNavigate()
  const { setIsSearchOpen } = usePlayer()

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 40,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px',
      background: 'rgba(10, 10, 15, 0.9)',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      {/* Brand */}
      <div
        onClick={() => navigate('/')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 900, color: '#fff',
        }}>
          M
        </div>
        <span className="hidden md:inline" style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.03em', color: '#7C3AED' }}>
          MUSIFY
        </span>
      </div>

      {/* Nav + Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Back/Forward (desktop) */}
        <button
          onClick={() => navigate(-1)}
          className="hidden md:flex"
          style={{
            width: 32, height: 32, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <button
          onClick={() => navigate(1)}
          className="hidden md:flex"
          style={{
            width: 32, height: 32, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>

        {/* Search (mobile) */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="md:hidden"
          style={{
            width: 36, height: 36, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
          }}
        >
          <FiSearch size={16} />
        </button>
      </div>
    </div>
  )
}
