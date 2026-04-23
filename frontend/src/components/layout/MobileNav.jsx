import { NavLink } from 'react-router-dom'
import { FiHome, FiSearch } from 'react-icons/fi'
import { VscLibrary } from 'react-icons/vsc'

export default function MobileNav() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-black/40 backdrop-blur-3xl border-t border-white/5 z-[70] flex items-center justify-around px-6 pb-4">
      <NavLink to="/" className={({isActive}) => `flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-[#A78BFA] scale-110' : 'text-white/40 hover:text-white'}`}>
        <FiHome className="text-2xl" />
        <span className="text-[10px] font-bold tracking-tight">Home</span>
      </NavLink>
      <NavLink to="/search" className={({isActive}) => `flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-[#A78BFA] scale-110' : 'text-white/40 hover:text-white'}`}>
        <FiSearch className="text-2xl" />
        <span className="text-[10px] font-bold tracking-tight">Search</span>
      </NavLink>
      <NavLink to="/library" className={({isActive}) => `flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-[#A78BFA] scale-110' : 'text-white/40 hover:text-white'}`}>
        <VscLibrary className="text-2xl" />
        <span className="text-[10px] font-bold tracking-tight">Library</span>
      </NavLink>
    </div>
  )
}
