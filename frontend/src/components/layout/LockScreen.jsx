import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiLock, FiGrid, FiDelete } from 'react-icons/fi'
import { haptics } from '../../utils/haptics'

export default function LockScreen({ onUnlock }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  const handleKeyClick = (val) => {
    // If there was an error, clear it as soon as the user starts typing again
    if (error) {
      setError(false)
      setPin(val)
      haptics.light()
      return
    }

    if (pin.length < 6) {
      haptics.light()
      const newPin = pin + val
      setPin(newPin)

      // Auto-validate when 6 digits are entered
      if (newPin.length === 6) {
        if (newPin === '313131') {
          haptics.medium()
          onUnlock()
        } else {
          haptics.error()
          setError(true)
          // We don't automatically clear the pin here.
          // The dots will stay red until the user types the next digit or presses delete.
        }
      }
    }
  }

  const handleDelete = () => {
    if (error) {
      setError(false)
      setPin('')
      return
    }
    if (pin.length > 0) {
      haptics.light()
      setPin(prev => prev.slice(0, -1))
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[9999] bg-[#000000] flex flex-col items-center justify-center select-none"
    >
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
        {/* Musify Logo */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-10"
        >
          <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-lavender to-[#7C3AED] flex items-center justify-center shadow-[0_0_30px_rgba(167,139,250,0.3)]">
            <FiGrid className="text-white text-3xl" />
          </div>
        </motion.div>

        <h2 className="text-2xl font-black text-white tracking-tight mb-8">Musify Private</h2>

        {/* PIN Display Area */}
        <div className="h-24 flex flex-col items-center justify-center mb-8">
          <motion.div 
            animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="flex gap-4"
          >
            {[...Array(6)].map((_, i) => (
              <div 
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                  pin.length > i 
                    ? (error ? 'bg-red-500 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-lavender border-lavender shadow-[0_0_15px_rgba(167,139,250,0.5)]')
                    : 'bg-transparent border-white/10'
                }`}
              />
            ))}
          </motion.div>
          
          <div className="h-8 mt-4">
            <AnimatePresence>
              {error && (
                <motion.p 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-red-500 text-[10px] font-black uppercase tracking-[4px]"
                >
                  TYPE AGAIN
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Numerical Keypad */}
        <div className="grid grid-cols-3 gap-6 w-full px-8">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyClick(num.toString())}
              className="aspect-square rounded-2xl bg-white/[0.03] border border-white/5 text-2xl font-bold text-white hover:bg-white/10 active:scale-90 transition-all flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleKeyClick('0')}
            className="aspect-square rounded-2xl bg-white/[0.03] border border-white/5 text-2xl font-bold text-white hover:bg-white/10 active:scale-90 transition-all flex items-center justify-center"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="aspect-square rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/30 hover:text-white active:scale-90 transition-all"
          >
            <FiDelete size={24} />
          </button>
        </div>
      </div>

      {/* Footer Decoration */}
      <div className="absolute bottom-12 flex items-center gap-3 opacity-20">
        <FiLock size={12} className="text-lavender" />
        <span className="text-[10px] font-black uppercase tracking-[4px]">Private Session</span>
      </div>
    </motion.div>
  )
}


