export class MenuManager {
    constructor(game) {
        this.game = game;
        this.canvas = document.getElementById('gameCanvas');
        this.hasPlayedIntro = false;
        this.menuHistory = [];
        this.currentMenu = null;

        // Wait for game to be fully initialized before showing menu
        requestAnimationFrame(() => {
            this.showMainMenu();
            this.initializeController();
            this.initializeMenuListeners();
        });

        // Add how to play content
        this.howToPlayContent = `
            <h2>How to Play</h2>
            <div class="controls-info">
                <p>Yılanı kontrol etmek için yön tuşlarını kullanın:</p>
                <p>↑ Yukarı | ↓ Aşağı | ← Sol | → Sağ</p>
                <p>Duraklatmak için ESC tuşuna basın</p>
                <p>Aynı yöne iki kez hızlıca basarak koşabilirsiniz</p>
            </div>
            <div class="apples-info">
                <h3>Yem Türleri:</h3>
                <div class="apple-info">
                    <div class="apple-item">
                        <span class="apple yellow"></span>
                        <p>Sarı Elma: +20 puan kazanırsınız</p>
                    </div>
                    <div class="apple-item">
                        <span class="apple green"></span>
                        <p>Yeşil Elma: +5 puan ve +20 can</p>
                    </div>
                    <div class="apple-item">
                        <span class="apple red"></span>
                        <p>Kırmızı Elma: -25 puan ve -25 can</p>
                    </div>
                </div>
            </div>
            <div class="special-food-info">
                <h3>Özel Yemler:</h3>
                <div class="special-item">
                    <span class="special-food double-score"></span>
                    <p>2X Skor: Puanlarınız ikiye katlanır</p>
                </div>
                <div class="special-item">
                    <span class="special-food ghost"></span>
                    <p>Hayalet Modu: Engellerden geçebilir ve duvarlara çarptığınızda geri sekersiniz</p>
                </div>
                <div class="special-item">
                    <span class="special-food extra-life"></span>
                    <p>Ekstra Hak: Bir yem hakkı kazanırsınız</p>
                </div>
                <div class="special-item">
                    <span class="special-food magnetic"></span>
                    <p>Manyetik Mod: Yemleri kendinize çekersiniz</p>
                </div>
            </div>
        `;
    }

    initializeController() {
        // Add event listener to back button
        this.addBackButtonListener();
    }

    // Add this new method to handle back button functionality
    addBackButtonListener() {
        const backButton = document.querySelector('.back-button');
        if (backButton) {
            backButton.addEventListener('click', () => {
                this.hideController();
                this.showMainMenu();
            });
        }
    }

    hideController() {
        const controller = document.querySelector('.controller');
        if (controller) {
            controller.classList.remove('visible');
            controller.style.display = 'none';
        }
    }

    showController() {
        this.hideAllMenus();
        const controller = document.querySelector('.controller');
        if (controller) {
            controller.innerHTML = `
                <div class="controller-content">
                    <h2>Kontroller</h2>
                    
                    <div class="controls-section">
                        <h3>Hareket Tuşları</h3>
                        <div class="key-container">
                            <div class="key-group">
                                <div class="key-label">WASD Tuşları</div>
                                <div class="key-row">
                                    <div class="key-indicator">W</div>
                                </div>
                                <div class="key-row">
                                    <div class="key-indicator">A</div>
                                    <div class="key-indicator">S</div>
                                    <div class="key-indicator">D</div>
                                </div>
                            </div>
                            
                            <div class="key-group">
                                <div class="key-label">Yön Tuşları</div>
                                <div class="key-row">
                                    <div class="key-indicator">↑</div>
                                </div>
                                <div class="key-row">
                                    <div class="key-indicator">←</div>
                                    <div class="key-indicator">↓</div>
                                    <div class="key-indicator">→</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="controls-section">
                        <h3>Oyun Kontrolleri</h3>
                        <div class="control-item">
                            <div class="key-indicator">ESC</div>
                            <span class="control-text">Oyunu Duraklat</span>
                        </div>
                    </div>
                </div>
                <button class="back-button">GERİ</button>
            `;

            controller.classList.add('visible');
            controller.style.display = 'flex';

            this.addClickSoundsToButtons();
            this.addBackButtonListener();
        }
    }

