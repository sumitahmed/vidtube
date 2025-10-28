requireAuth();

const profileBtn = document.getElementById('profile-btn');
const dropdownMenu = document.getElementById('dropdown-menu');
const profileImg = document.getElementById('profile-img');
const playlistDetailsContainer = document.getElementById('playlist-details-container');
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const content = document.querySelector('.content');

// Get playlist ID from URL
const urlParams = new URLSearchParams(window.location.search);
const playlistId = urlParams.get('id');

if (!playlistId) {
    window.location.href = 'playlists.html';
}

// Sidebar toggle
if (menuToggle) {
    menuToggle.addEventListener('click', function() {
        sidebar.classList.toggle('hidden');
        content.classList.toggle('expanded');
    });
}

// Profile dropdown
if (profileBtn && dropdownMenu) {
    profileBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownMenu.classList.toggle('active');
    });
}

document.addEventListener('click', function() {
    if (dropdownMenu) {
        dropdownMenu.classList.remove('active');
    }
});

// Load user profile
async function loadUserProfile() {
    try {
        const response = await apiRequest(API_ENDPOINTS.CURRENT_USER);
        const data = await response.json();
        if (data.data && data.data.avatar && profileImg) {
            profileImg.src = data.data.avatar;
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

// Load playlist details
async function loadPlaylistDetails() {
    try {
        playlistDetailsContainer.innerHTML = '<p class="loading" style="text-align: center; padding: 40px; color: #aaa;">Loading playlist...</p>';
        
        const response = await apiRequest(API_ENDPOINTS.PLAYLISTS + '/' + playlistId);
        const data = await response.json();

        console.log('Playlist response:', data);

        if (data.data) {
            displayPlaylistDetails(data.data);
        } else {
            showError();
        }
    } catch (error) {
        console.error('Error loading playlist:', error);
        showError();
    }
}

// Display playlist details
function displayPlaylistDetails(playlist) {
    const videoCount = playlist.videos ? playlist.videos.length : 0;
    const playlistName = escapeHtml(playlist.name || 'Untitled Playlist');
    const playlistDesc = playlist.description ? escapeHtml(playlist.description) : '';
    
    let html = '<div style="margin-bottom: 30px; padding: 30px; background: #1a1a1a; border-radius: 12px;">' +
        '<div style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px;">' +
            '<button onclick="window.location.href=\'playlists.html\'" style="background: transparent; border: none; color: white; cursor: pointer; display: flex; align-items: center; padding: 8px;">' +
                '<span class="material-icons">arrow_back</span>' +
            '</button>' +
            '<div style="flex: 1;">' +
                '<h1 style="font-size: 28px; font-weight: 600; color: white; margin-bottom: 8px;">' + playlistName + '</h1>' +
                '<p style="color: #aaa; font-size: 14px;">' + videoCount + ' videos</p>' +
            '</div>' +
        '</div>';
    
    if (playlistDesc) {
        html += '<p style="color: #ccc; font-size: 14px; line-height: 1.6;">' + playlistDesc + '</p>';
    }
    
    html += '</div><div id="playlist-videos-container">';
    
    if (videoCount === 0) {
        html += '<div class="empty-state" style="text-align: center; padding: 80px 20px;">' +
            '<div style="font-size: 80px; margin-bottom: 20px; opacity: 0.5;">🎬</div>' +
            '<h2 style="font-size: 24px; color: white; margin-bottom: 12px;">No Videos Yet</h2>' +
            '<p style="color: #aaa; font-size: 16px;">Videos you add will appear here</p>' +
        '</div>';
    }
    
    html += '</div>';
    playlistDetailsContainer.innerHTML = html;
    
    if (videoCount > 0) {
        displayPlaylistVideos(playlist.videos, playlist._id);
    }
}

// Display playlist videos - FIXED VERSION
function displayPlaylistVideos(videos, playlistId) {
    const container = document.getElementById('playlist-videos-container');
    
    const videosHtml = videos.map(function(video) {
        const videoId = video._id || '';
        const thumbnail = video.thumbnail || '';
        const title = escapeHtml(video.title || 'Untitled');
        const duration = video.duration ? formatDuration(video.duration) : '';
        const ownerAvatar = video.owner && video.owner.avatar ? video.owner.avatar : '';
        const ownerUsername = video.owner && video.owner.username ? video.owner.username : 'Unknown';
        const views = formatViews(video.views || 0);
        const date = formatDate(video.createdAt);
        
        return '<div class="video-card">' +
            '<div class="video-thumbnail" onclick="window.location.href=\'videoPlayer.html?id=' + videoId + '\'" style="position: relative; width: 100%; padding-bottom: 56.25%; background: #000; border-radius: 12px; overflow: hidden; cursor: pointer;">' +
                '<img src="' + thumbnail + '" alt="' + title + '" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">' +
                (duration ? '<span class="duration" style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.8); color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: 500;">' + duration + '</span>' : '') +
            '</div>' +
            '<div class="video-info" style="display: flex; gap: 12px; padding: 12px 0;">' +
                '<img src="' + ownerAvatar + '" alt="' + ownerUsername + '" onclick="window.location.href=\'channel.html?username=' + ownerUsername + '\'" style="width: 36px; height: 36px; border-radius: 50%; cursor: pointer; flex-shrink: 0; object-fit: cover;">' +
                '<div class="video-details" style="flex: 1; min-width: 0;">' +
                    '<h3 class="video-title" onclick="window.location.href=\'videoPlayer.html?id=' + videoId + '\'" style="font-size: 14px; font-weight: 600; color: white; margin: 0 0 4px 0; cursor: pointer; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.4;">' + title + '</h3>' +
                    '<p class="channel-name" style="font-size: 12px; color: #aaa; margin: 0 0 4px 0;">' + ownerUsername + '</p>' +
                    '<p class="video-stats" style="font-size: 12px; color: #aaa; margin: 0;">' + views + ' views • ' + date + '</p>' +
                '</div>' +
                '<div class="video-actions" style="flex-shrink: 0;">' +
                    '<button class="remove-video-btn" data-playlist-id="' + playlistId + '" data-video-id="' + videoId + '" style="background: transparent; border: none; color: #aaa; cursor: pointer; padding: 8px; transition: color 0.2s; display: flex; align-items: center;">' +
                        '<span class="material-icons" style="font-size: 20px;">delete</span>' +
                    '</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }).join('');
    
    container.innerHTML = '<div class="videos-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">' + videosHtml + '</div>';
    
    // Attach event listeners for remove buttons
    document.querySelectorAll('.remove-video-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const pId = this.getAttribute('data-playlist-id');
            const vId = this.getAttribute('data-video-id');
            removeVideoFromPlaylist(pId, vId);
        });
        
        // Add hover effect
        btn.addEventListener('mouseenter', function() {
            this.style.color = '#ea2a33';
        });
        btn.addEventListener('mouseleave', function() {
            this.style.color = '#aaa';
        });
    });
}

// Remove video from playlist
async function removeVideoFromPlaylist(playlistId, videoId) {
    if (!confirm('Remove this video from playlist?')) return;
    
    try {
        const response = await apiRequest(API_ENDPOINTS.PLAYLISTS + '/remove/' + playlistId + '/' + videoId, {
            method: 'PATCH'
        });
        
        if (response.ok) {
            alert('Video removed from playlist!');
            loadPlaylistDetails();
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to remove video');
        }
    } catch (error) {
        console.error('Error removing video:', error);
        alert('Failed to remove video');
    }
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show error
function showError() {
    playlistDetailsContainer.innerHTML = '<div class="empty-state" style="text-align: center; padding: 80px 20px;">' +
        '<div style="font-size: 80px; margin-bottom: 20px; opacity: 0.5;">⚠️</div>' +
        '<h2 style="font-size: 24px; color: white; margin-bottom: 12px;">Playlist Not Found</h2>' +
        '<p style="color: #aaa; font-size: 16px; margin-bottom: 20px;">This playlist doesn\'t exist or you don\'t have access to it.</p>' +
        '<button onclick="window.location.href=\'playlists.html\'" style="background: #ea2a33; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; cursor: pointer;">Back to Playlists</button>' +
    '</div>';
}

// Logout
if (document.getElementById('logout-btn')) {
    document.getElementById('logout-btn').addEventListener('click', async function(e) {
        e.preventDefault();
        await logout();
    });
}

// Initialize
loadUserProfile();
loadPlaylistDetails();
