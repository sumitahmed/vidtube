requireAuth();

const urlParams = new URLSearchParams(window.location.search);
const editVideoId = urlParams.get('edit');
let isEditMode = false;

// DOM Elements
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const content = document.querySelector('.content');
const profileBtn = document.getElementById('profile-btn');
const dropdownMenu = document.getElementById('dropdown-menu');
const profileImg = document.getElementById('profile-img');

// Upload form elements
const uploadForm = document.getElementById('upload-form');
const videoFile = document.getElementById('video-file');
const videoDropZone = document.getElementById('video-drop-zone');
const videoPreview = document.getElementById('video-preview');
const videoPreviewPlayer = document.getElementById('video-preview-player');
const videoFileName = document.getElementById('video-file-name');

// ✅ TRY BOTH IDs - one of them will work!
const thumbnailFile = document.getElementById('thumbnail-file') || document.getElementById('thumbnail');

const thumbnailPreview = document.getElementById('thumbnail-preview');
const thumbnailPlaceholder = document.getElementById('thumbnail-placeholder');
const titleInput = document.getElementById('title');
const descriptionInput = document.getElementById('description');
const titleCount = document.getElementById('title-count');
const descCount = document.getElementById('desc-count');
const uploadProgress = document.getElementById('upload-progress');
const progressFill = document.getElementById('progress-fill');
const progressStatus = document.getElementById('progress-status');
const progressPercent = document.getElementById('progress-percent');
const uploadBtn = document.getElementById('upload-btn');

console.log("Thumbnail element found:", !!thumbnailFile);

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
    document.addEventListener('click', () => {
        dropdownMenu.classList.remove('active');
    });
}

// Load user profile
const userData = getUserData();
if (userData && userData.avatar && profileImg) {
    profileImg.src = userData.avatar;
}

// Character counters
if (titleInput && titleCount) {
    titleInput.addEventListener('input', () => {
        titleCount.textContent = titleInput.value.length;
    });
}

if (descriptionInput && descCount) {
    descriptionInput.addEventListener('input', () => {
        descCount.textContent = descriptionInput.value.length;
    });
}

// Video file selection
if (videoFile) {
    videoFile.addEventListener('change', handleVideoSelect);
}

function handleVideoSelect(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
        displayVideoPreview(file);
    } else {
        showError('Please select a valid video file');
    }
}

function displayVideoPreview(file) {
    if (!videoPreviewPlayer || !videoPreview || !videoDropZone || !videoFileName) return;
    
    const url = URL.createObjectURL(file);
    videoPreviewPlayer.src = url;
    videoPreview.style.display = 'block';
    
    const dropZoneContent = videoDropZone.querySelector('.drop-zone-content');
    if (dropZoneContent) {
        dropZoneContent.style.display = 'none';
    }
    
    videoFileName.innerHTML = `<span class="material-icons">video_file</span> ${file.name}`;
}

function removeVideo() {
    if (!videoFile || !videoPreview || !videoDropZone || !videoFileName || !videoPreviewPlayer) return;
    
    videoFile.value = '';
    videoPreview.style.display = 'none';
    
    const dropZoneContent = videoDropZone.querySelector('.drop-zone-content');
    if (dropZoneContent) {
        dropZoneContent.style.display = 'block';
    }
    
    videoFileName.textContent = '';
    videoPreviewPlayer.src = '';
}

// Drag and drop for video
if (videoDropZone) {
    videoDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        videoDropZone.classList.add('dragover');
    });

    videoDropZone.addEventListener('dragleave', () => {
        videoDropZone.classList.remove('dragover');
    });

    videoDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        videoDropZone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('video/')) {
            videoFile.files = e.dataTransfer.files;
            displayVideoPreview(file);
        } else {
            showError('Please drop a valid video file');
        }
    });
}

// Thumbnail selection
if (thumbnailFile) {
    thumbnailFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        console.log("✅ Thumbnail selected:", file ? file.name : 'none');
        if (file && file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            if (thumbnailPreview) {
                thumbnailPreview.src = url;
                thumbnailPreview.style.display = 'block';
            }
            if (thumbnailPlaceholder) {
                thumbnailPlaceholder.style.display = 'none';
            }
        } else {
            showError('Please select a valid image file');
        }
    });
}

// Load video for editing
if (editVideoId) {
    loadVideoForEdit(editVideoId);
}

