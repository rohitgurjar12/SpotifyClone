
function getUserKeySuffix() {
    const user = (() => {
        try {
            return JSON.parse(localStorage.getItem('spotifyUser') || 'null');
        } catch {
            return null;
        }
    })();
    const identity = user?.email || user?.phone || user?.name || 'guest';
    return String(identity).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'guest';
}

function getScopedStorageKey(key) {
    return `${key}_${getUserKeySuffix()}`;
}

// Check if user is logged in, redirect to login if not
window.addEventListener('load', function () {
    const user = localStorage.getItem('spotifyUser');
    if (!user) {
        // Redirect to login if user is not logged in
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 100);
    }
});

// On page load, set up UI based on login status
window.addEventListener('load', function () {
    const user = localStorage.getItem('spotifyUser');
    const logInBtn = document.querySelector('.login-btn-nav');
    const SignUpBtn = document.querySelector('.Signup-btn-nav');
    const InstallBtn = document.querySelector('.darkbadge');
    const ExploreBtn = document.querySelector('.explore-btn-nav');

    if (InstallBtn) {
        InstallBtn.onclick = function () {
            window.location.href = 'https://www.spotify.com/download';
        };
    }

    if (ExploreBtn) {
        ExploreBtn.onclick = function () {
            window.location.href = 'https://open.spotify.com/premium';
        };
    }

    if (user) {
         SignUpBtn.textContent = 'Profile';
        SignUpBtn.onclick = function (e) {
            e.preventDefault();
            window.location.href = 'profile.html';
        };

        logInBtn.textContent = 'Log Out';
        logInBtn.onclick = function (e) {
            e.preventDefault();
            logout();
        };
    } else {
        logInBtn.textContent = 'Log In';
        logInBtn.onclick = function (e) {
            e.preventDefault();
            window.location.href = 'login.html';
        };

        SignUpBtn.innerHTML = 'Sign Up';
        SignUpBtn.onclick = function (e) {
            e.preventDefault();
            window.location.href = 'signup.html';
        };
    }
});

function normalizeSearchTrack(song) {
    return {
        title: song.trackName || song.title || 'Unknown title',
        artist: song.artistName || song.artist || 'Unknown artist',
        cover: song.artworkUrl100 || song.cover || 'assets/album_picture.jpeg',
        apiCover: song.artworkUrl100 || song.cover || 'assets/album_picture.jpeg',
        previewUrl: song.previewUrl || '',
        album: song.collectionName || song.album || 'Featured track'
    };
}

function setCurrentTrack(track) {
    localStorage.setItem(getScopedStorageKey('spotifyNowPlaying'), JSON.stringify(track));
    localStorage.setItem(getScopedStorageKey('spotifyLastSelectedTrack'), JSON.stringify(track));
    window.location.href = 'player.html';
}

async function searchSongs(query) {
    const input = document.getElementById('songSearchInput');
    const resultsBox = document.getElementById('searchResults');
    if (!input || !resultsBox) return;

    const exactQuery = query.trim();
    if (!exactQuery) {
        resultsBox.innerHTML = '';
        resultsBox.style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(exactQuery)}&entity=song&limit=8`);
        const data = await response.json();
        const songs = (data.results || []).filter((song) => song.previewUrl || song.trackName).slice(0, 8).map(normalizeSearchTrack);

        if (!songs.length) {
            resultsBox.innerHTML = '<div class="search-empty">No songs found for this search.</div>';
            resultsBox.style.display = 'block';
            return;
        }

        const catalog = window.spotifyCatalog || [];
        if (catalog.length === 0 || exactQuery.length > 2) {
            localStorage.setItem('spotifyCatalog', JSON.stringify(songs));
            window.spotifyCatalog = songs;
        }

        resultsBox.innerHTML = songs.map((song) => `
            <button class="search-item" data-title="${encodeURIComponent(song.title)}" data-artist="${encodeURIComponent(song.artist)}" type="button">
                <img src="${song.cover}" alt="${song.title}">
                <div>
                    <strong>${song.title}</strong>
                    <span>${song.artist}</span>
                </div>
            </button>
        `).join('');
        resultsBox.style.display = 'block';

        resultsBox.querySelectorAll('.search-item').forEach((button) => {
            button.addEventListener('click', () => {
                const title = decodeURIComponent(button.dataset.title || '');
                const artist = decodeURIComponent(button.dataset.artist || '');
                const track = songs.find((song) => song.title === title && song.artist === artist) || songs[0];
                setCurrentTrack(track);
            });
        });
    } catch (error) {
        console.warn('Search failed', error);
        resultsBox.innerHTML = '<div class="search-empty">Search is temporarily unavailable.</div>';
        resultsBox.style.display = 'block';
    }
}

function setupHomeSearch() {
    const input = document.getElementById('songSearchInput');
    const resultsBox = document.getElementById('searchResults');
    if (!input || !resultsBox) return;

    let timeoutId = null;
    input.addEventListener('input', (event) => {
        const query = event.target.value;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => searchSongs(query), 250);
    });

    document.addEventListener('click', (event) => {
        const insideSearch = event.target.closest('#songSearchInput') || event.target.closest('#searchResults');
        if (!insideSearch) {
            resultsBox.style.display = 'none';
        }
    });
}

window.addEventListener('load', function () {
    setupHomeSearch();
    const cards = document.querySelectorAll('.card');
    cards.forEach((card) => {
        const link = card.querySelector('a');
        if (!link) return;
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const title = card.querySelector('.card-title')?.textContent?.trim() || 'Unknown title';
            const artist = card.querySelector('.card-info')?.textContent?.trim() || 'Unknown artist';
            const cover = card.querySelector('.card-img')?.getAttribute('src') || 'assets/album_picture.jpeg';
            setCurrentTrack({ title, artist, cover, apiCover: cover, previewUrl: '' });
        });
    });
});

// Logout function
function logout() {
    if (confirm('Are you sure you want to log out?')) {
        localStorage.removeItem('spotifyUser');
        window.location.href = 'login.html';
    }
}

// Signout function
function signout() {
    if (confirm('Are you sure you want to sign out?')) {
        localStorage.removeItem('spotifyUser');
        window.location.href = 'signup.html';
    }
}
