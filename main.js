// On page load, set up UI based on login status
window.addEventListener('load', function () {
    const user = localStorage.getItem('spotifyUser');
    const logInBtn = document.querySelector('.login-btn-nav');
    const SignUpBtn = document.querySelector('.Signup-btn-nav');
    const InstallBtn = document.querySelector('.darkbadge');
    const ExploreBtn = document.querySelector('.explore-btn-nav');

    InstallBtn.onclick = function () {
        window.location.href = 'https://www.spotify.com/download';
    };

    ExploreBtn.onclick = function () {
        window.location.href = 'https://open.spotify.com/premium';
    };

    if (user) {
        // User is logged in
        logInBtn.textContent = 'Log Out';
        logInBtn.onclick = function (e) {
            e.preventDefault();
            logout();
        };

        SignUpBtn.textContent = 'Profile';
        SignUpBtn.onclick = function (e) {
            e.preventDefault();
            window.location.href = 'profile.html'; // Assuming profile page exists
        };
    } else {
        // User is not logged in
        logInBtn.textContent = 'Log In';
        logInBtn.onclick = function (e) {
            e.preventDefault();
            window.location.href = 'login.html';
        };

        SignUpBtn.textContent = 'Sign Up';
        SignUpBtn.onclick = function (e) {
            e.preventDefault();
            window.location.href = 'signup.html';
        };
    }
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
