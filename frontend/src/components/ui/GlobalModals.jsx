import React, { useState, useEffect, useRef } from 'react'
import { usePlayer } from '../../context/PlayerContext.jsx'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { shareSong } from '../../utils/share.js'
import { FiMoreHorizontal, FiTrash2, FiPlay, FiPlus, FiLink, FiSliders, FiX } from 'react-icons/fi'

export default function GlobalModals() {
  const { 
    userPlaylists, setEqBands, eqBands, playSong, addToQueue, 
    removeSongFromPlaylist, toggleSavedSong, deletePlaylist, updatePlaylist 
  } = usePlayer()

  // Context Menu State
  const [cmState, setCmState] = useState({ isOpen: false, x: 0, y: 0, song: null, playlistName: null, type: 'song' })
  const [showSubMenu, setShowSubMenu] = useState(false)
  const [confirmItem, setConfirmItem] = useState(null) // for 'Remove from Playlist'
  
  // Playlist Delete Modal State
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, playlistName: null })

  // Equalizer Modal State
  const [eqOpen, setEqOpen] = useState(false)
  const [localEq, setLocalEq] = useState([0,0,0,0,0])

  // --- NEW: Global Playlist Modal State ---
  const [playlistModal, setPlaylistModal] = useState({
    isOpen: false,
    editingName: null, // null for create, string for edit
    name: '',
    songs: [],
    searchQuery: ''
  })

  const { masterPlaylistData, setUserPlaylists, addSongToPlaylist } = usePlayer()
  const navigate = useNavigate()

  // Context Menu logic
  useEffect(() => {
    const handleOpen = (e) => {
      setCmState({ 
        isOpen: true, 
        x: e.detail.x, 
        y: e.detail.y, 
        song: e.detail.song, 
        playlistName: e.detail.playlistName,
        type: e.detail.type || 'song'
      })
      setShowSubMenu(false)
      setConfirmItem(null)
    }
    const handleClose = () => {
      setCmState(prev => ({ ...prev, isOpen: false }))
    }
    
    window.addEventListener('open-context-menu', handleOpen)
    window.addEventListener('click', handleClose)
    window.addEventListener('scroll', handleClose, true)

    return () => {
      window.removeEventListener('open-context-menu', handleOpen)
      window.removeEventListener('click', handleClose)
      window.removeEventListener('scroll', handleClose, true)
    }
  }, [])

  // Eq Modal listener
  useEffect(() => {
    const handleOpenEq = () => {
      setLocalEq([...eqBands])
      setEqOpen(true)
    }
    window.addEventListener('open-eq-modal', handleOpenEq)

    // Playlist Modal listeners
    const handleOpenCreate = () => {
      setPlaylistModal({
        isOpen: true,
        editingName: null,
        name: `My Playlist #${userPlaylists.length + 1}`,
        songs: [],
        searchQuery: ''
      })
    }
    const handleOpenEdit = (e) => {
      const pl = userPlaylists.find(p => p.name === e.detail.playlistName)
      if (!pl) return
      setPlaylistModal({
        isOpen: true,
        editingName: e.detail.playlistName,
        name: pl.name,
        songs: pl.songs || [],
        searchQuery: ''
      })
    }

    window.addEventListener('open-create-playlist', handleOpenCreate)
    window.addEventListener('open-edit-playlist', handleOpenEdit)

    return () => {
      window.removeEventListener('open-eq-modal', handleOpenEq)
      window.removeEventListener('open-create-playlist', handleOpenCreate)
      window.removeEventListener('open-edit-playlist', handleOpenEdit)
    }
  }, [eqBands, userPlaylists])

  const handleSavePlaylist = () => {
    const finalName = playlistModal.name.trim() || `My Playlist #${userPlaylists.length + 1}`
    
    if (playlistModal.editingName) {
      updatePlaylist(playlistModal.editingName, { name: finalName, songs: playlistModal.songs })
      if (playlistModal.editingName !== finalName) {
        navigate(`/playlist/${encodeURIComponent(finalName)}`)
      }
    } else {
      const newPlaylistObj = { 
        name: finalName, 
        songs: playlistModal.songs, 
        cover: '🎵', 
        color: `hsl(${Math.random() * 360}, 50%, 30%)`
      }
      setUserPlaylists(prev => [newPlaylistObj, ...prev])
      toast.success(`Playlist '${finalName}' created!`)
      navigate(`/playlist/${encodeURIComponent(finalName)}`)
    }
    setPlaylistModal(prev => ({ ...prev, isOpen: false }))
  }

  const handleCmClick = (e) => {
    e.stopPropagation()
  }

  // Positioning logic
  let menuX = cmState.x
  let menuY = cmState.y
  const menuWidth = 220
  const menuHeight = cmState.type === 'song' ? 280 : 200

  // Horizontal check
  if (menuX + menuWidth > window.innerWidth) menuX = window.innerWidth - menuWidth - 20
  if (menuX < 0) menuX = 20

  // Vertical check: Upward if in bottom half
  const isBottomHalf = menuY > window.innerHeight / 2
  if (isBottomHalf) {
    menuY = menuY - menuHeight - 10
  } else {
    // Already set to menuY (downward)
  }
  
  // Vertical overflow check
  if (menuY + menuHeight > window.innerHeight) menuY = window.innerHeight - menuHeight - 20
  if (menuY < 0) menuY = 20

  const handleRemove = () => {
    if (cmState.playlistName === 'Liked Songs') {
      toggleSavedSong(cmState.song)
    } else {
      removeSongFromPlaylist(cmState.playlistName, cmState.song.videoId)
    }
    setCmState({ isOpen: false })
  }

  return (
    <>
      {/* ─── CONTEXT MENU ─── */}
      {cmState.isOpen && (
        <div 
          onClick={handleCmClick}
          style={{
            position: 'fixed',
            top: menuY,
            left: menuX,
            background: '#2a2a2a',
            borderRadius: '12px',
            padding: '8px 0',
            minWidth: `${menuWidth}px`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            border: '1px solid #3a3a3a',
            zIndex: 10000,
            animation: 'menuAppear 0.2s ease',
            transformOrigin: isBottomHalf ? 'bottom left' : 'top left'
          }}
        >
          <style>{`
            @keyframes menuAppear {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
            }
            .cm-item {
              height: 40px;
              padding: 0 16px;
              display: flex;
              align-items: center;
              gap: 12px;
              color: #fff;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              background: transparent;
              border: none;
              width: 100%;
              text-align: left;
              transition: background 0.2s;
            }
            .cm-item:hover {
              background: #3a3a3a;
            }
            .cm-item.red { color: #ef4444; }
            .cm-item.red:hover { background: rgba(239, 68, 68, 0.1); }
            .divider { height: 1px; background: #3a3a3a; margin: 4px 0; }
            
            .confirm-row {
              padding: 8px 16px;
              display: flex;
              flex-direction: column;
              gap: 8px;
            }
            .confirm-btns {
              display: flex;
              gap: 8px;
            }
            .confirm-btn {
              flex: 1;
              padding: 6px;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 700;
              cursor: pointer;
              border: none;
            }
          `}</style>

          {cmState.type === 'song' ? (
            !showSubMenu ? (
              <>
                <button className="cm-item" onClick={() => { playSong(cmState.song); setCmState({ isOpen: false }) }}>
                  <FiPlay size={16} /> Play Now
                </button>
                <button className="cm-item" onClick={() => { addToQueue(cmState.song); setCmState({ isOpen: false }) }}>
                  <FiPlus size={16} /> Add to Queue
                </button>
                <button className="cm-item" onClick={(e) => { e.stopPropagation(); setShowSubMenu(true) }}>
                  <FiPlus size={16} /> Add to Playlist <span style={{ marginLeft: 'auto' }}>❯</span>
                </button>
                <button className="cm-item" onClick={() => { shareSong(cmState.song); setCmState({ isOpen: false }) }}>
                  <FiLink size={16} /> Share
                </button>
                <button className="cm-item" onClick={() => { window.dispatchEvent(new CustomEvent('open-eq-modal')); setCmState({ isOpen: false }) }}>
                  <FiSliders size={16} /> Equalizer
                </button>
                
                {cmState.playlistName && (
                  <>
                    <div className="divider" />
                    {confirmItem === 'remove' ? (
                      <div className="confirm-row">
                        <p style={{ color: '#b3b3b3', fontSize: '12px', margin: 0 }}>Remove '{cmState.song.title}'?</p>
                        <div className="confirm-btns">
                          <button className="confirm-btn" style={{ background: '#3a3a3a', color: '#fff' }} onClick={() => setConfirmItem(null)}>Cancel</button>
                          <button className="confirm-btn" style={{ background: '#ef4444', color: '#fff' }} onClick={handleRemove}>Remove</button>
                        </div>
                      </div>
                    ) : (
                      <button className="cm-item red" onClick={(e) => { e.stopPropagation(); setConfirmItem('remove') }}>
                        <FiTrash2 size={16} /> {cmState.playlistName === 'Liked Songs' ? 'Unlike Song' : 'Remove from this Playlist'}
                      </button>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                <div style={{ padding: '4px 16px 8px', borderBottom: '1px solid #3a3a3a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={(e) => { e.stopPropagation(); setShowSubMenu(false) }} style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', padding: 4 }}>❮</button>
                  <span style={{ color: '#b3b3b3', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Add to playlist</span>
                </div>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }} className="hide-scrollbar">
                  <button className="cm-item" style={{ color: 'var(--accent)', fontWeight: 700 }} onClick={() => { 
                    window.dispatchEvent(new CustomEvent('open-create-playlist'));
                    setCmState({ isOpen: false });
                  }}>
                    <FiPlus size={16} /> Create new playlist
                  </button>
                  <div className="divider" style={{ margin: '4px 0' }} />
                  {userPlaylists.filter(p => p.name !== 'Liked Songs').map(pl => (
                    <button key={pl.name} className="cm-item" onClick={() => { 
                      addSongToPlaylist(pl.name, cmState.song);
                      setCmState({ isOpen: false });
                    }}>
                      {pl.name}
                    </button>
                  ))}
                </div>
              </>
            )
          ) : cmState.type === 'playlist' ? (
            <>
              <button className="cm-item" onClick={() => { 
                window.dispatchEvent(new CustomEvent('open-edit-playlist', { detail: { playlistName: cmState.playlistName } }));
                setCmState({ isOpen: false });
              }}>
                <span style={{ fontSize: 16 }}>✏</span> Edit playlist details
              </button>
              <button className="cm-item" onClick={() => { 
                const el = document.getElementById('playlist-search');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                setCmState({ isOpen: false });
              }}>
                <FiPlus size={16} /> Add songs
              </button>
              <button className="cm-item" onClick={() => { toast.success("Playlist link copied"); setCmState({ isOpen: false }) }}>
                <FiLink size={16} /> Share playlist
              </button>
              <div className="divider" />
              <button className="cm-item red" onClick={() => { setDeleteModal({ isOpen: true, playlistName: cmState.playlistName }); setCmState({ isOpen: false }) }}>
                <FiTrash2 size={16} /> Delete playlist
              </button>
            </>
          ) : null}
        </div>
      )}

      {/* ─── DELETE PLAYLIST MODAL ─── */}
      {deleteModal.isOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          zIndex: 10002, display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            background: '#242424', borderRadius: '12px', padding: '28px', width: '380px',
            animation: 'modalScaleIn 0.2s ease', boxShadow: '0 12px 48px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: '0 0 12px 0' }}>Delete playlist?</h3>
            <p style={{ color: '#b3b3b3', fontSize: '14px', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              This will delete '{deleteModal.playlistName}' from Your Library. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setDeleteModal({ isOpen: false, playlistName: null })}
                style={{ background: 'none', border: '1px solid #535353', color: '#fff', padding: '10px 24px', borderRadius: '24px', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  deletePlaylist(deleteModal.playlistName);
                  setDeleteModal({ isOpen: false, playlistName: null });
                  window.dispatchEvent(new CustomEvent('playlist-deleted', { detail: { name: deleteModal.playlistName } }));
                }}
                style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '10px 24px', borderRadius: '24px', fontWeight: 700, cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EQUALIZER MODAL (Existing logic but refined) */}
      {eqOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
          zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.25s ease'
        }} onMouseDown={() => setEqOpen(false)}>
          <div style={{
            background: '#242424', borderRadius: '16px', padding: '24px', width: '320px',
            animation: 'modalScaleIn 0.25s ease'
          }} onMouseDown={e => e.stopPropagation()}>
            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, marginBottom: '24px', textAlign: 'center' }}>Equalizer</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', height: '160px', marginBottom: '24px' }}>
              {['Bass', 'Low Mid', 'Mid', 'High Mid', 'Treble'].map((label, i) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <input type="range" min="-12" max="12" value={localEq[i]} onChange={(e) => { const n=[...localEq]; n[i]=Number(e.target.value); setLocalEq(n); }}
                    style={{ writingMode: 'vertical-lr', direction: 'rtl', appearance: 'slider-vertical', width: '8px', height: '120px', accentColor: '#8B5CF6' }} />
                  <span style={{ color: '#b3b3b3', fontSize: '10px', fontWeight: 600, width: '40px', textAlign: 'center' }}>{label}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setLocalEq([0,0,0,0,0])} style={{ background: 'none', border: '1px solid #535353', color: '#fff', borderRadius: '24px', padding: '8px 24px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>Reset</button>
              <button onClick={() => { setEqBands(localEq); toast.success('Equalizer applied'); setEqOpen(false); }} style={{ background: '#fff', border: 'none', color: '#000', borderRadius: '24px', padding: '8px 24px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CREATE/EDIT PLAYLIST MODAL ─── */}
      {playlistModal.isOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10005,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.25s ease'
        }} onMouseDown={() => setPlaylistModal(p => ({ ...p, isOpen: false }))}>
          
          <div style={{
            background: '#121212', borderRadius: '16px', width: '90%', maxWidth: '520px', 
            maxHeight: '85vh', overflowY: 'auto', padding: 0, position: 'relative',
            animation: 'modalScaleIn 0.25s ease', boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
            border: '1px solid rgba(255,255,255,0.1)'
          }} className="hide-scrollbar" onMouseDown={e => e.stopPropagation()}>
            
            <button onClick={() => setPlaylistModal(p => ({ ...p, isOpen: false }))} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', zIndex: 10, width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiX size={20} />
            </button>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '32px 24px 24px', display: 'flex', flexDirection: window.innerWidth < 480 ? 'column' : 'row', gap: '24px', alignItems: 'center' }}>
                <div style={{ width: '160px', height: '160px', background: '#282828', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                  <span style={{ fontSize: '64px' }}>🎵</span>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', width: '100%' }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#b3b3b3', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Playlist Details</p>
                  <input type="text" value={playlistModal.name} onChange={e => setPlaylistModal(p => ({ ...p, name: e.target.value }))}
                    placeholder="Playlist Name"
                    style={{ background: 'transparent', border: 'none', borderBottom: '2px solid #333', color: '#fff', fontSize: '24px', fontWeight: 800, outline: 'none', paddingBottom: '8px', marginBottom: '20px', width: '100%' }} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={handleSavePlaylist} style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '24px', padding: '12px 36px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', transition: 'transform 0.2s' }} onMouseDown={e=>e.currentTarget.style.transform='scale(0.95)'} onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}>
                      {playlistModal.editingName ? 'Save Changes' : 'Create Playlist'}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #282828', padding: '24px', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: 700, margin: 0 }}>Add songs to your playlist</h4>
                  <span style={{ fontSize: '11px', color: '#8B5CF6', fontWeight: 800, background: 'rgba(139,92,246,0.1)', padding: '2px 8px', borderRadius: '4px' }}>{playlistModal.songs.length} SELECTED</span>
                </div>
                
                <div style={{ position: 'relative', marginBottom: '20px' }}>
                  <FiPlus size={18} color="#b3b3b3" style={{ position: 'absolute', top: '12px', left: '12px', transform: 'rotate(45deg)' }} />
                  <input 
                    type="text" 
                    placeholder="Search from your history or library" 
                    value={playlistModal.searchQuery} 
                    onChange={e => setPlaylistModal(p => ({ ...p, searchQuery: e.target.value }))} 
                    style={{ width: '100%', background: '#242424', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '14px', padding: '12px 12px 12px 40px', outline: 'none', transition: 'border-color 0.2s' }} 
                    onFocus={e => e.currentTarget.style.borderColor = '#8B5CF6'}
                    onBlur={e => e.currentTarget.style.borderColor = '#333'}
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '300px', overflowY: 'auto' }} className="hide-scrollbar">
                  {masterPlaylistData
                    .filter(s => s.title.toLowerCase().includes(playlistModal.searchQuery.toLowerCase()) || s.artist.toLowerCase().includes(playlistModal.searchQuery.toLowerCase()))
                    .slice(0, 15)
                    .map((song, i) => {
                    const isAdded = playlistModal.songs.some(s => s.videoId === song.videoId)
                    return (
                      <div key={song.videoId || i} style={{ display: 'flex', alignItems: 'center', padding: '8px', borderRadius: '8px', background: isAdded ? 'rgba(139,92,246,0.05)' : 'transparent', transition: 'background 0.2s' }}>
                        <img src={song.thumbnail} alt="" style={{ width: '40px', height: '40px', borderRadius: '4px', marginRight: '12px', objectFit: 'cover' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p className="truncate" style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0 }}>{song.title}</p>
                          <p className="truncate" style={{ color: '#b3b3b3', fontSize: '12px', margin: 0 }}>{song.artist}</p>
                        </div>
                        <button 
                          onClick={() => { 
                            if(!isAdded) setPlaylistModal(p => ({ ...p, songs: [song, ...p.songs] })); 
                            else setPlaylistModal(p => ({ ...p, songs: p.songs.filter(s => s.videoId !== song.videoId) }));
                          }}
                          style={{ 
                            background: isAdded ? '#8B5CF6' : 'transparent', 
                            border: isAdded ? 'none' : '1px solid #535353', 
                            borderRadius: '24px', color: isAdded ? '#fff' : '#fff', 
                            padding: '6px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', minWidth: '80px' 
                          }}>
                          {isAdded ? 'Added' : 'Add'}
                        </button>
                      </div>
                    )
                  })}
                  {masterPlaylistData.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#b3b3b3', fontSize: '13px', padding: '20px' }}>Listen to some songs first to add them here!</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