    hideAllMenus() {
        const existingMenus = document.querySelectorAll('.menu');
        existingMenus.forEach(menu => menu.remove());
    }

    showMainMenu() {
        this.hideAllMenus();
        this.hideController();

        const mainMenu = document.createElement('div');
        mainMenu.className = 'menu main-menu';

        mainMenu.innerHTML = `
            <div class="logo-container ${!this.hasPlayedIntro ? 'animate-in' : ''}">
                <img src="logo.png" alt="Pixel Serpent: Yem Avı" class="game-logo">
            </div>
            <div class="button-container ${!this.hasPlayedIntro ? 'first-load' : ''}">
                <button class="menu-button" id="startGame">Oyuna Başla</button>
                <button class="menu-button" id="showHighScores">Yüksek Skorlar</button>
                <button class="menu-button" id="showInfo">Nasıl Oynanır?</button>
                <button class="menu-button" id="showControls">Kontroller</button>
                <button class="menu-button exit-button" id="exitGame">Çıkış</button>
            </div>
        `;

        document.body.appendChild(mainMenu);
        this.menuHistory = [];
        this.pushMenu('mainMenu', mainMenu);
        this.addClickSoundsToButtons();

        if (!this.hasPlayedIntro) {
            requestAnimationFrame(() => {
                setTimeout(() => {
                    mainMenu.classList.add('frame-animate');
                }, 1000);
            });

            setTimeout(() => {
                this.initializeMenuListeners();
            }, 2200);

            this.hasPlayedIntro = true;
        } else {
            this.initializeMenuListeners();
        }
    }

    showInfoMenu() {
        this.hideAllMenus();
        const infoMenu = document.createElement('div');
        infoMenu.className = 'menu info-menu';
        infoMenu.innerHTML = `
          
            <h2>Nasıl Oynanır?</h2>
            <div class="info-content">
                <section class="info-section">
                    <h3>Oyun Hakkında</h3>
                    <p>Bu yılan oyununda amacınız, yemi yiyerek skorunuzu artırmak ve yılanınızı büyütmektir. Her 40 puan, yılanınızın kuyruğuna 1 segment ekler.</p>
                </section>
                
                <section class="info-section">
                    <h3>Yemler</h3>
                    <div class="apple-info">
                        <div class="apple-item">
                            <span class="apple yellow"></span>
                            <p>Sarı Elma: +20 puan kazanırsınız (2X etkinken +40 puan)</p>
                        </div>
                        <div class="apple-item">
                            <span class="apple green"></span>
                            <p>Yeşil Elma: +5 puan ve +20 can kazanırsınız</p>
                        </div>
                        <div class="apple-item">
                            <span class="apple red"></span>
                            <p>Kırmızı Elma: -25 puan ve -25 can kaybedersiniz</p>
                        </div>
                    </div>
                </section>

                <section class="info-section">
                    <h3>Özel Yemler</h3>
                    <div class="special-food-info">
                        <div class="special-item">
                            <span class="special-food double-score"></span>
                            <p><strong>2X Skor:</strong> 15 saniye boyunca tüm puanlarınız ikiye katlanır</p>
                        </div>
                        <div class="special-item">
                            <span class="special-food ghost"></span>
                            <p><strong>Hayalet Modu:</strong> 15 saniye boyunca duvarlardan ve engellarden geçebilirsiniz. Duvara çarptığınızda geri sekersiniz!</p>
                        </div>
                        <div class="special-item">
                            <span class="special-food extra-life"></span>
                            <p><strong>Ekstra Hak:</strong> Bir yem hakkı kazanırsınız</p>
                        </div>
                        <div class="special-item">
                            <span class="special-food magnetic"></span>
                            <p><strong>Manyetik Mod:</strong> 15 saniye boyunca yakındaki yemleri kendinize çekersiniz</p>
                        </div>
                    </div>
                </section>

                <section class="info-section">
                    <h3>Zorluklar</h3>
                    <div class="challenges-info">
                        <ul>
                            <li>Her 15 saniyede bir siyah engeller oluşur. Bunlara çarpmak oyunun bitmesine neden olur.</li>
                            <li>Her 20 saniyede bir bombalar oluşur. Patlama alanında bulunmak oyunun bitmesine neden olur.</li>
                            <li>Yemlerin süresi dolmadan yemezseniz, yem hakkınız azalır. Tüm haklarınızı kaybettiğinizde oyun sona erer.</li>
                            <li>Yılan kendine veya duvarlara çarptığında oyun biter (Hayalet modu aktif değilse).</li>
                            <li>Canınız 0'a düştüğünde oyun sona erer.</li>
                        </ul>
                    </div>
                </section>

                <section class="info-section">
                    <h3>İpuçları</h3>
                    <div class="tips-info">
                        <ul>
                            <li>Aynı yön tuşuna iki kez hızlıca basarak kısa süreli koşabilirsiniz.</li>
                            <li>Her 40 puan, yılanınızın uzunluğunu 1 segment artırır.</li>
                            <li>Kırmızı elmalardan mümkün olduğunca kaçının, bunlar hem canınızı hem de skorunuzu azaltır.</li>
                            <li>Özel yemler parlak ve soru işareti ile gösterilir, bunları kaçırmayın!</li>
                        </ul>
                    </div>
                </section>
            </div>
            <button class="menu-button" id="backFromInfo" style="opacity: 1;">Geri</button>
        `;

        document.body.appendChild(infoMenu);
        this.addClickSoundsToButtons();

        document.getElementById('backFromInfo').addEventListener('click', () => {
            infoMenu.remove();
            this.showMainMenu();
        });
    }

