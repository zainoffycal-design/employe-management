// Sound utility functions for the task manager
class SoundManager {
  constructor() {
    this.audioContext = null;
    this.sounds = {};
    this.volume = 0.3;
    this.enabled = true;
  }

  // Initialize audio context
  init() {
    if (typeof window !== 'undefined' && window.AudioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  // Generate a simple tone
  generateTone(frequency, duration, type = 'sine') {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Play different sounds for different actions
  playDrop() {
    if (!this.enabled) return;
    this.generateTone(800, 0.1, 'sine');
  }

  playSuccess() {
    if (!this.enabled) return;
    this.generateTone(523, 0.1, 'sine');
    setTimeout(() => this.generateTone(659, 0.1, 'sine'), 100);
    setTimeout(() => this.generateTone(784, 0.2, 'sine'), 200);
  }

  playMove() {
    if (!this.enabled) return;
    
    // More satisfying progress sound with a brief ascending pattern
    this.generateTone(400, 0.1, 'triangle');
    setTimeout(() => this.generateTone(500, 0.1, 'triangle'), 100);
    setTimeout(() => this.generateTone(600, 0.15, 'triangle'), 200);
  }

  playError() {
    if (!this.enabled) return;
    this.generateTone(200, 0.2, 'sawtooth');
    setTimeout(() => this.generateTone(150, 0.2, 'sawtooth'), 200);
  }

  playComplete() {
    if (!this.enabled) return;
    
    // More celebratory completion sound with ascending notes
    this.generateTone(523, 0.15, 'sine'); // C
    setTimeout(() => this.generateTone(659, 0.15, 'sine'), 150); // E
    setTimeout(() => this.generateTone(784, 0.15, 'sine'), 300); // G
    setTimeout(() => this.generateTone(1047, 0.2, 'sine'), 450); // C (high)
    setTimeout(() => this.generateTone(1319, 0.3, 'sine'), 650); // E (high)
  }

  // Set volume (0-1)
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  // Enable/disable sounds
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  // Toggle sound
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

// Create a singleton instance
const soundManager = new SoundManager();

// Initialize when the module is loaded
if (typeof window !== 'undefined') {
  soundManager.init();
}

export default soundManager; 