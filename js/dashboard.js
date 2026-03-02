// ==========================================
// DASHBOARD PAGE - INTERACTIVE FEATURES
// ==========================================

// ==========================================
// PROJECT CRUD OPERATIONS
// ==========================================

let currentEditProjectId = null;
let currentDeleteProjectId = null;
const API_BASE = './php/api';

/**
 * Load all projects from the API and display them
 */
async function loadProjects() {
    try {
        const response = await fetch(`${API_BASE}/projects.php`, {
            credentials: 'include'
        });

        // Not logged in — redirect to sign-in page
        if (response.status === 401) {
            window.location.href = 'signin.html';
            return;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }
        
        const projects = await response.json();
        displayProjects(projects);
    } catch (error) {
        console.error('Error loading projects:', error);
        const projectsGrid = document.getElementById('projectsGrid');
        if (projectsGrid) {
            projectsGrid.innerHTML = `<div class="projects-loading" style="color: var(--error-color);">Failed to load projects: ${error.message}</div>`;
        }
    }
}

/**
 * Display projects in the projects grid
 */
function displayProjects(projects) {
    const projectsGrid = document.getElementById('projectsGrid');
    if (!projectsGrid) return;

    if (projects.length === 0) {
            projectsGrid.innerHTML = `
                <div class="projects-empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem 2rem; background: rgba(0, 123, 255, 0.05); border-radius: 8px; border: 2px dashed var(--border-color);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🚀</div>
                    <h3 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-dark);">No projects yet</h3>
                    <p style="color: var(--text-light); margin-bottom: 0; font-size: 1rem;">Get started by creating your first project.</p>
                </div>
            `;
        return;
    }

    projectsGrid.innerHTML = projects.map(project => `
        <div class="project-card" data-project-id="${project.id}">
            <div class="project-card-actions">
                <button class="project-action-btn edit-btn" title="Edit project" aria-label="Edit project">
                    <span>✏️</span>
                </button>
                <button class="project-action-btn delete-btn" title="Delete project" aria-label="Delete project">
                    <span>🗑️</span>
                </button>
            </div>
            <div class="project-tag">${project.status === 'active' ? 'Active' : project.status === 'archived' ? 'Archived' : 'Completed'}</div>
            <h3 class="project-name">${escapeHtml(project.name)}</h3>
            <p class="project-description">${escapeHtml(project.description || 'No description')}</p>
            <div class="project-meta">
                ${project.start_date ? `<span class="meta-item">📅 ${project.start_date}</span>` : ''}
                ${project.access_level ? `<span class="meta-item">🔒 ${project.access_level === 'all-access' ? 'All Access' : 'Invite Only'}</span>` : ''}
            </div>
            <div class="project-avatar">
                <div class="avatar-circle">👤</div>
            </div>
        </div>
    `).join('');

    // Attach event listeners to action buttons
    attachProjectActionListeners();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Attach event listeners to project action buttons
 */
function attachProjectActionListeners() {
    // Edit buttons
    document.querySelectorAll('.project-card .edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const projectCard = btn.closest('.project-card');
            const projectId = projectCard.getAttribute('data-project-id');
            openEditProjectModal(projectId);
        });
    });

    // Delete buttons
    document.querySelectorAll('.project-card .delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const projectCard = btn.closest('.project-card');
            const projectId = projectCard.getAttribute('data-project-id');
            openDeleteProjectModal(projectId);
        });
    });

    // Project card click - view details
    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', function() {
            const projectId = this.getAttribute('data-project-id');
            viewProjectDetails(projectId);
        });
    });
}

/**
 * Open edit project modal and populate with data
 */
