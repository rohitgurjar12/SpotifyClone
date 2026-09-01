# Spotify Clone

A Spotify-inspired web music player built with vanilla HTML, CSS, and JavaScript. Enjoy browsing songs, creating playlists, managing wishlist and liked songs, and playing previews—all while keeping your account data separate and secure.

[Live Link](https://spotifycl0ne.vercel.app/)

## Features

### 🎵 Music Player
- Browse and search for songs using iTunes API integration
- Play 30-second song previews with playback controls
- Previous/Next track navigation
- Volume control and progress bar
- Download preview tracks
- Automatic preview limit enforcement (30 seconds)

### 👤 User Accounts
- Simple signup and login system with localStorage persistence
- Each user has isolated activity (likes, playlists, wishlist)
- User-scoped storage keys prevent data leakage between accounts
- Clean logout that clears active session

### 📚 Library Management
- **Playlists**: Create, view, and manage your custom playlists
- **Liked Songs**: Like/unlike songs and keep a personal favorites list
- **Wishlist**: Create and manage wishlist items
- Add songs to playlists directly from the player
- Quick playlist creation from player UI

### 🎨 Responsive Design
- Fully responsive layout for mobile (< 720px) and tablet (720px - 980px) views
- Mobile sidebar with smooth open/close animation
- Optimized sticky navigation for all screen sizes
- Adaptive card layouts and player controls
- Touch-friendly button sizes and spacing

### 🏠 Pages
- **Home (index.html)**: Search songs, browse featured playlists, select tracks to play
- **Player (player.html)**: Full-screen player with hero display, playback controls, and catalog browsing
- **Profile (profile.html)**: View liked songs, wishlists, playlists, and manage account
- **Login/Signup**: Account authentication and registration

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Storage**: localStorage (browser-based persistence)
- **APIs**: iTunes Search API for song catalog and previews
- **Icons**: Font Awesome 7

## Project Structure

```
├── index.html              Main home/browse page
├── player.html             Full player interface
├── profile.html            User account & library management
├── login.html              User login
├── signup.html             User registration
├── main.js                 Core app logic (auth, navigation, search, track selection)
├── player.js               Player controls, playback, preview loading, catalog UI
├── library.js              Playlists, wishlists, liked songs, profile rendering
├── style.css               Complete responsive styling
└── assets/                 Images, logos, and artwork
```

## How to Use

1. **Sign up** with your name, email, and password
2. **Search** for songs using the search bar on the home page
3. **Click a song** to load it on the player page
4. **Play** and control the track with playback buttons
5. **Like songs** to add them to your Liked Songs collection
6. **Create playlists** and add songs to them
7. **View your profile** to see all your activity (likes, playlists, wishlist)
8. **Log out** when done—your data is saved per-account

## Key Features in Detail

### Per-User Data Isolation
All storage keys are scoped to the logged-in user's identity (email/phone/name) to ensure:
- User A's playlists don't appear for User B
- Each user has separate liked songs and wishlist
- Logout clears the active session without affecting stored user data

### Preview Loading
- Songs are fetched from iTunes API with preview URLs
- Fallback API lookup if preview is missing
- 30-second auto-stop on all previews

### Responsive Mobile Experience
- Hamburger menu toggles collapsible sidebar on mobile
- Search and controls reflow for small screens
- Optimized touch targets and spacing
- Landscape and portrait support

## About Me

Hi, I'm **Rohit Gurjar**, a Full-Stack Web Developer and the creator of Spotify Clone.

- GitHub: [rohitgurjar12](https://github.com/rohitgurjar12)
- LinkedIn: [rohitgurjar12](https://www.linkedin.com/in/rohitgurjar12)
