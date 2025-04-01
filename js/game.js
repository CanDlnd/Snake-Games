import { MenuManager } from './menu.js';
import { Snake } from './snake.js';
import { Food } from './food.js';
import { Leaderboard } from './leaderboard.js';
import { UI } from './ui.js';

export class Game {

    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.timerElement = document.getElementById('timerDisplay');
        this.startTime = null;
        this.ctx = this.canvas.getContext('2d');

        // Initialize canvas size
        this.canvas.width = 1600;
        this.canvas.height = 900;

        // Initialize UI before other components
        this.ui = new UI(this.canvas);

        // Initialize game objects
        this.initializeGameObjects();

        // Connect UI to Snake
        this.snake.setUI(this.ui);

        // Initialize leaderboard before menu manager
        this.leaderboard = new Leaderboard();

        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.score = 0;
        this.countdownActive = false;
        this.countdownValue = 3;

        // Bind pause handler
        this.handlePause = this.handlePause.bind(this);

        // Get UI elements
        this.scoreElement = document.getElementById('scoreValue');
        this.healthFill = document.getElementById('healthFill');
        this.healthValue = document.getElementById('healthValue');
        this.uiContainer = document.querySelector('.game-ui-container');

        // Initialize menu manager after leaderboard
        this.menuManager = new MenuManager(this);

        // Initialize game
        this.init();

        // Add frame counter
        this.frameCount = 0;

        // Initialize sounds with correct paths
        this.deathSound = new Audio('./sounds/death-sounds.mp3');
        this.eatSound = new Audio('./sounds/eat-apple.mp3');
        this.clickSound = new Audio('./sounds/click-button.wav');
        this.bounceSound = new Audio('./sounds/bounce.mp3'); // Add bounce sound (create this file)

        // Replace blockInterval with block spawn times
        this.lastBlockSpawnTime = 0;
        this.blockSpawnInterval = 15; // Spawn blocks every 15 seconds

        this.remainingPasses = 3;
        this.passElements = document.querySelectorAll('.pass');

        // Add map size configurations
        this.mapSizes = {
            small: { width: 800, height: 450 },
            medium: { width: 1200, height: 675 },
            large: { width: 1600, height: 900 }
        };

        // Add property to store current map size
        this.currentMapSize = 'medium';

        // Add a property to store bombs
        this.bombs = [];

