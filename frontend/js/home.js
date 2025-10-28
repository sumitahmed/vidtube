requireAuth();

// DOM Elements
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const content = document.querySelector('.content');
const profileBtn = document.getElementById('profile-btn');
const dropdownMenu = document.getElementById('dropdown-menu');
const videosContainer = document.getElementById('videos-container');
const profileImg = document.getElementById('profile-img');

// Store video and playlist data
window.videoData = {};
window.playlistData = {};

// Sidebar Toggle
menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('hidden');
    content.classList.toggle('expanded');
});

// Profile Dropdown Toggle
profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle('active');
});

// Close dropdown when clicking outside
document.addEventListener('click', () => {
    dropdownMenu.classList.remove('active');
    document.querySelectorAll('.video-options-menu').forEach(menu => {
        menu.classList.remove('active');
    });
});

// Load User Profile
async function loadUserProfile() {
    const userData = getUserData();
    if (userData && userData.avatar) {
        profileImg.src = userData.avatar;
    }
}

// Fetch Videos from Backend
async function loadVideos() {
    console.log('Starting to load videos...');
    
    try {
        videosContainer.innerHTML = '<div class="loading">Loading videos...</div>';
        
        const response = await apiRequest(API_ENDPOINTS.VIDEOS);
        const data = await response.json();
        
        console.log('Videos response:', data);
        
        if (response.ok && data.data) {
            let videosArray = null;
            
            if (Array.isArray(data.data)) {
                videosArray = data.data;
            } else if (data.data.videos && Array.isArray(data.data.videos)) {
                videosArray = data.data.videos;
            } else if (data.data.docs && Array.isArray(data.data.docs)) {
                videosArray = data.data.docs;
            }
            
            console.log('Videos loaded:', videosArray ? videosArray.length : 0);
            
            if (videosArray && videosArray.length > 0) {
                displayVideos(videosArray);
            } else {
                showEmptyState();
            }
        } else {
            showEmptyState();
        }
    } catch (error) {
        console.error('Error loading videos:', error);
        showErrorState(error.message);
    }
}

// Show empty state
function showEmptyState() {
    videosContainer.innerHTML = '<div class="empty-state">' +
        '<span class="material-icons" style="font-size: 80px; color: #666;">videocam_off</span>' +
        '<h2>No Videos Found</h2>' +
        '<p>Be the first to upload a video!</p>' +
        '<a href="upload.html" class="btn-primary">Upload Video</a>' +
        '</div>';
}

// Show error state
function showErrorState(message) {
    videosContainer.innerHTML = '<div class="empty-state">' +
        '<span class="material-icons" style="font-size: 80px; color: #ea2a33;">error</span>' +
        '<h2>Failed to load videos</h2>' +
        '<p>' + message + '</p>' +
        '</div>';
}

// Display Videos with 3-dot menu
function displayVideos(videos) {
    console.log('Displaying videos...');
    
    // Store video data globally
    videos.forEach((video, index) => {
        window.videoData['video-' + index] = {
            id: video._id,
            title: video.title
        };
    });
    
    videosContainer.innerHTML = videos.map(function(video, index) {
        const videoKey = 'video-' + index;
        const videoId = video._id || '';
        const thumbnail = video.thumbnail || '';
        const titleDisplay = video.title || 'Untitled';
        const duration = video.duration ? formatDuration(video.duration) : '';
        const ownerAvatar = video.owner && video.owner.avatar ? video.owner.avatar : 'assets/default-avatar.png';
        const ownerUsername = video.owner && video.owner.username ? video.owner.username : 'Unknown';
        const views = formatViews(video.views || 0);
        const date = formatDate(video.createdAt);

        return '<div class="video-card">' +
            '<div class="video-thumbnail" onclick="window.location.href=\'videoPlayer.html?id=' + videoId + '\'">' +
                '<img src="' + thumbnail + '" alt="' + titleDisplay + '">' +
                (duration ? '<span class="duration">' + duration + '</span>' : '') +
            '</div>' +
            '<div class="video-info">' +
                '<img src="' + ownerAvatar + '" alt="' + ownerUsername + '" class="channel-avatar" ' +
                     'onclick="window.location.href=\'channel.html?username=' + ownerUsername + '\'">' +
                '<div class="video-details">' +
                    '<h3 class="video-title" onclick="window.location.href=\'videoPlayer.html?id=' + videoId + '\'">' + titleDisplay + '</h3>' +
                    '<p class="channel-name">' + ownerUsername + '</p>' +
                    '<p class="video-stats">' + views + ' views • ' + date + '</p>' +
                '</div>' +
                '<div class="video-options">' +
                    '<button class="options-btn" data-video-key="' + videoKey + '">' +
                        '<span class="material-icons">more_vert</span>' +
                    '</button>' +
                    '<div class="video-options-menu" id="options-' + videoKey + '">' +
                        '<button class="add-to-playlist-btn" data-video-key="' + videoKey + '">' +
                            '<span class="material-icons">playlist_add</span>' +
                            '<span>Add to playlist</span>' +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }).join('');
    
    // Add event listeners after rendering
    attachVideoOptionsListeners();
}

