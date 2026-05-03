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
          containerStyle={{ bottom: 100 }}
          toastOptions={{
            duration: 3000,
            style: {
              background: '#8B5CF6',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              fontFamily: 'var(--font)',
              padding: '12px 20px',
              animation: 'toastSlideUp 0.3s ease',
            },
            success: {
              iconTheme: { primary: '#fff', secondary: '#8B5CF6' },
            },
          }}
        />
      </PlayerProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
