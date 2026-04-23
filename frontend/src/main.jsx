import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ClerkProvider } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import App from './App.jsx'
import { PlayerProvider } from './context/PlayerContext.jsx'
import './index.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY} 
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#A78BFA',
          colorBackground: '#060608',
          colorInputBackground: '#121214',
          colorInputText: '#FFFFFF',
          borderRadius: '16px',
        },
        elements: {
          card: 'glass-panel shadow-2xl border border-white/5',
          navbar: 'hidden',
          headerTitle: 'text-2xl font-black tracking-tight',
          headerSubtitle: 'text-white/40 font-medium',
          socialButtonsBlockButton: 'glass-btn border-white/5 hover:bg-white/10 transition-all',
          formButtonPrimary: 'bg-lavender text-black font-black uppercase tracking-widest text-[12px] hover:scale-[1.02] active:scale-[0.98] transition-all',
          footerActionLink: 'text-lavender hover:text-lavender-light font-bold',
        }
      }}
    >
      <BrowserRouter>
        <PlayerProvider>
          <App />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'rgba(12, 12, 18, 0.8)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(30px) saturate(180%)',
                WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600',
                padding: '12px 20px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              },
              success: {
                iconTheme: {
                  primary: '#A78BFA',
                  secondary: '#fff',
                },
              },
            }}
          />
        </PlayerProvider>
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>,
)
