requireAuth();

// DOM Elements
const profileBtn = document.getElementById('profile-btn');
const dropdownMenu = document.getElementById('dropdown-menu');
const profileImg = document.getElementById('profile-img');
const userAvatar = document.getElementById('user-avatar');

// Video elements
const videoElement = document.getElementById('video-element');
const videoTitle = document.getElementById('video-title');
const videoViews = document.getElementById('video-views');
const videoDate = document.getElementById('video-date');
const likeBtn = document.getElementById('like-btn');
const likeCount = document.getElementById('like-count');
const channelAvatar = document.getElementById('channel-avatar');
const channelName = document.getElementById('channel-name');
const channelLink = document.getElementById('channel-link');
const subscriberCount = document.getElementById('subscriber-count');
const subscribeBtn = document.getElementById('subscribe-btn');
const descriptionContent = document.getElementById('description-content');
const showMoreBtn = document.getElementById('show-more-btn');
const commentCount = document.getElementById('comment-count');
const commentInput = document.getElementById('comment-input');
const sendCommentBtn = document.getElementById('send-comment-btn');
const commentsList = document.getElementById('comments-list');
const recommendedVideos = document.getElementById('recommended-videos');

// Get video ID from URL
const urlParams = new URLSearchParams(window.location.search);
const videoId = urlParams.get('id');
;

if (!videoId) {
  window.location.href = 'home.html';
}

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

// Load user profile
const userData = getUserData();
if (userData) {
  if (userData.avatar && profileImg) {
    profileImg.src = userData.avatar;
  }
  if (userData.avatar && userAvatar) {
    userAvatar.src = userData.avatar;
  }
}

// Description show more/less
if (showMoreBtn) {
  showMoreBtn.addEventListener('click', () => {
    descriptionContent.classList.toggle('expanded');
    showMoreBtn.textContent = descriptionContent.classList.contains('expanded') ? 'Show less' : 'Show more';
  });
}

// ============================================
// LIKE FUNCTIONALITY
// ============================================
let isLiked = false;

if (likeBtn) {
  likeBtn.addEventListener('click', async () => {
    try {
      const response = await apiRequest(API_ENDPOINTS.TOGGLE_VIDEO_LIKE(videoId), {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Toggle UI
        isLiked = !isLiked;
        likeBtn.classList.toggle('liked');
        
        // Update count
        const currentCount = parseInt(likeCount.textContent.replace(/[^0-9]/g, '')) || 0;
        likeCount.textContent = isLiked ? currentCount + 1 : Math.max(0, currentCount - 1);
        
        showSuccess(isLiked ? 'Liked!' : 'Unliked');
      } else {
        showError(data.message || 'Failed to like video');
      }
    } catch (error) {
      console.error('Error liking video:', error);
      showError('Failed to like video');
    }
  });
}

// ============================================
// SUBSCRIBE FUNCTIONALITY
// ============================================
let isSubscribed = false;
let currentChannelId = null;

if (subscribeBtn) {
    subscribeBtn.addEventListener('click', async () => {
        if (!currentChannelId) {
            showError('Channel ID not found');
            return;
        }

        try {
            subscribeBtn.disabled = true;
            
            const response = await apiRequest(`${API_URL}/subscriptions/c/${currentChannelId}`, {
                method: 'POST'
            });

            if (response.ok) {
                // Toggle subscribe state
                isSubscribed = !isSubscribed;
                
                if (isSubscribed) {
                    subscribeBtn.textContent = 'Subscribed';
                    subscribeBtn.style.background = '#666';
                    showSuccess('Subscribed!');
                } else {
                    subscribeBtn.textContent = 'Subscribe';
                    subscribeBtn.style.background = '#ea2a33';
                    showSuccess('Unsubscribed');
                }
            } else {
                const data = await response.json();
                showError(data.message || 'Failed to subscribe');
            }
        } catch (error) {
            console.error('Subscribe error:', error);
            showError('Failed to subscribe');
        } finally {
            subscribeBtn.disabled = false;
        }
    });
}


// ============================================
// COMMENT FUNCTIONALITY
// ============================================

// Send comment on button click
if (sendCommentBtn) {
  sendCommentBtn.addEventListener('click', async () => {
    const content = commentInput.value.trim();
    if (content) {
      await addComment(content);
      commentInput.value = '';
    }
  });
}

// Also send comment on Enter key
if (commentInput) {
  commentInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
      const content = commentInput.value.trim();
      if (content) {
        await addComment(content);
        commentInput.value = '';
      }
    }
  });
}

