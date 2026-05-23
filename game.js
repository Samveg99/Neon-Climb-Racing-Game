// Sci-Fi Hill Climb Racing - Main Game Logic, Rendering & HUD
class SciFiGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Logical resolution
        this.width = 1024;
        this.height = 576;
        
        this.state = 'menu'; // 'menu', 'playing', 'gameover'
        this.activeStage = 'cyberpunk'; // 'cyberpunk', 'lunar', 'nebula'
        
        // Game configuration & resources
        this.crystals = parseInt(localStorage.getItem('sf_crystals')) || 25000; // Start with 25000 for testing and validation
        this.highScores = JSON.parse(localStorage.getItem('sf_highscores')) || {
            cyberpunk: 0,
            lunar: 0,
            nebula: 0
        };
        
        // Upgrades: levels from 0 to 10
        this.upgrades = JSON.parse(localStorage.getItem('sf_upgrades')) || {
            engine: 1,
            suspension: 1,
            tires: 1,
            thrusters: 0
        };

        // Unlock states
        this.unlockedStages = JSON.parse(localStorage.getItem('sf_unlocked_stages')) || {
            cyberpunk: true,
            lunar: false,
            nebula: false
        };

        this.vehiclePaint = localStorage.getItem('sf_paint') || '#00ffcc'; // neon cyan default

        // Vehicle Models Hangar Configurations
        this.activeVehicle = localStorage.getItem('sf_active_vehicle') || 'suv';
        const defaultUnlocked = {
            suv: true,
            interceptor: false,
            rover: false,
            glider: false,
            cycle: false,
            gimbal: false,
            skiff: false,
            ufo: false
        };
        this.unlockedVehicles = Object.assign(defaultUnlocked, JSON.parse(localStorage.getItem('sf_unlocked_vehicles')) || {});

        this.vehicleModels = {
            suv: {
                id: 'suv',
                name: 'Cyber SUV',
                cost: 0,
                mass: 130,
                width: 110,
                height: 40,
                frontAttach: { x: 44, y: 10 },
                rearAttach: { x: -44, y: 10 },
                minSuspension: 20,
                maxSuspension: 60,
                frontWheel: { radius: 23, mass: 18, grip: 1.3 },
                rearWheel: { radius: 23, mass: 18, grip: 1.5 },
                baseStability: 28000,
                stabilitySlope: 48000,
                pedalAssist: 42000,
                desc: 'Standard tactical explorer. Balanced AWD.',
                color: '#00ffcc',
                tier: 'Tier I'
            },
            interceptor: {
                id: 'interceptor',
                name: 'Neon Interceptor',
                cost: 1200,
                mass: 110,
                width: 116,
                height: 32,
                frontAttach: { x: 48, y: 6 },
                rearAttach: { x: -48, y: 6 },
                minSuspension: 15,
                maxSuspension: 50,
                frontWheel: { radius: 21, mass: 15, grip: 1.45 },
                rearWheel: { radius: 21, mass: 15, grip: 1.7 },
                baseStability: 36000,
                stabilitySlope: 58000,
                pedalAssist: 48000,
                desc: 'High-speed active aero coupe. Superior ground control.',
                color: '#ff007f',
                tier: 'Tier II'
            },
            rover: {
                id: 'rover',
                name: 'Galactic Rover',
                cost: 2800,
                mass: 95,
                width: 106,
                height: 38,
                frontAttach: { x: 46, y: 8 },
                rearAttach: { x: -46, y: 8 },
                minSuspension: 18,
                maxSuspension: 55,
                frontWheel: { radius: 25, mass: 14, grip: 1.6 },
                rearWheel: { radius: 25, mass: 14, grip: 1.9 },
                baseStability: 44000,
                stabilitySlope: 68000,
                pedalAssist: 54000,
                desc: 'Deep-space canopy rover. Maximum stability & traction.',
                color: '#39ff14',
                tier: 'Tier III'
            },
            glider: {
                id: 'glider',
                name: 'Cyber Glider',
                cost: 3600,
                mass: 80,
                width: 100,
                height: 30,
                frontAttach: { x: 42, y: 8 },
                rearAttach: { x: -42, y: 8 },
                minSuspension: 12,
                maxSuspension: 45,
                frontWheel: { radius: 18, mass: 12, grip: 1.7 },
                rearWheel: { radius: 18, mass: 12, grip: 1.95 },
                baseStability: 50000,
                stabilitySlope: 72000,
                pedalAssist: 58000,
                desc: 'Hover-pod utilizing anti-gravity compression pads. Dampened sway.',
                color: '#e0b0ff',
                tier: 'Tier IV'
            },
            cycle: {
                id: 'cycle',
                name: 'Proton Cycle',
                cost: 5200,
                mass: 70,
                width: 96,
                height: 26,
                frontAttach: { x: 44, y: 12 },
                rearAttach: { x: -44, y: 12 },
                minSuspension: 10,
                maxSuspension: 40,
                frontWheel: { radius: 21, mass: 10, grip: 1.9 },
                rearWheel: { radius: 21, mass: 10, grip: 2.15 },
                baseStability: 58000,
                stabilitySlope: 82000,
                pedalAssist: 64000,
                desc: 'Light-cycle with solid-neon wheels and ultra-aerodynamic stance.',
                color: '#ff0033',
                tier: 'Tier V'
            },
            gimbal: {
                id: 'gimbal',
                name: 'Gimbal Orb-Pod',
                cost: 7000,
                mass: 60,
                width: 104,
                height: 36,
                frontAttach: { x: 48, y: 4 },
                rearAttach: { x: -48, y: 4 },
                minSuspension: 15,
                maxSuspension: 52,
                frontWheel: { radius: 24, mass: 9, grip: 2.1 },
                rearWheel: { radius: 24, mass: 9, grip: 2.35 },
                baseStability: 66000,
                stabilitySlope: 94000,
                pedalAssist: 72000,
                desc: 'Gimbal cockpit suspended between two giant rolling plasma orbs.',
                color: '#00ffff',
                tier: 'Tier VI'
            },
            skiff: {
                id: 'skiff',
                name: 'Starfighter Skiff',
                cost: 9000,
                mass: 50,
                width: 112,
                height: 28,
                frontAttach: { x: 50, y: 6 },
                rearAttach: { x: -50, y: 6 },
                minSuspension: 14,
                maxSuspension: 48,
                frontWheel: { radius: 17, mass: 8, grip: 2.3 },
                rearWheel: { radius: 17, mass: 8, grip: 2.6 },
                baseStability: 74000,
                stabilitySlope: 105000,
                pedalAssist: 80000,
                desc: 'Low-altitude fighter with shield bubble buffers instead of wheels.',
                color: '#ff8000',
                tier: 'Tier VII'
            },
            ufo: {
                id: 'ufo',
                name: 'Chronos Cruiser',
                cost: 12000,
                mass: 125,
                width: 100,
                height: 22,
                frontAttach: { x: 42, y: 12 },
                rearAttach: { x: -42, y: 12 },
                minSuspension: 22,
                maxSuspension: 22,
                frontWheel: { radius: 15, mass: 12, grip: 2.6 },
                rearWheel: { radius: 15, mass: 12, grip: 3.0 },
                baseStability: 90000,
                stabilitySlope: 130000,
                pedalAssist: 95000,
                desc: 'Anti-gravity saucer. Hover fields replace wheels. Near-unflipable.',
                color: '#ff00ff',
                tier: 'Tier VIII'
            }
        };

        // Physics & Terrain instances
        this.physics = new PhysicsEngine();
        this.terrain = null;
        this.vehicle = null;
        
        // Particles
        this.particles = [];
        
        // Inputs
        this.controls = {
            gas: false,
            brake: false,
            boost: false
        };

        // UI animations
        this.distance = 0;
        this.scoreNotification = null; // for flips/stunts
        this.scoreNotificationTimer = 0;
        
        // Parallax stars background
        this.stars = [];
        this.initStars();
        
        this.setupEventListeners();
        this.updateShopUI();
        this.updatePaintUI();
        this.drawLoop();
    }

    initStars() {
        this.stars = [];
        for (let i = 0; i < 80; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height * 0.7,
                size: Math.random() * 2 + 0.5,
                color: Math.random() > 0.5 ? '#ffffff' : (Math.random() > 0.5 ? '#00ffcc' : '#ff00ff'),
                speed: Math.random() * 0.15 + 0.05
            });
        }
    }

    setupEventListeners() {
        // Keyboard inputs
        window.addEventListener('keydown', (e) => {
            if (this.state !== 'playing') return;
            
            // Audio Context initialization on first interaction
            if (window.audioEngine && !window.audioEngine.initialized) {
                window.audioEngine.init();
            }

            switch(e.key.toLowerCase()) {
                case 'd':
                case 'arrowright':
                    this.controls.gas = true;
                    break;
                case 'a':
                case 'arrowleft':
                    this.controls.brake = true;
                    break;
                case ' ':
                    this.controls.boost = true;
                    break;
                case 'r':
                    this.restartGame();
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch(e.key.toLowerCase()) {
                case 'd':
                case 'arrowright':
                    this.controls.gas = false;
                    break;
                case 'a':
                case 'arrowleft':
                    this.controls.brake = false;
                    break;
                case ' ':
                    this.controls.boost = false;
                    break;
            }
        });

        // Prevention of scrolling with arrow/space keys
        window.addEventListener('keydown', (e) => {
            if (['space', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].indexOf(e.code.toLowerCase()) > -1) {
                e.preventDefault();
            }
        }, {passive: false});

        // Touch buttons for mobile support
        const bindTouchButton = (id, controlName) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            
            const startPress = (e) => {
                e.preventDefault();
                if (window.audioEngine) window.audioEngine.init();
                if (this.state === 'playing') {
                    this.controls[controlName] = true;
                }
            };
            const endPress = (e) => {
                e.preventDefault();
                this.controls[controlName] = false;
            };

            btn.addEventListener('mousedown', startPress);
            btn.addEventListener('mouseup', endPress);
            btn.addEventListener('mouseleave', endPress);
            
            btn.addEventListener('touchstart', startPress, {passive: false});
            btn.addEventListener('touchend', endPress, {passive: false});
        };

        bindTouchButton('btnGas', 'gas');
        bindTouchButton('btnBrake', 'brake');
        bindTouchButton('btnBoost', 'boost');

        // Restart button on game over screen
        const btnRestart = document.getElementById('btnRestart');
        if (btnRestart) {
            btnRestart.addEventListener('click', () => {
                if (window.audioEngine) window.audioEngine.playClick();
                this.restartGame();
            });
        }

        // Back to menu button
        const btnMenu = document.getElementById('btnMenu');
        if (btnMenu) {
            btnMenu.addEventListener('click', () => {
                if (window.audioEngine) window.audioEngine.playClick();
                this.showMenu();
            });
        }
    }

    startRun(stage) {
        if (window.audioEngine) {
            window.audioEngine.init();
            window.audioEngine.playClick();
            window.audioEngine.setEngineActive(true);
        }

        this.activeStage = stage;
        this.terrain = new SciFiTerrain(stage);
        
        // Set gravity based on stage
        if (stage === 'lunar') {
            this.physics.gravity = 9.81 * 30; // Low gravity
        } else if (stage === 'nebula') {
            this.physics.gravity = 9.81 * 120; // High gravity
        } else {
            this.physics.gravity = 9.81 * 80;  // Normal cyberpunk earth gravity
        }

        // Initialize selected vehicle state from models config hangar
        const config = this.vehicleModels[this.activeVehicle] || this.vehicleModels.suv;

        this.vehicle = {
            modelId: config.id,
            baseStability: config.baseStability,
            stabilitySlope: config.stabilitySlope,
            pedalAssist: config.pedalAssist,
            chassis: {
                modelId: config.id,
                x: 150,
                y: 465,
                vx: 0,
                vy: 0,
                angle: 0,
                angularVelocity: 0,
                mass: config.mass,
                inertia: (config.mass * (config.width * config.width + config.height * config.height)) / 12,
                width: config.width,
                height: config.height,
                forceX: 0,
                forceY: 0,
                torque: 0
            },
            frontAttach: config.frontAttach,
            rearAttach: config.rearAttach,
            minSuspension: config.minSuspension,
            maxSuspension: config.maxSuspension,
            
            frontWheel: {
                x: 150 + config.frontAttach.x,
                y: 465 + config.maxSuspension,
                vx: 0,
                vy: 0,
                radius: config.frontWheel.radius,
                mass: config.frontWheel.mass,
                inertia: 0.5 * config.frontWheel.mass * config.frontWheel.radius * config.frontWheel.radius,
                omega: 0,
                torque: 0,
                forceX: 0,
                forceY: 0,
                grip: config.frontWheel.grip,
                inContact: false
            },
            rearWheel: {
                x: 150 + config.rearAttach.x,
                y: 465 + config.maxSuspension,
                vx: 0,
                vy: 0,
                radius: config.rearWheel.radius,
                mass: config.rearWheel.mass,
                inertia: 0.5 * config.rearWheel.mass * config.rearWheel.radius * config.rearWheel.radius,
                omega: 0,
                torque: 0,
                forceX: 0,
                forceY: 0,
                grip: config.rearWheel.grip,
                inContact: false
            },

            // Status values
            fuel: 100, // percentage battery
            thrusterFuel: 100, // percentage rocket thruster charge
            crashed: false,
            boosting: false,
            airTime: 0,
            airRotationAccumulator: 0,
            lastAirAngle: null,
            stunts: [] // completed stunts
        };

        // Reset stage items collected cache
        this.terrain.reset();
        this.particles = [];
        this.distance = 0;
        this.state = 'playing';
        this.controlsOverlayTimer = 2.0; // Display control overlay for 2 seconds
        
        // Hide overlay menu
        document.getElementById('menuScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('mobileControls').classList.remove('hidden');
    }

    restartGame() {
        this.startRun(this.activeStage);
    }

    showMenu() {
        this.state = 'menu';
        if (window.audioEngine) {
            window.audioEngine.setEngineActive(false);
        }
        document.getElementById('menuScreen').classList.remove('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('mobileControls').classList.add('hidden');
        this.updateShopUI();
    }

    triggerGameOver(reason) {
        this.state = 'gameover';
        if (window.audioEngine) {
            window.audioEngine.setEngineActive(false);
            window.audioEngine.playCrash();
        }

        // Save crystals & High score
        localStorage.setItem('sf_crystals', this.crystals);
        
        const finalDist = Math.floor(this.distance);
        if (finalDist > this.highScores[this.activeStage]) {
            this.highScores[this.activeStage] = finalDist;
            localStorage.setItem('sf_highscores', JSON.stringify(this.highScores));
        }

        // Populate Game Over text
        document.getElementById('gameOverTitle').innerText = reason === 'fuel' ? 'BATTERY DRAINED' : 'SYSTEM CRITICALLY DAMAGED';
        document.getElementById('finalDistance').innerText = finalDist + " m";
        document.getElementById('highScoreVal').innerText = this.highScores[this.activeStage] + " m";
        
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.getElementById('mobileControls').classList.add('hidden');
    }

    collectCrystal(crystal) {
        this.crystals += crystal.value;
        this.terrain.collectItem(crystal.id);
        if (window.audioEngine) {
            window.audioEngine.playCrystal();
        }
        
        // Trigger floaty text
        this.scoreNotification = `+${crystal.value} EC`;
        this.scoreNotificationTimer = 1.2;

        // Particle splash
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: crystal.x,
                y: crystal.y,
                vx: (Math.random() - 0.5) * 150,
                vy: (Math.random() - 0.5) * 150 - 50,
                size: Math.random() * 3 + 2,
                color: '#39ff14', // bright green energy
                life: 0.8,
                maxLife: 0.8
            });
        }
    }

    collectFuel(fuel) {
        // Battery recharge
        this.vehicle.fuel = Math.min(100, this.vehicle.fuel + 45);
        this.terrain.collectItem(fuel.id);
        if (window.audioEngine) {
            window.audioEngine.playCrystal(); // play similar charge chime
        }

        this.scoreNotification = `SHIELD CHARGED!`;
        this.scoreNotificationTimer = 1.5;

        // Pulse particles
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 80 + 40;
            this.particles.push({
                x: fuel.x,
                y: fuel.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 4 + 3,
                color: '#ff00ff', // glowing pink battery particles
                life: 1.0,
                maxLife: 1.0
            });
        }
    }

    updateShopUI() {
        document.getElementById('crystalCount').innerText = this.crystals;
        
        // Render stats & upgrade levels
        const upgradeItems = ['engine', 'suspension', 'tires', 'thrusters'];
        upgradeItems.forEach(item => {
            const lvl = this.upgrades[item];
            const maxLvl = 10;
            
            // Progress dots
            let progressHtml = '';
            for (let i = 1; i <= maxLvl; i++) {
                progressHtml += `<div class="upgrade-dot ${i <= lvl ? 'active' : ''}"></div>`;
            }
            document.getElementById(`${item}Progress`).innerHTML = progressHtml;
            
            // Button label
            const btn = document.getElementById(`btnUpgrade_${item}`);
            if (btn) {
                if (lvl >= maxLvl) {
                    btn.innerText = 'MAX LEVEL';
                    btn.disabled = true;
                    btn.classList.add('maxed');
                } else {
                    const price = this.getUpgradePrice(item, lvl);
                    btn.innerText = `${price} EC`;
                    btn.disabled = this.crystals < price;
                    btn.classList.remove('maxed');
                }
            }
        });

        // Stage locks render
        const stages = ['lunar', 'nebula'];
        stages.forEach(st => {
            const unlocked = this.unlockedStages[st];
            const btn = document.getElementById(`btnStart_${st}`);
            const lockPanel = document.getElementById(`lock_${st}`);
            
            if (unlocked) {
                if (lockPanel) lockPanel.classList.add('hidden');
                if (btn) btn.innerText = 'LAUNCH';
            } else {
                if (lockPanel) lockPanel.classList.remove('hidden');
                const price = st === 'lunar' ? 1500 : 3000;
                const unlockBtn = document.getElementById(`btnUnlock_${st}`);
                if (unlockBtn) {
                    unlockBtn.innerText = `UNLOCK stage: ${price} EC`;
                    unlockBtn.disabled = this.crystals < price;
                }
            }
        });

        // Render Hangar Vehicle Selector
        const vehicleSelector = document.getElementById('vehicleSelector');
        if (vehicleSelector) {
            let hangarHtml = '';
            Object.values(this.vehicleModels).forEach(model => {
                const isUnlocked = this.unlockedVehicles[model.id];
                const isActive = this.activeVehicle === model.id;
                
                let actionBtnHtml = '';
                if (isActive) {
                    actionBtnHtml = `<button class="btn-pink maxed" disabled>ACTIVE</button>`;
                } else if (isUnlocked) {
                    actionBtnHtml = `<button onclick="game.selectVehicle('${model.id}')">SELECT</button>`;
                } else {
                    const price = model.cost;
                    const canBuy = this.crystals >= price;
                    actionBtnHtml = `<button class="btn-pink" onclick="game.unlockVehicle('${model.id}')" ${canBuy ? '' : 'disabled'}>${price} EC</button>`;
                }

                hangarHtml += `
                    <div class="vehicle-card ${isActive ? 'active' : ''}" onclick="if(${isUnlocked} && !${isActive}) game.selectVehicle('${model.id}')">
                        <div class="vehicle-info-block">
                            <h4>${model.name} <span class="stats-badge" style="color: ${model.color};">${model.tier}</span></h4>
                            <p>${model.desc}</p>
                            <p style="font-size:10px; color:rgba(255,255,255,0.4); margin-top:2px;">
                                Mass: ${model.mass}kg | CG Stability: +${Math.round((model.baseStability-28000)/28000 * 100)}%
                            </p>
                        </div>
                        <div onclick="event.stopPropagation();">
                            ${actionBtnHtml}
                        </div>
                    </div>
                `;
            });
            vehicleSelector.innerHTML = hangarHtml;
        }
    }

    selectVehicle(id) {
        if (this.unlockedVehicles[id]) {
            this.activeVehicle = id;
            localStorage.setItem('sf_active_vehicle', id);
            
            if (window.audioEngine) window.audioEngine.playUpgrade();
            this.updateShopUI();
            this.updatePaintUI();
        }
    }

    unlockVehicle(id) {
        const model = this.vehicleModels[id];
        if (model && !this.unlockedVehicles[id] && this.crystals >= model.cost) {
            this.crystals -= model.cost;
            this.unlockedVehicles[id] = true;
            
            localStorage.setItem('sf_crystals', this.crystals);
            localStorage.setItem('sf_unlocked_vehicles', JSON.stringify(this.unlockedVehicles));
            
            if (window.audioEngine) window.audioEngine.playUpgrade();
            this.selectVehicle(id);
        }
    }

    getUpgradePrice(item, currentLevel) {
        if (item === 'thrusters') {
            return (currentLevel + 1) * 350;
        }
        return (currentLevel + 1) * 200;
    }

    buyUpgrade(item) {
        const currentLevel = this.upgrades[item];
        if (currentLevel >= 10) return;

        const price = this.getUpgradePrice(item, currentLevel);
        if (this.crystals >= price) {
            this.crystals -= price;
            this.upgrades[item]++;
            
            localStorage.setItem('sf_crystals', this.crystals);
            localStorage.setItem('sf_upgrades', JSON.stringify(this.upgrades));
            
            if (window.audioEngine) window.audioEngine.playUpgrade();
            
            this.updateShopUI();
        }
    }

    unlockStage(stageName) {
        const price = stageName === 'lunar' ? 1500 : 3000;
        if (this.crystals >= price && !this.unlockedStages[stageName]) {
            this.crystals -= price;
            this.unlockedStages[stageName] = true;
            
            localStorage.setItem('sf_crystals', this.crystals);
            localStorage.setItem('sf_unlocked_stages', JSON.stringify(this.unlockedStages));
            
            if (window.audioEngine) window.audioEngine.playUpgrade();
            
            this.updateShopUI();
        }
    }

    updatePaintUI() {
        const colors = ['#00ffcc', '#39ff14', '#ff00ff', '#ff9900', '#ff0055'];
        let html = '';
        colors.forEach(col => {
            const isSelected = this.vehiclePaint === col;
            html += `<div class="paint-option ${isSelected ? 'selected' : ''}" 
                          style="background-color: ${col};" 
                          onclick="game.setVehiclePaint('${col}')"></div>`;
        });
        document.getElementById('paintSelector').innerHTML = html;
    }

    setVehiclePaint(col) {
        this.vehiclePaint = col;
        localStorage.setItem('sf_paint', col);
        this.updatePaintUI();
        if (window.audioEngine) window.audioEngine.playClick();
    }

    // MAIN GAME LOOP
    drawLoop() {
        try {
            const now = performance.now();
            const dt = Math.min(0.1, (now - (this.lastTime || now)) / 1000);
            this.lastTime = now;

            this.update(dt);
            this.render();
        } catch (e) {
            console.error(e);
            const d = document.getElementById('debugConsole');
            if (d) {
                d.style.display = 'block';
                d.innerHTML += '<div>[TRY-CATCH ERR] ' + e.message + '<br>' + (e.stack ? e.stack.replace(/\n/g, '<br>').replace(/ /g, '&nbsp;') : '') + '</div>';
            }
            // Stop loop execution on fatal crash to prevent flooding the screen
            return;
        }

        requestAnimationFrame(() => this.drawLoop());
    }

    update(dt) {
        if (this.state !== 'playing') {
            // Update menu background particles
            this.updateBackgroundStars(dt, 0.5);
            return;
        }

        // 1. Run Physics update
        this.physics.update(this.vehicle, this.terrain, this.controls, this.upgrades, dt);
        
        // Set camera horizontal position tracking the SUV chassis
        this.distance = Math.max(this.distance, this.vehicle.chassis.x / 100); // 1 meter per 100 pixels

        // Update control overlay timer
        if (this.controlsOverlayTimer > 0) {
            this.controlsOverlayTimer -= dt;
        }

        // Check crash and battery conditions
        if (this.vehicle.crashed) {
            this.triggerGameOver('crash');
            return;
        }
        if (this.vehicle.fuel <= 0) {
            this.triggerGameOver('fuel');
            return;
        }

        // 2. Play synthesized engine sound based on speed and gas pedal
        if (window.audioEngine) {
            const speedRatio = Math.min(1.0, Math.abs(this.vehicle.chassis.vx) / 800);
            const load = this.controls.gas ? 1.0 : (this.controls.brake ? 0.3 : 0.05);
            window.audioEngine.updateEngine(speedRatio, load);
            window.audioEngine.updateThruster(this.vehicle.boosting, this.upgrades.thrusters / 10);
        }

        // 3. Spawning particles
        this.spawnExhaustParticles(dt);
        this.updateParticles(dt);

        // 4. Update background star scrolling (speed dependent)
        this.updateBackgroundStars(dt, this.vehicle.chassis.vx);

        // 5. Item collision checks
        const screenLeft = this.vehicle.chassis.x - this.width / 2;
        const screenRight = this.vehicle.chassis.x + this.width / 2;
        const visibleItems = this.terrain.getItemsInWindow(screenLeft, screenRight);
        
        visibleItems.forEach(item => {
            // Check collision with chassis or wheels
            const checkDist = (obj) => {
                const dx = obj.x - item.x;
                const dy = obj.y - item.y;
                return Math.sqrt(dx*dx + dy*dy) < (obj.radius || 20) + item.radius;
            };

            if (checkDist(this.vehicle.frontWheel) || checkDist(this.vehicle.rearWheel) || checkDist(this.vehicle.chassis)) {
                if (item.type === 'crystal') {
                    this.collectCrystal(item);
                } else if (item.type === 'fuel') {
                    this.collectFuel(item);
                }
            }
        });

        // 6. Handle Stunt notifications
        if (this.vehicle.stunts.length > 0) {
            const stunt = this.vehicle.stunts[0];
            stunt.time -= dt;
            
            if (stunt.time > 0) {
                this.scoreNotification = `${stunt.name} +${stunt.reward} EC`;
                this.scoreNotificationTimer = stunt.time;
            } else {
                this.crystals += stunt.reward;
                this.vehicle.stunts.shift(); // Remove stunt
                this.scoreNotification = null;
            }
        }

        // Live Debug Overlay
        const debugConsole = document.getElementById('debugConsole');
        if (debugConsole) {
            debugConsole.style.display = 'block';
            debugConsole.innerHTML = `
                <div>STATE: ${this.state} | GAS: ${this.controls.gas} | BRAKE: ${this.controls.brake} | BOOST: ${this.controls.boost}</div>
                <div>CHASSIS: x=${this.vehicle.chassis.x.toFixed(1)}, y=${this.vehicle.chassis.y.toFixed(1)}, vx=${this.vehicle.chassis.vx.toFixed(1)}, vy=${this.vehicle.chassis.vy.toFixed(1)}</div>
                <div>FORCES: fx=${this.vehicle.chassis.forceX.toFixed(1)}, fy=${this.vehicle.chassis.forceY.toFixed(1)}</div>
                <div>WHEELS: FW_contact=${this.vehicle.frontWheel.inContact}, RW_contact=${this.vehicle.rearWheel.inContact}</div>
                <div>WHEELS_O: FW_w=${this.vehicle.frontWheel.omega.toFixed(2)}, RW_w=${this.vehicle.rearWheel.omega.toFixed(2)}</div>
            `;
        }
    }

    updateBackgroundStars(dt, carVelocityX) {
        this.stars.forEach(star => {
            // Parallax movement opposite to vehicle direction
            star.x -= carVelocityX * star.speed * dt;
            if (star.x < 0) star.x += this.width;
            if (star.x > this.width) star.x -= this.width;
        });
    }

    spawnExhaustParticles(dt) {
        const chassis = this.vehicle.chassis;
        const cos = Math.cos(chassis.angle);
        const sin = Math.sin(chassis.angle);

        // Exhaust emitter at the rear-bottom of the SUV
        const rx = -50;
        const ry = 8;
        const ex = chassis.x + rx * cos - ry * sin;
        const ey = chassis.y + rx * sin + ry * cos;

        // Base plasma engine particles
        if (Math.random() < 0.3) {
            this.particles.push({
                x: ex,
                y: ey,
                vx: -cos * 100 + (Math.random() - 0.5) * 40 - chassis.vx * 0.1,
                vy: -sin * 100 + (Math.random() - 0.5) * 40 + chassis.vy,
                size: Math.random() * 4 + 2,
                color: this.vehiclePaint,
                life: 0.5,
                maxLife: 0.5
            });
        }

        // In-air maneuvering thruster particles
        const inAir = !this.vehicle.frontWheel.inContact && !this.vehicle.rearWheel.inContact;
        if (inAir) {
            if (this.controls.gas) {
                // Rear booster plasma flare
                for (let i = 0; i < 2; i++) {
                    this.particles.push({
                        x: ex,
                        y: ey,
                        vx: -cos * 200 + (Math.random() - 0.5) * 50 + chassis.vx,
                        vy: -sin * 200 + (Math.random() - 0.5) * 50 + chassis.vy,
                        size: Math.random() * 4 + 2,
                        color: '#00ffcc', // bright plasma cyan
                        life: 0.35,
                        maxLife: 0.35
                    });
                }
            }
            if (this.controls.brake) {
                // Front thruster reverse jets
                const fx = chassis.x + 50 * cos - 8 * sin;
                const fy = chassis.y + 50 * sin + 8 * cos;
                for (let i = 0; i < 2; i++) {
                    this.particles.push({
                        x: fx,
                        y: fy,
                        vx: cos * 200 + (Math.random() - 0.5) * 50 + chassis.vx,
                        vy: sin * 200 + (Math.random() - 0.5) * 50 + chassis.vy,
                        size: Math.random() * 4 + 2,
                        color: '#ff007f', // hot neon pink reverse thruster
                        life: 0.35,
                        maxLife: 0.35
                    });
                }
            }
        }

        // Active Boost Thruster particles
        if (this.vehicle.boosting) {
            // High speed cyan/white jets
            for (let i = 0; i < 3; i++) {
                const thrustAngle = chassis.angle + Math.PI/2 + (Math.random() - 0.5) * 0.3; // point down relative to chassis
                const speed = Math.random() * 250 + 150;
                this.particles.push({
                    x: chassis.x + (Math.random() - 0.5) * 20,
                    y: chassis.y + 12,
                    vx: Math.sin(thrustAngle) * speed + chassis.vx * 0.5,
                    vy: -Math.cos(thrustAngle) * speed + chassis.vy * 0.5,
                    size: Math.random() * 5 + 3,
                    color: '#00ffff',
                    life: 0.6,
                    maxLife: 0.6
                });
            }
        }

        // Tire friction spark particles
        const checkTireSparks = (wheel) => {
            if (wheel.inContact && Math.abs(wheel.omega * wheel.radius - wheel.vx) > 180) {
                // Spinning tires
                const tInfo = this.terrain.getTerrainInfo(wheel.x);
                if (tInfo) {
                    this.particles.push({
                        x: wheel.x,
                        y: wheel.y + wheel.radius,
                        vx: -tInfo.tx * 180 + (Math.random() - 0.5) * 80,
                        vy: -tInfo.ty * 80 - Math.random() * 60,
                        size: Math.random() * 3 + 1,
                        color: this.stageType === 'cyberpunk' ? '#ff00ff' : '#ffea00',
                        life: 0.4,
                        maxLife: 0.4
                    });
                }
            }
        };

        checkTireSparks(this.vehicle.frontWheel);
        checkTireSparks(this.vehicle.rearWheel);
    }

    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    // DRAW & RENDER CODE
    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw Parallax Stars BackDrop
        this.drawBackground();

        if (this.state === 'menu') {
            // Draw floating cyber SUV in background on menu
            this.drawMenuBackgroundSUV();
            return;
        }

        // Calculate Camera Offset
        // Camera targets the vehicle but stays centered horizontally
        const cameraX = this.vehicle.chassis.x - this.width * 0.35;
        const cameraY = this.vehicle.chassis.y - this.height * 0.55;

        this.ctx.save();
        this.ctx.translate(-cameraX, -cameraY);

        // Draw Infinite Terrain Grid below surface and glowing line on top
        this.drawTerrain(cameraX);

        // Draw Fuel/Crystal items
        this.drawItems(cameraX);

        // Draw Active Particles
        this.drawParticles();

        // Draw Futuristic SUV (suspensions, chassis, glowing wheels, thruster flames)
        this.drawVehicle();

        this.ctx.restore();

        // Overlay HUD (Speedometer, Fuel, Crystals, Notifications)
        this.drawHUD();

        // Draw controls keys overlay at the start
        if (this.controlsOverlayTimer > 0) {
            this.drawControlsOverlay();
        }
    }

    drawControlsOverlay() {
        this.ctx.save();
        
        // Semi-transparent overlay box in center
        const boxW = 500;
        const boxH = 210;
        const bx = (this.width - boxW) / 2;
        const by = (this.height - boxH) / 2 - 20;

        // Background
        this.ctx.fillStyle = 'rgba(10, 5, 22, 0.9)';
        this.ctx.strokeStyle = '#00ffcc';
        this.ctx.shadowColor = '#00ffcc';
        this.ctx.shadowBlur = 15;
        this.ctx.lineWidth = 2.5;
        this.ctx.beginPath();
        this.ctx.roundRect(bx, by, boxW, boxH, 10);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.shadowBlur = 0;
        this.ctx.textAlign = 'center';
        
        // Header
        this.ctx.fillStyle = '#00ffcc';
        this.ctx.font = "bold 18px 'Orbitron', sans-serif";
        this.ctx.fillText("SYSTEM CALIBRATION", this.width / 2, by + 35);
        
        // Lines
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = "bold 14px 'Orbitron', sans-serif";
        
        this.ctx.fillText("GAS [ D ] or [ RIGHT ARROW ]", this.width / 2, by + 75);
        this.ctx.fillText("BRAKE / REVERSE [ A ] or [ LEFT ARROW ]", this.width / 2, by + 110);
        
        if (this.upgrades.thrusters > 0) {
            this.ctx.fillText("PLASMA JET BOOST [ SPACEBAR ]", this.width / 2, by + 145);
        } else {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.fillText("PLASMA BOOST [ SPACEBAR ] (Garage Upgrade Required)", this.width / 2, by + 145);
        }
        
        this.ctx.fillStyle = 'rgba(0, 255, 204, 0.6)';
        this.ctx.font = "11px 'Orbitron', sans-serif";
        this.ctx.fillText("RESPAWN [ R ]", this.width / 2, by + 180);
        
        this.ctx.restore();
    }

    drawBackground() {
        // Gradient dark background based on Stage Biome
        const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
        
        if (this.state === 'playing') {
            if (this.activeStage === 'lunar') {
                grad.addColorStop(0, '#020005');
                grad.addColorStop(1, '#0e0b1c');
            } else if (this.activeStage === 'nebula') {
                grad.addColorStop(0, '#06000d');
                grad.addColorStop(1, '#2c0442');
            } else {
                // Cyberpunk
                grad.addColorStop(0, '#05020c');
                grad.addColorStop(1, '#1b0e3b');
            }
        } else {
            // Menu screen
            grad.addColorStop(0, '#05020a');
            grad.addColorStop(1, '#15092a');
        }
        
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw stars
        this.stars.forEach(star => {
            this.ctx.fillStyle = star.color;
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        });

        // Drawing beautiful distant planets or neon city skyline outlines for aesthetics
        this.drawDistantCelestialBodies();
    }

    drawDistantCelestialBodies() {
        // Draw cosmic gradients/neon grid backdrop
        this.ctx.save();
        if (this.state === 'playing' && this.activeStage === 'lunar') {
            // Draw a huge glowing Earth planet in background
            this.ctx.beginPath();
            const planetGrad = this.ctx.createRadialGradient(250, 150, 10, 250, 150, 90);
            planetGrad.addColorStop(0, '#00ffff');
            planetGrad.addColorStop(0.3, '#0055ff');
            planetGrad.addColorStop(1, 'transparent');
            this.ctx.fillStyle = planetGrad;
            this.ctx.arc(250, 150, 90, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (this.state === 'playing' && this.activeStage === 'nebula') {
            // Draw massive colorful glowing Nebula rings
            this.ctx.strokeStyle = 'rgba(255, 0, 255, 0.15)';
            this.ctx.lineWidth = 15;
            this.ctx.beginPath();
            this.ctx.arc(800, 180, 250, 0.2, Math.PI * 1.3);
            this.ctx.stroke();
            
            this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
            this.ctx.lineWidth = 8;
            this.ctx.beginPath();
            this.ctx.arc(800, 180, 270, 0.5, Math.PI * 1.5);
            this.ctx.stroke();
        } else {
            // Cyberpunk grid backdrop (Neon city skyline)
            this.ctx.fillStyle = 'rgba(255, 0, 255, 0.03)';
            const skylineX = -(this.state === 'playing' ? this.vehicle.chassis.x * 0.1 : 0);
            for (let i = 0; i < 15; i++) {
                const rectW = 60 + (i % 3) * 35;
                const rectH = 150 + (i % 4) * 50;
                const rx = ((skylineX + i * 110) % (this.width + 200)) - 100;
                this.ctx.fillRect(rx, this.height - rectH, rectW, rectH);
            }
        }
        this.ctx.restore();
    }

    drawMenuBackgroundSUV() {
        // Floating selected vehicle illustration on main menu Hangar
        const cx = this.width / 2 + 190;
        const cy = this.height / 2 + 30;
        const time = performance.now() / 1000;
        
        // Gentle hover float animation
        const floatY = Math.sin(time * 2) * 8;
        
        this.ctx.save();
        this.ctx.translate(cx, cy + floatY);
        this.ctx.rotate(Math.sin(time * 0.5) * 0.03);

        // Neon outline glows
        this.ctx.shadowColor = this.vehiclePaint;
        this.ctx.shadowBlur = 15;
        this.ctx.strokeStyle = this.vehiclePaint;
        this.ctx.lineWidth = 3;
        this.ctx.fillStyle = 'rgba(10, 5, 25, 0.85)';

        const modelId = this.activeVehicle || 'suv';

        if (modelId === 'interceptor') {
            // Neon Interceptor: Low-profile sports coupe
            this.ctx.beginPath();
            this.ctx.moveTo(-58, 10);
            // Low spoiler
            this.ctx.lineTo(-58, -3);
            this.ctx.lineTo(-44, -10);
            // Roof line
            this.ctx.lineTo(-10, -10);
            this.ctx.lineTo(10, -22); // cockpit slope
            this.ctx.lineTo(34, -22);
            this.ctx.lineTo(46, -6);  // sleek front glass slope
            this.ctx.lineTo(58, -6);
            this.ctx.lineTo(58, 10);
            // Underbody arches
            this.ctx.lineTo(48, 10);
            this.ctx.arc(38, 13, 21, Math.PI, 0, true);
            this.ctx.lineTo(-28, 10);
            this.ctx.arc(-38, 13, 21, Math.PI, 0, true);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();

            // Cockpit glass detailing
            this.ctx.shadowBlur = 6;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(12, -18);
            this.ctx.lineTo(30, -18);
            this.ctx.lineTo(40, -6);
            this.ctx.lineTo(12, -6);
            this.ctx.closePath();
            this.ctx.stroke();

            // Headlight glow
            this.ctx.shadowColor = '#00ffff';
            this.ctx.shadowBlur = 12;
            this.ctx.fillStyle = '#00ffff';
            this.ctx.fillRect(53, -2, 5, 4);

            // Tail light glow
            this.ctx.shadowColor = '#ff0055';
            this.ctx.shadowBlur = 12;
            this.ctx.fillStyle = '#ff0055';
            this.ctx.fillRect(-58, 2, 3, 4);

            // Wheels
            const glowColor = this.vehicleModels.interceptor.color;
            this.ctx.shadowColor = glowColor;
            this.ctx.shadowBlur = 18;
            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
            this.ctx.strokeStyle = glowColor;
            this.ctx.lineWidth = 3;
            
            [-38, 38].forEach(xOff => {
                this.ctx.beginPath();
                this.ctx.arc(xOff, 13, 18, 0, Math.PI*2);
                this.ctx.fill();
                this.ctx.stroke();
                
                // spokes
                this.ctx.beginPath();
                for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
                    this.ctx.moveTo(xOff, 13);
                    this.ctx.lineTo(xOff + Math.cos(angle + time) * 18, 13 + Math.sin(angle + time) * 18);
                }
                this.ctx.stroke();
            });

        } else if (modelId === 'rover') {
            // Galactic Rover: Dome explorer
            this.ctx.beginPath();
            this.ctx.moveTo(-50, 12);
            // Equipment grid/Solar panel base
            this.ctx.lineTo(-50, -4);
            this.ctx.lineTo(-34, -12);
            // Bubble glass cockpit arc
            this.ctx.lineTo(-24, -12);
            this.ctx.bezierCurveTo(-14, -34, 18, -34, 26, -10);
            this.ctx.lineTo(42, -4);
            this.ctx.lineTo(50, 12);
            // Underbody arches
            this.ctx.lineTo(44, 12);
            this.ctx.arc(36, 14, 25, Math.PI, 0, true);
            this.ctx.lineTo(-26, 12);
            this.ctx.arc(-36, 14, 25, Math.PI, 0, true);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();

            // Solar panel details on equipment rack
            this.ctx.strokeStyle = '#00ffcc';
            this.ctx.shadowBlur = 6;
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(-48, -10);
            this.ctx.lineTo(-36, -10);
            this.ctx.stroke();

            // Glass canopy highlight (inside dome)
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.arc(4, -10, 18, -Math.PI*0.8, -Math.PI*0.2);
            this.ctx.stroke();

            // Reactor core inside the base
            this.ctx.fillStyle = '#39ff14';
            this.ctx.shadowColor = '#39ff14';
            this.ctx.shadowBlur = 10;
            this.ctx.fillRect(-15, 0, 14, 8);

            // Wheels
            const glowColor = this.vehicleModels.rover.color;
            this.ctx.shadowColor = glowColor;
            this.ctx.shadowBlur = 18;
            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
            this.ctx.strokeStyle = glowColor;
            this.ctx.lineWidth = 3;
            
            [-36, 36].forEach(xOff => {
                this.ctx.beginPath();
                this.ctx.arc(xOff, 14, 22, 0, Math.PI*2);
                this.ctx.fill();
                this.ctx.stroke();
                
                // spokes
                this.ctx.beginPath();
                for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
                    this.ctx.moveTo(xOff, 14);
                    this.ctx.lineTo(xOff + Math.cos(angle - time * 0.8) * 22, 14 + Math.sin(angle - time * 0.8) * 22);
                }
                this.ctx.stroke();
            });

        } else if (modelId === 'glider') {
            // Cyber Glider: Sleek capsule hover-pod
            this.ctx.beginPath();
            this.ctx.moveTo(-50, 6);
            this.ctx.lineTo(-45, -8);
            this.ctx.lineTo(-20, -14);
            this.ctx.lineTo(25, -14);
            this.ctx.lineTo(45, 0);
            this.ctx.lineTo(50, 6);
            this.ctx.lineTo(-50, 6);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();

            // Glass bubble canopy
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1.5;
            this.ctx.shadowBlur = 6;
            this.ctx.beginPath();
            this.ctx.arc(2, -10, 16, Math.PI * 1.05, Math.PI * 1.95);
            this.ctx.stroke();

            // Front glowing sensor eye
            this.ctx.shadowColor = '#00ffcc';
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = '#00ffcc';
            this.ctx.fillRect(40, -1, 4, 3);

            // Wing stabilizer fins
            this.ctx.strokeStyle = this.vehiclePaint;
            this.ctx.lineWidth = 2.5;
            this.ctx.beginPath();
            this.ctx.moveTo(-40, 2);
            this.ctx.lineTo(-55, -2);
            this.ctx.lineTo(-45, 6);
            this.ctx.stroke();

            // Hover Pads (Instead of wheels)
            const glowColor = this.vehicleModels.glider.color;
            this.ctx.shadowColor = glowColor;
            this.ctx.shadowBlur = 15;
            this.ctx.fillStyle = glowColor;
            
            [-36, 36].forEach(xOff => {
                // Hover Pad Disc
                this.ctx.beginPath();
                this.ctx.ellipse(xOff, 12, 16, 4, 0, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Translucent downward light beam
                this.ctx.save();
                const beamGrad = this.ctx.createLinearGradient(xOff, 12, xOff, 28);
                beamGrad.addColorStop(0, 'rgba(224, 176, 255, 0.45)');
                beamGrad.addColorStop(1, 'rgba(224, 176, 255, 0)');
                this.ctx.fillStyle = beamGrad;
                this.ctx.fillRect(xOff - 12, 12, 24, 16);
                this.ctx.restore();
            });

        } else if (modelId === 'cycle') {
            // Proton Cycle: Tron-style light bike
            this.ctx.beginPath();
            this.ctx.moveTo(-48, 8);
            this.ctx.lineTo(-48, 0);
            this.ctx.lineTo(-30, -10);
            this.ctx.lineTo(-10, -16); // seat
            this.ctx.lineTo(15, -16);  // canopy cowl
            this.ctx.lineTo(34, -4);   // front body
            this.ctx.lineTo(48, 8);
            // underbody arches
            this.ctx.lineTo(44, 8);
            this.ctx.arc(36, 10, 21, Math.PI, 0, true);
            this.ctx.lineTo(-26, 8);
            this.ctx.arc(-36, 10, 21, Math.PI, 0, true);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();

            // Cycle cockpit cowl glass
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1.5;
            this.ctx.shadowBlur = 6;
            this.ctx.beginPath();
            this.ctx.moveTo(4, -14);
            this.ctx.lineTo(16, -14);
            this.ctx.lineTo(26, -4);
            this.ctx.lineTo(4, -4);
            this.ctx.closePath();
            this.ctx.stroke();

            // Neon line detail along the body
            this.ctx.strokeStyle = this.vehiclePaint;
            this.ctx.beginPath();
            this.ctx.moveTo(-28, -6);
            this.ctx.lineTo(2, -6);
            this.ctx.lineTo(14, 2);
            this.ctx.stroke();

            // Wheels: Solid neon glowing rings
            const glowColor = this.vehicleModels.cycle.color;
            this.ctx.shadowColor = glowColor;
            this.ctx.shadowBlur = 18;
            this.ctx.strokeStyle = glowColor;
            this.ctx.fillStyle = '#04020a';
            this.ctx.lineWidth = 3.5;

            [-36, 36].forEach(xOff => {
                this.ctx.beginPath();
                this.ctx.arc(xOff, 10, 18, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                
                // Solid inner glow circle
                this.ctx.beginPath();
                this.ctx.arc(xOff, 10, 10, 0, Math.PI * 2);
                this.ctx.stroke();
            });

        } else if (modelId === 'gimbal') {
            // Gimbal Orb-Pod: Center spherical cockpit with connecting side linkages
            const glowColor = this.vehicleModels.gimbal.color;
            
            // Draw central sphere cockpit
            this.ctx.beginPath();
            this.ctx.arc(0, -4, 18, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();

            // Cockpit glass arc
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.arc(0, -4, 14, -Math.PI * 0.7, -Math.PI * 0.1);
            this.ctx.stroke();

            // Central glowing battery/core
            this.ctx.fillStyle = glowColor;
            this.ctx.shadowColor = glowColor;
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(0, -4, 6, 0, Math.PI*2);
            this.ctx.fill();

            // Metal linkage arms extending out
            this.ctx.shadowBlur = 0;
            this.ctx.strokeStyle = this.vehiclePaint;
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.moveTo(-18, -4);
            this.ctx.lineTo(-36, -4);
            this.ctx.moveTo(18, -4);
            this.ctx.lineTo(36, -4);
            this.ctx.stroke();

            // Wheels: Rolling plasma spheres
            this.ctx.shadowColor = glowColor;
            this.ctx.shadowBlur = 18;
            this.ctx.strokeStyle = glowColor;
            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.08)';
            this.ctx.lineWidth = 2.5;

            [-36, 36].forEach(xOff => {
                this.ctx.beginPath();
                this.ctx.arc(xOff, 8, 20, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();

                // Dynamic plasma sparks inside spheres
                this.ctx.beginPath();
                this.ctx.arc(xOff, 8, 8, 0, Math.PI * 2);
                this.ctx.stroke();
                
                this.ctx.beginPath();
                for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
                    this.ctx.moveTo(xOff + Math.cos(angle + time * 1.5) * 8, 8 + Math.sin(angle + time * 1.5) * 8);
                    this.ctx.lineTo(xOff + Math.cos(angle + time * 1.5) * 19, 8 + Math.sin(angle + time * 1.5) * 19);
                }
                this.ctx.stroke();
            });

        } else if (modelId === 'skiff') {
            // Starfighter Skiff: Flying jet bike shape
            const glowColor = this.vehicleModels.skiff.color;

            // Jet Chassis outline
            this.ctx.beginPath();
            this.ctx.moveTo(-54, 4);
            this.ctx.lineTo(-54, -4);  // exhaust nozzle
            this.ctx.lineTo(-44, -12); // tail
            this.ctx.lineTo(-12, -12);
            this.ctx.lineTo(4, -20);   // canopy
            this.ctx.lineTo(24, -20);
            this.ctx.lineTo(44, -4);
            this.ctx.lineTo(54, 4);    // nose
            this.ctx.lineTo(-54, 4);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();

            // Wing detailing
            this.ctx.beginPath();
            this.ctx.moveTo(-20, 2);
            this.ctx.lineTo(-38, -14);
            this.ctx.lineTo(-30, 2);
            this.ctx.stroke();

            // Canopy glass highlight
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(6, -17);
            this.ctx.lineTo(20, -17);
            this.ctx.lineTo(34, -4);
            this.ctx.lineTo(6, -4);
            this.ctx.closePath();
            this.ctx.stroke();

            // Wheels: Shield buffer bubbles (translucent glowing rings)
            this.ctx.shadowColor = glowColor;
            this.ctx.shadowBlur = 15;
            this.ctx.strokeStyle = glowColor;
            this.ctx.fillStyle = 'rgba(255, 128, 0, 0.08)';
            this.ctx.lineWidth = 2.0;

            [-38, 38].forEach(xOff => {
                this.ctx.beginPath();
                this.ctx.arc(xOff, 10, 15, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                
                // Inner buffer rings
                this.ctx.beginPath();
                this.ctx.arc(xOff, 10, 8, 0, Math.PI * 2);
                this.ctx.stroke();
            });

        } else if (modelId === 'ufo') {
            // Chronos Cruiser: Flying saucer (UFO)
            const glowColor = this.vehicleModels.ufo.color;

            // UFO dome top
            this.ctx.beginPath();
            this.ctx.arc(0, -6, 18, Math.PI, 0);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();

            // Glass canopy highlight (inside dome)
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.arc(0, -6, 12, -Math.PI*0.8, -Math.PI*0.2);
            this.ctx.stroke();

            // UFO lower disc platter
            this.ctx.beginPath();
            this.ctx.ellipse(0, 2, 54, 8, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();

            // Rotating perimeter lights
            this.ctx.shadowColor = glowColor;
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = glowColor;
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3 + time * 1.2;
                const px = Math.cos(angle) * 44;
                const py = Math.sin(angle) * 2 + 2;
                this.ctx.beginPath();
                this.ctx.arc(px, py, 3, 0, Math.PI*2);
                this.ctx.fill();
            }

            // Central tractor beam (instead of wheels)
            this.ctx.save();
            const beamGrad = this.ctx.createLinearGradient(0, 8, 0, 32);
            beamGrad.addColorStop(0, 'rgba(255, 0, 255, 0.45)');
            beamGrad.addColorStop(1, 'rgba(255, 0, 255, 0)');
            this.ctx.fillStyle = beamGrad;
            
            this.ctx.beginPath();
            this.ctx.moveTo(-18, 8);
            this.ctx.lineTo(-34, 30);
            this.ctx.lineTo(34, 30);
            this.ctx.lineTo(18, 8);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.restore();

        } else {
            // Cyber SUV: Blocky silhouette
            this.ctx.beginPath();
            this.ctx.moveTo(-52, 12);
            this.ctx.lineTo(-52, -6);
            this.ctx.lineTo(-30, -10);
            this.ctx.lineTo(-12, -28);
            this.ctx.lineTo(24, -28);
            this.ctx.lineTo(48, -4);
            this.ctx.lineTo(54, -4);
            this.ctx.lineTo(54, 12);
            this.ctx.lineTo(44, 12);
            this.ctx.arc(38, 15, 23, Math.PI, 0, true);
            this.ctx.lineTo(-28, 12);
            this.ctx.arc(-38, 15, 23, Math.PI, 0, true);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();

            // Neon Cabin Trim details
            this.ctx.shadowBlur = 8;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(-8, -24);
            this.ctx.lineTo(20, -24);
            this.ctx.lineTo(34, -6);
            this.ctx.lineTo(-8, -6);
            this.ctx.closePath();
            this.ctx.stroke();

            // Wheels
            const glowColor = this.vehicleModels.suv.color;
            this.ctx.shadowColor = glowColor;
            this.ctx.shadowBlur = 18;
            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
            this.ctx.strokeStyle = glowColor;
            this.ctx.lineWidth = 3;
            
            [-38, 38].forEach(xOff => {
                this.ctx.beginPath();
                this.ctx.arc(xOff, 15, 20, 0, Math.PI*2);
                this.ctx.fill();
                this.ctx.stroke();
                
                // spokes
                this.ctx.beginPath();
                for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
                    this.ctx.moveTo(xOff, 15);
                    this.ctx.lineTo(xOff + Math.cos(angle + time) * 20, 15 + Math.sin(angle + time) * 20);
                }
                this.ctx.stroke();
            });

            // Neon engine glow at rear
            this.ctx.shadowColor = '#ff00ff';
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = '#ff00ff';
            this.ctx.fillRect(-52, 2, 5, 5);
        }

        this.ctx.restore();
    }

    drawTerrain(cameraX) {
        this.ctx.save();

        const step = 4; // draw steps (pixels)
        const startX = Math.floor(cameraX) - 50;
        const endX = startX + this.width + 100;

        // Neon coloring based on Stage
        let trackColor = '#00ffcc';
        let gridColor = 'rgba(0, 255, 204, 0.04)';
        
        if (this.activeStage === 'lunar') {
            trackColor = '#ffea00'; // Cyber yellow lunar surface
            gridColor = 'rgba(255, 234, 0, 0.03)';
        } else if (this.activeStage === 'nebula') {
            trackColor = '#ff00ff'; // Neon pink magnetic track
            gridColor = 'rgba(255, 0, 255, 0.04)';
        }

        // 1. Draw solid ground grid underneath
        this.ctx.fillStyle = gridColor;
        this.ctx.beginPath();
        this.ctx.moveTo(startX, 800); // safety bottom boundary

        for (let x = startX; x <= endX; x += step * 3) {
            const y = this.terrain.getHeight(x);
            this.ctx.lineTo(x, y);
        }
        this.ctx.lineTo(endX, 800);
        this.ctx.closePath();
        this.ctx.fill();

        // 2. Draw vertical grid neon lines for cyberpunk feel
        this.ctx.strokeStyle = gridColor;
        this.ctx.lineWidth = 1.0;
        const gridSpacing = 40;
        const firstGridX = Math.floor(startX / gridSpacing) * gridSpacing;
        
        for (let gx = firstGridX; gx <= endX; gx += gridSpacing) {
            const gy = this.terrain.getHeight(gx);
            this.ctx.beginPath();
            this.ctx.moveTo(gx, gy);
            this.ctx.lineTo(gx, gy + 300);
            this.ctx.stroke();
        }

        // 3. Draw horizontal scrolling stripes under the road
        this.ctx.strokeStyle = gridColor;
        this.ctx.lineWidth = 1.5;
        for (let depth = 40; depth <= 200; depth += 40) {
            this.ctx.beginPath();
            let started = false;
            for (let x = startX; x <= endX; x += step * 5) {
                const y = this.terrain.getHeight(x) + depth;
                if (!started) {
                    this.ctx.moveTo(x, y);
                    started = true;
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.stroke();
        }

        // 4. Draw Glowing Neon Crust surface line
        this.ctx.shadowColor = trackColor;
        this.ctx.shadowBlur = 12;
        this.ctx.strokeStyle = trackColor;
        this.ctx.lineWidth = 4;
        
        this.ctx.beginPath();
        let terrainStarted = false;
        for (let x = startX; x <= endX; x += step) {
            const y = this.terrain.getHeight(x);
            if (!terrainStarted) {
                this.ctx.moveTo(x, y);
                terrainStarted = true;
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawItems(cameraX) {
        const startX = cameraX - 50;
        const endX = startX + this.width + 100;
        const items = this.terrain.getItemsInWindow(startX, endX);

        this.ctx.save();
        
        items.forEach(item => {
            if (item.type === 'crystal') {
                // Spin/pulse animation
                const pulse = 1 + Math.sin(performance.now() / 150 + item.x) * 0.12;
                
                this.ctx.shadowColor = '#39ff14';
                this.ctx.shadowBlur = 10;
                this.ctx.strokeStyle = '#39ff14';
                this.ctx.fillStyle = 'rgba(57, 255, 20, 0.25)';
                this.ctx.lineWidth = 2;

                // Diamond shape
                const r = item.radius * pulse;
                this.ctx.beginPath();
                this.ctx.moveTo(item.x, item.y - r);
                this.ctx.lineTo(item.x + r * 0.8, item.y);
                this.ctx.lineTo(item.x, item.y + r);
                this.ctx.lineTo(item.x - r * 0.8, item.y);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
                
                // Draw energy core crystal sparkles
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(item.x - 2, item.y - 2, 4, 4);
            } else if (item.type === 'fuel') {
                // Cylindrical glowing plasma battery cell
                const hover = Math.sin(performance.now() / 200) * 5;
                const iy = item.y + hover;
                
                this.ctx.shadowColor = '#ff00ff';
                this.ctx.shadowBlur = 14;
                
                // Capsule body
                this.ctx.fillStyle = 'rgba(255, 0, 255, 0.25)';
                this.ctx.strokeStyle = '#ff00ff';
                this.ctx.lineWidth = 3;
                
                const w = 24;
                const h = 34;
                this.ctx.beginPath();
                this.ctx.roundRect(item.x - w/2, iy - h/2, w, h, 6);
                this.ctx.fill();
                this.ctx.stroke();

                // Energy level indicator lines
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(item.x - 6, iy - 8, 12, 4);
                this.ctx.fillRect(item.x - 6, iy - 1, 12, 4);
                this.ctx.fillRect(item.x - 6, iy + 6, 12, 4);

                // Small battery cap
                this.ctx.fillStyle = '#ff00ff';
                this.ctx.fillRect(item.x - 4, iy - h/2 - 4, 8, 4);
            }
        });

        this.ctx.restore();
    }

    drawParticles() {
        this.ctx.save();
        this.particles.forEach(p => {
            const lifeRatio = p.life / p.maxLife;
            this.ctx.fillStyle = p.color;
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 8;
            this.ctx.globalAlpha = lifeRatio;
            
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * lifeRatio, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.restore();
    }

    drawVehicle() {
        const chassis = this.vehicle.chassis;
        const fWheel = this.vehicle.frontWheel;
        const rWheel = this.vehicle.rearWheel;
        const modelId = this.vehicle.modelId || 'suv';

        this.ctx.save();

        // 1. Draw Suspensions (coiled neon spring lines)
        this.ctx.shadowBlur = 4;
        this.ctx.lineWidth = 2.5;
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';

        const drawSpring = (attachLocal, wheel) => {
            const cos = Math.cos(chassis.angle);
            const sin = Math.sin(chassis.angle);
            const ax = chassis.x + attachLocal.x * cos - attachLocal.y * sin;
            const ay = chassis.y + attachLocal.x * sin + attachLocal.y * cos;

            const wx = wheel.x;
            const wy = wheel.y;

            // Draw a zig zag pattern for the spring coils
            this.ctx.beginPath();
            this.ctx.moveTo(ax, ay);

            const segments = 9;
            for (let i = 1; i <= segments; i++) {
                const ratio = i / segments;
                const px = ax + (wx - ax) * ratio;
                const py = ay + (wy - ay) * ratio;
                
                // Add lateral oscillation to create the spring coil look
                if (i > 1 && i < segments) {
                    const offsetAmt = 8 * (i % 2 === 0 ? 1 : -1);
                    const normX = -(wy - ay);
                    const normY = (wx - ax);
                    const len = Math.sqrt(normX*normX + normY*normY);
                    
                    this.ctx.lineTo(px + (normX / len) * offsetAmt, py + (normY / len) * offsetAmt);
                } else {
                    this.ctx.lineTo(px, py);
                }
            }
            this.ctx.stroke();
        };

        if (modelId !== 'ufo') {
            drawSpring(this.vehicle.frontAttach, fWheel);
            drawSpring(this.vehicle.rearAttach, rWheel);
        }

        // 2. Draw Chassis (Futuristic Vehicle based on Active Model)
        this.ctx.save();
        this.ctx.translate(chassis.x, chassis.y);
        this.ctx.rotate(chassis.angle);

        // Shadow neon glow setup
        this.ctx.shadowColor = this.vehiclePaint;
        this.ctx.shadowBlur = 18;
        this.ctx.strokeStyle = this.vehiclePaint;
        
        // Solid fill style (tinted translucent glassmorphism body)
        this.ctx.fillStyle = 'rgba(10, 5, 25, 0.85)';
        this.ctx.lineWidth = 3.5;

        if (modelId === 'interceptor') {
            // Neon Interceptor: Low-profile cyberpunk sports car
            this.ctx.beginPath();
            this.ctx.moveTo(-58, 10);
            // Low spoiler
            this.ctx.lineTo(-58, -3);
            this.ctx.lineTo(-44, -10);
            // Roof line
            this.ctx.lineTo(-10, -10);
            this.ctx.lineTo(10, -22); // cockpit slope
            this.ctx.lineTo(34, -22);
            this.ctx.lineTo(46, -6);  // sleek front glass slope
            this.ctx.lineTo(58, -6);
            this.ctx.lineTo(58, 10);
            // Underbody wheel arches
            this.ctx.lineTo(48, 10);
            this.ctx.arc(38, 13, 21, Math.PI, 0, true);
            this.ctx.lineTo(-28, 10);
            this.ctx.arc(-38, 13, 21, Math.PI, 0, true);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();

            // Cockpit glass detailing
            this.ctx.shadowBlur = 6;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(12, -18);
            this.ctx.lineTo(30, -18);
            this.ctx.lineTo(40, -6);
            this.ctx.lineTo(12, -6);
            this.ctx.closePath();
            this.ctx.stroke();

            // Headlight glow
            this.ctx.shadowColor = '#00ffff';
            this.ctx.shadowBlur = 12;
            this.ctx.fillStyle = '#00ffff';
            this.ctx.fillRect(53, -2, 5, 4);

            // Tail light glow
            this.ctx.shadowColor = '#ff0055';
            this.ctx.shadowBlur = 12;
            this.ctx.fillStyle = '#ff0055';
            this.ctx.fillRect(-58, 2, 3, 4);

            // Booster flame
            if (this.vehicle.boosting) {
                this.ctx.shadowColor = '#ff007f';
                this.ctx.shadowBlur = 15;
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.moveTo(-58, 4);
                this.ctx.lineTo(-84 - Math.random() * 20, 1);
                this.ctx.lineTo(-58, -2);
                this.ctx.closePath();
                this.ctx.fill();
            }

        } else if (modelId === 'rover') {
            // Galactic Rover: Bubble dome canopy exploration rover
            this.ctx.beginPath();
            this.ctx.moveTo(-50, 12);
            // Equipment grid/Solar panel base
            this.ctx.lineTo(-50, -4);
            this.ctx.lineTo(-34, -12);
            // Bubble glass cockpit arc (approximated dome shape)
            this.ctx.lineTo(-24, -12);
            // Draw dome top curve
            this.ctx.bezierCurveTo(-14, -34, 18, -34, 26, -10);
            this.ctx.lineTo(42, -4); // nose line
            this.ctx.lineTo(50, 12);
            // Underbody arches
            this.ctx.lineTo(44, 12);
            this.ctx.arc(36, 14, 25, Math.PI, 0, true);
            this.ctx.lineTo(-26, 12);
            this.ctx.arc(-36, 14, 25, Math.PI, 0, true);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();

            // Solar panel details on equipment rack
            this.ctx.strokeStyle = '#00ffcc';
            this.ctx.shadowBlur = 6;
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(-48, -10);
            this.ctx.lineTo(-36, -10);
            this.ctx.stroke();

            // Glass canopy highlight (inside dome)
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.arc(4, -10, 18, -Math.PI*0.8, -Math.PI*0.2);
            this.ctx.stroke();

            // Reactor core inside the base
            this.ctx.fillStyle = '#39ff14';
            this.ctx.shadowColor = '#39ff14';
            this.ctx.shadowBlur = 10;
            this.ctx.fillRect(-15, 0, 14, 8);

            // Double booster flame
            if (this.vehicle.boosting) {
                this.ctx.shadowColor = '#39ff14';
                this.ctx.shadowBlur = 16;
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.moveTo(-50, 6);
                this.ctx.lineTo(-76 - Math.random() * 20, 6);
                this.ctx.lineTo(-50, 2);
                this.ctx.moveTo(-50, -2);
                this.ctx.lineTo(-76 - Math.random() * 20, -2);
                this.ctx.lineTo(-50, -6);
                this.ctx.closePath();
                this.ctx.fill();
            }

        } else if (modelId === 'glider') {
            // Cyber Glider: Sleek capsule hover-pod
            this.ctx.beginPath();
            this.ctx.moveTo(-50, 6);
            this.ctx.lineTo(-45, -8);
            this.ctx.lineTo(-20, -14);
            this.ctx.lineTo(25, -14);
            this.ctx.lineTo(45, 0);
            this.ctx.lineTo(50, 6);
            this.ctx.lineTo(-50, 6);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();

            // Glass bubble canopy
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1.5;
            this.ctx.shadowBlur = 6;
            this.ctx.beginPath();
            this.ctx.arc(2, -10, 16, Math.PI * 1.05, Math.PI * 1.95);
            this.ctx.stroke();

            // Front glowing sensor eye
            this.ctx.shadowColor = '#00ffcc';
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = '#00ffcc';
            this.ctx.fillRect(40, -1, 4, 3);

            // Wing stabilizer fins
            this.ctx.strokeStyle = this.vehiclePaint;
            this.ctx.lineWidth = 2.5;
            this.ctx.beginPath();
            this.ctx.moveTo(-40, 2);
            this.ctx.lineTo(-55, -2);
            this.ctx.lineTo(-45, 6);
            this.ctx.stroke();

            // Booster flame (Electric Violet)
            if (this.vehicle.boosting) {
                this.ctx.shadowColor = '#e0b0ff';
                this.ctx.shadowBlur = 15;
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.moveTo(-50, 3);
                this.ctx.lineTo(-76 - Math.random() * 20, 1);
                this.ctx.lineTo(-50, -1);
                this.ctx.closePath();
                this.ctx.fill();
            }

        } else if (modelId === 'cycle') {
            // Proton Cycle: Tron-style light bike
            this.ctx.beginPath();
            this.ctx.moveTo(-48, 8);
            this.ctx.lineTo(-48, 0);
            this.ctx.lineTo(-30, -10);
            this.ctx.lineTo(-10, -16);
            this.ctx.lineTo(15, -16);
            this.ctx.lineTo(34, -4);
            this.ctx.lineTo(48, 8);
            this.ctx.lineTo(44, 8);
            this.ctx.arc(36, 10, 21, Math.PI, 0, true);
            this.ctx.lineTo(-26, 8);
            this.ctx.arc(-36, 10, 21, Math.PI, 0, true);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();

            // Cycle cockpit cowl glass
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1.5;
            this.ctx.shadowBlur = 6;
            this.ctx.beginPath();
            this.ctx.moveTo(4, -14);
            this.ctx.lineTo(16, -14);
            this.ctx.lineTo(26, -4);
            this.ctx.lineTo(4, -4);
            this.ctx.closePath();
            this.ctx.stroke();

            // Neon line detail along the body
            this.ctx.strokeStyle = this.vehiclePaint;
            this.ctx.beginPath();
            this.ctx.moveTo(-28, -6);
            this.ctx.lineTo(2, -6);
            this.ctx.lineTo(14, 2);
            this.ctx.stroke();

            // Booster flame (Neon Red)
            if (this.vehicle.boosting) {
                this.ctx.shadowColor = '#ff0033';
                this.ctx.shadowBlur = 15;
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.moveTo(-48, 5);
                this.ctx.lineTo(-74 - Math.random() * 18, 3);
                this.ctx.lineTo(-48, 1);
                this.ctx.closePath();
                this.ctx.fill();
            }

        } else if (modelId === 'gimbal') {
            // Gimbal Orb-Pod: Center spherical cockpit with connecting side linkages
            const glowColor = this.vehicleModels.gimbal.color;
            
            // Draw central sphere cockpit
            this.ctx.beginPath();
            this.ctx.arc(0, -4, 18, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();

            // Cockpit glass arc
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.arc(0, -4, 14, -Math.PI * 0.7, -Math.PI * 0.1);
            this.ctx.stroke();

            // Central glowing battery/core
            this.ctx.fillStyle = glowColor;
            this.ctx.shadowColor = glowColor;
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(0, -4, 6, 0, Math.PI*2);
            this.ctx.fill();

            // Metal linkage arms extending out
            this.ctx.shadowBlur = 0;
            this.ctx.strokeStyle = this.vehiclePaint;
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.moveTo(-18, -4);
            this.ctx.lineTo(-36, -4);
            this.ctx.moveTo(18, -4);
            this.ctx.lineTo(36, -4);
            this.ctx.stroke();

            // Downward boost jets under the side linkages
            if (this.vehicle.boosting) {
                this.ctx.shadowColor = '#00ffff';
                this.ctx.shadowBlur = 15;
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                // Left arm down flame
                this.ctx.moveTo(-36, -4);
                this.ctx.lineTo(-36 + (Math.random() - 0.5) * 6, 20 + Math.random() * 15);
                this.ctx.lineTo(-30, -4);
                // Right arm down flame
                this.ctx.moveTo(30, -4);
                this.ctx.lineTo(30 + (Math.random() - 0.5) * 6, 20 + Math.random() * 15);
                this.ctx.lineTo(36, -4);
                this.ctx.closePath();
                this.ctx.fill();
            }

        } else if (modelId === 'skiff') {
            // Starfighter Skiff: Flying jet bike shape
            const glowColor = this.vehicleModels.skiff.color;

            // Jet Chassis outline
            this.ctx.beginPath();
            this.ctx.moveTo(-54, 4);
            this.ctx.lineTo(-54, -4);  // exhaust nozzle
            this.ctx.lineTo(-44, -12); // tail
            this.ctx.lineTo(-12, -12);
            this.ctx.lineTo(4, -20);   // canopy
            this.ctx.lineTo(24, -20);
            this.ctx.lineTo(44, -4);
            this.ctx.lineTo(54, 4);    // nose
            this.ctx.lineTo(-54, 4);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();

            // Wing detailing
            this.ctx.beginPath();
            this.ctx.moveTo(-20, 2);
            this.ctx.lineTo(-38, -14);
            this.ctx.lineTo(-30, 2);
            this.ctx.stroke();

            // Canopy glass highlight
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(6, -17);
            this.ctx.lineTo(20, -17);
            this.ctx.lineTo(34, -4);
            this.ctx.lineTo(6, -4);
            this.ctx.closePath();
            this.ctx.stroke();

            // Dual booster flames (Fusion Orange)
            if (this.vehicle.boosting) {
                this.ctx.shadowColor = glowColor;
                this.ctx.shadowBlur = 16;
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                // upper nozzle
                this.ctx.moveTo(-54, -1);
                this.ctx.lineTo(-80 - Math.random() * 20, -3);
                this.ctx.lineTo(-54, -5);
                // lower nozzle
                this.ctx.moveTo(-54, 3);
                this.ctx.lineTo(-80 - Math.random() * 20, 1);
                this.ctx.lineTo(-54, -1);
                this.ctx.closePath();
                this.ctx.fill();
            }

        } else if (modelId === 'ufo') {
            // Chronos Cruiser: Flying saucer (UFO)
            const glowColor = this.vehicleModels.ufo.color;
            const time = performance.now() / 1000;

            // UFO dome top
            this.ctx.beginPath();
            this.ctx.arc(0, -6, 18, Math.PI, 0);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();

            // Glass canopy highlight (inside dome)
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.arc(0, -6, 12, -Math.PI*0.8, -Math.PI*0.2);
            this.ctx.stroke();

            // UFO lower disc platter
            this.ctx.beginPath();
            this.ctx.ellipse(0, 2, 54, 8, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();

            // Rotating perimeter lights
            this.ctx.shadowColor = glowColor;
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = glowColor;
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3 + time * 1.2;
                const px = Math.cos(angle) * 44;
                const py = Math.sin(angle) * 2 + 2;
                this.ctx.beginPath();
                this.ctx.arc(px, py, 3, 0, Math.PI*2);
                this.ctx.fill();
            }

            // Central tractor beam light cone under the saucer
            this.ctx.save();
            const beamGrad = this.ctx.createLinearGradient(0, 4, 0, 45);
            beamGrad.addColorStop(0, 'rgba(255, 0, 255, 0.45)');
            beamGrad.addColorStop(1, 'rgba(255, 0, 255, 0)');
            this.ctx.fillStyle = beamGrad;
            this.ctx.beginPath();
            this.ctx.moveTo(-18, 4);
            this.ctx.lineTo(-32, 42);
            this.ctx.lineTo(32, 42);
            this.ctx.lineTo(18, 4);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.restore();

            // Vertical booster nozzle downward flame
            if (this.vehicle.boosting) {
                this.ctx.shadowColor = '#ff00ff';
                this.ctx.shadowBlur = 20;
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.moveTo(-10, 4);
                this.ctx.lineTo(0, 36 + Math.random() * 20);
                this.ctx.lineTo(10, 4);
                this.ctx.closePath();
                this.ctx.fill();
            }

        } else {
            // Cyber SUV: Original blocky design
            this.ctx.beginPath();
            // Rear cargo bumper
            this.ctx.moveTo(-52, 12);
            this.ctx.lineTo(-52, -6);
            // Roof ascent angle
            this.ctx.lineTo(-30, -10);
            this.ctx.lineTo(-12, -28); // high windshield angle
            // Roof line
            this.ctx.lineTo(24, -28);
            // Bumper hood slope
            this.ctx.lineTo(48, -4);
            this.ctx.lineTo(54, -4);
            // Front nose bumper
            this.ctx.lineTo(54, 12);
            // Underbody wheel arches
            this.ctx.lineTo(44, 12);
            this.ctx.arc(38, 15, 23, Math.PI, 0, true); // Front arch
            this.ctx.lineTo(-28, 12);
            this.ctx.arc(-38, 15, 23, Math.PI, 0, true); // Rear arch
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();

            // Neon Cabin Trim details
            this.ctx.shadowBlur = 6;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            // Front window outline
            this.ctx.moveTo(-8, -24);
            this.ctx.lineTo(20, -24);
            this.ctx.lineTo(34, -6);
            this.ctx.lineTo(-8, -6);
            this.ctx.closePath();
            this.ctx.stroke();

            this.ctx.beginPath();
            // Back window outline
            this.ctx.moveTo(-26, -9);
            this.ctx.lineTo(-12, -24);
            this.ctx.lineTo(-11, -24);
            this.ctx.lineTo(-11, -6);
            this.ctx.lineTo(-26, -6);
            this.ctx.closePath();
            this.ctx.stroke();

            // Glowing battery module inside cargo
            this.ctx.fillStyle = '#ff00ff';
            this.ctx.shadowColor = '#ff00ff';
            this.ctx.shadowBlur = 10;
            this.ctx.fillRect(-45, -3, 12, 10);
            
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(-42, 0, 6, 4);

            // Headlight neon laser projection
            this.ctx.shadowColor = '#00ffff';
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = '#00ffff';
            this.ctx.fillRect(49, -2, 5, 4);

            // Tail lights
            this.ctx.shadowColor = '#ff0055';
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = '#ff0055';
            this.ctx.fillRect(-52, -2, 3, 5);

            // Active Booster Engine flame
            if (this.vehicle.boosting) {
                this.ctx.shadowColor = '#00ffff';
                this.ctx.shadowBlur = 15;
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.moveTo(-52, 4);
                this.ctx.lineTo(-78 - Math.random() * 20, 0);
                this.ctx.lineTo(-52, -4);
                this.ctx.closePath();
                this.ctx.fill();
            }
        }

        this.ctx.restore();

        // 3. Draw Wheels (Front and Rear)
        const drawWheel = (wheel) => {
            const modelConfig = this.vehicleModels[modelId] || this.vehicleModels.suv;
            const themeColor = modelConfig.color || '#00ffff';

            // UFO wheels are completely invisible
            if (modelId === 'ufo') {
                return;
            }

            this.ctx.save();
            this.ctx.translate(wheel.x, wheel.y);

            if (modelId === 'glider') {
                // Cyber Glider Hover pads (not rotating, drawn flat)
                this.ctx.shadowColor = themeColor;
                this.ctx.shadowBlur = 14;
                this.ctx.fillStyle = themeColor;
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, wheel.radius * 1.0, 4, 0, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Project downward light particles / streams
                if (Math.random() < 0.25) {
                    this.particles.push({
                        x: wheel.x + (Math.random() - 0.5) * 16,
                        y: wheel.y + 4,
                        vx: (Math.random() - 0.5) * 20,
                        vy: Math.random() * 50 + 30,
                        size: Math.random() * 2 + 1,
                        color: themeColor,
                        life: 0.3,
                        maxLife: 0.3
                    });
                }
            } else if (modelId === 'cycle') {
                // Tron-style Solid Neon Wheel (visually rotating, but rim is solid)
                this.ctx.rotate(wheel.omega * 0.016 * 60);
                this.ctx.shadowColor = themeColor;
                this.ctx.shadowBlur = 18;
                this.ctx.strokeStyle = themeColor;
                this.ctx.fillStyle = '#04020a';
                this.ctx.lineWidth = 4;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, wheel.radius - 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();

                // Add a small rotation indicator stripe
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2.0;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, wheel.radius - 6, 0, Math.PI / 3);
                this.ctx.stroke();
            } else if (modelId === 'gimbal') {
                // Rolling Plasma Orb
                this.ctx.rotate(wheel.omega * 0.016 * 60);
                this.ctx.shadowColor = themeColor;
                this.ctx.shadowBlur = 20;
                this.ctx.strokeStyle = themeColor;
                this.ctx.fillStyle = 'rgba(0, 255, 255, 0.05)';
                this.ctx.lineWidth = 2.5;

                this.ctx.beginPath();
                this.ctx.arc(0, 0, wheel.radius - 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();

                // Inner core
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
                this.ctx.stroke();

                // Electric arcs
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 1.0;
                this.ctx.beginPath();
                for (let i = 0; i < 3; i++) {
                    const angle = (i * Math.PI * 2) / 3;
                    const rx = Math.cos(angle) * 8;
                    const ry = Math.sin(angle) * 8;
                    const tx = Math.cos(angle + (Math.random() - 0.5) * 0.4) * (wheel.radius - 3);
                    const ty = Math.sin(angle + (Math.random() - 0.5) * 0.4) * (wheel.radius - 3);
                    this.ctx.moveTo(rx, ry);
                    this.ctx.lineTo(tx, ty);
                }
                this.ctx.stroke();
            } else if (modelId === 'skiff') {
                // Pulsing Shield Bubbles (semi-transparent glowing orb)
                const pulse = 1.0 + Math.sin(performance.now() / 100) * 0.06;
                this.ctx.shadowColor = themeColor;
                this.ctx.shadowBlur = 15;
                this.ctx.strokeStyle = themeColor;
                this.ctx.fillStyle = 'rgba(255, 128, 0, 0.05)';
                this.ctx.lineWidth = 2.0;

                this.ctx.beginPath();
                this.ctx.arc(0, 0, wheel.radius * pulse, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();

                // Inner concentric bubble
                this.ctx.beginPath();
                this.ctx.arc(0, 0, wheel.radius * 0.5 * pulse, 0, Math.PI * 2);
                this.ctx.stroke();
            } else {
                // Standard spoke wheels (SUV, Interceptor, Rover)
                this.ctx.rotate(wheel.omega * 0.016 * 60);
                this.ctx.shadowColor = themeColor;
                this.ctx.shadowBlur = 16;
                this.ctx.lineWidth = 3.5;
                
                this.ctx.fillStyle = '#04020a';
                this.ctx.strokeStyle = themeColor;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, wheel.radius - 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();

                this.ctx.shadowBlur = 8;
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 1.5;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
                this.ctx.stroke();

                this.ctx.strokeStyle = themeColor;
                this.ctx.lineWidth = 2.0;
                this.ctx.beginPath();
                for (let i = 0; i < 4; i++) {
                    const angle = (i * Math.PI) / 2;
                    this.ctx.moveTo(Math.cos(angle) * 10, Math.sin(angle) * 10);
                    this.ctx.lineTo(Math.cos(angle) * (wheel.radius - 2), Math.sin(angle) * (wheel.radius - 2));
                }
                this.ctx.stroke();

                this.ctx.shadowBlur = 0;
                this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
                    this.ctx.moveTo(Math.cos(angle) * (wheel.radius - 2), Math.sin(angle) * (wheel.radius - 2));
                    this.ctx.lineTo(Math.cos(angle) * wheel.radius, Math.sin(angle) * wheel.radius);
                }
                this.ctx.stroke();
            }

            this.ctx.restore();
        };

        drawWheel(fWheel);
        drawWheel(rWheel);

        this.ctx.restore();
    }

    drawHUD() {
        this.ctx.save();
        
        // 1. Crystal Counter
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = "bold 20px 'Orbitron', sans-serif";
        this.ctx.shadowColor = '#39ff14';
        this.ctx.shadowBlur = 8;
        this.ctx.fillText(`EC: ${this.crystals}`, 30, 45);

        // 2. Distance Meter
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 8;
        this.ctx.fillText(`DIST: ${Math.floor(this.distance)}m`, 30, 80);

        // 3. Stage Display
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.font = "bold 14px 'Orbitron', sans-serif";
        this.ctx.shadowBlur = 0;
        this.ctx.fillText(`STAGE: ${this.activeStage.toUpperCase()}`, 30, 110);

        // 4. Battery / Shield Energy Bar Centered at the bottom
        const barW = 240;
        const barH = 12;
        const bx = this.width / 2 - barW / 2; // Center horizontally
        
        // Stack Y coordinates depending on if Thruster is unlocked
        const hasThruster = this.upgrades.thrusters > 0;
        const by = hasThruster ? this.height - 52 : this.height - 35;

        this.ctx.fillStyle = 'rgba(255, 0, 255, 0.15)';
        this.ctx.strokeStyle = '#ff00ff';
        this.ctx.shadowColor = '#ff00ff';
        this.ctx.shadowBlur = 8;
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.roundRect(bx, by, barW, barH, 4);
        this.ctx.fill();
        this.ctx.stroke();

        const fuelRatio = this.vehicle.fuel / 100;
        if (fuelRatio > 0) {
            this.ctx.fillStyle = '#ff00ff';
            this.ctx.beginPath();
            this.ctx.roundRect(bx + 2, by + 2, (barW - 4) * fuelRatio, barH - 4, 2);
            this.ctx.fill();
        }
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = "bold 9px 'Orbitron', sans-serif";
        this.ctx.shadowBlur = 0;
        this.ctx.textAlign = 'center';
        this.ctx.fillText("SHIELD BATTERY", this.width / 2, by - 5);

        // 5. Thruster Booster Bar (Stacked below Battery in the center bottom)
        if (hasThruster) {
            const tby = this.height - 26;

            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.15)';
            this.ctx.strokeStyle = '#00ffff';
            this.ctx.shadowColor = '#00ffff';
            this.ctx.shadowBlur = 8;
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.roundRect(bx, tby, barW, barH, 4);
            this.ctx.fill();
            this.ctx.stroke();

            const boostRatio = this.vehicle.thrusterFuel / 100;
            if (boostRatio > 0) {
                this.ctx.fillStyle = '#00ffff';
                this.ctx.beginPath();
                this.ctx.roundRect(bx + 2, tby + 2, (barW - 4) * boostRatio, barH - 4, 2);
                this.ctx.fill();
            }
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = "bold 9px 'Orbitron', sans-serif";
            this.ctx.shadowBlur = 0;
            this.ctx.fillText("THRUSTER PLASMA CHARGE", this.width / 2, tby - 5);
        }
        this.ctx.textAlign = 'left'; // restore alignment default

        // 6. Stunts / Float notifications (Flips, Big air, Crystals collected)
        if (this.scoreNotification && this.scoreNotificationTimer > 0) {
            this.ctx.fillStyle = '#39ff14';
            this.ctx.font = "bold 26px 'Orbitron', sans-serif";
            this.ctx.shadowColor = '#39ff14';
            this.ctx.shadowBlur = 12;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.scoreNotification, this.width / 2, 140);
            this.ctx.textAlign = 'left'; // restore
            this.ctx.shadowBlur = 0;
        }

        this.ctx.restore();
    }
}

// Instantiate and start immediately
window.game = new SciFiGame();
