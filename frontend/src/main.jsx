/**
 * MUSIFY v2.0 — Entry Point
 * ─────────────────────────────────────────────
 * CHANGES:
 * - Made Clerk optional (app works without key)
 * - Updated theme colors to violet accent
 * - Removed blur from toast styles
 * - App opens directly to Home (no lock screen gate)
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { PlayerProvider } from './context/PlayerContext.jsx'
import './index.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function AppRoot() {
  return (
    <BrowserRouter>
      <PlayerProvider>
        <App />
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: 'rgba(18, 18, 26, 0.95)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '600',
              fontFamily: "'DM Sans', sans-serif",
              padding: '10px 16px',
            },
            success: {
              iconTheme: {
                primary: '#7C3AED',
                secondary: '#fff',
              },
            },
          }}
        />
      </PlayerProvider>
    </BrowserRouter>
  )
}

// Conditionally wrap with Clerk if key is available
function Root() {
  if (PUBLISHABLE_KEY) {
    // Dynamic import Clerk only when key exists
    const { ClerkProvider } = require('@clerk/clerk-react')
    const { dark } = require('@clerk/themes')
    return (
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        appearance={{
          baseTheme: dark,
          variables: {
            colorPrimary: '#7C3AED',
            colorBackground: '#0a0a0f',
            colorInputBackground: '#12121a',
            colorInputText: '#FFFFFF',
            borderRadius: '12px',
          },
        }}
      >
        <AppRoot />
      </ClerkProvider>
    )
  }
  return <AppRoot />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>,
)
