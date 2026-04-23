import { NavLink } from 'react-router-dom'
import { FiHome, FiSearch } from 'react-icons/fi'
import { VscLibrary } from 'react-icons/vsc'

export default function MobileNav() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-lg border-t border-white/10 z-[70] flex items-center justify-around px-4">
      <NavLink to="/" className={({isActive}) => `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-white' : 'text-white/50 hover:text-white'}`}>
        <FiHome className="text-2xl" />
        <span className="text-[10px] font-medium">Home</span>
      </NavLink>
      <NavLink to="/search" className={({isActive}) => `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-white' : 'text-white/50 hover:text-white'}`}>
        <FiSearch className="text-2xl" />
        <span className="text-[10px] font-medium">Search</span>
      </NavLink>
      <NavLink to="/library" className={({isActive}) => `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-white' : 'text-white/50 hover:text-white'}`}>
        <VscLibrary className="text-2xl" />
        <span className="text-[10px] font-medium">Library</span>
      </NavLink>
    </div>
  )
}