    showControlsMenu() {
        this.hideAllMenus();
        const controlsMenu = document.createElement('div');
        controlsMenu.className = 'menu controls-menu';
        controlsMenu.innerHTML = `
            <h2>Kontroller</h2>
            <div class="controls-content">
                <div class="control-item">
                    <span class="key-group">↑ ↓ ← →</span>
                    <p>Yılanı yönlendir</p>
                </div>
                <div class="control-item">
                    <span class="key">ESC</span>
                    <p>Oyunu duraklat</p>
                </div>
            </div>
            <button class="menu-button" id="backFromControls">Geri</button>
        `;

        document.body.appendChild(controlsMenu);
        this.addClickSoundsToButtons();

        document.getElementById('backFromControls').addEventListener('click', () => {
            controlsMenu.remove();
            this.showMainMenu();
        });
    }

    showGameOver(score, deathMessage, highScores) {
        this.hideAllMenus();
        const gameOverMenu = document.createElement('div');
        gameOverMenu.className = 'menu game-over';

        // Add the score and get the achievement message
        const achievementMessage = this.game.leaderboard.addScore(score);

        // Create leaderboard HTML
        const leaderboardHTML = highScores.map((entry, index) => `
            <div class="leaderboard-entry ${score === entry.score ? 'current-score' : ''}">
                <span class="rank">#${index + 1}</span>
                <span class="score">${entry.score}</span>
                <span class="date">${entry.date}</span>
            </div>
        `).join('');

        gameOverMenu.innerHTML = `
          
            <h2>Oyun Bitti!</h2>
            <p class="death-message">${deathMessage}</p>
            <p>Skorun: <span id="finalScore">${score}</span></p>
          
            <div class="button-container">
                <button class="menu-button" id="playAgain">Yeniden Oyna</button>
                <button class="menu-button" id="changeMap">Harita Değiştir</button>
                <button class="menu-button" id="backToMenu">Ana Menü</button>
            </div>
        `;

        document.body.appendChild(gameOverMenu);
        this.pushMenu('gameOver', gameOverMenu);
        this.addClickSoundsToButtons();

        // Update play again handler
        document.getElementById('playAgain').addEventListener('click', () => {
            this.hideAllMenus();
            this.game.restart();  // Use the restart method to keep the same map
        });

        // Add change map handler
        document.getElementById('changeMap').addEventListener('click', () => {
            // Store only game over as previous menu
            this.menuHistory = [{
                name: 'gameOver',
                element: gameOverMenu,
                state: {
                    score: score,
                    deathMessage: deathMessage,
                    highScores: highScores
                }
            }];
            this.showMapSelection();
        });

        document.getElementById('backToMenu').addEventListener('click', () => {
            this.hideAllMenus();
            this.game.reset();
            this.showMainMenu();
        });
    }

