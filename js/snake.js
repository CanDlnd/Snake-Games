export class Snake {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.size = 20;
        this.lastMove = 0;

        // Base speed values for different map sizes (higher numbers = slower speed)
        this.speedSettings = {
            small: {
                baseSpeed: 85,      // Significantly slower for small map
                sprintSpeed: 65,    // Slower sprint for small map
                maxSpeed: 60        // Slower max speed
            },
            medium: {
                baseSpeed: 75,      // Significantly slower for medium map
                sprintSpeed: 60,    // Slower sprint
                maxSpeed: 55        // Slower max speed
            },
            large: {
                baseSpeed: 55,      // Significantly slower for large map
                sprintSpeed: 45,    // Slower sprint
                maxSpeed: 40        // Slower max speed
            }
        };

        // Initialize with medium speed (will be updated in setMapSpeed)
        this.baseSpeed = this.speedSettings.medium.baseSpeed;
        this.normalSpeed = this.baseSpeed; // Önemli: Normal hız için referans değer
        this.sprintSpeed = this.speedSettings.medium.sprintSpeed;
        this.maxSpeed = this.speedSettings.medium.maxSpeed;

        this.speedIncrement = 0.0005;  // Reduced for even smoother speed increase

        // Sprint properties
        this.sprintDuration = 500;
        this.lastKeyPressTime = 0;
        this.doublePressThreshold = 200;
        this.lastDirection = null;
        this.isSprinting = false;
        this.sprintTimeout = null;

        // Enhanced controls for trackpads (better sensitivity on macOS)
        this.isMac = /Mac|iPad|iPhone|iPod/.test(navigator.userAgent);
        this.doublePressThreshold = this.isMac ? 250 : 200; // More forgiving double-press on macOS trackpads

        // FPS iyileştirme için interpolasyon değerleri
        this.interpolationFactor = 0.3; // Daha düşük = daha yumuşak geçiş
        this.lastRenderTime = 0;
        this.renderInterval = 16; // ~60 FPS hedefi için render aralığı

        this.health = 100;
        this.score = 0;
        this.reset();

        // Add new property to control movement
        this.canMove = true;
        this.initialDirection = 'right';

        // Add new properties for special effects
        this.doubleScoreActive = false;
        this.doubleScoreTimer = null;
        this.isGhost = false;
        this.ghostTimer = null;

        this.ui = null; // Will be set by Game class
        this.game = null; // Will be set by Game class

        // Points per tail segment
        this.pointsPerSegment = 40;
    }

    setMapSpeed(mapSize) {
        const speeds = this.speedSettings[mapSize];
        if (speeds) {
            this.baseSpeed = speeds.baseSpeed;
            this.normalSpeed = this.baseSpeed; // Normal hız referansını güncelle
            this.sprintSpeed = speeds.sprintSpeed;
            this.maxSpeed = speeds.maxSpeed;
        }
    }

    reset(mapWidth, mapHeight) {
        const cellSize = 20;
        this.body = [{
            x: Math.floor(mapWidth / 2 / cellSize) * cellSize,
            y: Math.floor(mapHeight / 2 / cellSize) * cellSize
        }];

        // Determine map size and set appropriate speed
        let mapSize = 'medium';
        if (mapWidth <= 800) mapSize = 'small';
        else if (mapWidth >= 1600) mapSize = 'large';

        this.setMapSpeed(mapSize);

        this.direction = this.initialDirection;
        this.nextDirection = this.initialDirection;
        this.health = 100;
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.canMove = false;
        this.lastMove = null;
        this.lastRenderTime = 0;

        // Reset special features
        this.resetSpecialFeatures();
    }

    increaseSpeed() {
        // Make speed increase more gradual
        const speedReduction = this.speedIncrement * (this.baseSpeed / 64);
        this.baseSpeed = Math.max(this.maxSpeed, this.baseSpeed - speedReduction);
        this.normalSpeed = this.baseSpeed; // Normal hız referansını da güncelle
        this.sprintSpeed = Math.max(this.maxSpeed, this.sprintSpeed - speedReduction);
    }

    grow() {
        // Add new segment at the tail
        const tail = this.body[this.body.length - 1];
        this.body.push({ ...tail });
    }

    shrink() {
        // Only shrink if snake has more than 1 segment
        if (this.body.length > 1) {
            this.body.pop(); // Remove the last segment
        }
    }

    update(currentTime) {
        if (!this.canMove) return false;

        if (!this.lastMove) {
            this.lastMove = currentTime;
            return false;
        }

        const deltaTime = currentTime - this.lastMove;
        if (deltaTime < this.baseSpeed) return false;

        const head = { x: this.body[0].x, y: this.body[0].y };

        switch (this.direction) {
            case 'up': head.y -= this.size; break;
            case 'down': head.y += this.size; break;
            case 'left': head.x -= this.size; break;
            case 'right': head.x += this.size; break;
        }

        this.body.unshift(head);
        this.body.pop();
        this.lastMove = currentTime;
        this.direction = this.nextDirection;

        // Yüksek kare hızı için mikro-zaman ayarlama
        requestAnimationFrame(() => this.microUpdate());

        return true;
    }

    // Daha yüksek kare hızı için ara-güncelleme fonksiyonu
    microUpdate() {
        const now = performance.now();
        if (now - this.lastRenderTime < this.renderInterval) return;
        this.lastRenderTime = now;

        // İhtiyaç olursa ekstra animasyon işlemleri buraya eklenebilir
    }

    draw() {
        // Modify the draw method to handle ghost mode
        if (this.isGhost) {
            this.ctx.globalAlpha = 0.5; // Make snake semi-transparent
        }

        // Add visual effect for sprinting
        if (this.isSprinting) {
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = '#f7a7bf';
        } else {
            this.ctx.shadowBlur = 0;
        }

        // Yılan vücudunu çiz - akıcılık efektleri ile
        this.body.forEach((segment, index) => {
            let segmentX = segment.x;
            let segmentY = segment.y;

            // Hareket yönünde hafif bir görsel efekt ekle - hareket hissini artırır
            if (index === 0 && this.isSprinting) {
                // Sprint durumunda yılan kafasına özel hareket efekti
                const moveEffect = 2;
                switch (this.direction) {
                    case 'up': segmentY += Math.sin(Date.now() / 100) * moveEffect; break;
                    case 'down': segmentY += Math.sin(Date.now() / 100) * moveEffect; break;
                    case 'left': segmentX += Math.sin(Date.now() / 100) * moveEffect; break;
                    case 'right': segmentX += Math.sin(Date.now() / 100) * moveEffect; break;
                }
            }

            if (index === 0) {
                // Draw head
                this.drawHead({ x: segmentX, y: segmentY });
            } else {
                // Draw body segment with subtle pulse effect
                const pulseAmount = 0.5;
                const pulseSpeed = 150;
                const pulse = Math.sin(Date.now() / pulseSpeed + index * 0.2) * pulseAmount;

                // Renkli gövde parçaları
                const baseColor = '#f7c5d4';
                let segmentColor;

                // Segmentlere hafif farklı tonlar ver
                if (index % 3 === 0) {
                    segmentColor = this.adjustColor(baseColor, 5);
                } else if (index % 3 === 1) {
                    segmentColor = this.adjustColor(baseColor, -5);
                } else {
                    segmentColor = baseColor;
                }

                this.ctx.fillStyle = segmentColor;

                // Daha yumuşak görünüm için yuvarlatılmış köşeler
                this.roundRect(
                    segmentX + pulse,
                    segmentY + pulse,
                    this.size - 1 - pulse * 2,
                    this.size - 1 - pulse * 2,
                    3
                );
            }
        });

        this.ctx.shadowBlur = 0; // Reset shadow
        this.ctx.globalAlpha = 1; // Reset transparency
    }

    // Yuvarlatılmış dörtgen çizim fonksiyonu
    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.arcTo(x + width, y, x + width, y + height, radius);
        this.ctx.arcTo(x + width, y + height, x, y + height, radius);
        this.ctx.arcTo(x, y + height, x, y, radius);
        this.ctx.arcTo(x, y, x + width, y, radius);
        this.ctx.closePath();
        this.ctx.fill();
    }

    // Renk ayarla (açıklaştır/koyulaştır)
    adjustColor(hex, percent) {
        // hex to rgb
        let r = parseInt(hex.substring(1, 3), 16);
        let g = parseInt(hex.substring(3, 5), 16);
        let b = parseInt(hex.substring(5, 7), 16);

        // adjust
        r = Math.max(0, Math.min(255, r + percent));
        g = Math.max(0, Math.min(255, g + percent));
        b = Math.max(0, Math.min(255, b + percent));

        // rgb to hex
        return '#' + this.toHex(r) + this.toHex(g) + this.toHex(b);
    }

    toHex(num) {
        const hex = num.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }

    drawHead(head) {
        // Base head color
        this.ctx.fillStyle = '#f7a7bf';
        this.ctx.fillRect(head.x, head.y, this.size - 1, this.size - 1);

        // Calculate eye positions based on direction
        let leftEye, rightEye;
        const eyeSize = 4;
        const eyeOffset = 4;
        const eyeInnerSize = 2;

        switch (this.direction) {
            case 'right':
                leftEye = { x: head.x + this.size - 6, y: head.y + eyeOffset };
                rightEye = { x: head.x + this.size - 6, y: head.y + this.size - eyeOffset - eyeSize };
                break;
            case 'left':
                leftEye = { x: head.x + 2, y: head.y + eyeOffset };
                rightEye = { x: head.x + 2, y: head.y + this.size - eyeOffset - eyeSize };
                break;
            case 'up':
                leftEye = { x: head.x + eyeOffset, y: head.y + 2 };
                rightEye = { x: head.x + this.size - eyeOffset - eyeSize, y: head.y + 2 };
                break;
            case 'down':
                leftEye = { x: head.x + eyeOffset, y: head.y + this.size - 6 };
                rightEye = { x: head.x + this.size - eyeOffset - eyeSize, y: head.y + this.size - 6 };
                break;
        }

        // Draw eyes
        // Eye whites
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(leftEye.x, leftEye.y, eyeSize, eyeSize);
        this.ctx.fillRect(rightEye.x, rightEye.y, eyeSize, eyeSize);

        // Eye pupils
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(leftEye.x + 1, leftEye.y + 1, eyeInnerSize, eyeInnerSize);
        this.ctx.fillRect(rightEye.x + 1, rightEye.y + 1, eyeInnerSize, eyeInnerSize);

        // Draw tongue occasionally
        if (Math.random() < 0.1) { // 10% chance to show tongue each frame
            this.drawTongue(head);
        }
    }

    drawTongue(head) {
        const tongueLength = 6;
        const tongueWidth = 2;
        let startX = head.x;
        let startY = head.y;

        this.ctx.fillStyle = '#ff0000';

        switch (this.direction) {
            case 'right':
                startX = head.x + this.size;
                startY = head.y + (this.size / 2);
                this.ctx.fillRect(startX, startY - tongueWidth / 2, tongueLength, tongueWidth);
                break;
            case 'left':
                startX = head.x - tongueLength;
                startY = head.y + (this.size / 2);
                this.ctx.fillRect(startX, startY - tongueWidth / 2, tongueLength, tongueWidth);
                break;
            case 'up':
                startX = head.x + (this.size / 2);
                startY = head.y - tongueLength;
                this.ctx.fillRect(startX - tongueWidth / 2, startY, tongueWidth, tongueLength);
                break;
            case 'down':
                startX = head.x + (this.size / 2);
                startY = head.y + this.size;
                this.ctx.fillRect(startX - tongueWidth / 2, startY, tongueWidth, tongueLength);
                break;
        }
    }

    setDirection(newDirection) {
        const currentTime = performance.now();
        const timeSinceLastPress = currentTime - this.lastKeyPressTime;

        // Make direction change more responsive
        if (this.direction !== this.getOpposite(newDirection)) {
            this.nextDirection = newDirection;
            // Optionally, update direction immediately if it's safe
            if (this.canChangeDirection(newDirection)) {
                this.direction = newDirection;
            }
        }

        // Check for double press in same direction
        if (timeSinceLastPress < this.doublePressThreshold && newDirection === this.lastDirection) {
            this.startSprint();
        }

        this.lastKeyPressTime = currentTime;
        this.lastDirection = newDirection;
    }

    // Helper method to check if direction change is safe
    canChangeDirection(newDirection) {
        if (!this.body || this.body.length < 2) return true;

        const head = this.body[0];
        const neck = this.body[1];

        switch (newDirection) {
            case 'up': return head.y !== neck.y - this.size;
            case 'down': return head.y !== neck.y + this.size;
            case 'left': return head.x !== neck.x - this.size;
            case 'right': return head.x !== neck.x + this.size;
        }
        return true;
    }

    // Helper method to get opposite direction
    getOpposite(direction) {
        const opposites = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };
        return opposites[direction];
    }

    startSprint() {
        if (this.sprintTimeout) {
            clearTimeout(this.sprintTimeout);
        }

        this.baseSpeed = this.sprintSpeed;
        this.isSprinting = true;

        this.sprintTimeout = setTimeout(() => {
            // Önemli değişiklik: Önceden tanımlanmış normal hıza geri dön (40 gibi sabit bir değer değil)
            this.baseSpeed = this.normalSpeed;
            this.isSprinting = false;
        }, this.sprintDuration);
    }

    checkCollision() {
        const head = this.body[0];

        // Wall collision
        if (head.x < 0 || head.x >= this.mapWidth ||
            head.y < 0 || head.y >= this.mapHeight) {

            // If ghost mode is active, bounce off the wall instead of dying
            if (this.isGhost) {
                // Check which wall was hit and change direction accordingly
                if (head.x < 0) {
                    // Hit left wall, reverse x position and change direction to right
                    head.x = 0;
                    this.direction = 'right';
                    this.nextDirection = 'right';
                } else if (head.x >= this.mapWidth) {
                    // Hit right wall, reverse x position and change direction to left
                    head.x = this.mapWidth - this.size;
                    this.direction = 'left';
                    this.nextDirection = 'left';
                } else if (head.y < 0) {
                    // Hit top wall, reverse y position and change direction to down
                    head.y = 0;
                    this.direction = 'down';
                    this.nextDirection = 'down';
                } else if (head.y >= this.mapHeight) {
                    // Hit bottom wall, reverse y position and change direction to up
                    head.y = this.mapHeight - this.size;
                    this.direction = 'up';
                    this.nextDirection = 'up';
                }

                // Create a bounce visual effect
                this.createBounceEffect();

                // Don't return 'wall' since we handled the collision
                return false;
            }

            return 'wall';
        }

        // Self collision (skip if ghost mode is active)
        if (!this.isGhost) {
            for (let i = 1; i < this.body.length; i++) {
                if (head.x === this.body[i].x && head.y === this.body[i].y) {
                    return 'self';
                }
            }
        }

        return false;
    }

    // Add a method to create visual bounce effect
    createBounceEffect() {
        // Create a flash effect on the snake when bouncing
        const originalAlpha = this.ctx.globalAlpha;
        const originalBlur = this.ctx.shadowBlur;
        const originalColor = this.ctx.shadowColor;

        // Flash effect
        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#95a5a6'; // Ghost color

        // Draw a bounce flash at next frame but reset afterward
        setTimeout(() => {
            this.ctx.globalAlpha = originalAlpha;
            this.ctx.shadowBlur = originalBlur;
            this.ctx.shadowColor = originalColor;
        }, 200);

        // Play bounce sound if game reference exists
        if (this.game && this.game.bounceSound) {
            // Reset sound to start
            this.game.bounceSound.currentTime = 0;
            this.game.bounceSound.play().catch(error => {
                console.log("Audio playback failed:", error);
            });
        }

        // Create floating text to indicate bounce
        if (this.game) {
            const head = this.body[0];
            this.game.showFloatingPoints("SEKME!", head.x, head.y);
        }
    }

    loseLife() {
        this.lives--;
        return this.lives <= 0;
    }

    handleAppleCollision(food) {
        switch (food.type) {
            case 'green':
                this.health = Math.min(100, this.health + 20);
                break;
            case 'red':
                this.health = Math.max(0, this.health - 15);
                break;
        }
        this.grow();
    }

    handleDeath() {
        this.health = 0;
        return true;
    }

    // Add method to start movement
    startMoving() {
        this.canMove = true;
        this.lastMove = null;
    }

    // Add new methods for special effects
    activateDoubleScore() {
        this.doubleScoreActive = true;
        if (this.doubleScoreTimer) clearTimeout(this.doubleScoreTimer);

        const duration = 15000; // 30 seconds

        // Show effect timer with countdown
        if (this.ui) {
            this.ui.showEffectTimer('double-score', duration);
        }

        this.doubleScoreTimer = setTimeout(() => {
            this.doubleScoreActive = false;
        }, duration);
    }

    activateGhostMode() {
        this.isGhost = true;
        if (this.ghostTimer) clearTimeout(this.ghostTimer);

        const duration = 15000; // 15 seconds

        // Show effect timer with countdown
        if (this.ui) {
            this.ui.showEffectTimer('ghost', duration);
        }

        this.ghostTimer = setTimeout(() => {
            this.isGhost = false;
        }, duration);
    }

    activateMagneticMode() {
        this.isMagnetic = true;
        if (this.magneticTimer) clearTimeout(this.magneticTimer);

        const duration = 15000; // 15 seconds

        // Show effect timer with countdown
        if (this.ui) {
            this.ui.showEffectTimer('magnetic', duration);
        }

        this.magneticTimer = setTimeout(() => {
            this.isMagnetic = false;
        }, duration);
    }

    // Add this method to attract food
    attractFood(food) {
        if (this.isMagnetic) {
            const distance = Math.sqrt(
                Math.pow(this.body[0].x - food.position.x, 2) +
                Math.pow(this.body[0].y - food.position.y, 2)
            );

            if (distance < 100) { // Adjust the distance threshold as needed
                const angle = Math.atan2(food.position.y - this.body[0].y, food.position.x - this.body[0].x);
                food.position.x -= Math.cos(angle) * 2; // Move food towards the snake
                food.position.y -= Math.sin(angle) * 2;
            }
        }
    }

    setUI(ui) {
        this.ui = ui;
    }

    resetSpecialFeatures() {
        // Clear double score effect
        if (this.doubleScoreTimer) {
            clearTimeout(this.doubleScoreTimer);
            this.doubleScoreTimer = null;
        }
        this.doubleScoreActive = false;

        // Clear ghost mode effect
        if (this.ghostTimer) {
            clearTimeout(this.ghostTimer);
            this.ghostTimer = null;
        }
        this.isGhost = false;

        // Clear magnetic effect
        if (this.magneticTimer) {
            clearTimeout(this.magneticTimer);
            this.magneticTimer = null;
        }
        this.isMagnetic = false;

        // Reset sprint state
        this.isSprinting = false;
        if (this.sprintTimeout) {
            clearTimeout(this.sprintTimeout);
            this.sprintTimeout = null;
        }

        // Reset visual effects
        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;
    }

    // New method to adjust snake length based on score
    adjustLengthBasedOnScore(score) {
        // Calculate how many segments should be in the tail (excluding head)
        const targetSegments = Math.floor(score / this.pointsPerSegment);

        // Current number of segments (excluding head)
        const currentSegments = this.body.length - 1;

        if (targetSegments > currentSegments) {
            // Grow snake if score increased enough
            for (let i = 0; i < targetSegments - currentSegments; i++) {
                this.grow();
            }
        } else if (targetSegments < currentSegments) {
            // Shrink snake if score decreased enough
            for (let i = 0; i < currentSegments - targetSegments; i++) {
                this.shrink();
            }
        }
    }

    // Add setter for game object
    setGame(game) {
        this.game = game;
    }
} 