        // Update the block spawn interval to include bombs
        this.bombSpawnInterval = 20; // Spawn bombs every 20 seconds
        this.lastBombSpawnTime = 0; // Track the last bomb spawn time
    }

    initializeGameObjects() {
        const cellSize = 20; // Define cell size
        this.snake = new Snake(this.canvas);
        this.snake.setGame(this); // Pass game reference to snake
        this.food = new Food(this.canvas, cellSize);
        this.blocks = [];
    }

    init() {
        window.addEventListener('resize', () => this.handleResize());
        this.handleResize();
        this.setupControls();

        // Add ESC key listener
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isRunning) {
                this.handlePause();
            }
        });

        // Make sure canvas is hidden initially
        this.canvas.classList.add('hidden');
    }
    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.isRunning || this.isPaused) return;

            const key = e.key.toLowerCase(); // Tuşu küçük harfe dönüştür

            switch (key) {
                case 'arrowup':
                case 'w':
                    this.snake.setDirection('up');
                    break;
                case 'arrowdown':
                case 's':
                    this.snake.setDirection('down');
                    break;
                case 'arrowleft':
                case 'a':
                    this.snake.setDirection('left');
                    break;
                case 'arrowright':
                case 'd':
                    this.snake.setDirection('right');
                    break;
            }
        });
    }


    handleResize() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight - 100;

        const canvasRatio = this.canvas.width / this.canvas.height;
        let width = containerWidth;
        let height = width / canvasRatio;

        if (height > containerHeight) {
            height = containerHeight;
            width = height * canvasRatio;
        }

        // Check if we're on macOS Safari by looking for exclusive Safari features
        const isMacSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

        // Add a small additional buffer for MacBooks to avoid scrollbars
        if (isMacSafari) {
            width *= 0.98;
            height *= 0.98;
        }

        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;

        // Force pixel perfection on Retina displays
        if (window.devicePixelRatio > 1) {
            this.ctx.imageSmoothingEnabled = false;
        }
    }

    async start(mapSize = 'medium') {
        // Reset everything before starting
        this.reset();

        this.currentMapSize = mapSize;

        // Set canvas size based on selected map
        const size = this.mapSizes[mapSize];
        this.canvas.width = size.width;
        this.canvas.height = size.height;

        // Set snake speed based on map size
        this.snake.setMapSpeed(mapSize);

        // Adjust block spawn interval based on map size
        switch (mapSize) {
            case 'small':
                this.blockSpawnInterval = 20;
                break;
            case 'medium':
                this.blockSpawnInterval = 15;
                break;
            case 'large':
                this.blockSpawnInterval = 10;
                break;
        }

        // Reset game state
        this.isRunning = false;
        this.isPaused = false;
        this.ui.score = 0;
        this.frameCount = 0;
        this.blocks = [];
        this.lastBlockSpawnTime = 0;

        // Reset snake position based on new map size
        this.snake.reset(size.width, size.height);

        // Show game elements
        this.canvas.classList.remove('hidden');
        this.uiContainer.classList.add('visible');

        // Reset and prepare timer
        this.ui.resetTimer();

        // Start game loop but keep snake stationary
        this.isRunning = true;
        requestAnimationFrame((time) => this.gameLoop(time));

        // Wait for round start and countdown
        await this.showRoundStart();

        // Start snake movement after countdown
        this.snake.startMoving();

        // Spawn food after countdown
        this.food.spawn(this.snake);

        // Start the timer
        this.ui.startTimer();
        this.remainingPasses = 3;
        this.updatePasses();
    }

    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.ui.score = 0;
        this.blocks = [];
        this.lastBlockSpawnTime = 0;  // Reset block spawn timer

        // Reset snake and special features
        this.snake.reset(this.canvas.width, this.canvas.height);

        // Ensure snake starts with just the head (length of 1)
        this.snake.body = this.snake.body.slice(0, 1);

        // Reset food
        this.food.reset();  // Call the reset method first
        this.food.spawn(this.snake);

        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.canvas.classList.add('hidden');
        this.uiContainer.classList.remove('visible');

        // Reset UI elements
        this.ui.resetTimer();
        this.ui.clearEffectTimers();

        // Reset remaining passes
        this.remainingPasses = 3;
        this.updatePasses();

        // Make sure snake is stationary
        this.snake.canMove = false;
    }

    gameOver(reason) {
        this.isRunning = false;
        this.startTime = null;

        // Stop the timer at the time of death
        this.ui.pauseTimer();

        // Clear all active effects immediately
        this.ui.clearEffectTimers();
        this.snake.resetSpecialFeatures();

        this.deathSound.play().catch(error => {
            console.log("Audio playback failed:", error);
        });

        let deathMessage = '';
        switch (reason) {
            case 'wall': deathMessage = 'Duvara çarptın!'; break;
            case 'self': deathMessage = 'Kendi kuyruğuna çarptın!'; break;
            case 'health': deathMessage = 'Sağlık tükendi!'; break;
            case 'block': deathMessage = 'Bir engelle çarpıştın!'; break;
            case 'passes': deathMessage = 'Çok fazla yemek kaçırdın!'; break;
            case 'bomb': deathMessage = 'Bomba patladı!'; break;
        }

        // Add score to leaderboard and get rank
        const isHighScore = this.leaderboard.isHighScore(this.ui.score);
        if (isHighScore) {
            const rank = this.leaderboard.addScore(this.ui.score);
            deathMessage += ` Yeni yüksek skor! (${rank}. sıra)`;
        }

        this.menuManager.showGameOver(
            this.ui.score,
            deathMessage,
            this.leaderboard.getHighScores()
        );
    }

    handlePause() {
        if (this.countdownActive) return;

        if (this.isPaused) {
            this.menuManager.hideAllMenus();
            this.startCountdown();
        } else {
            this.pause();
            this.menuManager.showPauseMenu();
        }
    }

    startCountdown() {
        this.countdownActive = true;
        this.countdownValue = 3;

        // Create and style countdown element
        const countdownEl = document.createElement('div');
        countdownEl.className = 'countdown';
        document.body.appendChild(countdownEl);

        const countdown = () => {
            if (this.countdownValue > 0) {
                countdownEl.textContent = this.countdownValue;
                this.countdownValue--;
                setTimeout(countdown, 1000);
            } else {
                countdownEl.remove();
                this.countdownActive = false;
                this.resume();
            }
        };

        countdown();
    }

    resume() {
        if (!this.countdownActive) {
            this.isPaused = false;
            this.ui.resumeTimer();
            this.food.resume();
            this.menuManager.hideAllMenus();
            requestAnimationFrame((time) => this.gameLoop(time));
        }
    }

    pause() {
        this.isPaused = true;
        this.ui.pauseTimer();
        this.food.pause();
    }

    addBlock() {
        const blockSize = 20; // Blok boyutu
        let blockX, blockY;

        do {
            blockX = Math.floor(Math.random() * (this.canvas.width / blockSize)) * blockSize;
            blockY = Math.floor(Math.random() * (this.canvas.height / blockSize)) * blockSize;
        } while (
            this.snake.body.some(segment => segment.x === blockX && segment.y === blockY) ||
            this.blocks.some(block => block.x === blockX && block.y === blockY)
        );

        // Yeni blok koordinatlarını ekle
        this.blocks.push({ x: blockX, y: blockY });
    }

    drawBlocks() {
        this.ctx.fillStyle = 'black';
        this.blocks.forEach(block => {
            // Add ghostly effect to blocks when snake is in ghost mode
            if (this.snake.isGhost) {
                this.ctx.globalAlpha = 0.5;
                this.ctx.shadowColor = '#95a5a6';
                this.ctx.shadowBlur = 10;
            }

            this.ctx.fillRect(block.x, block.y, 20, 20);

            // Reset effects
            this.ctx.globalAlpha = 1;
            this.ctx.shadowBlur = 0;
        });
    }

    gameLoop(currentTime) {
        if (!this.isRunning || this.isPaused) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBackground();

        // Check for block and bomb spawning
        this.checkBlockSpawn();
        this.checkBombSpawn(); // Check for bomb spawning

        this.drawBlocks();
        this.drawBombs(); // Draw bombs on the canvas
        this.snake.draw(this.ctx);

        // Attract food if magnetic mode is active
        this.snake.attractFood(this.food);

        // Check if food has expired
        if (this.food.isExpired()) {
            // Only decrease passes for regular food items
            if (!this.food.isSpecialItem) {
                this.remainingPasses--;
                this.updatePasses();

                if (this.remainingPasses <= 0) {
                    this.gameOver('passes');
                    return;
                }
            }

            // Spawn new food
            this.food.spawn(this.snake);
        }

        this.food.draw(currentTime);

        // Replace this.updateUI() with UI updates
        if (this.scoreElement) {
            this.scoreElement.textContent = this.ui.score;

            // Make sure snake length always matches score
            this.snake.adjustLengthBasedOnScore(this.ui.score);
        }

        // Update health bar
        if (this.healthFill && this.healthValue) {
            const health = this.snake.health;
            this.healthFill.style.width = `${health}%`;
            this.healthValue.textContent = `${Math.round(health)}%`;

            // Add/remove low health class
            if (health <= 25) {
                this.healthFill.classList.add('low');
            } else {
                this.healthFill.classList.remove('low');
            }
        }

        const head = this.snake.body[0];

        // Check block collisions (only if not in ghost mode)
        if (!this.snake.isGhost) {
            this.blocks.forEach(block => {
                if (head.x === block.x && head.y === block.y) {
                    this.gameOver('block');
                }
            });
        }

        if (this.snake.update(currentTime)) {
            const collisionType = this.snake.checkCollision();
            if (collisionType) {
                this.gameOver(collisionType);
                return;
            }

            const foodX = Math.floor(this.food.position.x / this.snake.size) * this.snake.size;
            const foodY = Math.floor(this.food.position.y / this.snake.size) * this.snake.size;

            // Check for food consumption
            if (head.x === foodX && head.y === foodY) {
                if (this.food.isSpecialItem) {
                    switch (this.food.type) {
                        case 'double_score':
                            this.snake.activateDoubleScore();
                            this.showFloatingPoints("2X PUAN!", foodX, foodY);
                            break;
                        case 'extra_life':
                            this.remainingPasses++;
                            this.updatePasses();
                            this.showFloatingPoints("+1 YEM HAKKI", foodX, foodY);
                            break;
                        case 'ghost':
                            this.snake.activateGhostMode();
                            this.showFloatingPoints("HAYALET MODU!", foodX, foodY);
                            break;
                        case 'magnetic':
                            this.snake.activateMagneticMode();
                            this.showFloatingPoints("MANYETIK MODU!", foodX, foodY);
                            break;
                    }

                    // Special effect sound
                    this.eatSound.play().catch(error => {
                        console.log("Audio playback failed:", error);
                    });

                    // Special items might affect score indirectly, so adjust length
                    this.snake.adjustLengthBasedOnScore(this.ui.score);
                } else {
                    // Handle regular food types
                    switch (this.food.type) {
                        case 'regular':
                            this.showFloatingPoints("-25", foodX, foodY);
                            break;
                        case 'green':
                            this.showFloatingPoints("+5", foodX, foodY);
                            break;
                        case 'yellow':
                            const points = this.snake.doubleScoreActive ? "+40" : "+20";
                            this.showFloatingPoints(points, foodX, foodY);
                            break;
                    }
                    this.handleFoodEffect(this.food.type);
                }
                this.food.spawn(this.snake); // Spawn new food immediately
            }
        }

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    showFloatingPoints(text, x, y) {
        const floatingText = document.createElement('div');
        floatingText.className = 'floating-points';
        floatingText.textContent = text;

        // Canvas koordinatlarını sayfa koordinatlarına dönüştür
        const rect = this.canvas.getBoundingClientRect();
        floatingText.style.left = `${rect.left + x}px`;
        floatingText.style.top = `${rect.top + y}px`;

        document.body.appendChild(floatingText);

        // Animasyon bittikten sonra elemanı kaldır
        setTimeout(() => {
            floatingText.remove();
        }, 1000); // 1 saniye sonra kaldır
    }

    drawBackground() {
        // Draw grass pattern
        this.ctx.fillStyle = '#e8ded2';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Grid pattern
        this.ctx.strokeStyle = '#ccc4b9';
        this.ctx.lineWidth = 0.5; // Thinner grid lines

        // Draw vertical lines
        for (let x = 0; x < this.canvas.width; x += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // Draw horizontal lines
        for (let y = 0; y < this.canvas.height; y += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawUI() {
        if (!this.isRunning) return;

        // Draw semi-transparent background for UI elements
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 200, 30); // Score background
        this.ctx.fillRect(this.canvas.width - 210, 10, 200, 30); // Health background

        // Score
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillText(`Puan: ${this.score}`, 20, 32);

        // Health bar
        const healthBarWidth = 150;
        const healthBarHeight = 20;
        const healthBarX = this.canvas.width - 200;
        const healthBarY = 15;

        // Health bar background
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

        // Current health
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.fillRect(
            healthBarX,
            healthBarY,
            healthBarWidth * (this.snake.health / 100),
            healthBarHeight
        );

        // Health text
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(
            `${Math.round(this.snake.health)}%`,
            healthBarX + healthBarWidth + 10,
            healthBarY + 15
        );
    }

    handleFoodEffect(foodType) {
        this.eatSound.play().catch(error => {
            console.log("Audio playback failed:", error);
        });

        const scoreMultiplier = this.snake.doubleScoreActive ? 2 : 1;

        switch (foodType) {
            case 'regular':
                this.ui.score -= 25 * scoreMultiplier;
                const damage = 25;
                this.snake.health = Math.max(0, this.snake.health - damage);
                if (this.snake.health <= 0) {
                    this.gameOver('health');
                    return;
                }
                // Adjust snake length based on updated score
                this.snake.adjustLengthBasedOnScore(this.ui.score);
                break;
            case 'green':
                this.ui.score += 5 * scoreMultiplier;
                this.snake.health = Math.min(100, this.snake.health + 20);
                // Adjust snake length based on updated score
                this.snake.adjustLengthBasedOnScore(this.ui.score);
                break;
            case 'yellow':
                this.ui.score += 20 * scoreMultiplier;
                // Adjust snake length based on updated score
                this.snake.adjustLengthBasedOnScore(this.ui.score);
                break;
        }
    }

    togglePause() {
        if (this.isPaused) {
            this.isPaused = false;
            this.ui.resumeTimer();
            // ... other resume logic ...
        } else {
            this.isPaused = true;
            this.ui.pauseTimer();
            // ... other pause logic ...
        }
    }

    update() {
        if (this.gameState !== 'playing') return;

        // Add this check for expired food
        if (this.food.isExpired()) {
            this.food.resetPosition();
        }

        // ... rest of the update logic ...
    }

    checkBlockSpawn() {
        const currentGameTime = this.ui.getGameTimeInSeconds();

        // Check if it's time to spawn a new block
        if (currentGameTime >= this.lastBlockSpawnTime + this.blockSpawnInterval) {
            this.addBlock();
            this.lastBlockSpawnTime = Math.floor(currentGameTime / this.blockSpawnInterval) * this.blockSpawnInterval;
        }
    }

    playClickSound() {
        this.clickSound.currentTime = 0; // Reset sound to start
        this.clickSound.play().catch(error => {
            console.log("Audio playback failed:", error);
        });
    }

    updatePasses() {
        this.passElements.forEach((pass, index) => {
            if (index < this.remainingPasses) {
                pass.classList.remove('lost');
            } else {
                pass.classList.add('lost');
            }
        });
    }

    startTransition() {
        return new Promise(resolve => {
            // Create transition element
            const transition = document.createElement('div');
            transition.className = 'game-transition';

            // Create expanding circle
            const circle = document.createElement('div');
            circle.className = 'circle';

            transition.appendChild(circle);
            document.body.appendChild(transition);

            // Start transition
            requestAnimationFrame(() => {
                transition.classList.add('active');
            });

            // Remove transition after animation
            setTimeout(() => {
                transition.remove();
                resolve();
            }, 1500); // Match this with animation duration
        });
    }

    showRoundStart() {
        return new Promise(resolve => {
            const roundStart = document.createElement('div');
            roundStart.className = 'round-start';
            roundStart.innerHTML = '<h2>Round Start</h2>';
            document.body.appendChild(roundStart);

            // Show "Round Start" for 1.5 seconds
            setTimeout(() => {
                roundStart.remove();
                this.startInitialCountdown(resolve);
            }, 1500);  // Reduced from 2000ms to 1500ms for better pacing
        });
    }

    startInitialCountdown(resolve) {
        let count = 3;
        const countdownElement = document.createElement('div');
        countdownElement.className = 'round-start';
        document.body.appendChild(countdownElement);

        const updateCount = () => {
            if (count >= 0) {
                countdownElement.innerHTML = `<div class="countdown-number">${count || 'GO!'}</div>`;

                if (count === 0) {
                    // Remove countdown and resolve after showing "GO!"
                    setTimeout(() => {
                        countdownElement.remove();
                        resolve();
                    }, 1000);
                } else {
                    count--;
                    setTimeout(updateCount, 1000);
                }
            }
        };

        updateCount();
    }

    // Add method to restart with current map size
    async restart() {
        await this.start(this.currentMapSize);
    }

    // Add bomb spawning logic in the game loop
    checkBombSpawn() {
        const currentGameTime = this.ui.getGameTimeInSeconds();

        // Check if it's time to spawn a new bomb
        if (currentGameTime >= this.lastBombSpawnTime + this.bombSpawnInterval) {
            this.addBomb();
            this.lastBombSpawnTime = currentGameTime;
        }
    }

    // Add a method to create a bomb
    addBomb() {
        const bombX = Math.floor(Math.random() * (this.canvas.width / 1)) * 1;
        const bombY = Math.floor(Math.random() * (this.canvas.height / 1)) * 1;

        // Add bomb coordinates to the bombs array
        this.bombs.push({ x: bombX, y: bombY });

        // Set a timeout for the bomb explosion
        setTimeout(() => {
            this.explodeBomb(bombX, bombY);
        }, 3000); // Explode after 3 seconds
    }

    // Handle bomb explosion
    explodeBomb(bombX, bombY) {
        // Check if the snake is within the explosion area (4x4 pixels)
        const head = this.snake.body[0];
        if (head.x >= bombX && head.x < bombX + 4 && head.y >= bombY && head.y < bombY + 4) {
            this.gameOver('bomb'); // End the game if the snake is in the explosion area
        }
    }

    // Add a method to draw bombs
    drawBombs() {
        this.ctx.fillStyle = 'red'; // Color for the bomb
        this.bombs.forEach(bomb => {
            this.ctx.fillRect(bomb.x, bomb.y, 1, 1); // Draw the bomb as a 1x1 pixel
        });
    }

}

// Initialize the game when the window loads
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});









