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
                
                setTimeout(() => {
                    // Redirect to dashboard after successful sign in
                    window.location.href = 'dashboard.html';
                }, 1000);
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

// Sign Up Form Handling
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fullname = document.getElementById('fullname')?.value;
        const email = document.getElementById('email')?.value;
        const organization = document.getElementById('organization')?.value;
        const terms = document.getElementById('terms')?.checked;
        
        if (fullname && email && organization && terms) {
            console.log('Sign up attempt:', { fullname, email, organization });
            // Animate button
            const submitBtn = signupForm.querySelector('.auth-submit');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Creating account...';
            
            // Simulate sign-up process
            setTimeout(() => {
                // Redirect to dashboard after successful signup
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            alert('Please fill in all fields and agree to terms');
        }
    });
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
