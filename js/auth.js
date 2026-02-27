// ==========================================
// DATACAMP AUTH PAGES - FORM HANDLING
// ==========================================

// Sign In Form Handling - Multi-step process
const signinForm = document.getElementById('signinForm');
const nextBtn = document.getElementById('nextBtn');
const passwordGroup = document.querySelector('.password-group');
const emailInput = document.getElementById('email');
let isPasswordStep = false;

if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (!isPasswordStep) {
            // First step: email validation
            if (email.value.trim()) {
                isPasswordStep = true;
                passwordGroup.style.display = 'block';
                passwordGroup.querySelector('input').focus();
                nextBtn.textContent = 'Sign In';
                emailInput.disabled = true;
            } else {
                alert('Please enter your email address');
            }
        } else {
            // Second step: sign in
            const email = emailInput.value;
            const password = document.getElementById('password').value;
            
            if (email && password) {
                console.log('Sign in attempt:', { email });
                nextBtn.textContent = 'Signing in...';
                nextBtn.disabled = true;
                
                // Call sign in API
                signInUser({ email, password });
            } else {
                alert('Please enter your password');
            }
        }
    });
}

// Email input - allow Enter key to proceed
if (emailInput) {
    emailInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !isPasswordStep) {
            nextBtn.click();
        }
    });
}

// Password input - allow Enter key to sign in
if (document.getElementById('password')) {
    document.getElementById('password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && isPasswordStep) {
            nextBtn.click();
        }
    });
}

// Sign Up Form Handling - Two Step Process
const signupForm = document.getElementById('signupForm');
const signupToggleBtn = document.getElementById('signupToggleBtn');
let isSignupPasswordStep = false;

if (signupToggleBtn) {
    signupToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (!isSignupPasswordStep) {
            // Step 1: Show password field when initial fields are filled
            const fullname = document.getElementById('fullname')?.value.trim() || '';
            const email = document.getElementById('email')?.value.trim() || '';
            const organization = document.getElementById('organization')?.value.trim() || '';
            
            // Validate initial fields
            if (!fullname) {
                alert('Please enter your name');
                return;
            }
            if (!email) {
                alert('Please enter your email');
                return;
            }
            if (!organization) {
                alert('Please enter your organization');
                return;
            }
            
            // Show password and terms sections
            document.getElementById('passwordSection').style.display = 'block';
            document.getElementById('termsSection').style.display = 'block';
            document.getElementById('password').focus();
            
            // Change button text and update state
            signupToggleBtn.textContent = 'Complete signup →';
            isSignupPasswordStep = true;
            
            // Disable initial fields
            document.getElementById('fullname').disabled = true;
            document.getElementById('email').disabled = true;
            document.getElementById('organization').disabled = true;
            
        } else {
            // Step 2: Submit form with all data including password
            const fullname = document.getElementById('fullname')?.value || '';
            const email = document.getElementById('email')?.value || '';
            const organization = document.getElementById('organization')?.value || '';
            const password = document.getElementById('password')?.value || '';
            const terms = document.getElementById('terms')?.checked;
            
            // Validate password
            if (!password) {
                showSignupError('Please enter a password');
                return;
            }
            if (password.length < 8) {
                showSignupError('Password must be at least 8 characters');
                return;
            }
            
            // Validate password strength using InputValidator
            if (typeof InputValidator !== 'undefined' && !InputValidator.isValidPassword(password)) {
                showSignupError('Password must contain: uppercase, lowercase, number, and special character (@, $, !, %, *, ?)');
                return;
            }
            
            // Check terms
            if (!terms) {
                showSignupError('Please agree to terms and conditions');
                return;
            }
            
            console.log('Sign up attempt (validated)');
            
            // Sanitize inputs for security
            const sanitizedData = {
              fullname: fullname.trim(),
              email: email.trim().toLowerCase(),
              organization: organization.trim(),
              password: password
            };
            
            // Animate button
            signupToggleBtn.textContent = 'Creating account...';
            signupToggleBtn.disabled = true;
            
            // Call signup API with sanitized data
            signUpUser(sanitizedData);
        }
    });
}

// Helper function for sign in (calls API)
function signInUser(credentials) {
  console.log('Attempting to sign in user...');
  
  fetch('/api/auth/signin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('✓ Sign in successful:', data.user);
      logMessage('Sign in successful');
      showSigninSuccess('You have been signed in successfully!', data.user);
    } else {
      console.error('✗ Sign in failed:', data.errors);
      showSigninError('Sign in failed: ' + (data.errors?.[0] || 'Invalid email or password'));
      nextBtn.textContent = 'Sign In';
      nextBtn.disabled = false;
    }
  })
  .catch(error => {
    console.error('✗ API Error:', error);
    showSigninError('Connection error: ' + error.message);
    nextBtn.textContent = 'Sign In';
    nextBtn.disabled = false;
  });
}

// Show sign in success message to user
function showSigninSuccess(message, user) {
  console.log('Sign in Success:', message);
  
  // Remove any existing messages
  const existingMessage = document.querySelector('.signin-success-message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  // Create success message element
  const successDiv = document.createElement('div');
  successDiv.className = 'signin-success-message';
  successDiv.innerHTML = `
    <div style="background-color: #efe; border: 1px solid #cfc; color: #3c3; padding: 16px; border-radius: 4px; margin-bottom: 20px; font-size: 14px;">
      <strong style="font-size: 16px;">✓ Signed In Successfully!</strong>
      <p style="margin: 10px 0 0 0;">Welcome back, <strong>${escapeHtml(user.fullname)}</strong>!</p>
      <p style="margin: 5px 0 0 0; color: #666;">Redirecting to your dashboard in 2 seconds...</p>
    </div>
  `;
  
  // Insert success message at top of form
  const authForm = document.getElementById('signinForm');
  if (authForm) {
    authForm.insertBefore(successDiv, authForm.firstChild);
  }
  
  // Disable the form
  nextBtn.disabled = true;
  emailInput.disabled = true;
  const passwordInput = document.getElementById('password');
  if (passwordInput) passwordInput.disabled = true;
  
  // Redirect to dashboard after 2 seconds
  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 2000);
}

