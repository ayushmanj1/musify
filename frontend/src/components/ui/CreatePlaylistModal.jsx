import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiPlus, FiMusic } from 'react-icons/fi'

export default function CreatePlaylistModal({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onCreate(name)
    setName('')
    onClose()
  }

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[101] pointer-events-auto"
          >
            <div className="glass-morphism p-8 rounded-[32px] border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.5)] relative overflow-hidden group">
              {/* Decorative Background */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#1DB954]/20 blur-[80px] rounded-full group-hover:bg-[#1DB954]/30 transition-colors duration-700" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40">
                      <FiMusic size={24} />
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight">New Playlist</h2>
                  </div>
                  <button 
                    onClick={onClose}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <FiX size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  <div className="relative">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Give your playlist a name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      className="w-full bg-white/5 border-2 border-white/5 rounded-2xl px-6 py-4 text-white font-bold placeholder:text-white/20 outline-none transition-all focus:border-[#1DB954]/50 focus:bg-white/10 shadow-inner"
                    />
                    <AnimatePresence>
                      {isFocused && (
                        <motion.div 
                          layoutId="input-glow"
                          className="absolute -inset-1 rounded-2xl bg-[#1DB954]/20 blur-md -z-10"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        />
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-4 rounded-2xl text-white/40 font-bold hover:text-white hover:bg-white/5 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!name.trim()}
                      className={`flex-1 py-4 rounded-2xl font-black tracking-widest uppercase text-[12px] shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                        name.trim() 
                        ? 'bg-[#1DB954] text-black hover:scale-105 hover:shadow-[#1DB954]/20 shadow-xl' 
                        : 'bg-white/5 text-white/20 cursor-not-allowed'
                      }`}
                    >
                      <FiPlus size={16} />
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
