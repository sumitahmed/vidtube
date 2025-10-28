requireAuth();

// DOM Elements
const profileBtn = document.getElementById('profile-btn');
const dropdownMenu = document.getElementById('dropdown-menu');
const profileImg = document.getElementById('profile-img');

// Channel elements
const channelCover = document.getElementById('channel-cover');
const channelAvatar = document.getElementById('channel-avatar');
const channelName = document.getElementById('channel-name');
const channelUsername = document.getElementById('channel-username');
const subscribersCount = document.getElementById('subscribers-count');
const videosCount = document.getElementById('videos-count');
const subscribeBtn = document.getElementById('subscribe-btn');
const videosContainer = document.getElementById('videos-container');
const manageChannelBtn = document.querySelector('.manage-channel-btn');


// Tabs
const videosTab = document.getElementById('videos-tab');
const aboutTab = document.getElementById('about-tab');
const videosSection = document.getElementById('videos-section');
const aboutSection = document.getElementById('about-section');

// Get current user data
const userData = getUserData();
let currentUserId = null;
let currentChannelId = null;

// Profile dropdown
if (profileBtn) {
    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('active');
    });
}

document.addEventListener('click', () => {
    if (dropdownMenu) {
        dropdownMenu.classList.remove('active');
    }
});

// Load user profile in navbar
if (userData && userData.avatar && profileImg) {
    profileImg.src = userData.avatar;
}

// Tab switching
if (videosTab) {
    videosTab.addEventListener('click', () => {
        videosTab.classList.add('active');
        aboutTab.classList.remove('active');
        videosSection.style.display = 'block';
        aboutSection.style.display = 'none';
    });
}

if (aboutTab) {
    aboutTab.addEventListener('click', () => {
        aboutTab.classList.add('active');
        videosTab.classList.remove('active');
        aboutSection.style.display = 'block';
        videosSection.style.display = 'none';
    });
}

// Subscribe button functionality
// Subscribe button functionality
if (subscribeBtn) {
    subscribeBtn.addEventListener('click', async () => {
        try {
            subscribeBtn.disabled = true;

            const response = await apiRequest(`${API_URL}/subscriptions/c/${currentChannelId}`, {
                method: 'POST'
            });

            const data = await response.json();

            if (response.ok) {
                const isNowSubscribed = data.data?.subscribed !== false;

                if (isNowSubscribed) {
                    subscribeBtn.textContent = 'Subscribed';
                    subscribeBtn.style.background = '#666';
                } else {
                    subscribeBtn.textContent = 'Subscribe';
                    subscribeBtn.style.background = '#ea2a33';
                }

                loadChannelData();
            } else {
                throw new Error(data.message || 'Failed to subscribe');
            }
        } catch (error) {
            console.error('Subscribe error:', error);
            showError('Failed to update subscription');
        } finally {
            subscribeBtn.disabled = false;
        }
    });
}


// Helper to get channel ID from URL
function getChannelUsername() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('username'); // Get username from URL
}

