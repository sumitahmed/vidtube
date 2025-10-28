// Check if already logged in
redirectIfAuthenticated();

// Get form elements
const loginSection = document.getElementById('login-section');
const registerSection = document.getElementById('register-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

// Toggle between login and register
function showRegister(e) {
  e.preventDefault();
  loginSection.style.display = 'none';
  registerSection.style.display = 'block';
}

function showLogin(e) {
  e.preventDefault();
  registerSection.style.display = 'none';
  loginSection.style.display = 'block';
}

// Handle Login
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  try {
    const response = await fetch(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Store tokens and user data
      setAccessToken(data.data.accessToken);
      setUserData(data.data.user);
      
      showSuccess('Login successful!');
      
      // Redirect to home page
      setTimeout(() => {
        window.location.href = 'home.html';
      }, 1000);
    } else {
      showError(data.message || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    showError('Failed to login. Please check if backend is running on port 8000.');
  }
}

// Handle Registration
// Handle Registration
async function handleRegister(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('register-fullname').value;
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const avatar = document.getElementById('register-avatar').files[0];
    const coverImage = document.getElementById('register-coverImage').files[0];
    
    // Validation
    if (!avatar) {
        showError('Please select an avatar image');
        return;
    }
    
    const formData = new FormData();
    formData.append('fullname', fullName);  // ✅ FIXED - lowercase
    formData.append('username', username);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('avatar', avatar);
    if (coverImage) {
        formData.append('coverImage', coverImage);
    }
    
    try {
        const response = await fetch(API_ENDPOINTS.REGISTER, {
            method: 'POST',
            body: formData,
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showSuccess('Registration successful! Please login.');
            setTimeout(() => {
                showLogin(new Event('click'));
                document.getElementById('login-email').value = email;
            }, 1500);
        } else {
            showError(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError('Failed to register. Please check if backend is running on port 8000.');
    }
}


// Attach event listeners
loginForm.addEventListener('submit', handleLogin);
registerForm.addEventListener('submit', handleRegister);