async function openEditProjectModal(projectId) {
    try {
        // Fetch project data
        const response = await fetch(`${API_BASE}/projects.php?id=${projectId}`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to load project');
        
        const project = await response.json();
        
        // Populate form fields
        document.getElementById('editProjectId').value = project.id;
        document.getElementById('editProjectName').value = project.name;
        document.getElementById('editProjectDesc').value = project.description || '';
        document.getElementById('editProjectStatus').value = project.status;
        document.getElementById('editProjectAccess').value = project.access_level;
        document.getElementById('editProjectStartDate').value = project.start_date || '';
        document.getElementById('editProjectEndDate').value = project.end_date || '';
        
        // Handle all_access_type field
        const accessTypeGroup = document.getElementById('editAccessTypeGroup');
        const accessTypeSelect = document.getElementById('editProjectAccessType');
        
        if (project.access_level === 'all-access') {
            accessTypeGroup.style.display = 'block';
            accessTypeSelect.value = project.all_access_type || 'data-prove';
        } else {
            accessTypeGroup.style.display = 'none';
            accessTypeSelect.value = 'data-prove';
        }
        
        currentEditProjectId = project.id;
        openModal('editProjectModal');
    } catch (error) {
        console.error('Error loading project:', error);
        alert('Failed to load project. Please try again.');
    }
}

/**
 * Create new project
 */
async function createProject(formData) {
    try {
        // Capture tool selections - only true if explicitly checked
        const tools = {
            'message-board': document.getElementById('tool-messageBoard')?.checked === true,
            'todos': document.getElementById('tool-todos')?.checked === true,
            'docs-files': document.getElementById('tool-docs')?.checked === true,
            'chat': document.getElementById('tool-chat')?.checked === true,
            'schedule': document.getElementById('tool-schedule')?.checked === true,
            'card-table': document.getElementById('tool-cardtable')?.checked === true
        };
        
        console.log('Tools selected:', tools);

        // Capture access level and all_access_type
        const access_level = document.querySelector('input[name="projectAccess"]:checked')?.value || 'invite-only';
        let all_access_type = null;
        
        if (access_level === 'all-access') {
            all_access_type = document.querySelector('input[name="allAccessType"]:checked')?.value || 'data-prove';
        }

        const projectData = {
            name: formData.get('projectName') || '',
            description: formData.get('projectDesc') || '',
            access_level: access_level,
            all_access_type: all_access_type,
            start_date: null,
            end_date: null,
            tools: tools
        };
        
        console.log('Sending project data:', projectData);

        const response = await fetch(`${API_BASE}/projects.php`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(projectData)
        });

        if (!response.ok) {
            try {
                const error = await response.json();
                throw new Error(error.error || `HTTP ${response.status}: Failed to create project`);
            } catch (e) {
                throw new Error(`HTTP ${response.status}: Failed to create project`);
            }
        }

        const newProject = await response.json();
        closeModal('projectModal');
        await loadProjects();
        alert(`Project "${newProject.name}" created successfully!`);
    } catch (error) {
        console.error('Error creating project:', error);
        alert(`Error: ${error.message}`);
    }
}

/**
 * Update project
 */
async function updateProject(projectId, formData) {
    try {
        const access_level = formData.get('access_level') || 'invite-only';
        const all_access_type = access_level === 'all-access' ? (formData.get('all_access_type') || 'data-prove') : null;

        const response = await fetch(`${API_BASE}/projects.php`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: projectId,
                name: formData.get('name'),
                description: formData.get('description'),
                status: formData.get('status'),
                access_level: access_level,
                all_access_type: all_access_type,
                start_date: formData.get('start_date') || null,
                end_date: formData.get('end_date') || null
            })
        });

        if (!response.ok) {
            try {
                const error = await response.json();
                throw new Error(error.error || `HTTP ${response.status}: Failed to update project`);
            } catch (e) {
                throw new Error(`HTTP ${response.status}: Failed to update project`);
            }
        }

        const updated = await response.json();
        closeModal('editProjectModal');
        await loadProjects();
        alert(`Project "${updated.name}" updated successfully!`);
    } catch (error) {
        console.error('Error updating project:', error);
        alert(`Error: ${error.message}`);
    }
}

/**
 * Delete project
 */
async function deleteProjectConfirmed(projectId) {
    try {
        const response = await fetch(`${API_BASE}/projects.php`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: projectId })
        });

        if (!response.ok) {
            try {
                const error = await response.json();
                throw new Error(error.error || `HTTP ${response.status}: Failed to delete project`);
            } catch (e) {
                throw new Error(`HTTP ${response.status}: Failed to delete project`);
            }
        }

        closeModal('deleteProjectModal');
        await loadProjects();
        alert('Project deleted successfully!');
    } catch (error) {
        console.error('Error deleting project:', error);
        alert(`Error: ${error.message}`);
    }
}

/**
 * Open delete confirmation modal
 */
function openDeleteProjectModal(projectId) {
    currentDeleteProjectId = projectId;
    openModal('deleteProjectModal');
}