async function addComment(content) {
  try {
    sendCommentBtn.disabled = true;
    
    const response = await apiRequest(API_ENDPOINTS.ADD_COMMENT(videoId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showSuccess('Comment added!');
      loadComments();
    } else {
      showError(data.message || 'Failed to add comment');
    }
  } catch (error) {
    console.error('Error adding comment:', error);
    showError('Failed to add comment');
  } finally {
    sendCommentBtn.disabled = false;
  }
}

// Load comments
async function loadComments() {
  try {
    console.log('Loading comments for video:', videoId);
    
    const response = await fetch(API_ENDPOINTS.GET_COMMENTS(videoId));
    const data = await response.json();
    
    console.log('Comments response:', data);
    
    if (response.ok) {
      let comments = [];
      
      if (Array.isArray(data.data)) {
        comments = data.data;
      } else if (data.data && Array.isArray(data.data.comments)) {
        comments = data.data.comments;
      }
      
      displayComments(comments);
      if (commentCount) {
        commentCount.textContent = comments.length;
      }
    } else {
      if (commentsList) {
        commentsList.innerHTML = '<p style="color: #aaa; text-align: center; padding: 20px;">No comments yet. Be the first to comment!</p>';
      }
      if (commentCount) {
        commentCount.textContent = '0';
      }
    }
  } catch (error) {
    console.error('Error loading comments:', error);
    if (commentsList) {
      commentsList.innerHTML = '<p style="color: #aaa; text-align: center; padding: 20px;">No comments yet. Be the first to comment!</p>';
    }
    if (commentCount) {
      commentCount.textContent = '0';
    }
  }
}

// Display comments
function displayComments(comments) {
  if (!commentsList) return;
  
  if (!comments || comments.length === 0) {
    commentsList.innerHTML = '<p style="color: #aaa; text-align: center; padding: 20px;">No comments yet. Be the first to comment!</p>';
    return;
  }
  
  commentsList.innerHTML = comments.map(comment => `
    <div class="comment">
      <img src="${comment.owner?.avatar || 'https://via.placeholder.com/40'}" 
           alt="${comment.owner?.username || 'User'}" 
           class="comment-avatar"
           onerror="this.src='https://via.placeholder.com/40'">
      <div class="comment-content">
        <div class="comment-header">
          <span class="comment-author">${comment.owner?.username || 'Unknown User'}</span>
          <span class="comment-date">${formatDate(comment.createdAt)}</span>
        </div>
        <p class="comment-text">${comment.content}</p>
        <div class="comment-actions">
          <button class="comment-action-btn">
            <span class="material-icons">thumb_up</span>
            <span>${comment.likes || 0}</span>
          </button>
          <button class="comment-action-btn">
            <span class="material-icons">thumb_down</span>
          </button>
          <button class="comment-action-btn">Reply</button>
        </div>
      </div>
    </div>
  `).join('');
}

// Load video data
async function loadVideoData() {
  try {
    const response = await fetch(`${API_ENDPOINTS.VIDEOS}/${videoId}`);
    const data = await response.json();
    
    console.log('Video data:', data);
    
    if (response.ok && data.data) {
      const video = data.data;
      
      // Set video source
      if (video.videoFile && videoElement) {
        videoElement.src = video.videoFile;
      }
      
      // Set video info
      if (videoTitle) videoTitle.textContent = video.title || 'Untitled Video';
      if (videoViews) videoViews.textContent = `${formatViews(video.views || 0)} views`;
      if (videoDate) videoDate.textContent = formatDate(video.createdAt);
      if (likeCount) likeCount.textContent = video.likes || 0;
      
      // Set channel info
      if (video.owner) {
        if (channelName) channelName.textContent = video.owner.username || 'Unknown';
        if (video.owner.avatar && channelAvatar) {
          channelAvatar.src = video.owner.avatar;
        }
        if (subscriberCount) subscriberCount.textContent = `${formatViews(video.owner.subscribersCount || 0)} subscribers`;
        if (channelLink) channelLink.href = `channel.html?user=${video.owner.username}`;
      }
      currentChannelId = video.owner._id;
      
      // Set description
      if (video.description && descriptionContent) {
        descriptionContent.innerHTML = `<p>${video.description.replace(/\n/g, '<br>')}</p>`;
      }
    } else {
      showError('Video not found');
      setTimeout(() => window.location.href = 'home.html', 2000);
    }
  } catch (error) {
    console.error('Error loading video:', error);
    showError('Failed to load video');
  }
}

// Load recommended videos
async function loadRecommendedVideos() {
  try {
    const response = await fetch(API_ENDPOINTS.VIDEOS);
    const data = await response.json();
    
    if (response.ok && data.data) {
      let videos = Array.isArray(data.data) ? data.data : [];
      
      // Filter out current video
      videos = videos.filter(v => v._id !== videoId);
      
      // Limit to 10 videos
      videos = videos.slice(0, 10);
      
      displayRecommendedVideos(videos);
    }
  } catch (error) {
    console.error('Error loading recommended videos:', error);
    if (recommendedVideos) {
      recommendedVideos.innerHTML = '<p style="color: #aaa; padding: 20px;">No recommendations</p>';
    }
  }
}

// Display recommended videos
function displayRecommendedVideos(videos) {
  if (!recommendedVideos) return;
  
  if (!videos || videos.length === 0) {
    recommendedVideos.innerHTML = '<p style="color: #aaa; padding: 20px;">No recommendations</p>';
    return;
  }
  
  recommendedVideos.innerHTML = videos.map(video => `
    <div class="recommended-video" onclick="window.location.href='videoPlayer.html?v=${video._id}'">
      <img src="${video.thumbnail || 'https://via.placeholder.com/168x94'}" 
           alt="${video.title}"
           onerror="this.src='https://via.placeholder.com/168x94/1a1a1a/ea2a33?text=No+Thumbnail'">
      <div class="recommended-info">
        <h4>${video.title}</h4>
        <p>${video.owner?.username || 'Unknown'}</p>
        <p>${formatViews(video.views || 0)} views • ${formatDate(video.createdAt)}</p>
      </div>
    </div>
  `).join('');
}

// ============================================
// TRACK WATCH HISTORY
// ============================================
if (videoElement) {
  videoElement.addEventListener('play', async () => {
    try {
      console.log('🎬 Video playing, adding to history...');
      const response = await apiRequest(API_ENDPOINTS.ADD_TO_HISTORY(videoId), {
        method: 'POST'
      });
      console.log('✅ Added to watch history');
    } catch (error) {
      console.error('❌ Failed to track watch history:', error);
    }
  }, { once: true });
}

// Initialize
console.log('Video ID:', videoId);
loadVideoData();
loadComments();
loadRecommendedVideos();
