requireAuth();

// DOM Elements
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const content = document.querySelector('.content');
const profileBtn = document.getElementById('profile-btn');
const dropdownMenu = document.getElementById('dropdown-menu');
const profileImg = document.getElementById('profile-img');
const subscriptionsContainer = document.getElementById('subscriptions-container');

// Sidebar toggle
if (menuToggle && sidebar && content) {
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('hidden');
        content.classList.toggle('expanded');
    });
}

// Profile dropdown
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

// Load user profile
const userData = getUserData();
if (userData && userData.avatar && profileImg) {
    profileImg.src = userData.avatar;
}

// Load subscriptions
async function loadSubscriptions() {
    try {
        subscriptionsContainer.innerHTML = '<p style="text-align: center; color: #aaa; padding: 40px;">Loading subscriptions...</p>';
        
        const response = await apiRequest(`${API_URL}/subscriptions/u/${userData._id}`, {
            method: 'GET'
        });
        
        const data = await response.json();
        console.log('Subscriptions response:', data);

        if (response.ok && data.data) {
            const subscriptions = data.data.subscribedChannels || [];
            
            if (subscriptions.length > 0) {
                displaySubscriptions(subscriptions);
            } else {
                subscriptionsContainer.innerHTML = `
                    <div style="text-align: center; padding: 60px 20px;">
                        <span class="material-icons" style="font-size: 80px; color: #666; margin-bottom: 20px;">subscriptions</span>
                        <h2 style="color: white; margin-bottom: 12px;">No subscriptions yet</h2>
                        <p style="color: #aaa;">Subscribe to channels to see their latest content here</p>
                    </div>
                `;
            }
        } else {
            throw new Error('Failed to load subscriptions');
        }
    } catch (error) {
        console.error('Error:', error);
        subscriptionsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <p style="color: #ea2a33;">Error loading subscriptions</p>
                <button onclick="loadSubscriptions()" style="margin-top: 20px; padding: 10px 20px; background: #333; border: none; border-radius: 4px; color: white; cursor: pointer;">Retry</button>
            </div>
        `;
    }
}

function displaySubscriptions(subscriptions) {
    subscriptionsContainer.innerHTML = subscriptions.map(sub => {
        const channel = sub.channel;
        return `
            <div class="channel-card" onclick="window.location.href='channel.html?username=${channel.username}'" style="cursor: pointer; padding: 16px; background: #282828; border-radius: 8px; display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
                <img src="${channel.avatar || 'https://via.placeholder.com/80'}" 
                     alt="${channel.username}"
                     onerror="this.src='https://via.placeholder.com/80'"
                     style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;">
                <div style="flex: 1;">
                    <h3 style="color: white; margin-bottom: 4px;">${channel.fullname || channel.username}</h3>
                    <p style="color: #aaa; font-size: 14px;">@${channel.username}</p>
                    <p style="color: #aaa; font-size: 14px;">${formatViews(sub.subscriberCount || 0)} subscribers</p>
                </div>
                <button onclick="event.stopPropagation(); unsubscribe('${channel._id}')" 
                        style="padding: 8px 16px; background: #ea2a33; border: none; border-radius: 4px; color: white; cursor: pointer;">
                    Subscribed
                </button>
            </div>
        `;
    }).join('');
}

async function unsubscribe(channelId) {
    if (!confirm('Unsubscribe from this channel?')) return;
    
    try {
        const response = await apiRequest(`${API_URL}/subscriptions/c/${channelId}`, {
            method: 'POST'
        });
        
        if (response.ok) {
            loadSubscriptions();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to unsubscribe');
    }
}

function formatViews(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// Initialize
loadSubscriptions();