/**
 * View project details
 */
async function viewProjectDetails(projectId) {
    try {
        const response = await fetch(`${API_BASE}/projects.php?id=${projectId}`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to load project');
        
        const project = await response.json();
        
        // Define all available tools
        const allTools = [
            { id: 'message-board', name: 'Message Board', icon: '💬', description: 'Post announcements, pitch ideas, and keep discussions on-topic.' },
            { id: 'todos', name: 'To-dos', icon: '✓', description: 'Organize work, assign tasks, set due dates, and stay on top of things.' },
            { id: 'docs-files', name: 'Docs & Files', icon: '📄', description: 'Share and organize docs, spreadsheets, images, and other files.' },
            { id: 'chat', name: 'Chat', icon: '💭', description: 'Chat casually with your team and share things without ceremony.' },
            { id: 'schedule', name: 'Schedule', icon: '📅', description: 'Set important dates on a shared schedule and sync with calendars.' },
            { id: 'card-table', name: 'Card Table', icon: '📊', description: 'A Kanban-like tool for process-oriented work with visual organization.' }
        ];
        
        // Filter tools to only show enabled ones
        let toolsHtml = '';
        if (project.tools && Object.keys(project.tools).length > 0) {
            allTools.forEach(tool => {
                if (project.tools[tool.id] === true) {
                    toolsHtml += `
                        <div class="tool-card-detail" data-tool="${tool.id}">
                            <div class="tool-icon">${tool.icon}</div>
                            <h4>${tool.name}</h4>
                            <p>${tool.description}</p>
                        </div>
                    `;
                }
            });
        }
        
        const detailContent = document.getElementById('projectDetailContent');
        detailContent.innerHTML = `
            <div class="project-detail-header">
                <div>
                    <h2>${escapeHtml(project.name)}</h2>
                    <p style="color: var(--text-light); margin-top: 0.5rem;">
                        <span style="background: rgba(0, 123, 255, 0.1); padding: 0.25rem 0.75rem; border-radius: 4px; display: inline-block; font-size: 0.85rem;">
                            ${project.status === 'active' ? 'Active' : project.status === 'archived' ? 'Archived' : 'Completed'}
                        </span>
                    </p>
                    ${project.description ? `<p style="margin-top: 1rem; color: var(--text-light);">${escapeHtml(project.description)}</p>` : ''}
                </div>
            </div>
            
            <div class="project-detail-tools">
                <h3 style="margin-bottom: 1.5rem; font-size: 1.1rem;">Project Tools</h3>
                <div class="tools-grid-detail">
                    ${toolsHtml || '<p style="color: var(--text-light);">No tools enabled for this project.</p>'}
                </div>
            </div>
            
            <div class="project-detail-footer">
                <button class="btn btn-secondary" onclick="closeModal('projectDetailModal')">Close</button>
                <button class="btn btn-primary" onclick="openEditProjectModal(${project.id})">Edit Project</button>
            </div>
        `;
        openModal('projectDetailModal');
        attachToolCardHandlers();
    } catch (error) {
        console.error('Error loading project details:', error);
        alert('Failed to load project details. Please try again.');
    }
}

// Load projects on page load
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
});

// ==========================================
// MODAL SETUP AND EVENT LISTENERS
// ==========================================

// Handle "Make a new project" button
const makeProjectBtns = document.querySelectorAll('.btn-primary');
makeProjectBtns.forEach(btn => {
    if (btn.textContent.includes('Make a new project')) {
        btn.addEventListener('click', () => {
            openModal('projectModal');
        });
    }
});

// Handle project form submission
const projectForm = document.getElementById('projectForm');
if (projectForm) {
    projectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(projectForm);
        await createProject(formData);
        projectForm.reset();
    });
}

// Handle edit project form submission
const editProjectForm = document.getElementById('editProjectForm');
if (editProjectForm) {
    editProjectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(editProjectForm);
        if (currentEditProjectId) {
            await updateProject(currentEditProjectId, formData);
        }
        editProjectForm.reset();
    });
}

