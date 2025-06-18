class GamificationSystem {
    constructor() {
        this.data = JSON.parse(localStorage.getItem('gamificationData')) || {
            points: 0,
            level: 1,
            badges: [],
            achievements: [],
            streaks: {
                current: 0,
                longest: 0,
                lastActivity: null
            }
        };
        
        this.badges = {
            wasteReduction: [
                { id: 'recycler_novice', name: 'Recycling Novice', requirement: 50, icon: 'fa-seedling' },
                { id: 'recycler_pro', name: 'Recycling Pro', requirement: 200, icon: 'fa-tree' },
                { id: 'waste_warrior', name: 'Waste Warrior', requirement: 500, icon: 'fa-award' },
                { id: 'eco_master', name: 'Eco Master', requirement: 1000, icon: 'fa-crown' }
            ],
            streaks: [
                { id: 'consistent_1', name: '7 Day Streak', requirement: 7, icon: 'fa-fire' },
                { id: 'consistent_2', name: '30 Day Streak', requirement: 30, icon: 'fa-fire-flame-curved' }
            ],
            special: [
                { id: 'variety_king', name: 'Variety King', requirement: 5, icon: 'fa-star' }, // 5 different waste types
                { id: 'method_master', name: 'Method Master', requirement: 4, icon: 'fa-certificate' } // All disposal methods
            ]
        };

        this.levels = [
            { level: 1, name: 'Eco Beginner', pointsNeeded: 0 },
            { level: 2, name: 'Green Starter', pointsNeeded: 100 },
            { level: 3, name: 'Earth Defender', pointsNeeded: 300 },
            { level: 4, name: 'Sustainability Warrior', pointsNeeded: 600 },
            { level: 5, name: 'Environmental Champion', pointsNeeded: 1000 },
            { level: 6, name: 'Eco Legend', pointsNeeded: 2000 }
        ];

        this.updateUI();
        this.checkDailyStreak();
    }

    addPoints(points, activity) {
        this.data.points += points;
        
        // Check for level up
        const newLevel = this.checkLevel();
        if (newLevel > this.data.level) {
            this.levelUp(newLevel);
        }

        // Update streak
        this.updateStreak(activity);

        // Check for new badges
        this.checkBadges(activity);

        // Save data
        this.saveData();
        
        // Update UI
        this.updateUI();
    }

    checkLevel() {
        for (let i = this.levels.length - 1; i >= 0; i--) {
            if (this.data.points >= this.levels[i].pointsNeeded) {
                return this.levels[i].level;
            }
        }
        return 1;
    }

    levelUp(newLevel) {
        const levelInfo = this.levels.find(l => l.level === newLevel);
        this.data.level = newLevel;
        this.showNotification('level-up', `Level Up! You're now ${levelInfo.name}! 🎉`);
    }

    updateStreak(activity) {
        const today = new Date().toDateString();
        const lastActivity = this.data.streaks.lastActivity;

        if (lastActivity) {
            const lastDate = new Date(lastActivity).toDateString();
            const dayDiff = (new Date(today) - new Date(lastDate)) / (1000 * 60 * 60 * 24);

            if (dayDiff === 1) {
                // Consecutive day
                this.data.streaks.current++;
                if (this.data.streaks.current > this.data.streaks.longest) {
                    this.data.streaks.longest = this.data.streaks.current;
                }
            } else if (dayDiff > 1) {
                // Streak broken
                this.data.streaks.current = 1;
            }
        } else {
            // First activity
            this.data.streaks.current = 1;
        }

        this.data.streaks.lastActivity = today;
    }

    checkBadges(activity) {
        if (activity.type === 'waste_management') {
            // Check waste reduction badges
            this.badges.wasteReduction.forEach(badge => {
                if (this.data.points >= badge.requirement && !this.data.badges.includes(badge.id)) {
                    this.data.badges.push(badge.id);
                    this.showNotification('badge', `New Badge Unlocked: ${badge.name}! 🏆`);
                }
            });

            // Check streak badges
            this.badges.streaks.forEach(badge => {
                if (this.data.streaks.current >= badge.requirement && !this.data.badges.includes(badge.id)) {
                    this.data.badges.push(badge.id);
                    this.showNotification('badge', `Streak Badge Unlocked: ${badge.name}! 🔥`);
                }
            });

            // Check for special badges
            this.checkSpecialBadges(activity);
        }
    }

    checkSpecialBadges(activity) {
        const wasteData = JSON.parse(localStorage.getItem('wasteData')) || { wasteByType: {}, wasteByMethod: {} };
        
        // Check variety badge
        const uniqueTypes = Object.keys(wasteData.wasteByType).length;
        const varietyBadge = this.badges.special.find(b => b.id === 'variety_king');
        if (uniqueTypes >= varietyBadge.requirement && !this.data.badges.includes(varietyBadge.id)) {
            this.data.badges.push(varietyBadge.id);
            this.showNotification('badge', `Special Badge Unlocked: ${varietyBadge.name}! 🌟`);
        }

        // Check method master badge
        const uniqueMethods = Object.keys(wasteData.wasteByMethod).length;
        const methodBadge = this.badges.special.find(b => b.id === 'method_master');
        if (uniqueMethods >= methodBadge.requirement && !this.data.badges.includes(methodBadge.id)) {
            this.data.badges.push(methodBadge.id);
            this.showNotification('badge', `Special Badge Unlocked: ${methodBadge.name}! 🎯`);
        }
    }

    checkDailyStreak() {
        if (!this.data.streaks.lastActivity) return;

        const today = new Date().toDateString();
        const lastActivity = new Date(this.data.streaks.lastActivity).toDateString();
        const dayDiff = (new Date(today) - new Date(lastActivity)) / (1000 * 60 * 60 * 24);

        if (dayDiff > 1) {
            this.data.streaks.current = 0;
            this.saveData();
            this.updateUI();
        }
    }

    updateUI() {
        // Update points display
        const pointsDisplay = document.querySelector('.points-display');
        if (pointsDisplay) {
            pointsDisplay.textContent = this.data.points.toLocaleString();
        }

        // Update level display
        const levelDisplay = document.querySelector('.level-badge');
        if (levelDisplay) {
            const currentLevel = this.levels.find(l => l.level === this.data.level);
            levelDisplay.textContent = currentLevel.name;
        }

        // Update streak display
        const streakDisplay = document.querySelector('.streak-display');
        if (streakDisplay) {
            streakDisplay.textContent = `${this.data.streaks.current} Day Streak 🔥`;
        }

        // Update badges
        this.updateBadgesDisplay();
    }

    updateBadgesDisplay() {
        const badgesContainer = document.querySelector('.achievement-grid');
        if (!badgesContainer) return;

        const allBadges = [...this.badges.wasteReduction, ...this.badges.streaks, ...this.badges.special];
        
        badgesContainer.innerHTML = allBadges.map(badge => {
            const isUnlocked = this.data.badges.includes(badge.id);
            return `
                <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                    <i class="fas ${badge.icon} achievement-icon"></i>
                    <h3 class="achievement-title">${badge.name}</h3>
                    <div class="achievement-progress">
                        <div class="progress-bar" style="width: ${isUnlocked ? '100%' : '0%'}"></div>
                    </div>
                    <p>${isUnlocked ? 'Completed!' : `${badge.requirement} points needed`}</p>
                </div>
            `;
        }).join('');
    }

    showNotification(type, message) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    saveData() {
        localStorage.setItem('gamificationData', JSON.stringify(this.data));
    }
}

// Initialize gamification system
window.gamification = new GamificationSystem(); 