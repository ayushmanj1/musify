const lyricsCache = new Map();

export async function fetchLyrics(artist, title) {
  if (!artist || !title) return null;
  const key = `${artist.toLowerCase()}|${title.toLowerCase()}`;
  if (lyricsCache.has(key)) {
    return lyricsCache.get(key);
  }

  // Clean title: remove " (Official Video)", " [Lyrics]", etc.
  const cleanTitle = title.replace(/\s*[([].*?[)\]]\s*/g, '').trim();
  const cleanArtist = artist.split(',')[0].trim(); // Take first artist

  try {
    // 1. LRCLIB (Most reliable free API)
    const lrclibRes = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(cleanArtist + ' ' + cleanTitle)}`);
    if (lrclibRes.ok) {
      const data = await lrclibRes.json();
      if (Array.isArray(data) && data.length > 0) {
        // Find closest match or just use first
        const track = data.find(t => t.instrumental === false) || data[0];
        if (track && (track.syncedLyrics || track.plainLyrics)) {
          const lyrics = track.syncedLyrics ? track.syncedLyrics.replace(/\[.*?\]/g, '').trim() : track.plainLyrics;
          lyricsCache.set(key, lyrics);
          return lyrics;
        }
      }
    }

    // 2. Lyrics.ovh
    const res1 = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`);
    if (res1.ok) {
      const data = await res1.json();
      if (data.lyrics) {
        let lyrics = data.lyrics;
        if (lyrics.startsWith('Paroles de la chanson')) {
          lyrics = lyrics.split('\r\n\r\n').slice(1).join('\n\n');
        }
        lyricsCache.set(key, lyrics);
        return lyrics;
      }
    }

    // 3. Lyrist
    const res2 = await fetch(`https://lyrist.vercel.app/api/${encodeURIComponent(cleanTitle)}/${encodeURIComponent(cleanArtist)}`);
    if (res2.ok) {
      const data = await res2.json();
      if (data.lyrics) {
        lyricsCache.set(key, data.lyrics);
        return data.lyrics;
      }
    }

    return null;
  } catch (error) {
    console.error('Lyrics fetch error:', error);
    return null; // Return null instead of throwing to prevent unhandled rejections
  }
}