// Handle edit project access level change - show/hide all_access_type field
const editProjectAccess = document.getElementById('editProjectAccess');
const editAccessTypeGroup = document.getElementById('editAccessTypeGroup');
if (editProjectAccess) {
    editProjectAccess.addEventListener('change', () => {
        if (editProjectAccess.value === 'all-access') {
            editAccessTypeGroup.style.display = 'block';
        } else {
            editAccessTypeGroup.style.display = 'none';
        }
    });
}

// Handle delete project button
const deleteProjectBtn = document.getElementById('deleteProjectBtn');
if (deleteProjectBtn) {
    deleteProjectBtn.addEventListener('click', () => {
        closeModal('editProjectModal');
        openDeleteProjectModal(currentEditProjectId);
    });
}

// Handle delete confirmation
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', () => {
        if (currentDeleteProjectId) {
            deleteProjectConfirmed(currentDeleteProjectId);
        }
    });
}

// Handle delete cancellation
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', () => {
        closeModal('deleteProjectModal');
    });
}

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
        
        // Show project detail modal with tools grid
        const detailContent = document.getElementById('projectDetailContent');
        detailContent.innerHTML = `
            <div class="project-detail-header">
                <div>
                    <h2>${projectName}</h2>
                    <p style="color: var(--text-light); margin-top: 0.5rem;">
                        <span style="background: rgba(0, 123, 255, 0.1); padding: 0.25rem 0.75rem; border-radius: 4px; display: inline-block; font-size: 0.85rem;">
                            ${projectTag}
                        </span>
                    </p>
                </div>
            </div>
            
            <div class="project-detail-tools">
                <h3 style="margin-bottom: 1.5rem; font-size: 1.1rem;">Project Tools</h3>
                <div class="tools-grid-detail">
                    <div class="tool-card-detail" data-tool="message-board">
                        <div class="tool-icon">💬</div>
                        <h4>Message Board</h4>
                        <p>Post announcements, pitch ideas, and keep discussions on-topic.</p>
                    </div>
                    <div class="tool-card-detail" data-tool="todos">
                        <div class="tool-icon">✓</div>
                        <h4>To-dos</h4>
                        <p>Organize work, assign tasks, set due dates, and stay on top of things.</p>
                    </div>
                    <div class="tool-card-detail" data-tool="docs-files">
                        <div class="tool-icon">📄</div>
                        <h4>Docs & Files</h4>
                        <p>Share and organize docs, spreadsheets, images, and other files.</p>
                    </div>
                    <div class="tool-card-detail" data-tool="chat">
                        <div class="tool-icon">💭</div>
                        <h4>Chat</h4>
                        <p>Chat casually with your team and share things without ceremony.</p>
                    </div>
                    <div class="tool-card-detail" data-tool="schedule">
                        <div class="tool-icon">📅</div>
                        <h4>Schedule</h4>
                        <p>Set important dates on a shared schedule and sync with calendars.</p>
                    </div>
                    <div class="tool-card-detail" data-tool="card-table">
                        <div class="tool-icon">📊</div>
                        <h4>Card Table</h4>
                        <p>A Kanban-like tool for process-oriented work with visual organization.</p>
                    </div>
                </div>
            </div>
            
            <div class="project-detail-footer">
                <button class="btn btn-secondary" onclick="closeModal('projectDetailModal')">Close</button>
                <button class="btn btn-primary" onclick="">View Full Project</button>
            </div>
        `;
        openModal('projectDetailModal');
        attachToolCardHandlers();
    });
});

// Attach click handlers to tool cards in project detail view
function attachToolCardHandlers() {
    const toolCards = document.querySelectorAll('.tool-card-detail');
    toolCards.forEach(card => {
        card.addEventListener('click', () => {
            const tool = card.getAttribute('data-tool');
            closeModal('projectDetailModal');
            openToolModal(tool);
        });
    });
}

// Open the appropriate tool modal based on tool type
function openToolModal(tool) {
    const toolModalMap = {
        'message-board': 'messageBoardModal',
        'todos': 'todosModal',
        'docs-files': 'docsFilesModal',
        'chat': 'chatModal',
        'schedule': 'scheduleModal',
        'card-table': 'cardTableModal'
    };
    
    const modalId = toolModalMap[tool];
    if (modalId) {
        openModal(modalId);
    }
}

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

// Handle tool toggle switches in project setup modal
document.querySelectorAll('.tool-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        updateToolStatus(checkbox);
    });
});