// Load channel data
async function loadChannelData() {
    try {
        console.log('Loading channel data...');

        const channelUsername = getChannelUsername();
        console.log('Channel username to load:', channelUsername);

        // If username provided, fetch that user's channel, otherwise fetch current user
        const endpoint = channelUsername
            ? `${API_URL}/users/channel/${channelUsername}`
            : API_ENDPOINTS.CURRENT_USER;

        console.log('Fetching from:', endpoint);

        const response = await apiRequest(endpoint, {
            method: 'GET'
        });

        const data = await response.json();
        console.log('Channel data:', data);

        if (response.ok && data.data) {
            const user = data.data;
            currentUserId = user._id;
            currentChannelId = user._id;

            // Set channel info
            if (channelName) channelName.textContent = user.fullname || 'No Name';
            if (channelUsername) channelUsername.textContent = `@${user.username || 'username'}`;

            // Set avatar
            if (channelAvatar) {
                if (user.avatar) {
                    channelAvatar.src = user.avatar;
                    channelAvatar.onerror = () => {
                        channelAvatar.src = 'https://via.placeholder.com/150/1a1a1a/ea2a33?text=Avatar';
                    };
                } else {
                    channelAvatar.src = 'https://via.placeholder.com/150/1a1a1a/ea2a33?text=Avatar';
                }
            }

            // Set cover image
            const coverContainer = document.querySelector('.channel-cover');
            if (coverContainer) {
                if (user.coverImage) {
                    coverContainer.style.backgroundImage = `url('${user.coverImage}')`;
                    coverContainer.style.backgroundSize = 'cover';
                    coverContainer.style.backgroundPosition = 'center';
                } else {
                    coverContainer.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                }
            }

            // Set subscribers count
            if (subscribersCount) {
                subscribersCount.textContent = `${formatViews(user.subscribersCount || 0)} subscribers`;
            }
            // ✅ CHECK IF OWN CHANNEL AND SHOW CORRECT BUTTON
            const subscribeGroup = document.querySelector('.subscribe-group');
            const notificationBtn = document.querySelector('.notification-btn');
            const isOwnChannel = userData && userData._id === currentUserId;

            console.log('🔍 DEBUG - userData._id:', userData?._id);
            console.log('🔍 DEBUG - currentUserId:', currentUserId);
            console.log('🔍 DEBUG - isOwnChannel:', isOwnChannel);

            if (isOwnChannel) {
                // Show Manage Channel for own channel
                if (manageChannelBtn) {
                    manageChannelBtn.style.display = 'inline-flex';
                }
                if (subscribeGroup) {
                    subscribeGroup.style.display = 'none';
                }
            } else {
                // Show Subscribe button group for other channels
                if (manageChannelBtn) {
                    manageChannelBtn.style.display = 'none';
                }
                if (subscribeGroup) {
                    subscribeGroup.style.display = 'inline-flex'; // ✅ SHOW THE WHOLE GROUP
                }

                // Check if already subscribed
                if (subscribeBtn) {
                    if (user.isSubscribed) {
                        subscribeBtn.textContent = 'Subscribed';
                        subscribeBtn.classList.add('subscribed');
                        if (notificationBtn) {
                            notificationBtn.classList.add('subscribed');
                        }
                    } else {
                        subscribeBtn.textContent = 'Subscribe';
                        subscribeBtn.classList.remove('subscribed');
                        if (notificationBtn) {
                            notificationBtn.classList.remove('subscribed');
                        }
                    }
                }
            }



            // Load user's videos - use the fetched user ID, not dashboard
            await loadChannelVideos(user._id);
        } else {
            showError('Failed to load channel data');
        }
    } catch (error) {
        console.error('Error loading channel data:', error);
        showError('Failed to load channel');
    }
}


// Load channel videos
async function loadChannelVideos(userId) {
    try {
        console.log('Loading videos for user ID:', userId);

        if (!videosContainer) {
            console.error('Videos container not found!');
            return;
        }

        // ✅ FIX: Use videos endpoint with userId query parameter
        const response = await apiRequest(`${API_URL}/videos?userId=${userId}`, {
            method: 'GET'
        });

        const data = await response.json();
        console.log('Videos response:', data);

        if (response.ok && data.data) {
            let userVideos = [];

            // Handle different response formats
            if (Array.isArray(data.data)) {
                userVideos = data.data;
            } else if (data.data.videos && Array.isArray(data.data.videos)) {
                userVideos = data.data.videos;
            } else if (data.data.docs && Array.isArray(data.data.docs)) {
                userVideos = data.data.docs;
            }

            console.log('User videos:', userVideos);
            console.log('User videos count:', userVideos.length);

            // Update video count
            if (videosCount) {
                videosCount.textContent = `${userVideos.length} videos`;
            }

            if (userVideos.length > 0) {
                displayVideos(userVideos);
            } else {
                videosContainer.innerHTML = `
                    <div class="no-videos">
                        <div class="no-videos-icon">
                            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                        </div>
                        <h2>No videos yet</h2>
                        <p>This channel hasn't uploaded any videos</p>
                    </div>
                `;
            }
        } else {
            throw new Error(data.message || 'Failed to load videos');
        }
    } catch (error) {
        console.error('Error loading videos:', error);
        if (videosContainer) {
            videosContainer.innerHTML = `
                <div class="error-message">
                    <p>Error loading videos: ${error.message}</p>
                </div>
            `;
        }
    }
}

