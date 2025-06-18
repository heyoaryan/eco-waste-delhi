document.addEventListener('DOMContentLoaded', function() {
    // Get user's current points
    const userPoints = 1250; // This should be fetched from the server

    // Handle reward cards
    const rewardCards = document.querySelectorAll('.reward-card');
    rewardCards.forEach(card => {
        const requiredPoints = parseInt(card.dataset.points);
        const claimBtn = card.querySelector('.claim-btn');
        
        if (userPoints >= requiredPoints) {
            card.querySelector('.status-badge').textContent = 'Unlocked!';
            card.querySelector('.status-badge').classList.remove('locked');
            card.querySelector('.status-badge').classList.add('unlocked');
            claimBtn.disabled = false;
            claimBtn.textContent = 'Claim Reward';
        } else {
            const pointsNeeded = requiredPoints - userPoints;
            claimBtn.textContent = `Earn ${pointsNeeded} More Points`;
        }

        // Add click event for claim button
        claimBtn.addEventListener('click', () => {
            if (!claimBtn.disabled) {
                showClaimModal(card);
            }
        });
    });

    // Handle claim modal
    const modal = document.getElementById('rewardClaimModal');
    const closeBtn = modal.querySelector('.close-modal');
    const claimForm = modal.querySelector('.claim-form');

    function showClaimModal(rewardCard) {
        const rewardTitle = rewardCard.querySelector('h3').textContent;
        const rewardDesc = rewardCard.querySelector('p').textContent;
        const rewardIcon = rewardCard.querySelector('.reward-icon').innerHTML;

        modal.querySelector('.reward-title').textContent = rewardTitle;
        modal.querySelector('.reward-description').textContent = rewardDesc;
        modal.querySelector('.reward-icon.large').innerHTML = rewardIcon;

        modal.classList.add('show');
    }

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });

    // Handle claim form submission
    claimForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = claimForm.querySelector('.claim-submit-btn');
        const originalText = submitBtn.textContent;
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Show success message
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Claimed Successfully!';
            submitBtn.style.background = '#4CAF50';

            // Close modal after success
            setTimeout(() => {
                modal.classList.remove('show');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                claimForm.reset();
            }, 2000);

        } catch (error) {
            console.error('Error claiming reward:', error);
            submitBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i> Failed to Claim';
            submitBtn.style.background = '#dc3545';

            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                submitBtn.style.background = '#4CAF50';
            }, 3000);
        }
    });

    // Handle challenges progress
    function updateChallengeProgress() {
        const challengeCards = document.querySelectorAll('.challenge-card');
        challengeCards.forEach(card => {
            const progressBar = card.querySelector('.progress-fill');
            const progressText = card.querySelector('.progress-text');
            
            // Animate progress bar
            const width = progressBar.style.width;
            progressBar.style.width = '0%';
            setTimeout(() => {
                progressBar.style.width = width;
            }, 100);
        });
    }

    // Update challenges on page load
    updateChallengeProgress();

    // Handle event reminder
    const eventBtn = document.querySelector('.event-btn');
    if (eventBtn) {
        eventBtn.addEventListener('click', async () => {
            const originalText = eventBtn.textContent;
            eventBtn.disabled = true;
            eventBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Setting Reminder...';

            try {
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 1000));

                eventBtn.innerHTML = '<i class="fas fa-check"></i> Reminder Set!';
                eventBtn.style.background = '#4CAF50';

                setTimeout(() => {
                    eventBtn.disabled = false;
                    eventBtn.textContent = originalText;
                }, 2000);

            } catch (error) {
                console.error('Error setting reminder:', error);
                eventBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i> Failed';
                eventBtn.style.background = '#dc3545';

                setTimeout(() => {
                    eventBtn.disabled = false;
                    eventBtn.textContent = originalText;
                    eventBtn.style.background = '#4CAF50';
                }, 3000);
            }
        });
    }

    // Update rewards status when new points are earned
    function updateRewardsStatus(newPoints) {
        rewardCards.forEach(card => {
            const requiredPoints = parseInt(card.dataset.points);
            const claimBtn = card.querySelector('.claim-btn');
            const statusBadge = card.querySelector('.status-badge');
            
            if (newPoints >= requiredPoints && statusBadge.classList.contains('locked')) {
                // Animate the unlock
                card.classList.add('animate__animated', 'animate__tada');
                setTimeout(() => {
                    statusBadge.textContent = 'Unlocked!';
                    statusBadge.classList.remove('locked');
                    statusBadge.classList.add('unlocked');
                    claimBtn.disabled = false;
                    claimBtn.textContent = 'Claim Reward';
                }, 500);
            }
        });
    }

    // Listen for points update events
    window.addEventListener('pointsUpdated', (e) => {
        updateRewardsStatus(e.detail.points);
    });
}); 