function updateToolStatus(checkbox) {
    const toolCard = checkbox.closest('.tool-card');
    const statusSpan = toolCard.querySelector('.tool-status');
    if (checkbox.checked) {
        statusSpan.textContent = 'ON';
        statusSpan.style.color = 'var(--success-color)';
    } else {
        statusSpan.textContent = 'OFF';
        statusSpan.style.color = 'var(--text-light)';
    }
}

// Handle project access options
const accessRadios = document.querySelectorAll('input[name="projectAccess"]');
const subRadios = document.querySelectorAll('input[name="allAccessType"]');

accessRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        updateAccessOptions();
    });
});

function updateAccessOptions() {
    const selectedAccess = document.querySelector('input[name="projectAccess"]:checked').value;
    const subOptionsContainer = document.querySelector('.sub-options');
    
    if (selectedAccess === 'all-access') {
        // Enable sub-options
        subRadios.forEach(radio => {
            radio.disabled = false;
        });
        if (subOptionsContainer) {
            subOptionsContainer.style.opacity = '1';
            subOptionsContainer.style.pointerEvents = 'auto';
        }
    } else {
        // Disable sub-options
        subRadios.forEach(radio => {
            radio.disabled = true;
        });
        if (subOptionsContainer) {
            subOptionsContainer.style.opacity = '0.5';
            subOptionsContainer.style.pointerEvents = 'none';
        }
    }
}

// Invite Modal Logic
const inviteRadios = document.querySelectorAll('input[name="inviteType"]');
const inviteNextBtn = document.querySelector('.invite-next-btn');
const inviteBackBtn = document.querySelector('.invite-back-btn');
const inviteStep1 = document.querySelector('.invite-step-1');
const inviteStep2 = document.querySelector('.invite-step-2');
const addMoreBtn = document.querySelector('#addMoreBtn');
const inviteStepTitle = document.querySelector('#inviteStepTitle');
const inviteDescription = document.querySelector('#inviteDescription');
const inviteCompanyField = document.querySelector('#inviteCompany');

const inviteTypeDescriptions = {
    coworker: {
        title: "Set up your coworker's account",
        description: "People who work at Data Prove are the only people who can create projects, add others to projects, and act as administrators. They can be full-time, part-time, or a volunteer.",
        company: "Data Prove"
    },
    contractor: {
        title: "Set up your contractor, vendor, etc.",
        description: "People outside Data Prove can collaborate on projects with you, but they won't be able to create projects, invite people to the account, add people to projects, or be admins.",
        company: ""
    },
    client: {
        title: "Set up your client's account",
        description: "Clients can access projects you've created, but they can't create their own, invite or add new people, or become admins. You can hide parts of projects from them so they can't see work in progress.",
        company: ""
    }
};

// Next button - Go from step 1 to step 2
if (inviteNextBtn) {
    inviteNextBtn.addEventListener('click', () => {
        inviteStep1.classList.remove('active');
        inviteStep2.classList.add('active');
        updateInviteFormForType();
    });
}

// Back button - Go from step 2 to step 1
if (inviteBackBtn) {
    inviteBackBtn.addEventListener('click', () => {
        inviteStep2.classList.remove('active');
        inviteStep1.classList.add('active');
        if (inviteStepTitle) inviteStepTitle.textContent = 'Who are you inviting?';
    });
}

// Update form based on selected invite type
function updateInviteFormForType() {
    const selectedType = document.querySelector('input[name="inviteType"]:checked').value;
    const config = inviteTypeDescriptions[selectedType];
    
    if (inviteStepTitle) inviteStepTitle.textContent = config.title;
    if (inviteDescription) inviteDescription.textContent = config.description;
    
    // Update company field for all entries
    if (selectedType === 'coworker') {
        if (inviteCompanyField) {
            inviteCompanyField.value = 'Data Prove';
            inviteCompanyField.readOnly = true;
            inviteCompanyField.style.backgroundColor = 'var(--bg-input)';
        }
        document.querySelectorAll('.invite-company').forEach(field => {
            field.value = 'Data Prove';
            field.readOnly = true;
            field.style.backgroundColor = 'var(--bg-input)';
        });
    } else {
        if (inviteCompanyField) {
            inviteCompanyField.value = '';
            inviteCompanyField.readOnly = false;
            inviteCompanyField.style.backgroundColor = '';
            if (selectedType === 'contractor') {
                inviteCompanyField.placeholder = 'Type company/org name...';
            } else {
                inviteCompanyField.placeholder = 'Type company/org name...';
            }
        }
        document.querySelectorAll('.invite-company').forEach(field => {
            field.value = '';
            field.readOnly = false;
            field.style.backgroundColor = '';
            field.placeholder = 'Type company/org name...';
        });
    }
}

