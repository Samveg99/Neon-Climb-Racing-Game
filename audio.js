// Sci-Fi Hill Climb Racing - Synthesized Audio Engine using Web Audio API
class SciFiAudioEngine {
    constructor() {
        this.ctx = null;
        this.initialized = false;
        
        // Engine Nodes
        this.engineOsc1 = null;
        this.engineOsc2 = null;
        this.engineFilter = null;
        this.engineGain = null;
        
        // Thruster Nodes
        this.thrusterNoise = null;
        this.thrusterFilter = null;
        this.thrusterGain = null;
        
        // Master Gain
        this.masterGain = null;
        this.isMuted = false;
    }

    init() {
        if (this.initialized) return;
        
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContextClass();
            
            // Master gain node
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.5;
            this.masterGain.connect(this.ctx.destination);
            
            this.setupEngine();
            this.setupThruster();
            
            this.initialized = true;
            console.log("Sci-Fi Audio Engine Initialized successfully.");
        } catch (e) {
            console.error("Failed to initialize Web Audio API:", e);
        }
    }

    setupEngine() {
        // Deep synth engine hum using two oscillators (sawtooth and triangle)
        this.engineOsc1 = this.ctx.createOscillator();
        this.engineOsc1.type = 'sawtooth';
        this.engineOsc1.frequency.value = 45; // base freq
        
        this.engineOsc2 = this.ctx.createOscillator();
        this.engineOsc2.type = 'triangle';
        this.engineOsc2.frequency.value = 45.5; // slight detune
        
        // Lowpass filter to make the engine sound beefy and futuristic, not buzzy
        this.engineFilter = this.ctx.createBiquadFilter();
        this.engineFilter.type = 'lowpass';
        this.engineFilter.frequency.value = 180;
        this.engineFilter.Q.value = 4;
        
        // Engine gain
        this.engineGain = this.ctx.createGain();
        this.engineGain.gain.value = 0.0; // start silent
        
        // Connections
        this.engineOsc1.connect(this.engineFilter);
        this.engineOsc2.connect(this.engineFilter);
        this.engineFilter.connect(this.engineGain);
        this.engineGain.connect(this.masterGain);
        
        // Start oscillators
        this.engineOsc1.start(0);
        this.engineOsc2.start(0);
    }

    setupThruster() {
        // Create noise buffer for thruster sound
        const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        this.thrusterNoise = this.ctx.createBufferSource();
        this.thrusterNoise.buffer = noiseBuffer;
        this.thrusterNoise.loop = true;
        
        // Bandpass filter to make it sound like rushing exhaust plasma
        this.thrusterFilter = this.ctx.createBiquadFilter();
        this.thrusterFilter.type = 'bandpass';
        this.thrusterFilter.frequency.value = 350;
        this.thrusterFilter.Q.value = 1.5;
        
        // Thruster gain
        this.thrusterGain = this.ctx.createGain();
        this.thrusterGain.gain.value = 0.0; // start silent
        
        // Connect
        this.thrusterNoise.connect(this.thrusterFilter);
        this.thrusterFilter.connect(this.thrusterGain);
        this.thrusterGain.connect(this.masterGain);
        
        this.thrusterNoise.start(0);
    }

    // Update engine sound based on vehicle speed/RPM and accelerator load
    updateEngine(rpm, load) {
        if (!this.initialized || this.isMuted) return;
        
        // Resume context if suspended (browser security)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        
        // Map RPM (0 to 1) to frequency (40Hz to 160Hz)
        const baseFreq = 40 + rpm * 140;
        const now = this.ctx.currentTime;
        
        this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.05);
        this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.01, now, 0.05);
        
        // Filter frequency sweeps up with RPM and throttle load
        const filterCutoff = 130 + rpm * 280 + load * 100;
        this.engineFilter.frequency.setTargetAtTime(filterCutoff, now, 0.05);
        
        // Volume depends on load and RPM
        const targetVol = 0.15 + load * 0.15 + rpm * 0.1;
        this.engineGain.gain.setTargetAtTime(targetVol, now, 0.05);
    }

    setEngineActive(active) {
        if (!this.initialized || this.isMuted) return;
        const now = this.ctx.currentTime;
        this.engineGain.gain.setTargetAtTime(active ? 0.15 : 0.0, now, 0.1);
    }

    updateThruster(active, intensity = 1.0) {
        if (!this.initialized || this.isMuted) return;
        const now = this.ctx.currentTime;
        const targetVol = active ? 0.25 * intensity : 0.0;
        this.thrusterGain.gain.setTargetAtTime(targetVol, now, 0.08);
        
        // Sweep thruster pitch slightly based on intensity
        const cutoff = 300 + intensity * 400;
        this.thrusterFilter.frequency.setTargetAtTime(cutoff, now, 0.1);
    }

    // Play a cyber-thud when the chassis bumper hits the ground
    playBump(intensity = 1.0) {
        if (!this.initialized || this.isMuted) return;
        const now = this.ctx.currentTime;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, now);
        
        // Volume depends on impact intensity (clamped to max 0.3)
        const vol = Math.min(0.3, 0.1 * intensity);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.15);
    }

    // Play a shiny sci-fi crystal collection chime
    playCrystal() {
        if (!this.initialized || this.isMuted) return;
        const now = this.ctx.currentTime;
        
        // Double sine wave chimes (harmonic interval)
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now); // A5
        osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.15); // A6
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1109, now); // C#6
        osc2.frequency.exponentialRampToValueAtTime(2218, now + 0.15); // C#7
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.masterGain);
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.3);
        osc2.stop(now + 0.3);
    }

    // Play a cool cyberpunk explosion for crashes
    playCrash() {
        if (!this.initialized || this.isMuted) return;
        const now = this.ctx.currentTime;
        
        // Low boom oscillator
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.6);
        
        // Noise burst for debris crash
        const bufferSize = this.ctx.sampleRate * 0.8;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        const noiseNode = this.ctx.createBufferSource();
        noiseNode.buffer = noiseBuffer;
        
        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(300, now);
        lowpass.frequency.exponentialRampToValueAtTime(30, now + 0.6);
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        
        osc.connect(gain);
        noiseNode.connect(lowpass);
        lowpass.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(now);
        noiseNode.start(now);
        
        osc.stop(now + 0.8);
        noiseNode.stop(now + 0.8);
    }

    // Upgrade click sound (synthesized filter sweep)
    playUpgrade() {
        if (!this.initialized || this.isMuted) return;
        const now = this.ctx.currentTime;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.25);
        
        const bandpass = this.ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.setValueAtTime(200, now);
        bandpass.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
        bandpass.Q.value = 2.0;
        
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        osc.connect(bandpass);
        bandpass.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.3);
    }

    // Simple ui click
    playClick() {
        if (!this.initialized || this.isMuted) return;
        const now = this.ctx.currentTime;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(300, now + 0.05);
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.08);
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0.0 : 0.5;
        }
        return this.isMuted;
    }
}

// Export singleton
window.audioEngine = new SciFiAudioEngine();
