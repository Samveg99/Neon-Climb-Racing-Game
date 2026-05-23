// Sci-Fi Hill Climb Racing - Procedural Terrain & Item Spawner
class SciFiTerrain {
    constructor(stageType = 'cyberpunk') {
        this.stageType = stageType; // 'cyberpunk', 'lunar', 'nebula'
        this.chunkSize = 250;       // Chunk size for item generation
        
        // Cache for collected items to avoid spawning them again
        this.collectedItems = new Set();
    }

    // Get terrain height y at world position x
    getHeight(x) {
        // Flat starting zone for safety
        if (x < 300) {
            return 550;
        }

        // Smoother, more gradual difficulty progression capped at 1.5
        const difficulty = Math.min(1.5, 1.0 + (x / 15000));
        
        switch (this.stageType) {
            case 'lunar': // Low gravity, cratered terrain
                return this.getLunarHeight(x, difficulty);
            case 'nebula': // Heavy gravity, deep curves and vertical loops/waves
                return this.getNebulaHeight(x, difficulty);
            case 'cyberpunk':
            default: // Cyberpunk neon city grid
                return this.getCyberpunkHeight(x, difficulty);
        }
    }

    getCyberpunkHeight(x, diff) {
        const base = 500;
        // Large sweeping hills (longer wavelength)
        const wave1 = Math.sin(x / 750) * 90 * diff;
        // Medium bumps (longer wavelength)
        const wave2 = Math.sin(x / 300) * 25 * diff;
        // High-frequency road noise (gentler)
        const wave3 = Math.sin(x / 80) * 4;
        
        // Occasional smooth launch ramp for jumps
        let ramp = 0;
        const rampFreq = x % 3000;
        if (rampFreq > 2200 && rampFreq < 2600) {
            const t = (rampFreq - 2200) / 400; // wider ramp
            ramp = -Math.sin(t * Math.PI) * 75 * diff; // lower amplitude
        }

        return base + wave1 + wave2 + wave3 + ramp;
    }

    getLunarHeight(x, diff) {
        const base = 520;
        // Sweeping low-g crater ridges (smoother wavelength)
        const wave1 = Math.cos(x / 900) * 110 * diff;
        // Heavy craters (redesigned as a smooth climbable bowl, no vertical cliffs)
        let crater = 0;
        const craterVal = Math.sin(x / 550);
        if (craterVal < -0.4) {
            const t = (craterVal + 0.4) / 0.6;
            crater = t * t * 130 * diff;
        }
        
        // Bumpy rocky noise
        const wave3 = Math.sin(x / 40) * 5 + Math.cos(x / 20) * 2;

        return base + wave1 + crater + wave3;
    }

    getNebulaHeight(x, diff) {
        const base = 480;
        // Massive, undulating planetary rollers (longer wavelength)
        const wave1 = Math.sin(x / 700) * 110 * diff;
        // Sharp peaks and valleys (smoothed)
        const wave2 = Math.sin(x / 250) * 35 * diff;
        // Intense frequency washboard bumps (gentler)
        const wave3 = Math.cos(x / 55) * 6;

        // Occasional vertical climb loops (very gradual)
        let magneticRise = 0;
        if (x > 2000) {
            magneticRise = Math.sin(x / 2000) * 50;
        }

        return base + wave1 + wave2 + wave3 + magneticRise;
    }

    // Get height, slope normal, and tangent vectors at world position x
    getTerrainInfo(x) {
        const y = this.getHeight(x);
        
        // Sample surrounding points to calculate tangent and normal
        const delta = 2.0;
        const yLeft = this.getHeight(x - delta);
        const yRight = this.getHeight(x + delta);
        
        // Tangent vector along terrain slope
        const tx = delta * 2;
        const ty = yRight - yLeft;
        const tLen = Math.sqrt(tx * tx + ty * ty);
        
        const tangentX = tx / tLen;
        const tangentY = ty / tLen;
        
        // Normal vector pointing UP (towards negative Y in screen space)
        // Normal is (-tangentY, tangentX) or (tangentY, -tangentX)
        // Since Y is down, -tangentX means upward y force.
        const normalX = tangentY;
        const normalY = -tangentX;

        return {
            y: y,
            nx: normalX,
            ny: normalY,
            tx: tangentX,
            ty: tangentY
        };
    }

    // Deterministically get items in a visible window [startX, endX]
    getItemsInWindow(startX, endX) {
        const items = [];
        
        // Pad the window slightly to avoid pop-in
        const startChunk = Math.floor((startX - 200) / this.chunkSize);
        const endChunk = Math.ceil((endX + 200) / this.chunkSize);

        for (let c = startChunk; c <= endChunk; c++) {
            if (c < 2) continue; // Start zone is empty

            // Deterministic hash based on chunk index
            const hash = this.getHash(c);
            
            // Chunk start X coordinate
            const chunkBaseX = c * this.chunkSize;

            if (hash < 0.12) {
                // Battery cell (fuel tank)
                const itemId = `fuel_${c}`;
                if (!this.collectedItems.has(itemId)) {
                    const x = chunkBaseX + this.chunkSize / 2;
                    const y = this.getHeight(x) - 75;
                    items.push({
                        id: itemId,
                        type: 'fuel',
                        x: x,
                        y: y,
                        radius: 20
                    });
                }
            } else if (hash < 0.60) {
                // String of 3 energy crystals (coins)
                for (let i = 0; i < 4; i++) {
                    const itemId = `crystal_${c}_${i}`;
                    if (!this.collectedItems.has(itemId)) {
                        const x = chunkBaseX + 40 + i * 45;
                        // Float in a gentle curve above terrain
                        const hoverHeight = 60 + Math.sin(i / 1.5) * 15;
                        const y = this.getHeight(x) - hoverHeight;
                        items.push({
                            id: itemId,
                            type: 'crystal',
                            x: x,
                            y: y,
                            radius: 12,
                            value: 100
                        });
                    }
                }
            }
            // Other hashes are empty zones
        }

        return items;
    }

    collectItem(id) {
        this.collectedItems.add(id);
    }

    reset() {
        this.collectedItems.clear();
    }

    getHash(seed) {
        const x = Math.sin(seed * 12.9898) * 43758.5453;
        return x - Math.floor(x);
    }
}

// Export singleton/class
window.SciFiTerrain = SciFiTerrain;