    showPauseMenu() {
        this.hideAllMenus();
        const pauseMenu = document.createElement('div');
        pauseMenu.className = 'menu pause-menu';
        pauseMenu.innerHTML = `
          
            <h2>Oyun Duraklatıldı</h2>
            <div class="button-container">
                <button class="menu-button" id="resumeGame">Devam Et</button>
                <button class="menu-button" id="restartGame">Yeniden Başlat</button>
                <button class="menu-button" id="exitToMenu">Ana Menü</button>
            </div>
        `;

        document.body.appendChild(pauseMenu);
        this.addClickSoundsToButtons();

        document.getElementById('resumeGame').addEventListener('click', () => {
            if (!this.game.countdownActive) {
                this.hideAllMenus();
                this.game.startCountdown();
            }
        });

        // Add restart button handler
        document.getElementById('restartGame').addEventListener('click', async () => {
            this.hideAllMenus();
            await this.game.restart();
        });

        document.getElementById('exitToMenu').addEventListener('click', () => {
            this.hideAllMenus();
            this.game.reset();
            this.showMainMenu();
        });
    }

    showHighScores() {
        this.hideAllMenus();
        const highScoresMenu = document.createElement('div');
        highScoresMenu.className = 'menu high-scores-menu';

        const highScores = this.game.leaderboard.getHighScores();
        const leaderboardHTML = highScores.length > 0 ? `
            <div class="leaderboard">
                <div class="leaderboard-entries">
                    ${highScores.map((entry, index) => `
                        <div class="leaderboard-entry">
                            <span class="rank">#${index + 1}</span>
                            <span class="score">${entry.score}</span>
                            <span class="date">${entry.date}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : '<p>Henüz yüksek skor yok!</p>';

        highScoresMenu.innerHTML = `
          
            <h2>Yüksek Skorlar</h2>
            ${leaderboardHTML}
            <button class="menu-button" id="backFromHighScores">Geri</button>
        `;

        document.body.appendChild(highScoresMenu);
        this.addClickSoundsToButtons();

        document.getElementById('backFromHighScores').addEventListener('click', () => {
            highScoresMenu.remove();
            this.showMainMenu();
        });
    }