// Add more invite entry button
if (addMoreBtn) {
    addMoreBtn.addEventListener('click', () => {
        const container = document.querySelector('.invite-fields-container');
        const entryCount = document.querySelectorAll('.invite-entry').length;
        const newEntry = document.createElement('div');
        newEntry.className = 'invite-entry';
        newEntry.innerHTML = `
            <div class="form-row">
                <div class="form-group form-col">
                    <label for="fullname-${entryCount}">Full name</label>
                    <input type="text" id="fullname-${entryCount}" placeholder="Full name" class="invite-fullname" title="Full name" required>
                </div>
                <div class="form-group form-col">
                    <label for="email-${entryCount}">Email address</label>
                    <input type="email" id="email-${entryCount}" placeholder="Email address" class="invite-email" title="Email address" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group form-col">
                    <label for="jobtitle-${entryCount}">Job title (optional)</label>
                    <input type="text" id="jobtitle-${entryCount}" placeholder="Job title (optional)" class="invite-jobtitle" title="Job title">
                </div>
                <div class="form-group form-col">
                    <label for="company-${entryCount}">Company/organization</label>
                    <input type="text" id="company-${entryCount}" placeholder="Company/organization" class="invite-company" title="Company or organization">
                </div>
            </div>
        `;
        container.appendChild(newEntry);
        
        // Update company field if needed
        const selectedType = document.querySelector('input[name="inviteType"]:checked').value;
        const companyField = newEntry.querySelector('.invite-company');
        if (selectedType === 'coworker') {
            companyField.value = 'Data Prove';
            companyField.readOnly = true;
            companyField.style.backgroundColor = 'var(--bg-input)';
        }
    });
}

// Handle invite form submission
const inviteForm = document.querySelector('.invite-form');
if (inviteForm) {
    inviteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const inviteType = document.querySelector('input[name="inviteType"]:checked').value;
        const entries = document.querySelectorAll('.invite-entry');
        const invitees = [];
        
        entries.forEach(entry => {
            invitees.push({
                name: entry.querySelector('.invite-fullname').value,
                email: entry.querySelector('.invite-email').value,
                jobTitle: entry.querySelector('.invite-jobtitle').value,
                company: entry.querySelector('.invite-company').value
            });
        });
        
        console.log('Inviting as:', inviteType);
        console.log('Invitees:', invitees);
        alert(`Invitations sent to ${invitees.length} people!`);
        closeModal('inviteModal');
        // Reset modal to step 1
        inviteStep2.classList.remove('active');
        inviteStep1.classList.add('active');
        if (inviteStepTitle) inviteStepTitle.textContent = 'Who are you inviting?';
        // Reset form
        e.target.reset();
        // Remove extra entries
        document.querySelectorAll('.invite-entry:not(:first-child)').forEach(entry => entry.remove());
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
// ==========================================
// USER PROFILE DROPDOWN MENU
// ==========================================

const userProfileBtn = document.getElementById('userProfileBtn');
const userDropdown = document.getElementById('userDropdown');

// Toggle dropdown on profile button click
if (userProfileBtn) {
    userProfileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('active');
    });
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (userDropdown && !userDropdown.contains(e.target) && e.target !== userProfileBtn) {
        userDropdown.classList.remove('active');
    }
});

// Close dropdown when pressing Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && userDropdown) {
        userDropdown.classList.remove('active');
    }
});

// Handle dropdown menu item clicks
const dropdownItems = document.querySelectorAll('.dropdown-item');
dropdownItems.forEach(item => {
    item.addEventListener('click', (e) => {
        // Close the dropdown when an item is clicked
        if (userDropdown) {
            userDropdown.classList.remove('active');
        }
        
        // Handle logout specifically
        if (item.classList.contains('dropdown-logout')) {
            e.preventDefault();
            // Add logout logic here
            console.log('Logout clicked');
            // window.location.href = 'signin.html'; // Redirect to login page
        }
    });
});