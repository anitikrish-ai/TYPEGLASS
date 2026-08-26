/**
 * LiquidType Core Typing Engine
 * Handles character state machine, caret movements, time tracking, and event emission
 */

import { TypingStatistics } from './statistics.js';
import { soundManager } from '../audio/sound.js';

export class TypingEngine {
  constructor(options = {}) {
    this.options = {
      strictBackspace: false,
      soundEnabled: true,
      onCharTyped: () => {},
      onStatsUpdate: () => {},
      onComplete: () => {},
      onTimeTick: () => {},
      ...options
    };

    this.stats = new TypingStatistics();
    this.text = '';
    this.characters = []; // Array of { char, state: 'untyped'|'correct'|'incorrect'|'active', typedChar: null }
    this.currentIndex = 0;
    this.isStarted = false;
    this.isPaused = false;
    this.isCompleted = false;
    this.isTimedMode = false;
    this.timeLimitSeconds = 0;
    this.remainingSeconds = 0;
    this.timerInterval = null;
    this.sampleInterval = null;
  }

  loadText(text, options = {}) {
    this.stopTimers();
    this.text = text || '';
    this.characters = this.text.split('').map((char, index) => ({
      index,
      char,
      state: index === 0 ? 'active' : 'untyped',
      typedChar: null
    }));

    this.currentIndex = 0;
    this.isStarted = false;
    this.isPaused = false;
    this.isCompleted = false;
    this.isTimedMode = !!options.timeLimit;
    this.timeLimitSeconds = options.timeLimit || 0;
    this.remainingSeconds = this.timeLimitSeconds;
    this.strictBackspace = !!options.strictBackspace;

    this.stats.reset();
    this.emitStatsUpdate();
    return this.characters;
  }

  start() {
    if (this.isStarted && !this.isPaused) return;
    this.isStarted = true;
    this.isPaused = false;
    this.stats.start();

    // Start timer loop
    this.startTimers();
  }

  startTimers() {
    this.stopTimers();
    
    // Main 100ms ticker for smooth timer / real-time analytics
    this.timerInterval = setInterval(() => {
      if (this.isPaused || this.isCompleted) return;

      if (this.isTimedMode) {
        const elapsed = this.stats.updateElapsed();
        this.remainingSeconds = Math.max(0, this.timeLimitSeconds - elapsed);
        this.options.onTimeTick(Math.ceil(this.remainingSeconds));

        if (this.remainingSeconds <= 0) {
          this.completeSession();
          return;
        }
      } else {
        const elapsed = this.stats.updateElapsed();
        this.options.onTimeTick(Math.floor(elapsed));
      }

      this.emitStatsUpdate();
    }, 100);

    // 1-second sample ticker for charts
    this.sampleInterval = setInterval(() => {
      if (this.isPaused || this.isCompleted) return;
      this.stats.sampleTimeline();
    }, 1000);
  }

  stopTimers() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.sampleInterval) {
      clearInterval(this.sampleInterval);
      this.sampleInterval = null;
    }
  }

  pause() {
    if (!this.isStarted || this.isCompleted) return;
    this.isPaused = true;
    this.stopTimers();
  }

  resume() {
    if (!this.isStarted || this.isCompleted) return;
    this.isPaused = false;
    this.startTimers();
  }

  togglePause() {
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
    return this.isPaused;
  }

  handleInput(key, ctrlKey = false, altKey = false, metaKey = false) {
    if (ctrlKey || altKey || metaKey || this.isCompleted) return;

    if (!this.isStarted) {
      this.start();
    }

    if (this.isPaused) {
      this.resume();
    }

    // Handle Backspace
    if (key === 'Backspace') {
      this.handleBackspace();
      return;
    }

    // Ignore non-printable single character keys (e.g., 'Shift', 'CapsLock', 'Tab', 'Enter' unless newline expected)
    if (key.length > 1 && key !== 'Enter') {
      return;
    }

    const inputChar = key === 'Enter' ? '\n' : key;
    const targetToken = this.characters[this.currentIndex];
    if (!targetToken) return;

    const expectedChar = targetToken.char;
    const isCorrect = inputChar === expectedChar;

    // Record in stats
    this.stats.recordCharacter(expectedChar, inputChar, isCorrect);

    // Play tactile sound feedback
    if (this.options.soundEnabled) {
      if (isCorrect) {
        soundManager.playKeyPress(inputChar);
      } else {
        soundManager.playError();
      }
    }

    // Update token state
    targetToken.typedChar = inputChar;
    targetToken.state = isCorrect ? 'correct' : 'incorrect';

    this.currentIndex++;

    // Highlight next active token
    if (this.currentIndex < this.characters.length) {
      this.characters[this.currentIndex].state = 'active';
    } else {
      // Completed entire passage
      this.completeSession();
      return;
    }

    this.options.onCharTyped({
      index: this.currentIndex - 1,
      char: inputChar,
      expected: expectedChar,
      isCorrect,
      nextChar: this.getNextRequiredChar()
    });

    this.emitStatsUpdate();
  }

  handleBackspace() {
    if (this.currentIndex <= 0) return;

    this.stats.recordBackspace();
    if (this.options.soundEnabled) {
      soundManager.playKeyPress('Backspace');
    }

    // Reset current active token
    if (this.currentIndex < this.characters.length) {
      this.characters[this.currentIndex].state = 'untyped';
    }

    // Move back
    this.currentIndex--;
    const prevToken = this.characters[this.currentIndex];
    prevToken.state = 'active';
    prevToken.typedChar = null;

    this.options.onCharTyped({
      index: this.currentIndex,
      isBackspace: true,
      nextChar: prevToken.char
    });

    this.emitStatsUpdate();
  }

  getNextRequiredChar() {
    if (this.currentIndex < this.characters.length) {
      return this.characters[this.currentIndex].char;
    }
    return '';
  }

  getProgressPercentage() {
    if (this.characters.length === 0) return 0;
    return Math.min(100, Math.round((this.currentIndex / this.characters.length) * 100));
  }

  completeSession() {
    if (this.isCompleted) return;
    this.isCompleted = true;
    this.stopTimers();

    const finalStats = this.stats.finish();
    if (this.options.soundEnabled) {
      soundManager.playSuccess();
    }

    this.options.onComplete({
      ...finalStats,
      progress: this.getProgressPercentage(),
      isTimedMode: this.isTimedMode,
      totalLength: this.characters.length
    });
  }

  emitStatsUpdate() {
    const snap = this.stats.getSnapshot();
    this.options.onStatsUpdate({
      ...snap,
      progress: this.getProgressPercentage(),
      currentIndex: this.currentIndex,
      remainingSeconds: this.remainingSeconds,
      isPaused: this.isPaused,
      isStarted: this.isStarted
    });
  }

  destroy() {
    this.stopTimers();
  }
}
