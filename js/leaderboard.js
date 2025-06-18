class Leaderboard {
    constructor() {
        this.currentPeriod = 'weekly';
        this.leaderboardData = {
            weekly: [
                {
                    rank: 1,
                    username: 'EcoWarrior',
                    points: 2500,
                    wasteStats: {
                        plastic: 45,
                        paper: 30,
                        organic: 65,
                        electronic: 10
                    },
                    totalWaste: 150,
                    correctSegregation: '98%',
                    avatar: 'assets/images/avatar1.png'
                },
                {
                    rank: 2,
                    username: 'GreenHero',
                    points: 2200,
                    wasteStats: {
                        plastic: 35,
                        paper: 40,
                        organic: 55,
                        electronic: 8
                    },
                    totalWaste: 138,
                    correctSegregation: '95%',
                    avatar: 'assets/images/avatar2.png'
                },
                // Add more users with detailed waste data
            ],
            monthly: [], // Similar structure for monthly data
            alltime: []  // Similar structure for all-time data
        };
        this.initializeEventListeners();
        this.renderLeaderboard();
    }

    initializeEventListeners() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.currentPeriod = button.dataset.period;
                // Update active button
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                // Render new data
                this.renderLeaderboard();
            });
        });
    }

    renderLeaderboard() {
        const leaderboardEntries = document.querySelector('.leaderboard-entries');
        const data = this.leaderboardData[this.currentPeriod];
        
        leaderboardEntries.innerHTML = data.map(entry => `
            <div class="leaderboard-entry ${entry.rank <= 3 ? 'top-3' : ''}">
                <span class="rank-number">#${entry.rank}</span>
                <div class="user-info">
                    <img src="${entry.avatar}" alt="${entry.username}'s avatar">
                    <div class="user-details">
                        <span class="username">${entry.username}</span>
                        <div class="waste-badges">
                            ${this.generateWasteBadges(entry.wasteStats)}
                        </div>
                    </div>
                </div>
                <div class="waste-stats">
                    <div class="stat">
                        <span class="label">Total Waste</span>
                        <span class="value">${entry.totalWaste}kg</span>
                    </div>
                    <div class="stat">
                        <span class="label">Segregation</span>
                        <span class="value">${entry.correctSegregation}</span>
                    </div>
                </div>
                <div class="points-section">
                    <span class="points">${entry.points.toLocaleString()}</span>
                    <span class="points-label">points</span>
                </div>
            </div>
        `).join('');
    }

    generateWasteBadges(wasteStats) {
        const badges = {
            plastic: { icon: 'fa-recycle', color: '#2ecc71' },
            paper: { icon: 'fa-newspaper', color: '#3498db' },
            organic: { icon: 'fa-leaf', color: '#27ae60' },
            electronic: { icon: 'fa-laptop', color: '#e74c3c' }
        };

        return Object.entries(wasteStats)
            .map(([type, amount]) => `
                <div class="waste-badge" title="${type}: ${amount}kg">
                    <i class="fas ${badges[type].icon}" style="color: ${badges[type].color}"></i>
                    <span>${amount}kg</span>
                </div>
            `).join('');
    }

    updateUserRank(userData) {
        const yourRankCard = document.querySelector('.your-rank-card');
        if (yourRankCard) {
            const rankInfo = yourRankCard.querySelector('.rank-info');
            rankInfo.querySelector('.rank-number').textContent = `#${userData.rank}`;
            rankInfo.querySelector('.points').textContent = userData.points.toLocaleString();
            rankInfo.querySelector('.impact').textContent = userData.impact;
        }
    }
}

// Initialize leaderboard
const leaderboard = new Leaderboard(); 