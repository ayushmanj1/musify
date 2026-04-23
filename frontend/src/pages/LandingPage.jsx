import { motion } from 'framer-motion'
import { SignInButton, SignUpButton } from '@clerk/clerk-react'
import { FiMusic, FiUser } from 'react-icons/fi'
import { usePlayer } from '../context/PlayerContext.jsx'

export default function LandingPage() {
  const { setIsGuestMode } = usePlayer()

  return (
    <div className="fixed inset-0 z-[200] bg-black overflow-hidden flex flex-col items-center justify-center px-6">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-lavender/10 rounded-full blur-[160px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-lavender/5 rounded-full blur-[140px]" style={{ animationDelay: '2s' }} />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 text-center max-w-2xl"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-lavender to-[#7C3AED] rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-[0_0_50px_rgba(167,139,250,0.3)] animate-float">
          <FiMusic className="text-white text-4xl" />
        </div>

        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-12 leading-none">
          MUSIFY<span className="text-lavender">.</span>
        </h1>

        <div className="flex flex-col items-center justify-center gap-6 w-full max-w-sm mx-auto">
          <SignInButton mode="modal">
            <button className="w-full py-6 bg-gradient-to-br from-lavender to-[#7C3AED] text-black font-black uppercase tracking-[0.3em] text-[13px] rounded-[28px] shadow-[0_20px_50px_rgba(167,139,250,0.4)] hover:shadow-[0_25px_60px_rgba(167,139,250,0.6)] hover:scale-[1.03] active:scale-[0.97] transition-all duration-500 relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              Sign In
            </button>
          </SignInButton>
          
          <SignUpButton mode="modal">
            <button className="w-full py-6 bg-transparent border-2 border-lavender/30 text-lavender font-black uppercase tracking-[0.3em] text-[13px] rounded-[28px] shadow-[inset_0_0_20px_rgba(167,139,250,0.05)] hover:bg-lavender/10 hover:border-lavender hover:scale-[1.03] active:scale-[0.97] transition-all duration-500">
              Sign Up
            </button>
          </SignUpButton>

          <button 
            onClick={() => setIsGuestMode(true)}
            className="mt-8 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.4em] text-white/20 hover:text-lavender transition-all duration-300 group"
          >
            <FiUser className="group-hover:scale-120 transition-transform" />
            Use App Without Sign In
          </button>
        </div>
      </motion.div>
    </div>
  )
}
