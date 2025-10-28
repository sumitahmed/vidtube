// ============================================
// Authentication Utilities
// ============================================

function getAccessToken() {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

function setAccessToken(token) {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
}

function removeAccessToken() {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
}

function getUserData() {
  const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
  return userData ? JSON.parse(userData) : null;
}

function setUserData(data) {
  localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data));
}

function removeUserData() {
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);
}

// Check if user is authenticated
function isAuthenticated() {
  return !!getAccessToken();
}

// Redirect to auth page if not logged in
function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = 'auth.html';
    return false;
  }
  return true;
}

// Redirect to home if already logged in
function redirectIfAuthenticated() {
  if (isAuthenticated()) {
    window.location.href = 'home.html';
  }
}

// ============================================
// API Request Utilities
// ============================================

async function apiRequest(url, options = {}) {
  const token = getAccessToken();
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, config);
    
    // Handle unauthorized - token expired
    if (response.status === 401) {
      handleUnauthorized();
      throw new Error('Unauthorized - Please login again');
    }
    
    return response;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
}

function handleUnauthorized() {
  removeAccessToken();
  removeUserData();
  window.location.href = 'auth.html';
}

// ============================================
// Logout Utility
// ============================================

async function logout() {
  try {
    await apiRequest(API_ENDPOINTS.LOGOUT, {
      method: 'POST'
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    removeAccessToken();
    removeUserData();
    window.location.href = 'auth.html';
  }
}

// ============================================
// Format Utilities
// ============================================

function formatViews(views) {
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
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// ============================================
// UI Utilities
// ============================================

function showLoading(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = '<div class="loading">Loading...</div>';
  }
}

function hideLoading(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = '';
  }
}

function showError(message, elementId = null) {
  if (elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = `<div class="error-message">${message}</div>`;
    }
  } else {
    alert(message);
  }
}

function showSuccess(message, elementId = null) {
  if (elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = `<div class="success-message">${message}</div>`;
    }
  } else {
    alert(message);
  }
}
