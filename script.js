function getWatchHistory() {
    return JSON.parse(localStorage.getItem('watchHistory') || '[]');
}

function getPlaybackPositions() {
    return JSON.parse(localStorage.getItem('playbackPositions') || '{}');
}
function savePlaybackPosition(videoId, episodeName, time) {
    const positions = getPlaybackPositions();
    const key = `${videoId}||${(episodeName || '').trim()}`;
    positions[key] = time;
    localStorage.setItem('playbackPositions', JSON.stringify(positions));
    console.log('[Resume Debug][save] key:', key, 'time:', time, 'positions:', positions);
}
function getPlaybackPosition(videoId, episodeName) {
    const positions = getPlaybackPositions();
    const key = `${videoId}||${(episodeName || '').trim()}`;
    const value = positions[key] || 0;
    console.log('[Resume Debug][get] key:', key, 'value:', value, 'positions:', positions);
    return value;
}
function getWatchedEpisodes() {
    return JSON.parse(localStorage.getItem('watchedEpisodes') || '{}');
}
function addToWatchHistory(videoId, episodeName) {
    console.log('[DEBUG] addToWatchHistory called with:', videoId, episodeName);
    const history = getWatchHistory();
    const timestamp = new Date().toISOString();
    // Avoid duplicate consecutive entries
    if (history.length > 0) {
        const last = history[history.length - 1];
        if (last.videoId === videoId && last.episodeName === episodeName) {
            console.log('[DEBUG] Duplicate consecutive entry. Skipping.');
            return;
        }
    }
    history.push({ videoId, episodeName, timestamp });
    // Limit history to 100 items
    if (history.length > 100) history.shift();
    localStorage.setItem('watchHistory', JSON.stringify(history));
    console.log('[DEBUG] watchHistory after push:', history);
}

function markEpisodeWatched(videoId, episodeName) {
    console.log('[DEBUG] markEpisodeWatched called with:', videoId, episodeName);
    const watched = getWatchedEpisodes();
    if (!watched[videoId]) watched[videoId] = [];
    if (!watched[videoId].includes(episodeName)) {
        watched[videoId].push(episodeName);
        localStorage.setItem('watchedEpisodes', JSON.stringify(watched));
    }
    // Also add to watch history
    addToWatchHistory(videoId, episodeName);
}
function isEpisodeWatched(videoId, episodeName) {
    const watched = getWatchedEpisodes();
    return watched[videoId] && watched[videoId].includes(episodeName);
}


document.addEventListener('DOMContentLoaded', () => {
    // Perform password authentication if needed
    checkStoredPassword();

    const urlParams = new URLSearchParams(window.location.search);
    const shareVideoId = urlParams.get('videoId');
    const shareEpisodeName = urlParams.get('episode');

    if (shareVideoId) {
        // Process shared video link
        checkForSharedVideo();
    } else {
        // Regular initialization
        initialize();
    }

    // Set up event handlers
    document.getElementById('searchButton').addEventListener('click', () => {
        const searchTerm = document.getElementById('searchInput').value.trim();
        loadVideos(1, '', searchTerm);
    });

    // Search on Enter key
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const searchTerm = document.getElementById('searchInput').value.trim();
            loadVideos(1, '', searchTerm);
        }
    });

    document.getElementById('settingsButton').addEventListener('click', () => {
        document.getElementById('settingsModal').classList.add('open');
    });

    document.getElementById('headerWatchListBtn').addEventListener('click', toggleWatchList);

    document.getElementById('mobileWatchListBtn').addEventListener('click', toggleWatchList);

    // Event listeners for modals (using event delegation)
    document.body.addEventListener('click', (event) => {
        if (event.target.classList.contains('close-button')) {
            // Find the closest modal parent
            const modal = event.target.closest('.modal');
            if (modal) {
                modal.classList.remove('open');
                
                if (modal.id === 'videoPlayerModal') {
                    saveOnClose();
                }
            }
        }
    });

    // Watch history button
    document.getElementById('watchHistoryButton').addEventListener('click', async () => {
        await renderWatchHistory();
        document.getElementById('watchHistoryModal').classList.add('open');
    });

    // History nav click
    document.getElementById('historyNav').addEventListener('click', async () => {
        await renderWatchHistory();
        document.getElementById('watchHistoryModal').classList.add('open');
    });

    // Settings nav click
    document.getElementById('settingsNav').addEventListener('click', () => {
        document.getElementById('settingsModal').classList.add('open');
    });

    // Scroll event for infinite loading
    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
            checkScroll();
        }
    });

    // Password submission
    document.getElementById('submitPassword').addEventListener('click', validatePassword);

    // Close button event handlers
    document.querySelectorAll('.close-button').forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            modal.classList.remove('open');
        });
    });

    // Export user data
    document.getElementById('exportAllUserDataButton').addEventListener('click', exportAllUserData);

    // Import user data
    document.getElementById('importAllUserDataButton').addEventListener('click', function() {
        document.getElementById('importAllUserDataInput').click();
    });

    document.getElementById('importAllUserDataInput').addEventListener('change', importAllUserData);
    
    // Set up modal scroll handling
    const videoPlayerModal = document.getElementById('videoPlayerModal');
    
    if (videoPlayerModal) {
        // When wheel event happens on the modal
        videoPlayerModal.addEventListener('wheel', function(e) {
            // Only if modal is open
            if (videoPlayerModal.classList.contains('open')) {
                // Get the modal content
                const modalContent = videoPlayerModal.querySelector('.video-modal-content');
                const isAtTop = modalContent.scrollTop === 0;
                const isAtBottom = modalContent.scrollTop + modalContent.clientHeight === modalContent.scrollHeight;
                
                // Allow scrolling only within the modal content
                if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
                    e.preventDefault();
                }
            }
        });
        
        // Prevent touch scroll propagation from modal to background
        videoPlayerModal.querySelector('.video-modal-content').addEventListener('touchmove', function(e) {
            e.stopPropagation();
        }, { passive: false });
    }
}); 