const SHAZAM_API = (q, limit = 5) => `https://betadash-api-swordslush-production.up.railway.app/shazam?title=${encodeURIComponent(q)}&limit=${limit}`;

const urlInput = document.getElementById('urlInput');
const btn = document.getElementById('downloadBtn');
const status = document.getElementById('status');
const resultBox = document.getElementById('result');

function setStatus(m, t) { status.className = 'status' + (t ? ' ' + t : ''); status.textContent = m || ''; }
function setLoading(on) { btn.disabled = on; btn.innerHTML = on ? '<span class="spinner"></span>Searching…' : 'Search'; }
function clear() { resultBox.innerHTML = ''; setStatus(''); }
function escape(s) { const d = document.createElement('div'); d.textContent = String(s || ''); return d.innerHTML; }

function pickResults(data) {
  const arr = data?.results || data?.tracks || data?.data || (Array.isArray(data) ? data : []);
  return (arr || []).map(t => ({
    title: t.title || t.name || t.song || '',
    artist: t.artistName || t.subtitle || t.artist || t.author || (Array.isArray(t.artists) ? t.artists.map(a => a.name || a).join(', ') : ''),
    album: t.albumName || '',
    cover: t.thumbnail || t.cover || t.coverart || t.image || t.images?.coverart || '',
    preview: t.previewUrl || t.preview || t.audioUrl || t.url || '',
    appleUrl: t.appleMusicUrl || t.apple_music_url || t.share?.href || '',
  })).filter(t => t.title);
}

async function run() {
  const q = urlInput.value.trim();
  clear();
  if (!q) return setStatus('⚠️ Please enter a song title to search.', 'error');

  setLoading(true); setStatus('⏳ Searching tracks…');
  try {
    const r = await fetch(SHAZAM_API(q, 6));
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    console.log('Shazam response', data);

    const tracks = pickResults(data);
    if (!tracks.length) throw new Error('No results found');

    let html = `<div class="results-list">`;
    tracks.forEach((t) => {
      html += `<div class="result">
        ${t.cover ? `<img class="cover" src="${t.cover}" alt="" onerror="this.style.visibility='hidden'">` : '<div class="cover"></div>'}
        <div class="info">
          <div class="ti">${escape(t.title)}</div>
          ${t.artist ? `<div class="ar">${escape(t.artist)}</div>` : ''}
          ${t.preview ? `<audio class="preview-audio" src="${t.preview}" controls preload="none"></audio>` : ''}
        </div>
        <div class="row-actions">
          ${t.preview ? `<a class="dl-mini" href="${t.preview}" download="${escape((t.title || 'track').replace(/[^\w\s-]/g, '').slice(0, 40))}.m4a" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>MP3
          </a>` : ''}
          ${t.appleUrl ? `<a class="dl-mini alt" href="${t.appleUrl}" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24"><path d="M14 3l-8 4v8.18A4 4 0 1 0 8 19V9l6-3v6.18A4 4 0 1 0 16 16V3z"/></svg>Open
          </a>` : ''}
        </div>
      </div>`;
    });
    html += `</div>
    <div class="preview-note">ℹ️ Spotify direct download is not allowed. We provide official 30-second previews + Apple Music links.</div>`;

    resultBox.innerHTML = html;
    setStatus('');
  } catch (e) {
    console.error(e);
    setStatus('❌ Failed to search. Please try again.', 'error');
  } finally { setLoading(false); }
}

btn.addEventListener('click', run);
urlInput.addEventListener('keypress', e => { if (e.key === 'Enter') run(); });
