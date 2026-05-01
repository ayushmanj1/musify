/**
 * MUSIFY — Entry Point
 * Simplified: no Clerk, direct render
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { PlayerProvider } from './context/PlayerContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <PlayerProvider>
        <App />
        <Toaster
          position="bottom-center"
          containerStyle={{ bottom: 150 }}
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--surface-highlight)',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              fontFamily: 'var(--font)',
              padding: '10px 16px',
            },
            success: {
              iconTheme: { primary: 'var(--accent)', secondary: '#fff' },
            },
          }}
        />
      </PlayerProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
