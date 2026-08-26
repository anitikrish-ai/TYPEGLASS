/**
 * LiquidType Real-Time Statistics Engine
 * Standard Typing Formula Compliance:
 * - WPM: Correct characters / 5 / elapsed minutes
 * - Accuracy: Correct characters / total typed characters * 100
 * - CPM: Correct characters / elapsed minutes
 */

export class TypingStatistics {
  constructor() {
    this.reset();
  }

  reset() {
    this.startTime = null;
    this.endTime = null;
    this.elapsedSeconds = 0;
    this.correctChars = 0;
    this.incorrectChars = 0;
    this.totalTypedChars = 0;
    this.backspaces = 0;
    this.errorsCount = 0;
    this.charMap = {}; // Tracks { [char]: { hits: number, errors: number } }
    this.wpmHistory = []; // Snapshots every second for charts
    this.accuracyHistory = [];
    this.rawWpmHistory = [];
  }

  start() {
    this.reset();
    this.startTime = performance.now();
  }

  recordCharacter(expectedChar, typedChar, isCorrect) {
    if (!this.startTime) {
      this.startTime = performance.now();
    }

    this.totalTypedChars++;

    const key = expectedChar.toLowerCase();
    if (!this.charMap[key]) {
      this.charMap[key] = { hits: 0, errors: 0 };
    }

    if (isCorrect) {
      this.correctChars++;
      this.charMap[key].hits++;
    } else {
      this.incorrectChars++;
      this.errorsCount++;
      this.charMap[key].errors++;
    }
  }

  recordBackspace() {
    this.backspaces++;
  }

  updateElapsed() {
    if (!this.startTime) return 0;
    const now = this.endTime || performance.now();
    this.elapsedSeconds = Math.max(0.1, (now - this.startTime) / 1000);
    return this.elapsedSeconds;
  }

  finish() {
    this.endTime = performance.now();
    this.updateElapsed();
    return this.getSnapshot();
  }

  sampleTimeline() {
    if (!this.startTime) return;
    this.updateElapsed();
    const snap = this.getSnapshot();
    this.wpmHistory.push({ time: Math.round(this.elapsedSeconds), wpm: snap.wpm, rawWpm: snap.rawWpm });
    this.accuracyHistory.push({ time: Math.round(this.elapsedSeconds), accuracy: snap.accuracy });
  }

  getSnapshot() {
    this.updateElapsed();
    const minutes = this.elapsedSeconds / 60;

    // Strict standard formulas
    const wpm = minutes > 0 ? Math.max(0, Math.round((this.correctChars / 5) / minutes)) : 0;
    const rawWpm = minutes > 0 ? Math.max(0, Math.round((this.totalTypedChars / 5) / minutes)) : 0;
    const cpm = minutes > 0 ? Math.max(0, Math.round(this.correctChars / minutes)) : 0;
    const accuracy = this.totalTypedChars > 0
      ? Math.max(0, Math.min(100, Math.round((this.correctChars / this.totalTypedChars) * 1000) / 10))
      : 100;

    // Consistency score (variance in speed snapshots)
    let consistency = 100;
    if (this.wpmHistory.length > 2) {
      const wpms = this.wpmHistory.map(h => h.wpm);
      const mean = wpms.reduce((a, b) => a + b, 0) / wpms.length;
      if (mean > 0) {
        const variance = wpms.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / wpms.length;
        const stdDev = Math.sqrt(variance);
        consistency = Math.max(20, Math.min(100, Math.round(100 - (stdDev / mean) * 100)));
      }
    }

    return {
      wpm,
      rawWpm,
      cpm,
      accuracy,
      elapsedSeconds: Math.round(this.elapsedSeconds * 10) / 10,
      correctChars: this.correctChars,
      incorrectChars: this.incorrectChars,
      totalTypedChars: this.totalTypedChars,
      backspaces: this.backspaces,
      errorsCount: this.errorsCount,
      consistency,
      charMap: this.charMap,
      wpmTimeline: this.wpmHistory,
      accuracyTimeline: this.accuracyHistory
    };
  }
}
