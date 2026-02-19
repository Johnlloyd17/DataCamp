// ==========================================
// DASHBOARD PAGE - INTERACTIVE FEATURES
// ==========================================

// Initialize theme from localStorage
function initializeDashboardTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateDashboardThemeIcon(savedTheme);
}

// Update theme icon
function updateDashboardThemeIcon(theme) {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('.theme-toggle-icon');
        if (icon) {
            icon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }
}

// Toggle theme
const dashboardThemeToggle = document.getElementById('themeToggle');
if (dashboardThemeToggle) {
    dashboardThemeToggle.addEventListener('click', () => {
        const htmlElement = document.documentElement;
        const currentTheme = htmlElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateDashboardThemeIcon(newTheme);
    });
}

// Initialize on page load
initializeDashboardTheme();

// Calendar Navigation
const calendarNavButtons = document.querySelectorAll('.calendar-nav');
const calendarMonth = document.querySelector('.calendar-month');
const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                'July', 'August', 'September', 'October', 'November', 'December'];

let currentMonth = new Date().getMonth(); // February = 1

calendarNavButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        if (index === 0) {
            // Previous month
            currentMonth = (currentMonth - 1 + 12) % 12;
        } else {
            // Next month
            currentMonth = (currentMonth + 1) % 12;
        }
        if (calendarMonth) {
            calendarMonth.textContent = months[currentMonth];
        }
    });
});

// Project card click handler
const projectCards = document.querySelectorAll('.project-card');
projectCards.forEach(card => {
    card.addEventListener('click', () => {
        const projectName = card.querySelector('.project-name').textContent;
        const projectDesc = card.querySelector('.project-description').textContent;
        const projectTag = card.querySelector('.project-tag').textContent;
        
        // Show project detail modal
        const detailContent = document.getElementById('projectDetailContent');
        detailContent.innerHTML = `
            <h2>${projectName}</h2>
            <p style="color: var(--text-light); margin-bottom: 1rem;">
                <span style="background: rgba(0, 123, 255, 0.1); padding: 0.25rem 0.75rem; border-radius: 4px; display: inline-block;">
                    ${projectTag}
                </span>
            </p>
            <p>${projectDesc}</p>
            <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
                <button class="btn btn-primary" onclick="document.getElementById('projectDetailModal').classList.remove('show')">View Project</button>
                <button class="btn btn-secondary" onclick="document.getElementById('projectDetailModal').classList.remove('show')">Close</button>
            </div>
        `;
        openModal('projectDetailModal');
    });
});

// Day click handler
const calendarDays = document.querySelectorAll('.day');
calendarDays.forEach(day => {
    day.addEventListener('click', () => {
        // Remove previous selection
        document.querySelectorAll('.day.selected').forEach(d => d.classList.remove('selected'));
        // Add selection to clicked day
        day.classList.add('selected');
        console.log('Selected day:', day.textContent);
    });
});

// Modal Functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

// Close modal when clicking X button
document.querySelectorAll('.modal-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) {
            modal.classList.remove('show');
        }
    });
});

// Close modal when clicking outside of modal content
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
});

// Action buttons - Open modals
const makeProjectBtn = document.querySelector('.btn-primary');
if (makeProjectBtn) {
    makeProjectBtn.addEventListener('click', () => {
        openModal('projectModal');
    });
}

const inviteBtn = document.querySelector('.btn-secondary');
if (inviteBtn) {
    inviteBtn.addEventListener('click', () => {
        openModal('inviteModal');
    });
}

// Handle modal form submissions
const projectForm = document.querySelector('#projectModal .modal-form');
if (projectForm) {
    projectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const projectName = document.getElementById('projectName').value;
        console.log('Creating project:', projectName);
        alert(`Project "${projectName}" created successfully!`);
        closeModal('projectModal');
        // Reset form
        e.target.reset();
    });
}

const inviteForm = document.querySelector('#inviteModal .modal-form');
if (inviteForm) {
    inviteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emails = document.getElementById('inviteEmails').value;
        console.log('Sending invitations to:', emails);
        alert('Invitations sent successfully!');
        closeModal('inviteModal');
        // Reset form
        e.target.reset();
    });
}

// Keyboard shortcut
document.addEventListener('keydown', (e) => {
    // Close modals with Escape key
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.show').forEach(modal => {
            modal.classList.remove('show');
        });
    }
    
    // Command palette with Ctrl+J
    if ((e.ctrlKey || e.metaKey) && e.key === 'j') {
        e.preventDefault();
        alert('Command palette would open here (Ctrl+J)');
        console.log('Command palette shortcut triggered');
    }
});

// Smooth scroll for navigation links
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href && href !== '#') {
            window.location.href = href;
        }
    });
});

// Idle time tracking for activity status
let idleTimer = null;
let isIdle = false;

function resetIdleTimer() {
    if (idleTimer) {
        clearTimeout(idleTimer);
    }
    isIdle = false;
    
    idleTimer = setTimeout(() => {
        isIdle = true;
        console.log('User is idle');
    }, 5 * 60 * 1000); // 5 minutes
}

document.addEventListener('mousemove', resetIdleTimer);
document.addEventListener('keydown', resetIdleTimer);
document.addEventListener('click', resetIdleTimer);

// Initialize idle timer
resetIdleTimer();
