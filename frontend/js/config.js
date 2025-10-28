// API Configuration
const API_URL = "https://vidtube-l3cq.onrender.com/";

// API Endpoints
const API_ENDPOINTS = {
    // Auth
    REGISTER: `${API_URL}/users/register`,
    LOGIN: `${API_URL}/users/login`,
    LOGOUT: `${API_URL}/users/logout`,
    CURRENT_USER: `${API_URL}/users/current-user`,
    REFRESH_TOKEN: `${API_URL}/users/refresh-token`,
    
    SUBSCRIPTIONS: `${API_URL}/subscriptions/u`,
    PLAYLISTS: `${API_URL}/playlists`,

    TOGGLE_SUBSCRIPTION: (channelId) => `${API_URL}/subscriptions/c/${channelId}`,

    // Videos
    VIDEOS: `${API_URL}/videos`,
    UPLOAD_VIDEO: `${API_URL}/videos`,
    USER_VIDEOS: (userId) => `${API_URL}/videos/user/${userId}`,

    // Users
    CHANNEL: (username) => `${API_URL}/users/channel/${username}`,
    WATCH_HISTORY: `${API_URL}/users/history`,
    ADD_TO_HISTORY: (videoId) => `${API_URL}/users/history/${videoId}`,

    // Dashboard
    DASHBOARD_STATS: `${API_URL}/dashboard/stats`,
    DASHBOARD_VIDEOS: `${API_URL}/dashboard/videos`,

    // Likes
    TOGGLE_VIDEO_LIKE: (videoId) => `${API_URL}/likes/toggle/v/${videoId}`,
    TOGGLE_COMMENT_LIKE: (commentId) => `${API_URL}/likes/toggle/c/${commentId}`,

    // Comments
    GET_COMMENTS: (videoId) => `${API_URL}/comments/${videoId}`,
    ADD_COMMENT: (videoId) => `${API_URL}/comments/${videoId}`,
    DELETE_COMMENT: (commentId) => `${API_URL}/comments/c/${commentId}`,
};

// Local Storage Keys
const STORAGE_KEYS = {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    USER_DATA: 'userData'
};
