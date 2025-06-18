class WasteTracker {
    constructor() {
        this.wasteData = JSON.parse(localStorage.getItem('wasteData')) || {
                    entries: [],
                    totalWaste: 0,
                    wasteByType: {},
                    wasteByMethod: {},
                    monthlyData: {}
                };
        this.initializeEventListeners();
        this.updateUI();
    }

    initializeEventListeners() {
        // Add Waste Entry Button
        const addWasteBtn = document.getElementById('addWasteBtn');
        if (addWasteBtn) {
            addWasteBtn.addEventListener('click', () => {
                const formContainer = document.getElementById('wasteFormContainer');
                if (formContainer) {
                    formContainer.classList.add('active');
                }
            });
        }

        // Cancel Button
        const cancelBtn = document.getElementById('cancelWasteEntry');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                const formContainer = document.getElementById('wasteFormContainer');
                if (formContainer) {
                    formContainer.classList.remove('active');
                }
                const wasteEntryForm = document.getElementById('wasteEntryForm');
                if (wasteEntryForm) {
                    wasteEntryForm.reset();
                }
            });
        }

        // Waste Entry Form
        const wasteForm = document.getElementById('wasteEntryForm');
        if (wasteForm) {
            wasteForm.addEventListener('submit', (e) => {
            e.preventDefault();
                this.logWaste();
        });
    }
        }

    logWaste() {
        const wasteType = document.getElementById('wasteType').value;
        const wasteAmount = parseFloat(document.getElementById('wasteAmount').value);
        const disposalMethod = document.getElementById('disposalMethod').value;
        const location = document.getElementById('location').value;
        const date = document.getElementById('date').value;
        const notes = document.getElementById('notes').value;

        if (wasteType && wasteAmount && disposalMethod) {
        const entry = {
            id: Date.now(),
                type: wasteType,
                amount: wasteAmount,
                method: disposalMethod,
                location: location,
                date: date || new Date().toISOString().split('T')[0],
                notes: notes,
            timestamp: new Date().toISOString()
        };

        // Add entry to waste data
        this.wasteData.entries.unshift(entry);
            this.wasteData.totalWaste += wasteAmount;

        // Update waste by type
            this.wasteData.wasteByType[wasteType] = (this.wasteData.wasteByType[wasteType] || 0) + wasteAmount;

        // Update waste by method
            this.wasteData.wasteByMethod[disposalMethod] = (this.wasteData.wasteByMethod[disposalMethod] || 0) + wasteAmount;

        // Update monthly data
            const monthYear = date.substring(0, 7); // Format: YYYY-MM
        if (!this.wasteData.monthlyData[monthYear]) {
            this.wasteData.monthlyData[monthYear] = {
                total: 0,
                byType: {},
                byMethod: {}
            };
        }
            this.wasteData.monthlyData[monthYear].total += wasteAmount;
            this.wasteData.monthlyData[monthYear].byType[wasteType] = 
                (this.wasteData.monthlyData[monthYear].byType[wasteType] || 0) + wasteAmount;
            this.wasteData.monthlyData[monthYear].byMethod[disposalMethod] = 
                (this.wasteData.monthlyData[monthYear].byMethod[disposalMethod] || 0) + wasteAmount;

        // Save to localStorage
            localStorage.setItem('wasteData', JSON.stringify(this.wasteData));

            // Calculate points based on waste type and method
            const points = this.calculatePoints(wasteType, wasteAmount, disposalMethod);

            // Update gamification system
        if (window.gamification) {
                window.gamification.addPoints(points, {
                    type: 'waste_management',
                    details: {
                        wasteType,
                        amount: wasteAmount,
                        method: disposalMethod
                    }
                });
        }

        // Update UI
        this.updateUI();
            this.showSuccess(points);

            // Reset and hide form
            document.getElementById('wasteEntryForm').reset();
            document.getElementById('wasteFormContainer').classList.remove('active');
        }
    }

    calculatePoints(type, amount, method) {
        let points = 0;
        
        // Base points by waste type
        const typePoints = {
            plastic: 15,
            paper: 10,
            organic: 8,
            electronic: 25,
            glass: 12,
            metal: 20
        };

        // Multiplier by disposal method
        const methodMultiplier = {
            recycling: 1.5,
            composting: 1.2,
            reuse: 2.0,
            donation: 1.8
        };

        // Calculate base points
        points = (typePoints[type] || 5) * amount;
        
        // Apply method multiplier
        points *= methodMultiplier[method] || 1;

        return Math.round(points);
    }

    updateUI() {
        // Update total waste
        const totalWasteDisplay = document.getElementById('wasteReduced');
        if (totalWasteDisplay) {
            totalWasteDisplay.textContent = `${this.wasteData.totalWaste.toFixed(1)} kg`;
        }

        // Update impact stats
        this.updateImpactStats();

        // Update activity feed with latest entries
        this.updateActivityFeed();

        // Update charts if they exist
        if (window.updateCharts) {
            window.updateCharts();
        }
    }

    updateImpactStats() {
        const totalWaste = this.wasteData.totalWaste;
        
        // Calculate environmental impact
        const treesImpact = (totalWaste * 0.17).toFixed(1);
        const waterImpact = (totalWaste * 1000).toFixed(0);
        const co2Impact = (totalWaste * 2.5).toFixed(1);

        // Update impact cards
        const impactElements = {
            trees: document.querySelector('.impact-card:nth-child(1) .impact-value'),
            water: document.querySelector('.impact-card:nth-child(2) .impact-value'),
            co2: document.querySelector('.impact-card:nth-child(4) .impact-value')
        };

        if (impactElements.trees) impactElements.trees.textContent = treesImpact;
        if (impactElements.water) impactElements.water.textContent = `${waterImpact}L`;
        if (impactElements.co2) impactElements.co2.textContent = `${co2Impact} kg`;
    }

    updateActivityFeed() {
        const activityFeed = document.getElementById('activityFeed');
        if (!activityFeed) return;

        const recentEntries = this.wasteData.entries.slice(0, 5);
        activityFeed.innerHTML = recentEntries.map(entry => `
            <div class="activity-item">
                <div class="activity-icon ${entry.type}">
                    <i class="fas ${this.getWasteIcon(entry.type)}"></i>
                </div>
                <div class="activity-details">
                    <h4>${this.formatWasteType(entry.type)} - ${entry.amount} kg</h4>
                    <p>Disposed via ${this.formatMethod(entry.method)}</p>
                    <span class="activity-time">${this.formatDate(entry.date)}</span>
                </div>
            </div>
        `).join('');
    }

    getWasteIcon(type) {
        const icons = {
            plastic: 'fa-bottle-water',
            paper: 'fa-newspaper',
            organic: 'fa-leaf',
            electronic: 'fa-laptop',
            glass: 'fa-glass',
            metal: 'fa-cube'
        };
        return icons[type] || 'fa-trash';
    }

    formatWasteType(type) {
        return type.charAt(0).toUpperCase() + type.slice(1);
    }

    formatMethod(method) {
        return method.charAt(0).toUpperCase() + method.slice(1);
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    showSuccess(points) {
        const message = document.createElement('div');
        message.className = 'success-message';
        message.innerHTML = `
            <i class="fas fa-check-circle"></i>
            Activity logged successfully!
            <span class="points-earned">+${points} points earned</span>
        `;
        document.body.appendChild(message);

        setTimeout(() => {
            message.remove();
        }, 3000);
    }
}

// Initialize waste tracker
const wasteTracker = new WasteTracker(); 