// Display videos with 3-dot menu
function displayVideos(videos) {
    if (!videosContainer) return;

    videosContainer.innerHTML = '';

    videos.forEach(video => {
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        videoCard.style.position = 'relative';

        videoCard.innerHTML = `
            <div class="video-thumbnail" style="cursor: pointer;">
                <img src="${video.thumbnail || 'https://via.placeholder.com/320x180/1a1a1a/ea2a33?text=No+Thumbnail'}" 
                     alt="${video.title}"
                     onerror="this.src='https://via.placeholder.com/320x180/1a1a1a/ea2a33?text=No+Thumbnail'">
                <span class="video-duration">${formatDuration(video.duration)}</span>
            </div>
            <div class="video-info">
                <h3 class="video-title">${video.title}</h3>
                <div class="video-stats">
                    <span>${formatViews(video.views)} views</span>
                    <span>•</span>
                    <span>${formatDate(video.createdAt)}</span>
                </div>
            </div>
            
            <button class="video-menu-btn" data-video-id="${video._id}" style="
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(0,0,0,0.8);
                border: none;
                border-radius: 50%;
                width: 32px;
                height: 32px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 20px;
                z-index: 10;
            ">⋮</button>
            
            <div class="video-menu" data-video-id="${video._id}" style="
                display: none;
                position: absolute;
                top: 45px;
                right: 10px;
                background: #282828;
                border-radius: 8px;
                padding: 8px 0;
                min-width: 150px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                z-index: 20;
            ">
                <div class="menu-item" data-action="edit" data-video-id="${video._id}" style="
                    padding: 10px 16px;
                    cursor: pointer;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                ">
                    <span class="material-icons" style="font-size: 20px;">edit</span>
                    <span>Edit</span>
                </div>
                <div class="menu-item" data-action="delete" data-video-id="${video._id}" style="
                    padding: 10px 16px;
                    cursor: pointer;
                    color: #ea2a33;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                ">
                    <span class="material-icons" style="font-size: 20px;">delete</span>
                    <span>Delete</span>
                </div>
            </div>
        `;

        const thumbnail = videoCard.querySelector('.video-thumbnail');
        thumbnail.addEventListener('click', () => {
            window.location.href = `videoPlayer.html?id=${video._id}`;
        });

        const menuBtn = videoCard.querySelector('.video-menu-btn');
        const menu = videoCard.querySelector('.video-menu');

        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.video-menu').forEach(m => {
                if (m !== menu) m.style.display = 'none';
            });
            menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        });

        const menuItems = videoCard.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.background = '#3a3a3a';
            });
            item.addEventListener('mouseleave', () => {
                item.style.background = 'transparent';
            });
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = item.getAttribute('data-action');
                const videoId = item.getAttribute('data-video-id');

                if (action === 'edit') {
                    editVideo(videoId);
                } else if (action === 'delete') {
                    deleteVideo(videoId, video.title);
                }

                menu.style.display = 'none';
            });
        });

        videosContainer.appendChild(videoCard);
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.video-menu').forEach(menu => {
            menu.style.display = 'none';
        });
    });
}

function editVideo(videoId) {
    window.location.href = `upload.html?edit=${videoId}`;
}

async function deleteVideo(videoId, videoTitle) {
    if (!confirm(`Are you sure you want to delete "${videoTitle}"?`)) {
        return;
    }

    try {
        const response = await apiRequest(`${API_ENDPOINTS.VIDEOS}/${videoId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Video deleted successfully!');
            loadChannelData();
        } else {
            const data = await response.json();
            throw new Error(data.message || 'Failed to delete video');
        }
    } catch (error) {
        console.error('Error deleting video:', error);
        alert('Failed to delete video: ' + error.message);
    }
}

function formatViews(views) {
    if (!views) return '0';
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return views.toString();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
}

function formatDuration(seconds) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function showError(message) {
    alert(message);
}

// Initialize
loadChannelData();
