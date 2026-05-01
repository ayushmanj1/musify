/**
 * MUSIFY — Bottom Navigation
 * 3 tabs: Home, Search, Library
 * Fully opaque — NO blur for performance
 */

import { useNavigate, useLocation } from 'react-router-dom'
import { FiHome, FiSearch, FiBook } from 'react-icons/fi'

const TABS = [
  { path: '/', label: 'Home', Icon: FiHome },
  { path: '/search', label: 'Search', Icon: FiSearch },
  { path: '/library', label: 'Your Library', Icon: FiBook },
]

export default function MobileNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 390,
      height: 'calc(var(--bottom-nav-h) + var(--safe-bottom))',
      paddingBottom: 'var(--safe-bottom)',
      background: 'var(--bg-primary)',
      borderTop: '1px solid var(--bg-card)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 50,
    }}>
      {TABS.map(({ path, label, Icon }) => {
        const active = pathname === path
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 4, background: 'none', border: 'none', padding: '8px 16px',
              cursor: 'pointer', touchAction: 'manipulation',
              color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
              transform: active ? 'scale(1.08)' : 'scale(1)',
              transition: 'transform 150ms ease, color 150ms ease',
            }}
          >
            <Icon size={24} />
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
