requireAuth();

// DOM Elements
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const content = document.querySelector('.content');
const profileBtn = document.getElementById('profile-btn');
const dropdownMenu = document.getElementById('dropdown-menu');
const profileImg = document.getElementById('profile-img');
const videosContainer = document.getElementById('videos-container');

// Sidebar Toggle
if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('hidden');
    content.classList.toggle('expanded');
  });
}

// Profile Dropdown
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

// Load User Profile
const userData = getUserData();
if (userData && userData.avatar && profileImg) {
  profileImg.src = userData.avatar;
}

// Load Watch History
async function loadWatchHistory() {
  try {
    if (!videosContainer) {
      console.error('Videos container not found!');
      return;
    }
    
    videosContainer.innerHTML = '<div class="loading" style="grid-column: 1/-1; text-align: center; padding: 40px; color: white;">Loading history...</div>';
    
    console.log('Fetching watch history...');
    const response = await apiRequest(API_ENDPOINTS.WATCH_HISTORY, {
      method: 'GET'
    });
    
    const data = await response.json();
    console.log('Watch history response:', data);
    
    if (response.ok) {
      let videos = [];
      
      if (Array.isArray(data.data)) {
        videos = data.data;
      } else if (data.data && Array.isArray(data.data.videos)) {
        videos = data.data.videos;
      }
      
      if (videos.length > 0) {
        displayVideos(videos);
      } else {
        videosContainer.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
            <span class="material-icons" style="font-size: 80px; color: #666; margin-bottom: 20px; display: block;">history</span>
            <h2 style="color: white; margin-bottom: 12px;">No watch history</h2>
            <p style="color: #aaa; margin-bottom: 24px;">Start watching videos to build your history</p>
            <a href="home.html" class="btn-primary">Browse Videos</a>
          </div>
        `;
      }
    } else {
      throw new Error(data.message || 'Failed to load history');
    }
  } catch (error) {
    console.error('Error loading watch history:', error);
    if (videosContainer) {
      videosContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
          <span class="material-icons" style="font-size: 80px; color: #ea2a33; margin-bottom: 20px; display: block;">error_outline</span>
          <h2 style="color: white; margin-bottom: 12px;">Failed to load history</h2>
          <p style="color: #aaa; margin-bottom: 24px;">${error.message}</p>
          <button class="btn-primary" onclick="loadWatchHistory()">Retry</button>
        </div>
      `;
    }
  }
}

// Display Videos
function displayVideos(videos) {
  if (!videosContainer) return;
  
  videosContainer.innerHTML = videos.map(video => `
    <div class="video-card" onclick="openVideo('${video._id}')">
      <div class="video-thumbnail">
        <img src="${video.thumbnail || 'https://via.placeholder.com/320x180'}" 
             alt="${video.title}"
             onerror="this.src='https://via.placeholder.com/320x180/1a1a1a/ea2a33?text=No+Thumbnail'">
        <span class="video-duration">${formatDuration(video.duration || 0)}</span>
      </div>
      <div class="video-info">
        <div class="channel-avatar">
          <img src="${video.owner?.avatar || 'https://via.placeholder.com/36'}" 
               alt="${video.owner?.username || 'Channel'}"
               onerror="this.src='https://via.placeholder.com/36'">
        </div>
        <div class="video-details">
          <h3 class="video-title">${video.title}</h3>
          <div class="video-meta">
            <div class="channel-name">${video.owner?.username || 'Unknown Channel'}</div>
            <div>${formatViews(video.views || 0)} views • ${formatDate(video.createdAt)}</div>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function openVideo(videoId) {
  window.location.href = `videoPlayer.html?v=${videoId}`;
}

// Initialize
console.log('History page loaded');
loadWatchHistory();