async function loadVideoForEdit(videoId) {
    try {
        isEditMode = true;
        
        const pageTitle = document.querySelector('h1');
        if (pageTitle) pageTitle.textContent = 'Edit Video';
        if (uploadBtn) uploadBtn.textContent = 'Update Video';
        
        if (videoDropZone) {
            const dropZonePara = videoDropZone.querySelector('p');
            if (dropZonePara) {
                dropZonePara.textContent = 'Leave empty to keep existing video';
            }
        }
        
        const response = await apiRequest(`${API_ENDPOINTS.VIDEOS}/${videoId}`, {
            method: 'GET'
        });
        
        const data = await response.json();
        
        if (response.ok && data.data) {
            const video = data.data;
            
            if (titleInput) titleInput.value = video.title;
            if (descriptionInput) descriptionInput.value = video.description || '';
            
            if (titleCount) titleCount.textContent = video.title.length;
            if (descCount) descCount.textContent = (video.description || '').length;
            
            if (video.thumbnail && thumbnailPreview && thumbnailPlaceholder) {
                thumbnailPreview.src = video.thumbnail;
                thumbnailPreview.style.display = 'block';
                thumbnailPlaceholder.style.display = 'none';
            }
            
            if (video.videoFile && videoFileName) {
                videoFileName.innerHTML = `<span class="material-icons">video_file</span> Current video (${video.duration}s)`;
            }
        } else {
            throw new Error('Failed to load video');
        }
    } catch (error) {
        console.error('Error loading video for edit:', error);
        showError('Failed to load video for editing');
        setTimeout(() => window.location.href = 'dashboard.html', 2000);
    }
}

// Form submission
if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!isEditMode && (!videoFile || !videoFile.files[0])) {
            showError('Please select a video file');
            return;
        }
        
        if (!isEditMode && (!thumbnailFile || !thumbnailFile.files[0])) {
            showError('Please select a thumbnail image');
            return;
        }
        
        if (!titleInput || !titleInput.value.trim()) {
            showError('Please enter a video title');
            return;
        }
        
        const formData = new FormData();
        
        if (videoFile && videoFile.files && videoFile.files[0]) {
            formData.append('videoFile', videoFile.files[0]);
        }
        
        // ✅ FIXED thumbnail append
        if (thumbnailFile && thumbnailFile.files && thumbnailFile.files.length > 0) {
            formData.append('thumbnail', thumbnailFile.files[0]);
            console.log("✅ Thumbnail appended:", thumbnailFile.files[0].name);
        } else {
            console.log("⚠️ No thumbnail selected");
        }
        
        formData.append('title', titleInput.value.trim());
        if (descriptionInput) {
            formData.append('description', descriptionInput.value.trim());
        }
        
        const visibility = document.querySelector('input[name="visibility"]:checked');
        if (visibility) {
            formData.append('isPublished', visibility.value === 'public' ? 'true' : 'false');
        }
        
        if (uploadProgress) uploadProgress.style.display = 'block';
        if (uploadBtn) {
            uploadBtn.disabled = true;
            uploadBtn.textContent = isEditMode ? 'Updating...' : 'Uploading...';
        }
        
        try {
            const xhr = new XMLHttpRequest();
            
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable && progressFill && progressPercent && progressStatus) {
                    const percent = Math.round((e.loaded / e.total) * 100);
                    progressFill.style.width = percent + '%';
                    progressPercent.textContent = percent + '%';
                    if (percent === 100) {
                        progressStatus.textContent = 'Processing...';
                    }
                }
            });
            
            xhr.addEventListener('load', () => {
                if (xhr.status === 200 || xhr.status === 201) {
                    showSuccess(isEditMode ? 'Video updated successfully!' : 'Video uploaded successfully!');
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 2000);
                } else {
                    const error = JSON.parse(xhr.responseText);
                    showError(error.message || (isEditMode ? 'Update failed' : 'Upload failed'));
                    resetUploadState();
                }
            });
            
            xhr.addEventListener('error', () => {
                showError(isEditMode ? 'Update failed. Please try again.' : 'Upload failed. Please try again.');
                resetUploadState();
            });
            
            const method = isEditMode ? 'PATCH' : 'POST';
            const url = isEditMode ? `${API_ENDPOINTS.VIDEOS}/${editVideoId}` : API_ENDPOINTS.UPLOAD_VIDEO;
            
            xhr.open(method, url);
            xhr.setRequestHeader('Authorization', `Bearer ${getAccessToken()}`);
            xhr.send(formData);
            
        } catch (error) {
            console.error('Upload error:', error);
            showError('Failed. Please check your connection.');
            resetUploadState();
        }
    });
}

function resetUploadState() {
    if (uploadProgress) uploadProgress.style.display = 'none';
    if (progressFill) progressFill.style.width = '0%';
    if (progressPercent) progressPercent.textContent = '0%';
    if (progressStatus) progressStatus.textContent = 'Uploading...';
    if (uploadBtn) {
        uploadBtn.disabled = false;
        uploadBtn.textContent = isEditMode ? 'Update Video' : 'Upload Video';
    }
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await logout();
    });
}
