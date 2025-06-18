document.addEventListener('DOMContentLoaded', async function() {
    'use strict';
    
    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            // Toggle icon between bars and times
            const icon = mobileMenuBtn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileMenuBtn.contains(e.target) && !navLinks.contains(e.target)) {
                navLinks.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-bars');
                    icon.classList.remove('fa-times');
                }
            }
        });
    }

    // Waste Entry Form Handling
    const wasteFormContainer = document.getElementById('wasteFormContainer');
    const addWasteBtn = document.getElementById('addWasteBtn');
    const wasteEntryForm = document.getElementById('wasteEntryForm');

    if (!wasteFormContainer || !addWasteBtn || !wasteEntryForm) {
        console.warn('Waste entry form elements not found');
        return;
    }

    // Initially hide the form
    wasteFormContainer.style.display = 'none';

    // Show/Hide form
    addWasteBtn.addEventListener('click', () => {
        wasteFormContainer.style.display = 'block';
        // Set default date to today
        const dateInput = document.getElementById('date');
        if (dateInput) {
            dateInput.valueAsDate = new Date();
        }
    });

    document.getElementById('cancelWasteEntry').addEventListener('click', () => {
        wasteFormContainer.style.display = 'none';
        wasteEntryForm.reset();
    });

    // Handle form submission
    wasteEntryForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent form submission from reloading the page
        
        const submitBtn = e.target.querySelector('.submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

        const formData = {
            wasteType: document.getElementById('wasteType').value,
            wasteAmount: parseFloat(document.getElementById('wasteAmount').value),
            disposalMethod: document.getElementById('disposalMethod').value,
            location: document.getElementById('location').value,
            date: document.getElementById('date').value
        };

        try {
            const response = await fetch('/api/waste-entry', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Failed to submit waste entry');
            }

            // Hide the form
            wasteFormContainer.style.display = 'none';
            wasteEntryForm.reset();

            // Show gamification popup
            showGameficationPopup(result.data);

            // Update dashboard data
            updateDashboardWithNewEntry(result.data);

        } catch (error) {
            console.error('Error submitting waste entry:', error);
            if (error.message.includes('logged in')) {
                window.location.href = '/auth.html';
            } else {
                alert(error.message || 'Failed to record waste entry. Please try again.');
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Log Activity';
        }
    });

    // Function to update dashboard with new entry data
    function updateDashboardWithNewEntry(data) {
        // Update main stats
        const wasteReducedElement = document.getElementById('wasteReduced');
        if (wasteReducedElement) {
            wasteReducedElement.textContent = `${data.wasteReduced.toFixed(1)} kg`;
        }

        // Update achievements count
        const achievementsElement = document.getElementById('achievements');
        if (achievementsElement) {
            const achievementCount = Math.floor(data.totalPoints / 100);
            achievementsElement.textContent = achievementCount;
        }

        // Update community impact
        const communityImpactElement = document.getElementById('communityImpact');
        if (communityImpactElement) {
            // Assuming each entry influences 2 people
            const impactCount = Math.floor(data.wasteReduced * 2);
            communityImpactElement.textContent = impactCount;
        }

        // Update impact cards
        const impactElements = {
            trees: document.querySelector('.impact-card:nth-child(1) .impact-value'),
            water: document.querySelector('.impact-card:nth-child(2) .impact-value'),
            co2: document.querySelector('.impact-card:nth-child(4) .impact-value')
        };

        if (impactElements.trees) impactElements.trees.textContent = data.impact.trees;
        if (impactElements.water) impactElements.water.textContent = `${data.impact.water}L`;
        if (impactElements.co2) impactElements.co2.textContent = `${data.impact.co2} kg`;

        // Update activity feed
        const activityFeed = document.getElementById('activityFeed');
        if (activityFeed) {
            const activityHTML = `
                <div class="activity-item animate__animated animate__fadeIn">
                    <div class="activity-icon">
                        <i class="fas fa-recycle"></i>
                    </div>
                    <div class="activity-content">
                        <p class="activity-text">
                            Disposed ${data.lastEntry.wasteAmount}kg of ${data.lastEntry.wasteType} 
                            waste through ${data.lastEntry.disposalMethod} at ${data.lastEntry.location}
                        </p>
                        <span class="activity-time">Just now</span>
                    </div>
                    <div class="activity-points">+${data.lastEntry.points} pts</div>
                </div>
            `;
            activityFeed.insertAdjacentHTML('afterbegin', activityHTML);

            // Limit the number of visible activities
            const activities = activityFeed.getElementsByClassName('activity-item');
            if (activities.length > 5) {
                activities[activities.length - 1].remove();
            }
        }

        // Update progress bars if they exist
        const recyclingProgress = document.querySelector('.achievement-card:nth-child(2) .progress-bar');
        const recyclingText = document.querySelector('.achievement-card:nth-child(2) p');
        if (recyclingProgress && recyclingText) {
            const progress = Math.min((data.wasteReduced / 100) * 100, 100);
            recyclingProgress.style.width = `${progress}%`;
            recyclingText.textContent = `${data.wasteReduced.toFixed(1)}/100 items recycled`;
        }

        // Update local storage
        const wasteData = {
            totalWaste: data.wasteReduced,
            entries: JSON.parse(localStorage.getItem('wasteData'))?.entries || []
        };
        wasteData.entries.unshift(data.lastEntry);
        localStorage.setItem('wasteData', JSON.stringify(wasteData));
    }

    // Function to refresh user data
    async function refreshUserData() {
        try {
            const response = await fetch('/api/profile', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to refresh user data');
            }

            const { user } = await response.json();
            localStorage.setItem('userData', JSON.stringify(user));

            // Update UI with fresh data
            document.getElementById('navUserName').textContent = user.name;
            document.getElementById('dropdownUserName').textContent = user.name;
            document.getElementById('dropdownUserEmail').textContent = user.email;

            // Update other stats
            updateDashboard();
        } catch (error) {
            console.error('Error refreshing user data:', error);
        }
    }

    // Rest of the dashboard initialization code
        try {
        // Fetch user profile data from server
            const response = await fetch('/api/profile', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }

            const { user } = await response.json();
        
            // Store the fresh user data
            localStorage.setItem('userData', JSON.stringify(user));
        
        // Update all username displays
        document.getElementById('navUserName').textContent = user.name;
        document.getElementById('dropdownUserName').textContent = user.name;
        document.getElementById('dropdownUserEmail').textContent = user.email;
        } catch (error) {
        console.error('Error fetching user data:', error);
            // Fallback to stored data if fetch fails
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (userData) {
            document.getElementById('navUserName').textContent = userData.name;
            document.getElementById('dropdownUserName').textContent = userData.name;
            document.getElementById('dropdownUserEmail').textContent = userData.email;
        } else {
            // Redirect to login if no user data is available
                window.location.href = '/auth.html';
            }
        }

    // Load user data
    const userData = JSON.parse(localStorage.getItem('userData'));
    const user = JSON.parse(localStorage.getItem('user'));
    const displayName = (userData && userData.name) || (user && user.username) || 'User';

    // Update all username displays
    document.getElementById('navUserName').textContent = displayName;
    document.getElementById('dropdownUserName').textContent = displayName;
    document.getElementById('dropdownUserEmail').textContent = (userData && userData.email) || (user && user.email) || 'user@example.com';

    // Create logout popup if it doesn't exist
    if (!document.getElementById('logoutPopup')) {
        const logoutPopup = document.createElement('div');
        logoutPopup.id = 'logoutPopup';
        logoutPopup.className = 'auth-modal';
        logoutPopup.innerHTML = `
            <div class="auth-modal-content">
                <div class="auth-forms">
                    <div class="auth-form active">
                        <div class="logout-status">
                            <i class="fas fa-spinner fa-spin"></i>
                            <h2>Logging Out</h2>
                            <p>Please wait while we securely log you out...</p>
                            <p class="redirect-msg">Redirecting to Home</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(logoutPopup);
        
        // Add styles for the logout popup
        const style = document.createElement('style');
        style.textContent = `
            .logout-status {
                text-align: center;
                padding: 2rem;
            }
            .logout-status i {
                font-size: 3rem;
                color: var(--primary-color);
                margin-bottom: 1.5rem;
            }
            .logout-status h2 {
                font-size: 1.8rem;
                color: #333;
                margin-bottom: 1rem;
            }
            .logout-status p {
                font-size: 1.1rem;
                color: #666;
                margin: 0.5rem 0;
            }
            .logout-status .redirect-msg {
                color: var(--primary-color);
                font-weight: 500;
                margin-top: 1rem;
            }
            .logout-status.error i {
                color: #dc3545;
            }
            .logout-status.error h2 {
                color: #dc3545;
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .auth-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                justify-content: center;
                align-items: center;
                z-index: 9999;
            }
            .auth-modal.show {
                display: flex;
                animation: fadeIn 0.3s ease;
            }
            .auth-modal-content {
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                width: 100%;
                max-width: 400px;
                margin: 20px;
            }
        `;
        document.head.appendChild(style);
    }

    // Profile Dropdown Toggle
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');

    // Toggle Profile Dropdown
    profileBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        profileDropdown.classList.toggle('show');
        this.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!profileDropdown.contains(e.target) && !profileBtn.contains(e.target)) {
            profileDropdown.classList.remove('show');
            profileBtn.classList.remove('active');
        }
    });

    // Close dropdown on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && profileDropdown.classList.contains('show')) {
            profileDropdown.classList.remove('show');
            profileBtn.classList.remove('active');
        }
    });

    // Handle Logout
    document.getElementById('profileLogoutBtn').addEventListener('click', async function() {
        const logoutPopup = document.getElementById('logoutPopup');
        logoutPopup.classList.add('show');
        
        try {
            // First attempt to logout from the server
            const response = await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Logout failed');
            }
            
            // Only clear local storage after successful server logout
            localStorage.removeItem('user');
            localStorage.removeItem('userData');
            sessionStorage.clear();
            
            // Clear cookies
            document.cookie.split(";").forEach(function(c) { 
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
            });
            
            // Show success message and redirect
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } catch (error) {
            console.error('Logout error:', error);
            const logoutStatus = logoutPopup.querySelector('.logout-status');
            logoutStatus.classList.add('error');
            logoutStatus.innerHTML = `
                <i class="fas fa-exclamation-circle"></i>
                <h2>Logout Failed</h2>
                <p>There was an error during logout</p>
                <p>Please try again</p>
            `;
            setTimeout(() => {
                logoutPopup.classList.remove('show');
            }, 3000);
        }
    });

    // Helper Functions
    function getActivityIcon(type) {
        switch(type) {
            case 'recycling':
                return 'fa-recycle';
            case 'community':
                return 'fa-users';
            case 'challenges':
                return 'fa-trophy';
            default:
                return 'fa-check-circle';
        }
    }

    // Update Stats
    function updateStats() {
        const stats = {
            wasteReduced: '125',
            achievements: '15',
            communityImpact: '250'
        };

        document.getElementById('wasteReduced').textContent = `${stats.wasteReduced} kg`;
        document.getElementById('achievements').textContent = stats.achievements;
        document.getElementById('communityImpact').textContent = stats.communityImpact;
    }

    // Initialize Stats
    updateStats();

    // Initialize waste data from localStorage
    let wasteData = JSON.parse(localStorage.getItem('wasteData')) || {
        entries: [],
        totalWaste: 0,
        wasteByType: {},
        wasteByMethod: {},
        monthlyData: {}
    };

    function updateDashboard() {
        // Update total waste reduced
        document.getElementById('wasteReduced').textContent = `${wasteData.totalWaste.toFixed(1)} kg`;

        // Update impact stats
        const treesImpact = (wasteData.totalWaste * 0.17).toFixed(1);
        const waterImpact = (wasteData.totalWaste * 1000).toFixed(0);
        const co2Impact = (wasteData.totalWaste * 2.5).toFixed(1);

        // Update impact cards if they exist
        const impactElements = {
            trees: document.querySelector('.impact-card:nth-child(1) .impact-value'),
            water: document.querySelector('.impact-card:nth-child(2) .impact-value'),
            co2: document.querySelector('.impact-card:nth-child(4) .impact-value')
        };

        if (impactElements.trees) impactElements.trees.textContent = treesImpact;
        if (impactElements.water) impactElements.water.textContent = `${waterImpact}L`;
        if (impactElements.co2) impactElements.co2.textContent = `${co2Impact} kg`;

        // Update chart if it exists
        updateChart();

        // Update activity feed
        updateActivityFeed();
    }

    // Initialize dashboard
    updateDashboard();

    // Function to show gamification popup
    function showGameficationPopup(data) {
        // Create popup if it doesn't exist
        let popup = document.getElementById('gamificationPopup');
        if (!popup) {
            popup = document.createElement('div');
            popup.id = 'gamificationPopup';
            popup.className = 'gamification-popup animate__animated animate__fadeIn';
            document.body.appendChild(popup);
        }

        // Calculate level based on total points
        const level = Math.floor(data.totalPoints / 1000) + 1;
        const nextLevelPoints = level * 1000;
        const progress = ((data.totalPoints % 1000) / 1000) * 100;
            
        popup.innerHTML = `
            <div class="gamification-content">
                <div class="points-earned animate__animated animate__bounceIn">
                    <i class="fas fa-star"></i>
                    <h2>+${data.lastEntry.points} Points!</h2>
                </div>
                <div class="achievement-details">
                    <div class="level-info">
                        <h3>Level ${level}</h3>
                        <div class="level-progress">
                            <div class="progress-bar" style="width: ${progress}%"></div>
                        </div>
                        <p>${data.totalPoints} / ${nextLevelPoints} points to next level</p>
                    </div>
                    <div class="impact-summary">
                        <h3>Environmental Impact</h3>
                    </div>
                </div>
            </div>
        `;

        // Set timeout to remove popup after 5 seconds
            setTimeout(() => {
            popup.classList.remove('animate__fadeIn');
            popup.classList.add('animate__fadeOut');
            setTimeout(() => {
                popup.remove();
            }, 1000); // Remove after fade out animation completes
        }, 4000); // Start fade out after 4 seconds (total 5 seconds with animation)
    }

    // Activity Log Variables
    let currentPage = 1;
    let currentFilter = 'all';

    // Function to format timestamp
    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    // Function to get activity icon
    function getActivityIcon(activity) {
        switch (activity) {
            case 'login':
                return 'fa-sign-in-alt';
            case 'logout':
                return 'fa-sign-out-alt';
            case 'register':
                return 'fa-user-plus';
            case 'points_earned':
                return 'fa-star';
            case 'waste_disposal':
                return 'fa-recycle';
            case 'profile_update':
                return 'fa-user-edit';
            default:
                return 'fa-circle';
        }
    }

    // Function to create activity item HTML
    function createActivityItemHTML(activity) {
        return `
            <div class="activity-item ${activity.activity} animate__animated animate__fadeIn">
                <div class="activity-icon">
                    <i class="fas ${getActivityIcon(activity.activity)}"></i>
                </div>
                <div class="activity-content">
                    <p class="activity-text">${activity.details}</p>
                    <span class="activity-time">${formatTimestamp(activity.timestamp)}</span>
                </div>
            </div>
        `;
    }

    // Function to fetch and display activities
    async function fetchActivities(page = 1, filter = 'all') {
        try {
            const response = await fetch(`/api/user/activity?page=${page}&limit=10${filter !== 'all' ? `&type=${filter}` : ''}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch activities');
            }

            const data = await response.json();
            
            // Update activity list
            const activityLogList = document.getElementById('activityLogList');
            activityLogList.innerHTML = data.activities.map(activity => createActivityItemHTML(activity)).join('');

            // Update pagination
            const prevPageBtn = document.getElementById('prevPage');
            const nextPageBtn = document.getElementById('nextPage');
            const pageInfo = document.getElementById('pageInfo');

            prevPageBtn.disabled = page === 1;
            nextPageBtn.disabled = page >= data.pagination.totalPages;
            pageInfo.textContent = `Page ${page} of ${data.pagination.totalPages}`;

            // Update current page
            currentPage = page;
        } catch (error) {
            console.error('Error fetching activities:', error);
        }
    }

    // Activity log initialization
    const activityTypeFilter = document.getElementById('activityTypeFilter');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');

    // Event listeners for activity log
    activityTypeFilter.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        currentPage = 1;
        fetchActivities(currentPage, currentFilter);
    });

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            fetchActivities(currentPage - 1, currentFilter);
        }
    });

    nextPageBtn.addEventListener('click', () => {
        fetchActivities(currentPage + 1, currentFilter);
    });

    // Initial fetch of activities
    await fetchActivities(1, 'all');

    // Function to update dashboard with actual data
    async function updateDashboardWithData() {
        try {
            const response = await fetch('/api/dashboard-data', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch dashboard data');
            }

            const { data } = await response.json();

            // Update user info
            document.getElementById('navUserName').textContent = data.user.name;
            document.getElementById('dropdownUserName').textContent = data.user.name;
            document.getElementById('dropdownUserEmail').textContent = data.user.email;

            // Update main stats
            document.getElementById('wasteReduced').textContent = `${data.stats.wasteReduced.toFixed(1)} kg`;
            document.getElementById('achievements').textContent = data.stats.achievements;
            document.getElementById('communityImpact').textContent = data.stats.communityImpact;

            // Update impact cards
            const impactElements = {
                trees: document.querySelector('.impact-card:nth-child(1) .impact-value'),
                water: document.querySelector('.impact-card:nth-child(2) .impact-value'),
                co2: document.querySelector('.impact-card:nth-child(4) .impact-value')
            };

            if (impactElements.trees) impactElements.trees.textContent = data.impact.trees;
            if (impactElements.water) impactElements.water.textContent = `${data.impact.water}L`;
            if (impactElements.co2) impactElements.co2.textContent = `${data.impact.co2} kg`;

            // Update leaderboard
            const leaderboardList = document.querySelector('.leaderboard-list');
            if (leaderboardList && data.leaderboard) {
                leaderboardList.innerHTML = data.leaderboard.map((user, index) => `
                    <li class="leaderboard-item">
                        <span class="leaderboard-rank">${index + 1}</span>
                        <div class="leaderboard-user">
                            <div class="leaderboard-avatar">
                                <i class="fas fa-user"></i>
                            </div>
                            <span>${user.name}</span>
                        </div>
                        <span class="leaderboard-points">${user.points} pts</span>
                    </li>
                `).join('');
            }

            // Update recent activities
            const activityFeed = document.getElementById('activityFeed');
            if (activityFeed && data.recentActivities) {
                activityFeed.innerHTML = data.recentActivities.map(activity => `
                    <div class="activity-item animate__animated animate__fadeIn">
                        <div class="activity-icon">
                            <i class="fas ${getActivityIcon(activity.type)}"></i>
                        </div>
                        <div class="activity-content">
                            <p class="activity-text">${activity.description}</p>
                            <span class="activity-time">${formatTimestamp(activity.timestamp)}</span>
                        </div>
                        <div class="activity-points">+${activity.points} pts</div>
                    </div>
                `).join('');
            }

            // Update achievements progress
            const recyclingProgress = document.querySelector('.achievement-card:nth-child(2) .progress-bar');
            const recyclingText = document.querySelector('.achievement-card:nth-child(2) p');
            if (recyclingProgress && recyclingText) {
                const progress = Math.min((data.stats.wasteReduced / 100) * 100, 100);
                recyclingProgress.style.width = `${progress}%`;
                recyclingText.textContent = `${data.stats.wasteReduced.toFixed(1)}/100 items recycled`;
            }

            // Store user data in localStorage
            localStorage.setItem('userData', JSON.stringify(data.user));
        } catch (error) {
            console.error('Error updating dashboard:', error);
            if (error.message.includes('logged in')) {
                window.location.href = '/auth.html';
            }
        }
    }

    // Initialize dashboard with actual data
    await updateDashboardWithData();

    // Refresh dashboard data every 5 minutes
    setInterval(updateDashboardWithData, 5 * 60 * 1000);

    // Function to update impact section
    async function updateImpactSection() {
        try {
            const response = await fetch('/api/user/impact', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch impact data');
            }

            const { data } = await response.json();
            
            // Update impact cards
            const impactCards = {
                trees: document.querySelector('.impact-card:nth-child(1)'),
                water: document.querySelector('.impact-card:nth-child(2)'),
                energy: document.querySelector('.impact-card:nth-child(3)'),
                co2: document.querySelector('.impact-card:nth-child(4)')
            };

            if (impactCards.trees) {
                impactCards.trees.querySelector('.impact-value').textContent = data.currentMonth.trees.toFixed(1);
                const trend = impactCards.trees.querySelector('.impact-trend');
                const trendValue = parseFloat(data.trends.trees);
                trend.className = `impact-trend ${trendValue >= 0 ? 'positive' : 'negative'}`;
                trend.innerHTML = `
                    <i class="fas fa-arrow-${trendValue >= 0 ? 'up' : 'down'}"></i>
                    <span>${Math.abs(trendValue)}% vs last month</span>
                `;
            }

            if (impactCards.water) {
                impactCards.water.querySelector('.impact-value').textContent = `${data.currentMonth.water.toFixed(0)}L`;
                const trend = impactCards.water.querySelector('.impact-trend');
                const trendValue = parseFloat(data.trends.water);
                trend.className = `impact-trend ${trendValue >= 0 ? 'positive' : 'negative'}`;
                trend.innerHTML = `
                    <i class="fas fa-arrow-${trendValue >= 0 ? 'up' : 'down'}"></i>
                    <span>${Math.abs(trendValue)}% vs last month</span>
                `;
            }

            if (impactCards.energy) {
                impactCards.energy.querySelector('.impact-value').textContent = `${data.currentMonth.energySaved.toFixed(0)} kWh`;
                const trend = impactCards.energy.querySelector('.impact-trend');
                const trendValue = parseFloat(data.trends.energySaved);
                trend.className = `impact-trend ${trendValue >= 0 ? 'positive' : 'negative'}`;
                trend.innerHTML = `
                    <i class="fas fa-arrow-${trendValue >= 0 ? 'up' : 'down'}"></i>
                    <span>${Math.abs(trendValue)}% vs last month</span>
                `;
            }

            if (impactCards.co2) {
                impactCards.co2.querySelector('.impact-value').textContent = `${data.currentMonth.co2.toFixed(1)} kg`;
                const trend = impactCards.co2.querySelector('.impact-trend');
                const trendValue = parseFloat(data.trends.co2);
                trend.className = `impact-trend ${trendValue >= 0 ? 'positive' : 'negative'}`;
                trend.innerHTML = `
                    <i class="fas fa-arrow-${trendValue >= 0 ? 'up' : 'down'}"></i>
                    <span>${Math.abs(trendValue)}% vs last month</span>
                `;
            }
        } catch (error) {
            console.error('Error updating impact section:', error);
        }
    }

    // Function to update rewards section
    async function updateRewardsSection() {
        try {
            const response = await fetch('/api/user/rewards', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch rewards data');
            }

            const { data } = await response.json();
            
            // Update rewards grid
            const rewardsGrid = document.querySelector('.rewards-grid');
            if (rewardsGrid) {
                rewardsGrid.innerHTML = data.rewards.map(reward => `
                    <div class="reward-card ${reward.status}">
                        <div class="reward-image">
                            <i class="fas ${getRewardIcon(reward.name)}"></i>
                        </div>
                        <h3>${reward.name}</h3>
                        <p>${reward.description}</p>
                        <p class="reward-points">${reward.pointsCost} points</p>
                        <button class="reward-btn" 
                                onclick="redeemReward('${reward.name}')"
                                ${reward.status !== 'unlocked' ? 'disabled' : ''}>
                            ${reward.status === 'locked' ? 'Locked' : 
                              reward.status === 'redeemed' ? 'Redeemed' : 'Redeem'}
                        </button>
                    </div>
                `).join('');
            }

            // Update milestone track
            const milestoneTrack = document.querySelector('.milestone-track');
            if (milestoneTrack) {
                const milestones = [100, 500, 1000, 2000];
                milestoneTrack.innerHTML = milestones.map(points => `
                    <div class="milestone ${data.points >= points ? 'achieved' : data.points >= points/2 ? 'current' : ''}">
                        <i class="fas ${getMilestoneIcon(points)}"></i>
                        <span>${points} pts</span>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error updating rewards section:', error);
        }
    }

    // Function to redeem reward
    async function redeemReward(rewardName) {
        try {
            const response = await fetch('/api/user/rewards/redeem', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ rewardName })
            });

            if (!response.ok) {
                throw new Error('Failed to redeem reward');
            }

            const result = await response.json();
            
            // Show success message
            showNotification('Success!', `You have successfully redeemed ${rewardName}`, 'success');
            
            // Update rewards section
            await updateRewardsSection();
            
            // Update points display
            document.querySelectorAll('.points-display').forEach(el => {
                el.textContent = result.data.remainingPoints;
            });
        } catch (error) {
            console.error('Error redeeming reward:', error);
            showNotification('Error', 'Failed to redeem reward. Please try again.', 'error');
        }
    }

    // Helper function to get reward icon
    function getRewardIcon(rewardName) {
        switch(rewardName.toLowerCase()) {
            case 'eco-friendly bag':
                return 'fa-shopping-bag';
            case 'plant a tree kit':
                return 'fa-seedling';
            case 'solar power bank':
                return 'fa-solar-panel';
            default:
                return 'fa-gift';
        }
    }

    // Helper function to get milestone icon
    function getMilestoneIcon(points) {
        if (points >= 2000) return 'fa-crown';
        if (points >= 1000) return 'fa-star';
        if (points >= 500) return 'fa-medal';
        return 'fa-award';
    }

    // Function to show notification
    function showNotification(title, message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type} animate__animated animate__fadeInRight`;
        notification.innerHTML = `
            <div class="notification-content">
                <h3>${title}</h3>
                    <p>${message}</p>
            </div>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.remove('animate__fadeInRight');
            notification.classList.add('animate__fadeOutRight');
            setTimeout(() => notification.remove(), 1000);
        }, 3000);
    }

    // Update impact and rewards sections when dashboard loads
    await updateImpactSection();
    await updateRewardsSection();

    // Refresh impact data every 5 minutes
    setInterval(updateImpactSection, 5 * 60 * 1000);

    // Add event listener for time filter in impact section
    const timeFilter = document.querySelector('.time-filter');
    if (timeFilter) {
        timeFilter.addEventListener('change', updateImpactSection);
    }

    // Function to update waste statistics section
    async function updateWasteStats() {
        try {
            const timeFilter = document.getElementById('timeFilterSelect').value;
            const response = await fetch(`/api/waste/stats?period=${timeFilter}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch waste statistics');
            }

            const data = await response.json();

            // Update waste type breakdown with animations
            const wasteTypes = ['plastic', 'paper', 'organic', 'electronic', 'glass', 'metal'];
            wasteTypes.forEach(type => {
                const amount = data.wasteByType[type] || 0;
                const amountElement = document.querySelector(`.waste-type-item:has(.waste-type-label:contains('${capitalizeFirstLetter(type)}')) .waste-type-amount`);
                if (amountElement) {
                    const oldValue = parseFloat(amountElement.textContent) || 0;
                    animateValue(amountElement, oldValue, amount, 1000, 'kg');
                    
                    // Add visual feedback for changes
                    const itemElement = amountElement.closest('.waste-type-item');
                    if (amount > oldValue) {
                        itemElement.classList.add('increased');
                        setTimeout(() => itemElement.classList.remove('increased'), 2000);
                    }
                }
            });

            // Store the data in localStorage for persistence
            localStorage.setItem('wasteStats', JSON.stringify({
                lastUpdated: new Date().toISOString(),
                wasteByType: data.wasteByType,
                timeFilter
            }));

        } catch (error) {
            console.error('Error updating waste statistics:', error);
            showNotification('Error', 'Failed to update waste statistics', 'error');
            
            // Try to load from localStorage if API fails
            const storedStats = JSON.parse(localStorage.getItem('wasteStats'));
            if (storedStats) {
                updateWasteTypeDisplay(storedStats.wasteByType);
            }
        }
    }

    // Function to update waste type display
    function updateWasteTypeDisplay(wasteByType) {
        Object.entries(wasteByType).forEach(([type, amount]) => {
            const amountElement = document.querySelector(`.waste-type-item:has(.waste-type-label:contains('${capitalizeFirstLetter(type)}')) .waste-type-amount`);
            if (amountElement) {
                amountElement.textContent = `${amount.toFixed(1)} kg`;
            }
        });
    }

    // Function to animate value changes
    function animateValue(element, start, end, duration, unit = '') {
        const startTime = performance.now();
        
        function updateValue(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth animation
            const easeOutQuad = 1 - Math.pow(1 - progress, 2);
            const current = start + (end - start) * easeOutQuad;

            element.textContent = `${current.toFixed(1)}${unit ? ' ' + unit : ''}`;
            element.classList.add('updating');

            if (progress < 1) {
                requestAnimationFrame(updateValue);
            } else {
                element.classList.remove('updating');
            }
        }

        requestAnimationFrame(updateValue);
    }

    // Function to update the waste chart
    function updateWasteChart(wasteByType) {
        const chartElement = document.querySelector('.waste-chart');
        if (!chartElement) return;

        const total = Object.values(wasteByType).reduce((sum, amount) => sum + amount, 0);
        if (total === 0) return; // Don't update chart if there's no data
        
        // Create segments for the chart
        const segments = Object.entries(wasteByType)
            .filter(([_, amount]) => amount > 0) // Only show types with values
            .map(([type, amount]) => ({
                type,
                amount,
                percentage: (amount / total * 100).toFixed(1)
            }))
            .sort((a, b) => b.amount - a.amount); // Sort by amount descending

        // Generate HTML for chart
        const chartHTML = segments.map(({ type, amount, percentage }) => `
            <div class="chart-segment ${type.toLowerCase()}-color" 
                 style="width: ${percentage}%;"
                 title="${capitalizeFirstLetter(type)}: ${amount.toFixed(1)} kg (${percentage}%)">
                    </div>
        `).join('');

        chartElement.innerHTML = chartHTML;

        // Update legend colors to match chart
        const legendItems = document.querySelectorAll('.legend-item');
        legendItems.forEach(item => {
            const type = item.textContent.trim().toLowerCase();
            const segment = segments.find(s => s.type.toLowerCase() === type);
            if (segment) {
                const color = getComputedStyle(document.querySelector(`.${type}-color`)).backgroundColor;
                item.querySelector('.legend-color').style.backgroundColor = color;
                item.style.opacity = '1';
            } else {
                item.style.opacity = '0.5'; // Dim legend items with no data
            }
        });
    }

    // Function to update points and rewards
    function updatePointsAndRewards(totalWaste) {
        // Calculate points (10 points per kg)
        const points = Math.floor(totalWaste * 10);
        
        // Update points display
        const pointsDisplay = document.querySelector('.user-points');
        if (pointsDisplay) {
            const currentPoints = parseInt(pointsDisplay.textContent);
            animateValue(pointsDisplay, currentPoints, points, 1000, 'pts');
        }

        // Update milestones
        const milestones = document.querySelectorAll('.milestone');
        milestones.forEach(milestone => {
            const requiredPoints = parseInt(milestone.querySelector('span').textContent);
            if (points >= requiredPoints) {
                milestone.classList.add('achieved');
            } else {
                milestone.classList.remove('achieved');
            }
        });

        // Update reward cards
        const rewardCards = document.querySelectorAll('.reward-card');
        rewardCards.forEach(card => {
            const requiredPoints = parseInt(card.querySelector('p').textContent);
            if (points >= requiredPoints) {
                card.classList.remove('locked');
                const button = card.querySelector('.reward-btn');
                if (button) {
                    button.removeAttribute('disabled');
                    button.textContent = 'Redeem';
                }
            }
        });
    }

    // Add CSS for animations
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        .waste-type-item {
            transition: transform 0.3s ease, background-color 0.3s ease;
            }

        .waste-type-item.increased {
            background-color: rgba(var(--success-rgb), 0.1);
            transform: scale(1.05);
            }

        .waste-type-amount {
            transition: color 0.3s ease;
        }

        .updating {
            color: var(--success-color);
    }
    `;
    document.head.appendChild(styleSheet);

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', () => {
        // Initial update
        updateWasteStats();

        // Add event listener for time filter changes
        const timeFilter = document.getElementById('timeFilterSelect');
        if (timeFilter) {
            timeFilter.addEventListener('change', updateWasteStats);
        }

        // Refresh stats every 5 minutes
        setInterval(updateWasteStats, 5 * 60 * 1000);
    });

    // Leaderboard Animation Effects
    function createSparkle(element) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        
        // Random position within the element
        sparkle.style.left = Math.random() * 100 + '%';
        sparkle.style.top = Math.random() * 100 + '%';
        
        element.appendChild(sparkle);
        
        // Remove sparkle after animation
        setTimeout(() => sparkle.remove(), 1500);
    }

    function createFirework(element) {
        const firework = document.createElement('div');
        firework.className = 'firework';
        
        // Random position and color
        firework.style.left = Math.random() * 100 + '%';
        firework.style.bottom = '0';
        firework.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        
        element.appendChild(firework);
        
        // Remove firework after animation
        setTimeout(() => firework.remove(), 1000);
    }

    // Add effects to top 3 leaders
    document.querySelectorAll('.leaderboard-item.top-3').forEach(leader => {
        // Create sparkles periodically
        setInterval(() => createSparkle(leader), 2000);
        
        // Create fireworks on hover
        leader.addEventListener('mouseenter', () => {
            const fireworkInterval = setInterval(() => createFirework(leader), 300);
            leader.setAttribute('data-firework-interval', fireworkInterval);
        });
        
        leader.addEventListener('mouseleave', () => {
            const interval = leader.getAttribute('data-firework-interval');
            if (interval) {
                clearInterval(parseInt(interval));
                leader.removeAttribute('data-firework-interval');
            }
        });
    });

    // Add floating animation to crown
    const firstPlace = document.querySelector('.leaderboard-item.first-place');
    if (firstPlace) {
        firstPlace.style.transform = 'translateY(0)';
        let floating = true;
        
        setInterval(() => {
            if (floating) {
                firstPlace.style.transform = 'translateY(-10px)';
            } else {
                firstPlace.style.transform = 'translateY(0)';
            }
            floating = !floating;
        }, 1500);
    }
});