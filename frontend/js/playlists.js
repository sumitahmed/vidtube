requireAuth();

// DOM Elements
const profileBtn = document.getElementById('profile-btn');
const dropdownMenu = document.getElementById('dropdown-menu');
const profileImg = document.getElementById('profile-img');
const playlistsContainer = document.getElementById('playlists-container');
const createPlaylistBtn = document.getElementById('create-playlist-btn');
const playlistModal = document.getElementById('playlist-modal');
const modalClose = document.getElementById('modal-close');
const cancelBtn = document.getElementById('cancel-btn');
const playlistForm = document.getElementById('playlist-form');
const modalTitle = document.getElementById('modal-title');
const saveBtn = document.getElementById('save-btn');
let currentEditingPlaylistId = null;

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

// Load playlists
// Load playlists
async function loadPlaylists() {
    try {
        playlistsContainer.innerHTML = '<div class="loading">Loading playlists...</div>';
        
        const response = await apiRequest(API_ENDPOINTS.PLAYLISTS, {
            method: 'GET'
        });
        
        const data = await response.json();
        
        console.log('Playlists loaded:', data);
        
        // FIX: Handle both response formats
        let playlistsArray = null;
        
        if (data.data && Array.isArray(data.data)) {
            // Old format: data.data = [playlists]
            playlistsArray = data.data;
        } else if (data.data && data.data.playlists && Array.isArray(data.data.playlists)) {
            // New format: data.data.playlists = [playlists]
            playlistsArray = data.data.playlists;
        }
        
        if (playlistsArray && playlistsArray.length > 0) {
            displayPlaylists(playlistsArray);
        } else {
            showEmptyState();
        }
    } catch (error) {
        console.error('Error loading playlists:', error);
        showEmptyState();
    }
}


// Create playlist thumbnail grid
function createPlaylistThumbnail(videos) {
    const videoCount = videos ? videos.length : 0;
    
    if (videoCount === 0) {
        // Empty playlist - dark theme icon
        return '<div style="position: relative; width: 100%; padding-bottom: 56.25%; background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); display: flex; align-items: center; justify-content: center;">' +
            '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: #666;">' +
                '<span class="material-icons" style="font-size: 64px; margin-bottom: 8px;">video_library</span>' +
                '<p style="font-size: 14px; margin: 0;">No videos</p>' +
            '</div>' +
        '</div>';
    } else if (videoCount === 1) {
        // Single video - show full thumbnail
        return '<div style="position: relative; width: 100%; padding-bottom: 56.25%; background: #000; overflow: hidden;">' +
            '<img src="' + videos[0].thumbnail + '" alt="Playlist cover" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">' +
            '<div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.8); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">' +
                '1 video' +
            '</div>' +
        '</div>';
    } else {
        // Multiple videos - show 2x2 grid
        const displayVideos = videos.slice(0, 4);
        const gridHtml = displayVideos.map(function(video) {
            return '<div style="position: relative; width: 100%; height: 100%; background: #000; overflow: hidden;">' +
                '<img src="' + video.thumbnail + '" alt="" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">' +
            '</div>';
        }).join('');
        
        // Fill empty slots if less than 4 videos
        const emptySlots = 4 - displayVideos.length;
        const emptyHtml = Array(emptySlots).fill('<div style="background: #1a1a1a;"></div>').join('');
        
        return '<div style="position: relative; width: 100%; padding-bottom: 56.25%; background: #000; overflow: hidden;">' +
            '<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 2px;">' +
                gridHtml + emptyHtml +
            '</div>' +
            '<div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.9); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">' +
                videoCount + ' videos' +
            '</div>' +
        '</div>';
    }
}

// Display playlists
function displayPlaylists(playlists) {
    const grid = document.createElement('div');
    grid.className = 'playlists-grid';
    grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; padding: 20px;';
    
    playlists.forEach(function(playlist) {
        const playlistCard = document.createElement('div');
        playlistCard.className = 'playlist-card';
        playlistCard.style.cssText = 'background: #1a1a1a; border-radius: 12px; overflow: hidden; transition: transform 0.2s; cursor: pointer;';
        
        const playlistName = escapeHtml(playlist.name);
        const playlistDesc = escapeHtml(playlist.description || 'No description');
        const videoCount = playlist.videos ? playlist.videos.length : 0;
        const playlistId = playlist._id;
        
        playlistCard.innerHTML = '<div class="playlist-thumbnail" style="position: relative; overflow: hidden; border-radius: 12px 12px 0 0;">' +
            createPlaylistThumbnail(playlist.videos) +
        '</div>' +
        '<div class="playlist-info" style="padding: 16px;">' +
            '<h3 style="color: white; font-size: 16px; font-weight: 600; margin-bottom: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + playlistName + '</h3>' +
            '<p style="color: #aaa; font-size: 14px; margin-bottom: 16px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + playlistDesc + '</p>' +
            '<div class="playlist-actions" style="display: flex; gap: 8px;">' +
                '<button class="playlist-action view" data-playlist-id="' + playlistId + '" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 16px; background: #ea2a33; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; transition: background 0.2s;">' +
                    '<span class="material-icons" style="font-size: 18px;">visibility</span>' +
                    '<span>View</span>' +
                '</button>' +
                '<button class="playlist-action edit" data-playlist-id="' + playlistId + '" style="display: flex; align-items: center; justify-content: center; padding: 10px 14px; background: #2a2a2a; color: white; border: none; border-radius: 8px; cursor: pointer; transition: background 0.2s;">' +
                    '<span class="material-icons" style="font-size: 18px;">edit</span>' +
                '</button>' +
                '<button class="playlist-action delete" data-playlist-id="' + playlistId + '" style="display: flex; align-items: center; justify-content: center; padding: 10px 14px; background: #2a2a2a; color: white; border: none; border-radius: 8px; cursor: pointer; transition: background 0.2s;">' +
                    '<span class="material-icons" style="font-size: 18px;">delete</span>' +
                '</button>' +
            '</div>' +
        '</div>';
        
        // Add hover effect
        playlistCard.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
            this.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3)';
        });
        playlistCard.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
        
        grid.appendChild(playlistCard);
    });
    
    playlistsContainer.innerHTML = '';
    playlistsContainer.appendChild(grid);
    
    // Attach event listeners
    attachPlaylistEventListeners();
}

