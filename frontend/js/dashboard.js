requireAuth();

// DOM Elements
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const content = document.querySelector('.content');
const profileBtn = document.getElementById('profile-btn');
const dropdownMenu = document.getElementById('dropdown-menu');
const profileImg = document.getElementById('profile-img');

// Stats elements
const totalVideosEl = document.getElementById('total-videos');
const totalViewsEl = document.getElementById('total-views');
const totalSubscribersEl = document.getElementById('total-subscribers');
const totalLikesEl = document.getElementById('total-likes');

// Videos container
const videosContainer = document.getElementById('videos-container');

// Sidebar Toggle
if (menuToggle && sidebar && content) {
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('hidden');
        content.classList.toggle('expanded');
    });
}

// Profile Dropdown
if (profileBtn && dropdownMenu) {
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

// Load user profile image
const userData = getUserData();
if (userData && userData.avatar && profileImg) {
    profileImg.src = userData.avatar;
}

// Load Dashboard Stats
async function loadDashboardStats() {
    try {
        const response = await apiRequest(API_ENDPOINTS.DASHBOARD_STATS, {
            method: 'GET'
        });
        
        const data = await response.json();
        console.log('Dashboard stats response:', data);

        if (response.ok && data.data) {
            const stats = data.data;
            console.log('Displaying stats:', stats);
            
            if (totalVideosEl) totalVideosEl.textContent = stats.totalVideos || 0;
            if (totalViewsEl) totalViewsEl.textContent = formatViews(stats.totalViews || 0);
            if (totalSubscribersEl) totalSubscribersEl.textContent = formatViews(stats.totalSubscribers || 0);
            if (totalLikesEl) totalLikesEl.textContent = formatViews(stats.totalLikes || 0);
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Load Dashboard Videos
async function loadDashboardVideos() {
    try {
        console.log('Loading dashboard videos...');
        
        if (!videosContainer) {
            console.error('Videos container not found in DOM!');
            return;
        }

        const response = await apiRequest(API_ENDPOINTS.DASHBOARD_VIDEOS, {
            method: 'GET'
        });
        
        const data = await response.json();
        console.log('Dashboard videos response:', data);

        if (response.ok && data.data) {
            let videos = [];
            
            // Handle different response structures
            if (Array.isArray(data.data)) {
                videos = data.data;
            } else if (data.data.videos && Array.isArray(data.data.videos)) {
                videos = data.data.videos;
            } else if (data.data.docs && Array.isArray(data.data.docs)) {
                videos = data.data.docs;
            }
            
            console.log('Videos:', videos);
            console.log('Videos count:', videos.length);

            if (videos.length > 0) {
                displayVideos(videos);
            } else {
                videosContainer.innerHTML = `
                    <div class="no-videos" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 20px;">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                        <h3>No videos yet</h3>
                        <p>Upload your first video to get started!</p>
                        <a href="upload.html" class="btn-primary" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #ea2a33; color: white; text-decoration: none; border-radius: 4px;">Upload Video</a>
                    </div>
                `;
            }
        } else {
            throw new Error(data.message || 'Failed to load videos');
        }
    } catch (error) {
        console.error('Error loading dashboard videos:', error);
        if (videosContainer) {
            videosContainer.innerHTML = `
                <div class="error-message" style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ea2a33;">
                    <p>Error loading videos</p>
                    <p style="font-size: 14px; color: #999; margin-top: 10px;">${error.message}</p>
                </div>
            `;
        }
    }
}

// Display Videos
// Display Videos
// Display Videos
function displayVideos(videos) {
    if (!videosContainer) {
        console.error('Cannot display videos: container not found');
        return;
    }
    
    videosContainer.innerHTML = '';
    
    videos.forEach(video => {
        const videoCard = document.createElement('div');
        videoCard.className = 'video-item';
        // Remove cursor pointer from the card itself
        videoCard.style.cursor = 'default';
        
        videoCard.innerHTML = `
            <img src="${video.thumbnail || 'https://via.placeholder.com/160x90/1a1a1a/ea2a33?text=No+Thumbnail'}" 
                 alt="${video.title}"
                 onerror="this.src='https://via.placeholder.com/160x90/1a1a1a/ea2a33?text=No+Thumbnail'"
                 style="width: 160px; height: 90px; object-fit: cover; border-radius: 8px;">
            <div class="video-details" style="flex: 1; margin-left: 15px;">
                <h4 style="margin: 0 0 8px 0; color: white; font-size: 16px;">${video.title}</h4>
                <div class="video-meta" style="color: #999; font-size: 14px; margin-bottom: 5px;">
                    <span>${formatViews(video.views)} views</span>
                    <span> • </span>
                    <span>${formatDate(video.createdAt)}</span>
                </div>
                <div class="video-stats" style="color: #999; font-size: 13px;">
                    <span>${formatViews(video.likes || 0)} likes</span>
                    <span> • </span>
                    <span>${formatViews(video.comments || 0)} comments</span>
                </div>
            </div>
            <div class="video-actions" style="display: flex; gap: 10px;">
                <button class="view-btn" data-id="${video._id}" style="padding: 8px 16px; background: #ea2a33; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">View</button>
            </div>
        `;
        
        // Add click event to button only
        const viewBtn = videoCard.querySelector('.view-btn');
        if (viewBtn) {
            viewBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const videoId = video._id;
                console.log('Navigating to video:', videoId);
                window.location.href = `videoPlayer.html?id=${videoId}`;
            });
        }
        
        videosContainer.appendChild(videoCard);
    });
    
    console.log('Successfully displayed', videos.length, 'videos');
}

// Helper functions
function formatViews(views) {
    if (!views) return '0';
    if (views >= 1000000) {
        return (views / 1000000).toFixed(1) + 'M';
    } else if (views >= 1000) {
        return (views / 1000).toFixed(1) + 'K';
    }
    return views.toString();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
        const years = Math.floor(diffDays / 365);
        return `${years} year${years > 1 ? 's' : ''} ago`;
    }
}

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
    loadDashboardVideos();
});
