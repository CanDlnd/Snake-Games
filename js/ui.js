export class UI {
    constructor(canvas) {
        this.canvas = canvas;
        this.score = 0;
        this.startTime = null;
        this.elapsedTime = 0;
        this.timerInterval = null;
        this.isPaused = false;
        this.pausedAt = 0;

        // Add container for active effects
        this.activeEffectsContainer = document.createElement('div');
        this.activeEffectsContainer.className = 'active-effects';
        document.body.appendChild(this.activeEffectsContainer);
    }

    reset() {
        this.score = 0;
        this.startTime = null;
        this.elapsedTime = 0;
        this.timerInterval = null;
        this.isPaused = false;
        this.pausedAt = 0;
    }

    startTimer() {
        this.startTime = Date.now() - this.elapsedTime;
        this.timerInterval = setInterval(() => {
            if (!this.isPaused) {
                this.elapsedTime = Date.now() - this.startTime;
                this.updateTimerDisplay();
            }
        }, 1000);
    }

    pauseTimer() {
        this.isPaused = true;
        this.pausedAt = this.elapsedTime;
    }

    resumeTimer() {
        this.isPaused = false;
        this.startTime = Date.now() - this.pausedAt;
    }

    updateTimerDisplay() {
        const seconds = Math.floor(this.elapsedTime / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        document.getElementById('timerDisplay').textContent = `Süre: ${formattedTime}`;
    }

    resetTimer() {
        clearInterval(this.timerInterval);
        this.elapsedTime = 0;
        this.startTime = null;
        this.isPaused = false;
        this.pausedAt = 0;
        document.getElementById('timerDisplay').textContent = 'Süre: 00:00';
    }

    showGameOver(score, message, highScores) {
        const gameOver = document.getElementById('gameOver');
        const finalScore = document.getElementById('finalScore');
        const deathMessage = document.getElementById('deathMessage');
        const leaderboardList = document.getElementById('leaderboardList');

        finalScore.textContent = score;
        deathMessage.textContent = message;

        // Update leaderboard display
        if (leaderboardList) {
            leaderboardList.innerHTML = highScores.map((entry, index) => `
                <div class="leaderboard-entry ${entry.score === score ? 'current-score' : ''}">
                    <span class="rank">#${index + 1}</span>
                    <span class="score">${entry.score}</span>
                    <span class="date">${entry.date}</span>
                </div>
            `).join('');
        }

        gameOver.classList.remove('hidden');
    }

    hideDisplays() {
        const displays = document.querySelectorAll('.score-display, .timer-display, .health-bar');
        displays.forEach(display => display.classList.add('hidden'));
    }

    showDisplays() {
        const displays = document.querySelectorAll('.score-display, .timer-display, .health-bar');
        displays.forEach(display => display.classList.remove('hidden'));
    }

    draw(ctx, snake) {
        // Draw score
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Puan: ${this.score}`, 20, 40);

        // Draw health bar
        const healthBarWidth = 200;
        const healthBarHeight = 20;
        const healthBarX = (this.canvas.width - healthBarWidth) / 2;
        const healthBarY = this.canvas.height - 40;

        // Background
        ctx.fillStyle = 'rgba(231, 76, 60, 0.3)';
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

        // Health fill
        const healthWidth = (snake.health / 100) * healthBarWidth;
        ctx.fillStyle = snake.health > 20 ? '#2ecc71' : '#e74c3c';
        ctx.fillRect(healthBarX, healthBarY, healthWidth, healthBarHeight);
    }

    getGameTimeInSeconds() {
        return Math.floor(this.elapsedTime / 1000);
    }

    showEffectTimer(effectType, duration) {
        const effectId = `effect-${Date.now()}`;
        const timer = document.createElement('div');
        timer.className = `effect-timer ${effectType}`;
        timer.id = effectId;

        let icon, name;
        switch (effectType) {
            case 'double-score':
                icon = '2X';
                name = 'Double Score';
                break;
            case 'ghost':
                icon = '👻';
                name = 'Ghost Mode';
                break;
            case 'magnetic':
                icon = '🧲';
                name = 'Magnetic Mode';
                break;
        }

        timer.innerHTML = `
            <div class="effect-icon">${icon}</div>
            <div class="effect-info">
                <div class="effect-name-container">
                    <div class="effect-name">${name}</div>
                    <div class="effect-progress">
                        <div class="effect-bar" style="width: 100%"></div>
                    </div>
                </div>
                <div class="effect-countdown">${duration / 1000}s</div>
            </div>
        `;

        this.activeEffectsContainer.appendChild(timer);

        // Start countdown
        const startTime = Date.now();
        const updateProgress = () => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, duration - elapsed);
            const progress = (remaining / duration) * 100;
            const secondsLeft = Math.ceil(remaining / 1000);

            const bar = timer.querySelector('.effect-bar');
            const countdown = timer.querySelector('.effect-countdown');

            bar.style.width = `${progress}%`;
            countdown.textContent = `${secondsLeft}s`;

            if (remaining > 0) {
                requestAnimationFrame(updateProgress);
            } else {
                // Add fade-out animation
                timer.classList.add('fade-out');
                setTimeout(() => timer.remove(), 300);
            }
        };

        updateProgress();
    }

    clearEffectTimers() {
        // Remove all effect timers from the DOM
        this.activeEffectsContainer.innerHTML = '';

        // Make sure all animation timers are cancelled
        const timers = document.querySelectorAll('.effect-timer');
        timers.forEach(timer => {
            // Add fade-out animation
            timer.classList.add('fade-out');
            // Remove the element after animation completes
            setTimeout(() => timer.remove(), 300);
        });
    }
} 