    showMapSelection() {
        this.hideAllMenus();
        const mapMenu = document.createElement('div');
        mapMenu.className = 'menu map-selection';
        mapMenu.innerHTML = `
          
            <h2>Harita Boyutu Seç</h2>
            <div class="map-options">
                <div class="map-option ${this.game.currentMapSize === 'small' ? 'active' : ''}" data-size="small">
                    <h3>Küçük Harita</h3>
                    <p>800 x 450</p>
                </div>
                <div class="map-option ${this.game.currentMapSize === 'medium' ? 'active' : ''}" data-size="medium">
                    <h3>Orta Harita</h3>
                    <p>1200 x 675</p>
                </div>
                <div class="map-option ${this.game.currentMapSize === 'large' ? 'active' : ''}" data-size="large">
                    <h3>Büyük Harita</h3>
                    <p>1600 x 900</p>
                </div>
            </div>
            <div class="map-selection-buttons">
                <button class="menu-button" id="startSelectedMap" disabled>Oyunu Başlat</button>
                <button class="menu-button" id="backFromMapSelection">Geri</button>
            </div>
        `;

        document.body.appendChild(mapMenu);
        this.pushMenu('mapSelection', mapMenu);
        this.addClickSoundsToButtons();

        const startButton = document.getElementById('startSelectedMap');

        // Add click handlers for map options
        const mapOptions = mapMenu.querySelectorAll('.map-option');
        mapOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove active class from all options
                mapOptions.forEach(opt => opt.classList.remove('active'));
                // Add active class to clicked option
                option.classList.add('active');
                // Enable start button
                startButton.removeAttribute('disabled');
                // Store selected size
                this.selectedMapSize = option.dataset.size;
            });
        });

        // Add click handler for start button
        startButton.addEventListener('click', async () => {
            if (this.selectedMapSize) {
                this.hideAllMenus();
                this.hideController();
                await this.game.startTransition();
                this.canvas.classList.remove('hidden');
                await this.game.start(this.selectedMapSize);
            }
        });

        document.getElementById('backFromMapSelection').addEventListener('click', () => {
            this.handleBack();
        });
    }

    initializeMenuListeners() {
        const startGame = document.getElementById('startGame');
        const showHighScores = document.getElementById('showHighScores');
        const showInfo = document.getElementById('showInfo');
        const showControls = document.getElementById('showControls');
        const exitGame = document.getElementById('exitGame');

        if (startGame) {
            startGame.addEventListener('click', () => {
                this.showMapSelection(); // Show map selection instead of starting game directly
            });
        }

        if (showHighScores) {
            showHighScores.addEventListener('click', () => {
                this.showHighScores();
            });
        }

        if (showInfo) {
            showInfo.addEventListener('click', () => {
                this.hideController();
                this.showInfoMenu();
            });
        }

        if (showControls) {
            showControls.addEventListener('click', () => {
                this.hideAllMenus();
                this.showController();
            });
        }

        if (exitGame) {
            exitGame.addEventListener('click', () => {
                this.showExitConfirmation();
            });
        }

        // Re-bind back button event listener
        const backButton = document.querySelector('.back-button');
        if (backButton) {
            backButton.addEventListener('click', () => {
                this.hideController();
                this.showMainMenu();
            });
        }
    }

    showExitConfirmation() {
        // Tüm mevcut menüleri gizle
        this.hideAllMenus();

        // Çıkış onay menüsünü oluştur
        const exitMenu = document.createElement('div');
        exitMenu.className = 'menu exit-confirmation';
        exitMenu.innerHTML = `
          
            <h2>Emin misin?</h2>
            <p>Oyundan çıkmak istediğine emin misin?</p>
            <div class="button-container">
                <button class="menu-button confirm-exit">Evet</button>
                <button class="menu-button cancel-exit">Hayır</button>
            </div>
        `;

        // Menü öğesini gövdeye ekle
        document.body.appendChild(exitMenu);
        this.addClickSoundsToButtons();

        // Evet butonuna tıklama işlevi
        const confirmExitButton = document.querySelector('.confirm-exit');
        if (confirmExitButton) {
            confirmExitButton.addEventListener('click', () => {
                window.close(); // Tarayıcı kısıtlaması olabilir
            });
        }

        // Hayır butonuna tıklama işlevi
        const cancelExitButton = exitMenu.querySelector('.cancel-exit');
        cancelExitButton.addEventListener('click', () => {
            exitMenu.remove(); // Onay menüsünü temizle
            this.showMainMenu(); // Ana menüye geri dön
        });
    }

    // Add this helper method to add click sounds to buttons
    addClickSoundsToButtons() {
        document.querySelectorAll('button').forEach(button => {
            // Store the original click listeners if it's a back button
            const isBackButton = button.classList.contains('back-button');

            // Clone the button and replace it
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);

            // Add click sound
            newButton.addEventListener('click', () => {
                this.game.playClickSound();
            });

            // Re-add back button functionality if it was a back button
            if (isBackButton) {
                newButton.addEventListener('click', () => {
                    this.hideController();
                    this.showMainMenu();
                });
            }
        });
    }

    // Add method to track menu navigation
    pushMenu(menuName, menuElement) {
        if (this.currentMenu) {
            // Clone the current menu element before pushing to history
            const clonedElement = this.currentMenu.element.cloneNode(true);
            this.menuHistory.push({
                name: this.currentMenu.name,
                element: clonedElement,
                // Store any necessary state
                state: {
                    score: this.game.ui.score,
                    deathMessage: this.currentMenu.deathMessage,
                    highScores: this.game.leaderboard.getHighScores()
                }
            });
        }
        this.currentMenu = {
            name: menuName,
            element: menuElement,
            deathMessage: menuElement.querySelector('.death-message')?.textContent
        };
    }

    // Add method to handle back navigation
    handleBack() {
        if (this.menuHistory.length > 0) {
            const previousMenu = this.menuHistory.pop();
            this.hideAllMenus();

            if (previousMenu.name === 'gameOver') {
                // Recreate game over menu with stored state
                this.showGameOver(
                    previousMenu.state.score,
                    previousMenu.state.deathMessage,
                    previousMenu.state.highScores
                );
            } else {
                // For other menus, create fresh instance
                switch (previousMenu.name) {
                    case 'mainMenu':
                        this.showMainMenu();
                        break;
                    case 'mapSelection':
                        this.showMapSelection();
                        break;
                    default:
                        document.body.appendChild(previousMenu.element);
                        this.currentMenu = previousMenu;
                        this.addClickSoundsToButtons();
                }
            }
        } else {
            this.showMainMenu();
        }
    }

}