// Attach event listeners to video options
function attachVideoOptionsListeners() {
    // Options button listeners
    document.querySelectorAll('.options-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const videoKey = this.getAttribute('data-video-key');
            toggleVideoOptions(e, videoKey);
        });
    });
    
    // Add to playlist button listeners
    document.querySelectorAll('.add-to-playlist-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const videoKey = this.getAttribute('data-video-key');
            const videoInfo = window.videoData[videoKey];
            console.log('Add to playlist clicked:', videoInfo);
            openAddToPlaylistModal(videoInfo.id, videoInfo.title);
        });
    });
}

// Toggle video options menu
function toggleVideoOptions(event, videoKey) {
    event.stopPropagation();
    
    const menu = document.getElementById('options-' + videoKey);
    const allMenus = document.querySelectorAll('.video-options-menu');
    
    allMenus.forEach(function(m) {
        if (m !== menu) {
            m.classList.remove('active');
        }
    });
    
    if (menu) {
        menu.classList.toggle('active');
    }
}

// Open add to playlist modal
function openAddToPlaylistModal(videoId, videoTitle) {
    console.log('Opening modal for video:', videoId, videoTitle);
    
    if (!videoId || videoId === 'undefined') {
        alert('Video ID is not defined');
        return;
    }
    
    // Store current video ID for later use
    window.currentVideoId = videoId;
    window.currentVideoTitle = videoTitle;
    
    let modal = document.getElementById('add-to-playlist-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'add-to-playlist-modal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = '<div class="modal-content">' +
        '<div class="modal-header">' +
            '<h2>Save to playlist</h2>' +
            '<button class="modal-close" id="modal-close-btn">' +
                '<span class="material-icons">close</span>' +
            '</button>' +
        '</div>' +
        '<div class="modal-body">' +
            '<p class="loading">Loading playlists...</p>' +
        '</div>' +
    '</div>';
    
    modal.classList.add('active');
    
    // Attach close button listener
    document.getElementById('modal-close-btn').addEventListener('click', closeAddToPlaylistModal);
    
    // Load playlists
    loadPlaylistsForModal();
}

// Load playlists for modal
async function loadPlaylistsForModal() {
    try {
        const response = await apiRequest(API_ENDPOINTS.PLAYLISTS);
        const data = await response.json();
        
        const modal = document.getElementById('add-to-playlist-modal');
        const modalBody = modal.querySelector('.modal-body');
        
        if (data.data && data.data.length > 0) {
            // Store playlist data globally
            data.data.forEach((playlist, index) => {
                window.playlistData['playlist-' + index] = {
                    id: playlist._id,
                    name: playlist.name,
                    videoCount: playlist.videos ? playlist.videos.length : 0
                };
            });
            
            displayPlaylistsInModal(data.data, modalBody);
        } else {
            modalBody.innerHTML = 
                '<div class="empty-state" style="padding: 40px 20px;">' +
                    '<p style="color: #aaa; margin-bottom: 16px;">You don\'t have any playlists yet</p>' +
                    '<button onclick="window.location.href=\'playlists.html\'" class="btn-primary">Create Playlist</button>' +
                '</div>';
        }
    } catch (error) {
        console.error('Error loading playlists:', error);
        const modal = document.getElementById('add-to-playlist-modal');
        const modalBody = modal.querySelector('.modal-body');
        modalBody.innerHTML = '<p style="color: #ea2a33; text-align: center;">Failed to load playlists</p>';
    }
}

// Display playlists in modal
function displayPlaylistsInModal(playlists, modalBody) {
    const playlistsHtml = playlists.map(function(playlist, index) {
        const playlistKey = 'playlist-' + index;
        const playlistNameDisplay = playlist.name || 'Untitled Playlist';
        const videoCount = playlist.videos ? playlist.videos.length : 0;
        
        return '<div class="playlist-item" data-playlist-key="' + playlistKey + '">' +
            '<span class="material-icons">video_library</span>' +
            '<div class="playlist-item-info">' +
                '<div class="playlist-item-name">' + playlistNameDisplay + '</div>' +
                '<div class="playlist-item-count">' + videoCount + ' videos</div>' +
            '</div>' +
        '</div>';
    }).join('');
    
    modalBody.innerHTML = '<div class="playlist-list">' + playlistsHtml + '</div>';
    
    // Attach click listeners
    document.querySelectorAll('.playlist-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const playlistKey = this.getAttribute('data-playlist-key');
            const playlistInfo = window.playlistData[playlistKey];
            const videoId = window.currentVideoId;
            
            console.log('Adding video to playlist:', playlistInfo.id, videoId);
            addVideoToPlaylist(playlistInfo.id, videoId, playlistInfo.name);
        });
    });
}

// Add video to playlist
async function addVideoToPlaylist(playlistId, videoId, playlistName) {
    console.log('API call - playlistId:', playlistId, 'videoId:', videoId);
    
    try {
        const url = API_ENDPOINTS.PLAYLISTS + '/add/' + playlistId + '/' + videoId;
        console.log('Full URL:', url);
        
        const response = await apiRequest(url, {
            method: 'PATCH'
        });
        
        if (response.ok) {
            alert('Added to ' + playlistName + '!');
            closeAddToPlaylistModal();
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to add video to playlist');
        }
    } catch (error) {
        console.error('Error adding video:', error);
        alert('Failed to add video to playlist');
    }
}

// Close modal
function closeAddToPlaylistModal() {
    const modal = document.getElementById('add-to-playlist-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('add-to-playlist-modal');
    if (modal && e.target === modal) {
        closeAddToPlaylistModal();
    }
});

// Initialize
loadUserProfile();
loadVideos();
