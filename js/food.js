export class Food {
    constructor(canvas, size) {
        this.canvas = canvas;
        this.size = size;
        this.position = { x: 0, y: 0 };
        this.type = 'regular';
        this.spawnTime = 0;
        this.timeLimit = 7000; // 7 seconds for all food items
        this.pauseStartTime = null;
        this.totalPausedTime = 0;

        // Add special item properties
        this.isSpecialItem = false;

        // Track time since last special item appeared
        this.lastSpecialItemTime = 0;
        this.specialItemInterval = 15000; // 15 seconds between special items
    }

    // Add a reset method
    reset() {
        this.lastSpecialItemTime = 0;
        this.isSpecialItem = false;
        this.type = 'regular';
        this.spawnTime = 0;
        this.totalPausedTime = 0;
        this.pauseStartTime = null;
    }

    spawn(snake) {
        const gridWidth = Math.floor(this.canvas.width / this.size);
        const gridHeight = Math.floor(this.canvas.height / this.size);

        do {
            this.position.x = Math.floor(Math.random() * gridWidth) * this.size;
            this.position.y = Math.floor(Math.random() * gridHeight) * this.size;
        } while (this.checkCollisionWithSnake(snake));

        const currentTime = Date.now();
        const timeSinceLastSpecial = currentTime - this.lastSpecialItemTime;

        // Guarantee a special item every 15 seconds
        if (timeSinceLastSpecial >= this.specialItemInterval) {
            this.isSpecialItem = true;
            this.lastSpecialItemTime = currentTime;

            // Randomly select special item type
            const random = Math.random();
            if (random < 0.25) {
                this.type = 'double_score';
            } else if (random < 0.5) {
                this.type = 'extra_life';
            } else if (random < 0.75) {
                this.type = 'ghost';
            } else {
                this.type = 'magnetic'; // New Magnetic Bait
            }
        } else {
            // Random chance to spawn special item (15% chance)
            if (Math.random() < 0.15) {
                this.isSpecialItem = true;
                this.lastSpecialItemTime = currentTime;

                // Randomly select special item type
                const random = Math.random();
                if (random < 0.25) {
                    this.type = 'double_score';
                } else if (random < 0.5) {
                    this.type = 'extra_life';
                } else if (random < 0.75) {
                    this.type = 'ghost';
                } else {
                    this.type = 'magnetic'; // New Magnetic Bait
                }
            } else {
                // Regular food items
                this.isSpecialItem = false;
                const random = Math.random();
                if (random < 0.1) {
                    this.type = 'regular';
                }
                else if (random < 0.2) {
                    this.type = 'green';
                }
                else {
                    this.type = 'yellow';
                }
            }
        }

        this.spawnTime = Date.now();
        this.totalPausedTime = 0;
        this.pauseStartTime = null;
    }

    checkCollisionWithSnake(snake) {
        return snake.body.some(segment =>
            segment.x === this.position.x &&
            segment.y === this.position.y
        );
    }

    draw(currentTime) {
        const ctx = this.canvas.getContext('2d');

        if (this.isSpecialItem) {
            this.drawSpecialFood(ctx);
        } else {
            this.drawRegularFood(ctx);
        }

        // Draw timer bar
        this.drawTimerBar(ctx);
    }

    drawRegularFood(ctx) {
        const centerX = this.position.x + this.size / 2;
        const centerY = this.position.y + this.size / 2;
        const radius = this.size / 2 - 2;

        // Set color based on type
        let color, glowColor;
        switch (this.type) {
            case 'regular':
                color = '#e74c3c';
                glowColor = '#c0392b';
                break;
            case 'green':
                color = '#2ecc71';
                glowColor = '#27ae60';
                break;
            case 'yellow':
                color = '#f1c40f';
                glowColor = '#f39c12';
                break;
        }

        // Add glow effect
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 8;

        // Draw main circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.closePath();

        // Add highlight for 3D effect
        ctx.beginPath();
        ctx.arc(centerX - radius / 3, centerY - radius / 3, radius / 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();
        ctx.closePath();

        // Reset shadow
        ctx.shadowBlur = 0;
    }

    drawSpecialFood(ctx) {
        const centerX = this.position.x + this.size / 2;
        const centerY = this.position.y + this.size / 2;
        const radius = this.size / 2;

        // Set color and icon based on special type
        let color, icon;
        switch (this.type) {
            case 'double_score':
                color = '#9b59b6';
                icon = '2X';
                break;
            case 'extra_life':
                color = '#3498db';
                icon = '+1';
                break;
            case 'ghost':
                color = '#95a5a6';
                icon = '👻';
                break;
            case 'magnetic':
                color = '#e67e22';
                icon = '🧲';
                break;
        }

        // Draw pulsing outer glow
        const time = Date.now() / 1000;
        const pulseSize = 1 + Math.sin(time * 4) * 0.1;

        ctx.shadowColor = color;
        ctx.shadowBlur = 15;

        // Draw main circle with pulse effect
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Draw inner circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();

        // Draw icon or text
        ctx.shadowBlur = 0;
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, centerX, centerY);

        // Add sparkle effect
        this.drawSparkles(ctx, centerX, centerY, radius);
    }

    drawSparkles(ctx, centerX, centerY, radius) {
        const time = Date.now() / 1000;
        const sparkleCount = 4;
        const sparkleRadius = radius + 5;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(time); // Rotate sparkles over time

        for (let i = 0; i < sparkleCount; i++) {
            const angle = (i * Math.PI * 2) / sparkleCount;
            const x = Math.cos(angle) * sparkleRadius;
            const y = Math.sin(angle) * sparkleRadius;

            // Draw sparkle
            ctx.beginPath();
            ctx.moveTo(x - 3, y);
            ctx.lineTo(x + 3, y);
            ctx.moveTo(x, y - 3);
            ctx.lineTo(x, y + 3);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.restore();
    }

    drawTimerBar(ctx) {
        const timeRemaining = this.getTimeRemaining();
        const timerWidth = 30;
        const timerHeight = 3;
        const timerX = this.position.x + (this.size - timerWidth) / 2;
        const timerY = this.position.y - 10;

        // Timer background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(timerX, timerY, timerWidth, timerHeight);

        // Timer fill with glow effect for special items
        if (this.isSpecialItem) {
            ctx.shadowColor = '#9b59b6';
            ctx.shadowBlur = 5;
        }

        ctx.fillStyle = this.isSpecialItem ? '#9b59b6' : '#e98aa7';
        ctx.fillRect(
            timerX,
            timerY,
            (timeRemaining / this.timeLimit) * timerWidth,
            timerHeight
        );

        // Reset shadow
        ctx.shadowBlur = 0;
    }

    pause() {
        if (!this.pauseStartTime) {
            this.pauseStartTime = Date.now();
        }
    }

    resume() {
        if (this.pauseStartTime) {
            this.totalPausedTime += Date.now() - this.pauseStartTime;
            this.pauseStartTime = null;
        }
    }

    isExpired() {
        if (this.pauseStartTime) {
            return false; // Never expire while paused
        }
        const activeTime = Date.now() - this.spawnTime - this.totalPausedTime;
        return activeTime >= this.timeLimit;
    }

    getTimeRemaining() {
        if (this.pauseStartTime) {
            // If paused, return the time that was remaining when paused
            const activeTime = this.pauseStartTime - this.spawnTime - this.totalPausedTime;
            return Math.max(0, this.timeLimit - activeTime);
        }
        const activeTime = Date.now() - this.spawnTime - this.totalPausedTime;
        return Math.max(0, this.timeLimit - activeTime);
    }
} 