// Attach event listeners to playlist buttons
function attachPlaylistEventListeners() {
    // View buttons
    document.querySelectorAll('.playlist-action.view').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const playlistId = this.getAttribute('data-playlist-id');
            window.location.href = 'playlist-details.html?id=' + playlistId;
        });
        btn.addEventListener('mouseenter', function() {
            this.style.background = '#c91f26';
        });
        btn.addEventListener('mouseleave', function() {
            this.style.background = '#ea2a33';
        });
    });
    
    // Edit buttons
    document.querySelectorAll('.playlist-action.edit').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const playlistId = this.getAttribute('data-playlist-id');
            editPlaylist(playlistId);
        });
        btn.addEventListener('mouseenter', function() {
            this.style.background = '#3a3a3a';
        });
        btn.addEventListener('mouseleave', function() {
            this.style.background = '#2a2a2a';
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.playlist-action.delete').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const playlistId = this.getAttribute('data-playlist-id');
            deletePlaylist(playlistId);
        });
        btn.addEventListener('mouseenter', function() {
            this.style.background = '#ea2a33';
        });
        btn.addEventListener('mouseleave', function() {
            this.style.background = '#2a2a2a';
        });
    });
}

// Show empty state
function showEmptyState() {
    playlistsContainer.innerHTML = '<div class="empty-state" style="text-align: center; padding: 80px 20px;">' +
        '<span class="material-icons" style="font-size: 80px; color: #666; margin-bottom: 20px;">video_library</span>' +
        '<h2 style="color: white; font-size: 24px; margin-bottom: 12px;">No Playlists Yet</h2>' +
        '<p style="color: #aaa; font-size: 16px;">Create your first playlist to organize your favorite videos</p>' +
    '</div>';
}

// Open create playlist modal
if (createPlaylistBtn) {
    createPlaylistBtn.addEventListener('click', function() {
        currentEditingPlaylistId = null;
        modalTitle.textContent = 'Create Playlist';
        saveBtn.textContent = 'Create';
        playlistForm.reset();
        playlistModal.classList.add('active');
    });
}

// Close modal
function closeModal() {
    playlistModal.classList.remove('active');
    playlistForm.reset();
    currentEditingPlaylistId = null;
}

if (modalClose) {
    modalClose.addEventListener('click', closeModal);
}

if (cancelBtn) {
    cancelBtn.addEventListener('click', closeModal);
}

// Save playlist
if (playlistForm) {
    playlistForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('playlist-name').value.trim();
        const description = document.getElementById('playlist-description').value.trim();
        
        if (!name) {
            alert('Playlist name is required');
            return;
        }
        
        try {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
            
            let response;
            if (currentEditingPlaylistId) {
                response = await apiRequest(API_ENDPOINTS.PLAYLISTS + '/' + currentEditingPlaylistId, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: name, description: description })
                });
            } else {
                response = await apiRequest(API_ENDPOINTS.PLAYLISTS, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: name, description: description })
                });
            }
            
            if (response.ok) {
                closeModal();
                loadPlaylists();
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to save playlist');
            }
        } catch (error) {
            console.error('Error saving playlist:', error);
            alert('Failed to save playlist');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = currentEditingPlaylistId ? 'Update' : 'Create';
        }
    });
}

// Edit playlist
async function editPlaylist(playlistId) {
    try {
        const response = await apiRequest(API_ENDPOINTS.PLAYLISTS + '/' + playlistId);
        const data = await response.json();
        
        if (data.data) {
            currentEditingPlaylistId = playlistId;
            modalTitle.textContent = 'Edit Playlist';
            saveBtn.textContent = 'Update';
            document.getElementById('playlist-name').value = data.data.name;
            document.getElementById('playlist-description').value = data.data.description || '';
            playlistModal.classList.add('active');
        }
    } catch (error) {
        console.error('Error loading playlist:', error);
        alert('Failed to load playlist');
    }
}

// Delete playlist
async function deletePlaylist(playlistId) {
    if (!confirm('Are you sure you want to delete this playlist?')) {
        return;
    }
    
    try {
        const response = await apiRequest(API_ENDPOINTS.PLAYLISTS + '/' + playlistId, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadPlaylists();
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to delete playlist');
        }
    } catch (error) {
        console.error('Error deleting playlist:', error);
        alert('Failed to delete playlist');
    }
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
loadPlaylists();
