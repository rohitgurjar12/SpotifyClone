(() => {
  const STORAGE_KEYS = {
    playlists: 'spotifyPlaylists',
    wishlist: 'spotifyWishlist',
  };

  const $ = (sel, parent = document) => parent.querySelector(sel);
  const $$ = (sel, parent = document) => Array.from(parent.querySelectorAll(sel));

  const ensureLoggedIn = () => {
    const userRaw = localStorage.getItem('spotifyUser');
    if (!userRaw) {
      window.location.href = 'login.html';
      return null;
    }
    try {
      return JSON.parse(userRaw);
    } catch {
      return { raw: userRaw };
    }
  };

  const safeId = () =>
    (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : String(Date.now()) + '_' + Math.random().toString(16).slice(2);

  const loadJSON = (key, fallback) => {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    try {
      const parsed = JSON.parse(raw);
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  };

  const saveJSON = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  const normalizeTrack = (track) => {
    // Minimal structure for demo.
    // track can be passed as { title, artist, cover, sourceUrl }.
    return {
      id: track.id || safeId(),
      title: track.title || track.name || 'Unknown title',
      artist: track.artist || 'Unknown artist',
      cover: track.cover || '',
      sourceUrl: track.sourceUrl || '#',
      addedAt: Date.now(),
    };
  };

  const renderEmpty = (container, message) => {
    container.innerHTML = `
      <div class="empty-state">
        <p>${message}</p>
      </div>
    `;
  };

  const trackCard = (track, opts = {}) => {
    const coverHTML = track.cover
      ? `<img class="track-cover" src="${track.cover}" alt="cover">`
      : `<div class="track-cover placeholder"></div>`;

    const wishlistBtnLabel = opts.wishlistIn ? 'Remove' : 'Add to wishlist';
    const wishlistBtnIcon = opts.wishlistIn ? 'fa-solid fa-xmark' : 'fa-solid fa-heart';

    return `
      <div class="track-item" data-track-id="${track.id}">
        ${coverHTML}
        <div class="track-meta">
          <div class="track-title">${escapeHTML(track.title)}</div>
          <div class="track-artist">${escapeHTML(track.artist)}</div>
        </div>
        <div class="track-actions">
          ${opts.showWishlistButton ? `
            <button class="badge wishlist-toggle" data-track-id="${track.id}" data-wishlist-action="${opts.wishlistIn ? 'remove' : 'add'}">
              <i class="fa ${wishlistBtnIcon}"></i>
              <span>${wishlistBtnLabel}</span>
            </button>
          ` : ''}
        
        </div>
      </div>
    `;
  };

  const escapeHTML = (s) => String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '<')
    .replaceAll('>', '>')
    .replaceAll('"', '"')
    .replaceAll("'", '&#039;');

  const escapeAttr = (s) => escapeHTML(s).replaceAll('`', '&#096;');

  // --------- Playlist management (minimal) ----------
  const removePlaylist = (playlistId) => {
    const playlists = loadJSON(STORAGE_KEYS.playlists, []);
    const next = playlists.filter((p) => p.id !== playlistId);
    saveJSON(STORAGE_KEYS.playlists, next);
  };

  const createPlaylist = (name) => {
    const playlists = loadJSON(STORAGE_KEYS.playlists, []);
    const playlist = {
      id: safeId(),
      name: name || `Playlist ${playlists.length + 1}`,
      tracks: [],
      createdAt: Date.now(),
    };
    playlists.unshift(playlist);
    saveJSON(STORAGE_KEYS.playlists, playlists);
    return playlist;
  };

  const addToPlaylist = (playlistId, track) => {
    const playlists = loadJSON(STORAGE_KEYS.playlists, []);
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;
    playlist.tracks = playlist.tracks || [];
    const normalized = normalizeTrack(track);
    // Prevent duplicates by title+artist (simple)
    const exists = playlist.tracks.some(
      (t) => t.title === normalized.title && t.artist === normalized.artist
    );
    if (!exists) playlist.tracks.unshift(normalized);
    saveJSON(STORAGE_KEYS.playlists, playlists);
  };

  // --------- Wishlist management ----------
  const addToWishlist = (track) => {
    const wishlist = loadJSON(STORAGE_KEYS.wishlist, []);
    const normalized = normalizeTrack(track);
    const exists = wishlist.some((t) => t.id === normalized.id || (t.title === normalized.title && t.artist === normalized.artist));
    if (!exists) wishlist.unshift(normalized);
    saveJSON(STORAGE_KEYS.wishlist, wishlist);
  };

  const removeFromWishlist = (trackId) => {
    const wishlist = loadJSON(STORAGE_KEYS.wishlist, []);
    const next = wishlist.filter((t) => t.id !== trackId);
    saveJSON(STORAGE_KEYS.wishlist, next);
  };

  // --------- Rendering ----------
  const renderProfileUser = (user) => {
    const el = $('#profileUserLine');
    if (el) {
      const display = user?.name || user?.email || user?.phone || 'User';
      el.textContent = display;
    }

    const meta = $('#profileMeta');
    if (meta) {
      const display = user?.name || user?.email || user?.phone || 'Spotify user';
      meta.textContent = display;
    }
  };

  const renderPlaylists = () => {
    const playlists = loadJSON(STORAGE_KEYS.playlists, []);
    const playlistsSection = $('#playlistsSection');
    const playlistsCount = $('#playlistsCount');
    if (playlistsCount) playlistsCount.textContent = String(playlists.length);

    if (!playlistsSection) return;

    if (!playlists.length) {
      renderEmpty(playlistsSection, 'No playlists yet. Create your first playlist!');
      return;
    }

    playlistsSection.innerHTML = playlists
      .map((p) => {
        const tracksHTML = (p.tracks && p.tracks.length)
          ? p.tracks.slice(0, 6).map((t) => `
              <div class="wishlist-in-playlist">
                <div class="wishlist-in-playlist-meta">
                  <div class="track-title">${escapeHTML(t.title)}</div>
                  <div class="track-artist">${escapeHTML(t.artist)}</div>
                </div>
              </div>
            `).join('')
          : `<div class="muted">No tracks added yet.</div>`;

        return `
          <div class="playlist-card" data-playlist-id="${p.id}">
              <div class="playlist-header">
              <div class="playlist-name">${escapeHTML(p.name)}</div>
              <div class="playlist-actions">
                <button class="badge remove-playlist" data-playlist-id="${p.id}" data-remove="playlist">
                  <i class="fa-solid fa-trash"></i>
                  <span>Remove</span>
                </button>
                <button class="badge add-demo-track" data-playlist-id="${p.id}">
                  <i class="fa-solid fa-plus"></i> <span>Add demo track</span>
                </button>
              </div>
            </div>
            <div class="playlist-tracks">${tracksHTML}</div>
          </div>
        `;
      })
      .join('');
  };

  const renderWishlist = () => {
    const wishlist = loadJSON(STORAGE_KEYS.wishlist, []);
    const wishlistSection = $('#wishlistSection');
    const wishlistCount = $('#wishlistCount');
    if (wishlistCount) wishlistCount.textContent = `${wishlist.length} items`;

    if (!wishlistSection) return;

    if (!wishlist.length) {
      renderEmpty(wishlistSection, 'Your wishlist is empty. Add songs from the home page.');
      return;
    }

    wishlistSection.innerHTML = wishlist
      .map((t) => trackCard(t, { showWishlistButton: true, wishlistIn: true }))
      .join('');
  };

  const bindEvents = () => {
    const createPlaylistBtn = $('#createPlaylistBtn');
    const createWishlistBtn = $('#createWishlistBtn');

    if (createPlaylistBtn) {
      createPlaylistBtn.addEventListener('click', () => {
        const name = prompt('Playlist name?');
        if (!name) return;
        createPlaylist(name.trim());
        renderPlaylists();
      });
    }

    if (createWishlistBtn) {
      createWishlistBtn.addEventListener('click', () => {
        // Wishlist array is created lazily; this button is just a nicer UX.
        // Add a demo track so it becomes "working" immediately.
        const demoTrack = {
          title: 'Demo Song',
          artist: 'Demo Artist',
          cover: 'assets/album_picture.jpeg',
          // sourceUrl: '#',
        };
        addToWishlist(demoTrack);
        renderWishlist();
      });
    }

    const logoutBtn = $('#logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to log out?')) {
          localStorage.removeItem('spotifyUser');
          window.location.href = 'login.html';
        }
      });
    }

    const wishlistSection = $('#wishlistSection');
    if (wishlistSection) {
      wishlistSection.addEventListener('click', (e) => {
        const btn = e.target.closest('.wishlist-toggle');
        if (!btn) return;

        const trackId = btn.getAttribute('data-track-id');
        const action = btn.getAttribute('data-wishlist-action');
        if (!trackId) return;

        if (action === 'remove') {
          removeFromWishlist(trackId);
          renderWishlist();
          renderPlaylists();
        }
      });
    }

    const playlistsSection = $('#playlistsSection');
    if (playlistsSection) {
      playlistsSection.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.remove-playlist');
        if (removeBtn) {
          const playlistId = removeBtn.getAttribute('data-playlist-id');
          if (!playlistId) return;
          if (!confirm('Remove this playlist?')) return;
          removePlaylist(playlistId);
          renderPlaylists();
          renderWishlist();
          return;
        }
        const btn = e.target.closest('.add-demo-track');
        if (!btn) return;
        const playlistId = btn.getAttribute('data-playlist-id');
        if (!playlistId) return;

        const demoTrack = {
          title: 'Demo Song ' + new Date().toLocaleTimeString(),
          artist: 'Demo Artist',
          cover: 'assets/album_picture.jpeg',
          sourceUrl: '#',
        };

        addToPlaylist(playlistId, demoTrack);
        renderPlaylists();
      });
    }

    const yourLibraryLink = $('#yourLibraryLink');
    if (yourLibraryLink) {
      yourLibraryLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'profile.html';
      });
    }

    const libraryPlusBtn = $('#libraryPlusBtn');
    if (libraryPlusBtn) {
      libraryPlusBtn.addEventListener('click', () => {
        const name = prompt('Playlist name?');
        if (!name) return;
        createPlaylist(name.trim());
        renderPlaylists();
      });
    }
  };

  // Called from index.html buttons.
  window.spotifyLibrary = {
    addTrackToWishlist: (track) => {
      addToWishlist(track);
      renderWishlist();
    },
    createPlaylist: (name) => {
      const playlist = createPlaylist(name);
      renderPlaylists();
      return playlist;
    },
  };

  // --------- Init ----------
  const init = () => {
    const user = ensureLoggedIn();
    if (!user) return;

    renderProfileUser(user);

    // Seed storage shape if missing (so counts work nicely)
    loadJSON(STORAGE_KEYS.playlists, []);
    loadJSON(STORAGE_KEYS.wishlist, []);

    renderPlaylists();
    renderWishlist();
    bindEvents();
  };

  document.addEventListener('DOMContentLoaded', init);
})();

