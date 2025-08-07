
class SoundManager {
  constructor() {
    this.audioContext = null;
    this.sounds = {};
    this.volume = 0.3;
    this.enabled = true;
  }

  init() {
    if (typeof window !== 'undefined' && window.AudioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

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
    this.generateTone(523, 0.15, 'sine');
    setTimeout(() => this.generateTone(659, 0.15, 'sine'), 150);
    setTimeout(() => this.generateTone(784, 0.15, 'sine'), 300);
    setTimeout(() => this.generateTone(1047, 0.2, 'sine'), 450);
    setTimeout(() => this.generateTone(1319, 0.3, 'sine'), 650);
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

const soundManager = new SoundManager();

if (typeof window !== 'undefined') {
  soundManager.init();
}

export default soundManager; 