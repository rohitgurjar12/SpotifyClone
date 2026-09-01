(function () {
    const STORAGE_KEY = 'spotifyNowPlaying';
    const PLAYBACK_STATE_KEY = 'spotifyPlaybackState';
    const LIKED_KEY = 'spotifyLikedSongs';
    const CATALOG_KEY = 'spotifyCatalog';
    const API_URL = 'https://itunes.apple.com/search';
    const PREVIEW_LIMIT_SECONDS = 30;

    const getUserKeySuffix = () => {
        const user = (() => {
            try {
                return JSON.parse(localStorage.getItem('spotifyUser') || 'null');
            } catch {
                return null;
            }
        })();
        const identity = user?.email || user?.phone || user?.name || 'guest';
        return String(identity).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'guest';
    };
    const getScopedStorageKey = (key) => `${key}_${getUserKeySuffix()}`;

    const fallbackTracks = [];

    const readTrack = () => {
        try { return JSON.parse(localStorage.getItem(getScopedStorageKey(STORAGE_KEY))) || null; } catch { return null; }
    };

    const addCurrentTrackToPlaylist = (track) => {
        // Open modal to let user choose playlist
        showPlaylistModal(track);
    };

    const showPlaylistModal = (track) => {
        const modal = document.querySelector('#playlistModal');
        const overlay = document.querySelector('#playlistModalOverlay');
        const playlistList = document.querySelector('#playlistList');
        
        if (!modal || !playlistList) return;

        const playlists = JSON.parse(localStorage.getItem(getScopedStorageKey('spotifyPlaylists')) || '[]');
        
        // Build playlist options
        let html = '<div class="playlist-options">';
        if (playlists.length > 0) {
            html += playlists.map(pl => `
                <button class="playlist-option" data-playlist-id="${pl.id}" type="button">
                    <div class="playlist-option-name">${pl.name}</div>
                    <div class="playlist-option-count">${(pl.tracks || []).length} songs</div>
                </button>
            `).join('');
        } else {
            html += '<p class="no-playlists">No playlists yet. Create one to get started!</p>';
        }
        html += '</div>';
        
        playlistList.innerHTML = html;

        // Show modal
        modal.style.display = 'block';
        if (overlay) overlay.style.display = 'block';

        // Handle playlist selection
        playlistList.querySelectorAll('.playlist-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const playlistId = btn.getAttribute('data-playlist-id');
                addTrackToSelectedPlaylist(track, playlistId);
                closePlaylistModal();
            });
        });
    };

    const closePlaylistModal = () => {
        const modal = document.querySelector('#playlistModal');
        const overlay = document.querySelector('#playlistModalOverlay');
        if (modal) modal.style.display = 'none';
        if (overlay) overlay.style.display = 'none';
    };

    const addTrackToSelectedPlaylist = (track, playlistId) => {
        const playlists = JSON.parse(localStorage.getItem(getScopedStorageKey('spotifyPlaylists')) || '[]');
        const playlist = playlists.find(p => p.id === playlistId);
        
        if (!playlist) return;

        const alreadyExists = (playlist.tracks || []).some((item) => item.title === track.title && item.artist === track.artist);
        if (!alreadyExists) {
            playlist.tracks = playlist.tracks || [];
            playlist.tracks.unshift({ ...track, id: `${track.title}-${track.artist}` });
            localStorage.setItem(getScopedStorageKey('spotifyPlaylists'), JSON.stringify(playlists));
            
            updateAddButtonState(track);
            // Show success feedback
            showPlaylistAddedMessage(playlist.name);
        } else {
            updateAddButtonState(track);
            alert('This song is already in this playlist!');
        }
    };

    const showPlaylistAddedMessage = (playlistName) => {
        const toast = document.querySelector('#toastNotification');
        const toastMsg = document.querySelector('#toastMessage');
        
        if (!toast || !toastMsg) return;

        toastMsg.textContent = `Added to "${playlistName}"`;
        toast.style.display = 'block';
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.style.display = 'none';
            }, 300);
        }, 900);
    };

    const writeTrack = (track) => localStorage.setItem(getScopedStorageKey(STORAGE_KEY), JSON.stringify(track));
    const readPlaybackState = () => {
        try { return JSON.parse(localStorage.getItem(getScopedStorageKey(PLAYBACK_STATE_KEY))) || { isPlaying: false }; } catch { return { isPlaying: false }; }
    };
    const writePlaybackState = (state) => localStorage.setItem(getScopedStorageKey(PLAYBACK_STATE_KEY), JSON.stringify(state));
     const readPlaylists = () => {
        try { return JSON.parse(localStorage.getItem(getScopedStorageKey('spotifyPlaylists')) || '[]'); } catch { return []; }
    };
    const isTrackInAnyPlaylist = (track) => {
        if (!track) return false;
        return readPlaylists().some((playlist) => (playlist.tracks || []).some((item) => item.title === track.title && item.artist === track.artist));
    };
    const updateAddButtonState = (track) => {
        const button = document.querySelector('#addToPlaylistButton');
        if (!button) return;
        const added = isTrackInAnyPlaylist(track);
        button.classList.toggle('is-added', added);
        button.setAttribute('aria-label', added ? 'Added to playlist' : 'Add to playlist');
        button.title = added ? 'Added to playlist' : 'Add to playlist';
        button.innerHTML = `<i class="fa-solid fa-${added ? 'check' : 'plus'}"></i>`;
    };
    const readCatalog = () => {
        try {
            const raw = localStorage.getItem(CATALOG_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    };
    const writeCatalog = (tracks) => localStorage.setItem(CATALOG_KEY, JSON.stringify(tracks));
    const readLiked = () => {
        try { return JSON.parse(localStorage.getItem(getScopedStorageKey(LIKED_KEY))) || []; } catch { return []; }
    };
    const isLiked = (track) => readLiked().some((item) => item.title === track.title && item.artist === track.artist);
    const updateLikeButton = (track) => {
        const button = document.querySelector('#likeButton');
        if (!button) return;
        const liked = isLiked(track);
        button.classList.toggle('is-liked', liked);
        button.setAttribute('aria-label', liked ? 'Unlike song' : 'Like song');
        button.title = liked ? 'Unlike song' : 'Like song';
        button.innerHTML = `<i class="fa-${liked ? 'solid' : 'regular'} fa-heart"></i>`;
    };
    const toggleLike = (track) => {
        const liked = readLiked();
        const index = liked.findIndex((item) => item.title === track.title && item.artist === track.artist);
        if (index >= 0) liked.splice(index, 1); else liked.unshift({ ...track, id: `${track.title}-${track.artist}` });
        localStorage.setItem(getScopedStorageKey(LIKED_KEY), JSON.stringify(liked));
        updateLikeButton(track);
        window.dispatchEvent(new Event('spotifylikedchange'));
    };
    const formatTime = (seconds) => {
        if (!Number.isFinite(seconds)) return '0:00';
        return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
    };

    function buildTrackFromApi(song) {
        return {
            title: song.trackName || song.title || 'Unknown title',
            artist: song.artistName || song.artist || 'Unknown artist',
            cover: song.artworkUrl100 || song.cover || 'assets/album_picture.jpeg',
            apiCover: song.artworkUrl100 || song.cover || 'assets/album_picture.jpeg',
            previewUrl: song.previewUrl || '',
            audioUrl: song.previewUrl || '',
            downloadUrl: song.previewUrl || '',
            album: song.collectionName || song.album || 'Featured track'
        };
    }

    async function resolvePreview(track) {
        if (track.audioUrl || track.downloadUrl) return track;
        try {
            const response = await fetch(`${API_URL}?term=${encodeURIComponent(`${track.title} ${track.artist}`)}&entity=song&limit=1`);
            const result = await response.json();
            const song = result.results && result.results[0];
            if (song && song.previewUrl) {
                return {
                    ...track,
                    previewUrl: song.previewUrl,
                    audioUrl: song.previewUrl,
                    downloadUrl: song.previewUrl,
                    album: song.collectionName || 'Featured song',
                    apiCover: song.artworkUrl100 || track.cover
                };
            }
        } catch (error) {
            console.warn('Preview lookup unavailable', error);
        }
        return track;
    }

    async function setTrack(track, autoPlay) {
        const resolved = await resolvePreview(track || {});
        const next = { ...resolved, startedAt: Date.now() };
        writeTrack(next);
        writePlaybackState({ track: next, isPlaying: !!autoPlay });
        window.dispatchEvent(new CustomEvent('spotifytrackchange', { detail: next }));
        if (autoPlay) window.dispatchEvent(new CustomEvent('spotifyautoplay', { detail: next }));
        return next;
    }

    async function playTrack(track) {
        const resolved = await resolvePreview(track);
        setTrack(resolved, true);
    }

    function collectHomeTracks() {
        const catalog = readCatalog();
        if (catalog.length) return catalog;
        return [...document.querySelectorAll('.card')].map((card) => ({
            title: card.querySelector('.card-title')?.textContent.trim(),
            artist: card.querySelector('.card-info')?.textContent.trim() || 'Various artists',
            cover: card.querySelector('.card-img')?.getAttribute('src'),
            apiCover: card.querySelector('.card-img')?.getAttribute('src')
        })).filter((track) => track.title && track.cover);
    }

    function updateBar(track) {
        const title = document.querySelector('#playerSongTitle');
        const artist = document.querySelector('#playerSongArtist');
        const cover = document.querySelector('#playerCover');
        if (title) title.textContent = track.title;
        if (artist) artist.textContent = track.artist;
        if (cover) cover.src = track.apiCover || track.cover || 'assets/album_picture.jpeg';
        updateLikeButton(track);
         updateAddButtonState(track);
    }

    function getTrackAudioSource(track) {
        return track.audioUrl || track.previewUrl || track.downloadUrl || '';
    }

    function enforcePreviewLimit(audio) {
        if (!audio || !Number.isFinite(audio.currentTime)) return;
        if (audio.duration > PREVIEW_LIMIT_SECONDS && audio.currentTime >= PREVIEW_LIMIT_SECONDS) {
            audio.pause();
            audio.currentTime = PREVIEW_LIMIT_SECONDS;
        }
    }

    function initBar() {
        const audio = document.querySelector('#globalAudio');
        if (!audio) return;
        let current = readTrack() || fallbackTracks[0];
        const playbackState = readPlaybackState();
        const initialShouldPlay = !!(current && playbackState.isPlaying);

        const hydrateCurrentTrack = async (track, shouldPlay) => {
            if (!track) return;
            const resolved = await resolvePreview(track);
            current = resolved;
            updateBar(resolved);
            const source = getTrackAudioSource(resolved);
            audio.src = source || '';
            audio.load();
            if (source && shouldPlay) {
                audio.currentTime = 0;
                audio.play().catch(() => {});
            }
            writeTrack(resolved);
            writePlaybackState({ track: resolved, isPlaying: !!(source && shouldPlay) });
            toggleIcon();
        };

        updateBar(current);
        audio.volume = Number(document.querySelector('#volumeControl')?.value || 80) / 100;

        const syncHeroPlayButton = () => {
            const heroButton = document.querySelector('#heroPlayButton');
            if (!heroButton) return;
            heroButton.innerHTML = `<i class="fa-solid fa-${audio.paused ? 'play' : 'pause'}"></i>`;
            heroButton.setAttribute('aria-label', audio.paused ? 'Play current song' : 'Pause current song');
        };

        const syncProgress = () => {
            enforcePreviewLimit(audio);
            const progress = document.querySelector('#progressControl');
            const currentTime = document.querySelector('#currentTime');
            const totalTime = document.querySelector('#totalTime');
            if (progress) progress.value = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
            if (currentTime) currentTime.textContent = formatTime(audio.currentTime);
            if (totalTime) totalTime.textContent = formatTime(audio.duration);
        };
        const toggleIcon = () => {
            const button = document.querySelector('#playToggle');
            if (button) button.innerHTML = `<i class="fa-solid fa-${audio.paused ? 'play' : 'pause'}"></i>`;
            syncHeroPlayButton();
        };
        const load = async (track, shouldPlay) => {
            current = track;
            const resolved = await resolvePreview(track || {});
            current = resolved;
            updateBar(resolved);
            const source = getTrackAudioSource(resolved);
            audio.src = source || '';
            audio.load();
            if (source && shouldPlay) {
                audio.currentTime = 0;
                audio.play().catch(() => toggleIcon());
            }
            writeTrack(resolved);
            writePlaybackState({ track: resolved, isPlaying: !!(source && shouldPlay) });
            toggleIcon();
        };

        window.addEventListener('spotifytrackchange', (event) => load(event.detail, false));
        window.addEventListener('spotifyautoplay', (event) => load(event.detail, true));

        if (current && (!current.previewUrl && !current.audioUrl && !current.downloadUrl)) {
            hydrateCurrentTrack(current, initialShouldPlay);
        } else if (current && current.previewUrl) {
            load(current, initialShouldPlay);
        }
        audio.addEventListener('timeupdate', syncProgress);
        audio.addEventListener('loadedmetadata', () => {
            if (audio.duration > PREVIEW_LIMIT_SECONDS) {
                audio.currentTime = 0;
            }
            syncProgress();
        });
        audio.addEventListener('play', () => {
            writePlaybackState({ track: current, isPlaying: true });
            toggleIcon();
        });
        audio.addEventListener('pause', () => {
            writePlaybackState({ track: current, isPlaying: false });
            toggleIcon();
        });
        audio.addEventListener('ended', () => {
            const tracks = collectHomeTracks();
            const index = tracks.findIndex((track) => track.title === current.title && track.artist === current.artist);
            const next = tracks[(index + 1) % tracks.length] || tracks[0];
            if (next) playTrack(next);
        });

        document.querySelector('#playToggle')?.addEventListener('click', () => {
            if (!audio.src) return playTrack(current);
            if (audio.paused) {
                audio.play().catch(() => {});
                writePlaybackState({ track: current, isPlaying: true });
            } else {
                audio.pause();
                writePlaybackState({ track: current, isPlaying: false });
            }
        });
        document.querySelector('#heroPlayButton')?.addEventListener('click', () => {
            if (!audio.src) return playTrack(current);
            if (audio.paused) {
                audio.play().catch(() => {});
                writePlaybackState({ track: current, isPlaying: true });
            } else {
                audio.pause();
                writePlaybackState({ track: current, isPlaying: false });
            }
        });
        document.querySelector('#addToPlaylistButton')?.addEventListener('click', () => {
            addCurrentTrackToPlaylist(current);
        });
        document.querySelector('#previousTrack')?.addEventListener('click', () => {
            const tracks = collectHomeTracks();
            const index = tracks.findIndex((track) => track.title === current.title && track.artist === current.artist);
            const prev = tracks[(index - 1 + tracks.length) % tracks.length] || tracks[0];
            if (prev) playTrack(prev);
        });
        document.querySelector('#nextTrack')?.addEventListener('click', () => {
            const tracks = collectHomeTracks();
            const index = tracks.findIndex((track) => track.title === current.title && track.artist === current.artist);
            const next = tracks[(index + 1) % tracks.length] || tracks[0];
            if (next) playTrack(next);
        });
        document.querySelector('#progressControl')?.addEventListener('input', (event) => {
            if (audio.duration) audio.currentTime = (event.target.value / 100) * audio.duration;
        });
        document.querySelector('#volumeControl')?.addEventListener('input', (event) => { audio.volume = event.target.value / 100; });
        document.querySelector('#playerCover')?.addEventListener('click', () => { window.location.href = 'player.html'; });
        document.querySelector('#likeButton')?.addEventListener('click', () => toggleLike(current));
        document.querySelector('#downloadTrack')?.addEventListener('click', () => {
            const source = getTrackAudioSource(current);
            if (!source) return;
            const link = document.createElement('a');
            link.href = source;
            link.download = `${(current.title || 'song').replace(/[^a-z0-9]/gi, '_')}.mp3`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            link.remove();
        });
        document.querySelector('#heroDownloadButton')?.addEventListener('click', () => {
            const source = getTrackAudioSource(current);
            if (!source) return;
            const link = document.createElement('a');
            link.href = source;
            link.download = `${(current.title || 'song').replace(/[^a-z0-9]/gi, '_')}.mp3`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            link.remove();
        });

        document.querySelectorAll('.card').forEach((card) => {
            card.addEventListener('click', (event) => {
                event.preventDefault();

                const title = card.querySelector('.card-title')?.textContent.trim();
                const artist = card.querySelector('.card-info')?.textContent.trim() || 'Various artists';
                const cover = card.querySelector('.card-img')?.getAttribute('src') || 'assets/album_picture.jpeg';

                if (!title) return;

                const track = {
                    title,
                    artist,
                    cover,
                    apiCover: cover,
                    previewUrl: '',
                    audioUrl: '',
                    album: 'Featured track'
                };

                window.localStorage.setItem(getScopedStorageKey(STORAGE_KEY), JSON.stringify(track));
                window.location.href = 'player.html';
            });
        });

        // Modal event listeners
        document.querySelector('#playlistModalClose')?.addEventListener('click', closePlaylistModal);
        
        document.querySelector('#createNewPlaylistBtn')?.addEventListener('click', () => {
            const playlistName = prompt('Enter playlist name:');
            if (playlistName && playlistName.trim()) {
                const playlists = JSON.parse(localStorage.getItem(getScopedStorageKey('spotifyPlaylists')) || '[]');
                const newPlaylist = {
                    id: `playlist-${Date.now()}`,
                    name: playlistName.trim(),
                    tracks: [],
                    createdAt: Date.now()
                };
                playlists.unshift(newPlaylist);
                localStorage.setItem(getScopedStorageKey('spotifyPlaylists'), JSON.stringify(playlists));
                
                // Get the current track and add it to the new playlist
                const track = readTrack();
                if (track) {
                    addTrackToSelectedPlaylist(track, newPlaylist.id);
                }
                closePlaylistModal();
            }
        });
    }

    async function fetchCatalog(term = 'popular songs') {
        try {
            const response = await fetch(`${API_URL}?term=${encodeURIComponent(term)}&entity=song&limit=20`);
            const result = await response.json();
            const songs = (result.results || []).filter((song) => song.previewUrl).map(buildTrackFromApi);
            if (songs.length) {
                writeCatalog(songs);
                return songs;
            }
        } catch (error) {
            console.warn('Catalog fetch failed', error);
        }
        return [];
    }

    function initPlayerPage() {
        const catalog = document.querySelector('#playerCatalog');
        if (!catalog) return;

        const heroTitle = document.querySelector('#heroSongTitle');
        const heroArtist = document.querySelector('#heroSongArtist');
        const heroCover = document.querySelector('#heroSongCover');
        const renderHero = (track) => {
            if (heroTitle) heroTitle.textContent = track.title;
            if (heroArtist) heroArtist.textContent = track.artist;
            if (heroCover) heroCover.src = track.apiCover || track.cover || 'assets/album_picture.jpeg';
        };

        let tracks = readCatalog().length ? readCatalog() : [];
        const renderCatalog = () => {
            if (!tracks.length) {
                catalog.innerHTML = '<p class="catalog-empty">No songs loaded. Please search for songs from the home page.</p>';
                return;
            }
            catalog.innerHTML = tracks.map((track, index) => `
                <article class="player-track">
                    <span class="track-number">${String(index + 1).padStart(2, '0')}</span>
                    <img src="${track.apiCover || track.cover || 'assets/album_picture.jpeg'}" alt="${track.title}">
                    <div><h3>${track.title}</h3><p>${track.artist}</p></div>
                    <button class="catalog-play" data-track-index="${index}" aria-label="Play ${track.title}"><i class="fa-solid fa-play"></i></button>
                </article>
            `).join('');
        };

        renderCatalog();
        const saved = readTrack() || tracks[0];
        if (saved) renderHero(saved);

        catalog.addEventListener('click', async (event) => {
            const button = event.target.closest('.catalog-play');
            if (!button) return;
            const selected = tracks[Number(button.dataset.trackIndex)];
            if (selected) {
                const resolved = await resolvePreview(selected);
                setTrack(resolved, true);
                renderHero(resolved);
            }
        });

        document.querySelector('#playerSearchForm')?.addEventListener('submit', async (event) => {
            event.preventDefault();
            const query = document.querySelector('#playerSearchInput')?.value.trim();
            if (!query) return;
            const heading = document.querySelector('#catalogHeading');
            if (heading) heading.textContent = `Search results for "${query}"`;
            try {
                const response = await fetch(`${API_URL}?term=${encodeURIComponent(query)}&entity=song&limit=12`);
                const result = await response.json();
                const results = (result.results || []).filter((song) => song.trackName && song.previewUrl).map(buildTrackFromApi);
                tracks = results.length ? results : [];
                renderCatalog();
                if (!tracks.length) {
                    catalog.innerHTML = '<p class="catalog-empty">No playable previews found. Try another search.</p>';
                }
            } catch (error) {
                catalog.innerHTML = '<p class="catalog-empty">Search is unavailable right now. Please try again.</p>';
            }
        });

        window.addEventListener('spotifytrackchange', (event) => {
            renderHero(event.detail);
        });
    }

    window.spotifyPlayer = { playTrack, fallbackTracks, readTrack, fetchCatalog };
    window.addEventListener('DOMContentLoaded', initBar);
    window.addEventListener('DOMContentLoaded', initPlayerPage);
})();