// Show sign in error message to user
function showSigninError(message) {
  console.error('Sign in Error:', message);
  
  // Remove any existing error messages
  const existingError = document.querySelector('.signin-error-message');
  if (existingError) {
    existingError.remove();
  }
  
  // Create error message element
  const errorDiv = document.createElement('div');
  errorDiv.className = 'signin-error-message';
  errorDiv.innerHTML = `
    <div style="background-color: #fee; border: 1px solid #fcc; color: #c33; padding: 12px; border-radius: 4px; margin-bottom: 15px; font-size: 14px;">
      <strong>Error:</strong> ${message}
    </div>
  `;
  
  // Insert error message at top of form
  const authForm = document.getElementById('signinForm');
  if (authForm) {
    authForm.insertBefore(errorDiv, authForm.firstChild);
  }
}

// Helper function for sign up (calls API)
function signUpUser(credentials) {
  console.log('Creating user account (sanitized input)...');
  
  // Call the signup API with sanitized data
  fetch('/api/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('✓ Account created successfully:', data.user);
      logMessage('Account creation successful');
      showSignupSuccess('Your account has been created successfully! You can now sign in.', data.user);
    } else {
      console.error('✗ Account creation failed:', data.errors);
      showSignupError('Account creation failed: ' + (data.errors?.[0] || 'Unknown error'));
      signupToggleBtn.textContent = 'Complete signup →';
      signupToggleBtn.disabled = false;
    }
  })
  .catch(error => {
    console.error('✗ API Error:', error);
    showSignupError('Connection error: ' + error.message);
    signupToggleBtn.textContent = 'Complete signup →';
    signupToggleBtn.disabled = false;
  });
}

// Log signup attempt
function logMessage(message) {
  console.log('[SIGNUP] ' + message);
}

// Show signup success message to user
function showSignupSuccess(message, user) {
  console.log('Signup Success:', message);
  
  // Remove any existing messages
  const existingMessage = document.querySelector('.signup-success-message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  // Create success message element
  const successDiv = document.createElement('div');
  successDiv.className = 'signup-success-message';
  successDiv.innerHTML = `
    <div style="background-color: #efe; border: 1px solid #cfc; color: #3c3; padding: 16px; border-radius: 4px; margin-bottom: 20px; font-size: 14px;">
      <strong style="font-size: 16px;">✓ Account Created Successfully!</strong>
      <p style="margin: 10px 0 0 0;">Welcome, <strong>${escapeHtml(user.fullname)}</strong>!</p>
      <p style="margin: 5px 0 0 0; color: #666;">Your account with email <strong>${escapeHtml(user.email)}</strong> has been created.</p>
      <p style="margin: 10px 0 0 0;">Redirecting to sign in page in 2 seconds...</p>
    </div>
  `;
  
  // Insert success message at top of form
  const authForm = document.getElementById('signupForm');
  if (authForm) {
    authForm.insertBefore(successDiv, authForm.firstChild);
  }
  
  // Disable the form and button
  signupToggleBtn.disabled = true;
  signupToggleBtn.style.opacity = '0.5';
  document.getElementById('fullname').disabled = true;
  document.getElementById('email').disabled = true;
  document.getElementById('organization').disabled = true;
  document.getElementById('password').disabled = true;
  document.getElementById('terms').disabled = true;
  
  // Redirect to sign in page after 2 seconds
  setTimeout(() => {
    window.location.href = 'signin.html';
  }, 2000);
}

// Helper function to escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Show signup error message to user
function showSignupError(message) {
  console.error('Signup Error:', message);
  
  // Remove any existing error messages
  const existingError = document.querySelector('.signup-error-message');
  if (existingError) {
    existingError.remove();
  }
  
  // Create error message element
  const errorDiv = document.createElement('div');
  errorDiv.className = 'signup-error-message';
  errorDiv.innerHTML = `
    <div style="background-color: #fee; border: 1px solid #fcc; color: #c33; padding: 12px; border-radius: 4px; margin-bottom: 15px; font-size: 14px;">
      <strong>Error:</strong> ${message}
    </div>
  `;
  
  // Insert error message at top of form
  const authForm = document.getElementById('signupForm');
  if (authForm) {
    authForm.insertBefore(errorDiv, authForm.firstChild);
  }
}

// Google Sign In Button
const googleSigninBtn = document.getElementById('googleSigninBtn');
if (googleSigninBtn) {
    googleSigninBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Google Sign In clicked');
        alert('Google Sign In integration would go here. (This is a demo)');
    });
}

// Form input focus effects
document.querySelectorAll('.form-group input').forEach(input => {
    input.addEventListener('focus', (e) => {
        e.target.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', (e) => {
        e.target.parentElement.classList.remove('focused');
    });
});

// Password visibility toggle (optional enhancement)
function addPasswordToggle() {
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
        const wrapper = input.parentElement;
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'password-toggle';
        toggleBtn.innerHTML = '👁️';
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (input.type === 'password') {
                input.type = 'text';
                toggleBtn.innerHTML = '🙈';
            } else {
                input.type = 'password';
                toggleBtn.innerHTML = '👁️';
            }
        });
        wrapper.appendChild(toggleBtn);
    });
}

addPasswordToggle();
