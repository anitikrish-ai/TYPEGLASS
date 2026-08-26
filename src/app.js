/**
 * LiquidType - Main Application Controller
 * Modular Vanilla JavaScript Architecture
 */

import { StorageManager } from './data/storage.js';
import { soundManager } from './audio/sound.js';
import { PASSAGES, generateWeakKeyPassage } from './typing/passages.js';
import { TypingEngine } from './typing/engine.js';
import { KeyboardVisualizer, getKeyCodeForChar } from './ui/keyboard.js';
import { AmbientBackgroundEngine, animateCountUp, triggerCelebrationConfetti } from './ui/animations.js';
import { WpmTimelineChart, DailyPracticeChart } from './ui/charts.js';
import { NavigationManager } from './ui/navigation.js';

class LiquidTypeApp {
  constructor() {
    this.settings = StorageManager.getSettings();
    this.currentMode = 'Practice';
    this.currentDifficulty = 'Intermediate';
    this.currentPassage = null;
    this.currentSnippetLang = 'JavaScript';
    this.speedDuration = 60;

    this.activeEngine = null;
    this.keyboardVisualizer = null;
    this.wpmChart = null;
    this.dailyChart = null;
    this.ambientEngine = null;
    this.navigation = null;

    this.init();
  }

  init() {
    // 1. Initialize Audio Engine & UI Settings
    this.applySettingsToDOM();
    soundManager.setVolume(this.settings.soundVolume);
    soundManager.setMuted(!this.settings.soundEnabled);
    soundManager.setProfile(this.settings.soundProfile);

    // 2. Initialize Ambient Canvas
    const ambientCanvas = document.getElementById('ambient-canvas');
    if (ambientCanvas) {
      this.ambientEngine = new AmbientBackgroundEngine(ambientCanvas);
      this.ambientEngine.setIntensity(this.settings.animationIntensity);
    }

    // 3. Setup Navigation
    this.navigation = new NavigationManager({
      onPageChange: (pageId) => this.handlePageChange(pageId)
    });

    // 4. Setup Electron Window Controls
    this.setupElectronBridge();

    // 5. Setup Modals and Global Event Handlers
    this.setupGlobalShortcuts();
    this.setupEventListeners();

    // 6. Populate Home Dashboard
    this.updateDashboardMetrics();

    // 7. Initialize Practice Passage by default
    this.loadPracticePassage();
  }

  applySettingsToDOM() {
    document.documentElement.setAttribute('data-theme', this.settings.theme);
    const root = document.documentElement;

    root.style.setProperty('--glass-bg', `rgba(${this.settings.theme === 'liquid-dark' ? '18, 24, 38' : '255, 255, 255'}, ${this.settings.glassOpacity / 100})`);
    root.style.setProperty('--glass-blur', `${this.settings.blurIntensity}px`);
    root.style.setProperty('--typing-font-size', this.settings.fontSize);

    // Sound toggle state in header
    const iconOn = document.getElementById('icon-sound-on');
    const iconOff = document.getElementById('icon-sound-off');
    if (iconOn && iconOff) {
      if (this.settings.soundEnabled) {
        iconOn.classList.remove('hidden');
        iconOff.classList.add('hidden');
      } else {
        iconOn.classList.add('hidden');
        iconOff.classList.remove('hidden');
      }
    }
  }

  setupElectronBridge() {
    const electronControls = document.getElementById('electron-controls');
    if (window.electronAPI) {
      document.getElementById('btn-win-min')?.addEventListener('click', () => window.electronAPI.minimize());
      document.getElementById('btn-win-max')?.addEventListener('click', () => window.electronAPI.maximize());
      document.getElementById('btn-win-close')?.addEventListener('click', () => window.electronAPI.close());
    } else if (electronControls) {
      // In browser preview, keep minimal status
      electronControls.style.display = 'none';
    }
  }

  setupGlobalShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Allow sound system to resume on user interaction
      soundManager.ensureContext();

      // Modal open shortcuts
      const resultsModal = document.getElementById('modal-results');
      const customModal = document.getElementById('modal-custom-text');

      if (!resultsModal.classList.contains('hidden')) {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.closeResultsModal();
          this.restartCurrentMode();
          return;
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          this.closeResultsModal();
          this.nextPassageCurrentMode();
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          this.closeResultsModal();
          this.navigation.navigateTo('home');
          return;
        }
      }

      if (e.key === 'Escape') {
        if (!customModal.classList.contains('hidden')) {
          customModal.classList.add('hidden');
          return;
        }
        if (this.activeEngine && this.activeEngine.isStarted) {
          this.activeEngine.togglePause();
          return;
        }
      }

      // Fast Mode Switching (CTRL + 1..6)
      if (e.ctrlKey && !e.altKey && !e.metaKey) {
        switch (e.key) {
          case '1': e.preventDefault(); this.navigation.navigateTo('practice'); return;
          case '2': e.preventDefault(); this.navigation.navigateTo('speed'); return;
          case '3': e.preventDefault(); this.navigation.navigateTo('training'); return;
          case '4': e.preventDefault(); this.navigation.navigateTo('code'); return;
          case '5': e.preventDefault(); this.navigation.navigateTo('stats'); return;
          case ',': e.preventDefault(); this.navigation.navigateTo('settings'); return;
          case 'r':
          case 'R':
            e.preventDefault();
            this.restartCurrentMode();
            return;
        }
      }

      // If active on a typing view and no modal open, route key directly to engine
      const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
      if (isInputFocused) return;

      const currentPage = this.navigation.getCurrentPage();
      const typingPages = ['practice', 'speed', 'training', 'code'];
      if (typingPages.includes(currentPage) && this.activeEngine) {
        // Prevent browser scroll on Space or Backspace navigation
        if (e.key === ' ' || e.key === 'Backspace' || e.key === 'Tab') {
          e.preventDefault();
        }

        // Tactile key flash on virtual keyboard
        const code = e.code;
        if (this.keyboardVisualizer) {
          const isError = !e.ctrlKey && e.key.length === 1 && e.key !== this.activeEngine.getNextRequiredChar();
          this.keyboardVisualizer.pressKey(code, isError);
        }

        this.activeEngine.handleInput(e.key, e.ctrlKey, e.altKey, e.metaKey);
      }
    });

    window.addEventListener('keyup', (e) => {
      if (this.keyboardVisualizer) {
        this.keyboardVisualizer.releaseKey(e.code);
      }
    });
  }

  setupEventListeners() {
    // Quick Sound Toggle in header
    document.getElementById('btn-quick-sound')?.addEventListener('click', () => {
      this.settings.soundEnabled = !this.settings.soundEnabled;
      StorageManager.saveSettings(this.settings);
      soundManager.setMuted(!this.settings.soundEnabled);
      this.applySettingsToDOM();
    });

    // Custom Text Modal trigger
    document.getElementById('btn-custom-text-modal')?.addEventListener('click', () => {
      this.openCustomTextModal();
    });
    document.getElementById('custom-text-close-btn')?.addEventListener('click', () => {
      document.getElementById('modal-custom-text')?.classList.add('hidden');
    });

    // Home Screen Quick Actions
    document.getElementById('home-start-practice-btn')?.addEventListener('click', () => {
      this.navigation.navigateTo('practice');
    });
    document.getElementById('home-start-speed-btn')?.addEventListener('click', () => {
      this.navigation.navigateTo('speed');
    });
    document.getElementById('home-view-all-stats-btn')?.addEventListener('click', () => {
      this.navigation.navigateTo('stats');
    });

    // Home Mode Launcher Cards
    document.querySelectorAll('[data-launch-mode]').forEach(card => {
      card.addEventListener('click', () => {
        const mode = card.dataset.launchMode;
        if (mode === 'custom') {
          this.openCustomTextModal();
        } else {
          this.navigation.navigateTo(mode);
        }
      });
    });

    // Practice Page Controls
    document.querySelectorAll('.practice-diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.practice-diff-btn').forEach(b => {
          b.className = 'practice-diff-btn px-3 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-white/5 border border-white/10';
        });
        btn.className = 'practice-diff-btn px-3 py-1 rounded-lg text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30';
        this.currentDifficulty = btn.dataset.diff;
        this.loadPracticePassage();
      });
    });

    document.getElementById('practice-next-passage-btn')?.addEventListener('click', () => {
      this.loadPracticePassage(true);
    });
    document.getElementById('typing-restart-btn')?.addEventListener('click', () => {
      this.restartCurrentMode();
    });

    // Speed Test Duration Buttons
    document.querySelectorAll('.speed-time-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.speed-time-btn').forEach(b => {
          b.className = 'speed-time-btn px-3 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-white/5 border border-white/10';
        });
        btn.className = 'speed-time-btn px-3 py-1 rounded-lg text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30';
        this.speedDuration = parseInt(btn.dataset.speedTime, 10);
        this.loadSpeedTest();
      });
    });

    // Key Training Tabs & Weak Key generator
    document.querySelectorAll('.training-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.training-tab-btn').forEach(b => {
          b.className = 'training-tab-btn px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-white/5 border border-white/10';
        });
        btn.className = 'training-tab-btn px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
        this.loadKeyTraining(btn.dataset.trainingSet);
      });
    });

    document.getElementById('training-weak-keys-btn')?.addEventListener('click', () => {
      this.loadAdaptiveWeakKeysDrill();
    });
    document.getElementById('stats-practice-weak-btn')?.addEventListener('click', () => {
      this.navigation.navigateTo('training');
      this.loadAdaptiveWeakKeysDrill();
    });

    // Code Typing Language Buttons
    document.querySelectorAll('.code-lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.code-lang-btn').forEach(b => {
          b.className = 'code-lang-btn px-3 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-white/5 border border-white/10';
        });
        btn.className = 'code-lang-btn px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30';
        this.currentSnippetLang = btn.dataset.codeLang;
        this.loadCodeTyping();
      });
    });

    // Results Modal Action Buttons
    document.getElementById('result-try-again-btn')?.addEventListener('click', () => {
      this.closeResultsModal();
      this.restartCurrentMode();
    });
    document.getElementById('result-next-btn')?.addEventListener('click', () => {
      this.closeResultsModal();
      this.nextPassageCurrentMode();
    });

    // Settings Inputs Listeners
    this.setupSettingsInputs();

    // Data Export / Import
    document.getElementById('stats-export-btn')?.addEventListener('click', () => this.handleDataExport());
    document.getElementById('stats-import-btn')?.addEventListener('click', () => this.handleDataImport());
    document.getElementById('setting-reset-data-btn')?.addEventListener('click', () => this.handleDataReset());

    // Custom Text creation
    const textBodyInput = document.getElementById('custom-text-body-input');
    textBodyInput?.addEventListener('input', () => {
      const val = textBodyInput.value;
      const words = val.trim() ? val.trim().split(/\s+/).length : 0;
      document.getElementById('custom-text-char-count').textContent = `${val.length} characters (${words} words)`;
    });

    document.getElementById('custom-text-save-btn')?.addEventListener('click', () => {
      const title = document.getElementById('custom-text-title-input').value;
      const content = document.getElementById('custom-text-body-input').value;
      if (!content.trim()) return;

      StorageManager.saveCustomText(title, content);
      document.getElementById('modal-custom-text')?.classList.add('hidden');
      this.navigation.navigateTo('practice');
      this.loadCustomPassage(title || 'Custom Text', content);
    });
  }

  setupSettingsInputs() {
    const themeSelect = document.getElementById('setting-theme-select');
    themeSelect.value = this.settings.theme;
    themeSelect.addEventListener('change', (e) => {
      this.settings.theme = e.target.value;
      StorageManager.saveSettings(this.settings);
      this.applySettingsToDOM();
    });

    const opacityRange = document.getElementById('setting-opacity-range');
    opacityRange.value = this.settings.glassOpacity;
    opacityRange.addEventListener('input', (e) => {
      this.settings.glassOpacity = parseInt(e.target.value, 10);
      document.getElementById('setting-opacity-label').textContent = `${this.settings.glassOpacity}%`;
      StorageManager.saveSettings(this.settings);
      this.applySettingsToDOM();
    });

    const blurRange = document.getElementById('setting-blur-range');
    blurRange.value = this.settings.blurIntensity;
    blurRange.addEventListener('input', (e) => {
      this.settings.blurIntensity = parseInt(e.target.value, 10);
      document.getElementById('setting-blur-label').textContent = `${this.settings.blurIntensity}px`;
      StorageManager.saveSettings(this.settings);
      this.applySettingsToDOM();
    });

    const animRange = document.getElementById('setting-anim-range');
    animRange.value = this.settings.animationIntensity;
    animRange.addEventListener('input', (e) => {
      this.settings.animationIntensity = parseInt(e.target.value, 10);
      document.getElementById('setting-anim-label').textContent = `${this.settings.animationIntensity}%`;
      if (this.ambientEngine) {
        this.ambientEngine.setIntensity(this.settings.animationIntensity);
      }
      StorageManager.saveSettings(this.settings);
    });

    const soundToggle = document.getElementById('setting-sound-toggle');
    soundToggle.checked = this.settings.soundEnabled;
    soundToggle.addEventListener('change', (e) => {
      this.settings.soundEnabled = e.target.checked;
      soundManager.setMuted(!e.target.checked);
      StorageManager.saveSettings(this.settings);
      this.applySettingsToDOM();
    });

    const soundProfile = document.getElementById('setting-sound-profile');
    soundProfile.value = this.settings.soundProfile;
    soundProfile.addEventListener('change', (e) => {
      this.settings.soundProfile = e.target.value;
      soundManager.setProfile(e.target.value);
      StorageManager.saveSettings(this.settings);
      soundManager.playKeyPress('a');
    });

    const volumeRange = document.getElementById('setting-volume-range');
    volumeRange.value = this.settings.soundVolume;
    volumeRange.addEventListener('input', (e) => {
      this.settings.soundVolume = parseInt(e.target.value, 10);
      document.getElementById('setting-volume-label').textContent = `${this.settings.soundVolume}%`;
      soundManager.setVolume(this.settings.soundVolume);
      StorageManager.saveSettings(this.settings);
    });

    document.getElementById('setting-test-sound-btn')?.addEventListener('click', () => {
      soundManager.playKeyPress('Space');
    });

    const fontSizeSelect = document.getElementById('setting-font-size');
    fontSizeSelect.value = this.settings.fontSize;
    fontSizeSelect.addEventListener('change', (e) => {
      this.settings.fontSize = e.target.value;
      StorageManager.saveSettings(this.settings);
      this.applySettingsToDOM();
    });

    const showKeyboardToggle = document.getElementById('setting-show-keyboard');
    showKeyboardToggle.checked = this.settings.showKeyboard;
    showKeyboardToggle.addEventListener('change', (e) => {
      this.settings.showKeyboard = e.target.checked;
      StorageManager.saveSettings(this.settings);
      if (this.keyboardVisualizer) {
        this.keyboardVisualizer.setVisible(e.target.checked);
      }
    });

    const fingerGuideToggle = document.getElementById('setting-finger-guide');
    fingerGuideToggle.checked = this.settings.showFingerGuide;
    fingerGuideToggle.addEventListener('change', (e) => {
      this.settings.showFingerGuide = e.target.checked;
      StorageManager.saveSettings(this.settings);
      if (this.keyboardVisualizer) {
        this.keyboardVisualizer.updateFingerGuide(e.target.checked);
      }
    });

    const strictBackspaceToggle = document.getElementById('setting-strict-backspace');
    strictBackspaceToggle.checked = this.settings.strictBackspace;
    strictBackspaceToggle.addEventListener('change', (e) => {
      this.settings.strictBackspace = e.target.checked;
      StorageManager.saveSettings(this.settings);
    });
  }

  handlePageChange(pageId) {
    if (this.activeEngine) {
      this.activeEngine.destroy();
    }

    switch (pageId) {
      case 'home':
        this.updateDashboardMetrics();
        break;
      case 'practice':
        this.loadPracticePassage();
        break;
      case 'speed':
        this.loadSpeedTest();
        break;
      case 'training':
        this.loadKeyTraining('Home Row');
        this.renderWeakKeyChips();
        break;
      case 'code':
        this.loadCodeTyping();
        break;
      case 'stats':
        this.renderStatisticsPage();
        break;
      case 'settings':
        break;
    }
  }

  // ================= TYPING ENGINES & MODES =================

  attachEngineToDOM({ containerId, kbContainerId, text, mode, title, timeLimit = 0, isCode = false }) {
    if (this.activeEngine) {
      this.activeEngine.destroy();
    }

    const container = document.getElementById(containerId);
    const kbContainer = document.getElementById(kbContainerId);
    if (!container) return;

    this.currentMode = mode;
    this.currentPassageTitle = title;

    // Initialize visual keyboard
    if (kbContainer) {
      this.keyboardVisualizer = new KeyboardVisualizer(kbContainer, {
        showFingerGuide: this.settings.showFingerGuide,
        visible: this.settings.showKeyboard
      });
    }

    this.activeEngine = new TypingEngine({
      strictBackspace: this.settings.strictBackspace,
      soundEnabled: this.settings.soundEnabled,
      onCharTyped: ({ index, isCorrect, nextChar }) => {
        this.updateStreamToken(container, index, isCorrect);
        if (this.keyboardVisualizer) {
          this.keyboardVisualizer.setNextTarget(nextChar);
        }
      },
      onStatsUpdate: (stats) => {
        this.renderLiveHUD(stats);
      },
      onComplete: (finalStats) => {
        this.handleSessionComplete(finalStats);
      },
      onTimeTick: (timeVal) => {
        this.updateTimeHUD(timeVal, timeLimit > 0);
      }
    });

    const tokens = this.activeEngine.loadText(text, { timeLimit });
    this.renderInitialStream(container, tokens, isCode);

    if (this.keyboardVisualizer) {
      this.keyboardVisualizer.setNextTarget(this.activeEngine.getNextRequiredChar());
    }

    // Auto-focus container
    const parentCard = container.closest('.liquid-glass-card');
    if (parentCard) {
      parentCard.focus();
    }
  }

  renderInitialStream(container, tokens, isCode = false) {
    container.innerHTML = '';
    const fragment = document.createDocumentFragment();

    tokens.forEach((t, i) => {
      const span = document.createElement('span');
      span.id = `token-${i}`;
      span.className = `typing-token ${i === 0 ? 'token-active' : 'token-untyped'}`;

      if (t.char === ' ') {
        span.textContent = ' ';
      } else if (t.char === '\n') {
        span.textContent = '↵\n';
        span.classList.add('opacity-40');
      } else {
        span.textContent = t.char;
      }

      fragment.appendChild(span);
    });

    container.appendChild(fragment);
  }

  updateStreamToken(container, index, isCorrect) {
    const currentToken = document.getElementById(`token-${index}`);
    if (currentToken) {
      currentToken.className = `typing-token ${isCorrect ? 'token-correct' : 'token-incorrect'}`;
    }

    // Next token active highlight & smooth scroll
    const nextToken = document.getElementById(`token-${index + 1}`);
    if (nextToken) {
      nextToken.className = 'typing-token token-active';
      nextToken.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }

  renderLiveHUD(stats) {
    // Practice live HUD
    const wpmEl = document.getElementById('live-stat-wpm');
    const accEl = document.getElementById('live-stat-acc');
    const progEl = document.getElementById('live-stat-progress');
    const fillEl = document.getElementById('live-progress-fill');

    if (wpmEl) wpmEl.textContent = stats.wpm;
    if (accEl) accEl.textContent = `${stats.accuracy}%`;
    if (progEl) progEl.textContent = `${stats.progress}%`;
    if (fillEl) fillEl.style.width = `${stats.progress}%`;

    // Speed test live HUD
    const speedWpm = document.getElementById('speed-stat-wpm');
    const speedAcc = document.getElementById('speed-stat-acc');
    if (speedWpm) speedWpm.textContent = stats.wpm;
    if (speedAcc) speedAcc.textContent = `${stats.accuracy}%`;
  }

  updateTimeHUD(timeVal, isCountdown = false) {
    if (isCountdown) {
      const speedTime = document.getElementById('speed-stat-time');
      const speedBadge = document.getElementById('speed-countdown-badge');
      const speedFill = document.getElementById('speed-progress-fill');
      if (speedTime) speedTime.textContent = timeVal;
      if (speedBadge) speedBadge.textContent = `${timeVal}s`;
      if (speedFill && this.speedDuration > 0) {
        speedFill.style.width = `${(timeVal / this.speedDuration) * 100}%`;
      }
    } else {
      const timeEl = document.getElementById('live-stat-time');
      if (timeEl) {
        const mins = Math.floor(timeVal / 60);
        const secs = timeVal % 60;
        timeEl.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
      }
    }
  }

  loadPracticePassage(forceNext = false) {
    const list = PASSAGES.Practice[this.currentDifficulty] || PASSAGES.Practice.Intermediate;
    let passage = list[0];
    if (forceNext || !this.currentPassage) {
      passage = list[Math.floor(Math.random() * list.length)];
    }
    this.currentPassage = passage;

    document.getElementById('practice-passage-title').textContent = passage.title;

    this.attachEngineToDOM({
      containerId: 'typing-stream-content',
      kbContainerId: 'practice-keyboard-container',
      text: passage.text,
      mode: 'Practice',
      title: passage.title
    });
  }

  loadSpeedTest() {
    const list = PASSAGES.SpeedTest[String(this.speedDuration)] || PASSAGES.SpeedTest['60'];
    const item = list[Math.floor(Math.random() * list.length)];

    document.getElementById('speed-stat-time').textContent = this.speedDuration;
    document.getElementById('speed-countdown-badge').textContent = `${this.speedDuration}s`;

    this.attachEngineToDOM({
      containerId: 'speed-stream-content',
      kbContainerId: 'speed-keyboard-container',
      text: item.text,
      mode: 'Speed Test',
      title: `${item.title} (${this.speedDuration}s)`,
      timeLimit: this.speedDuration
    });
  }

  loadKeyTraining(setKey = 'Home Row') {
    const list = PASSAGES.KeyTraining[setKey] || PASSAGES.KeyTraining['Home Row'];
    const item = list[Math.floor(Math.random() * list.length)];

    this.attachEngineToDOM({
      containerId: 'training-stream-content',
      kbContainerId: 'training-keyboard-container',
      text: item.text,
      mode: 'Key Training',
      title: item.title
    });
  }

  loadAdaptiveWeakKeysDrill() {
    const weakMap = StorageManager.getWeakKeys();
    const dynamicPassage = generateWeakKeyPassage(weakMap);

    this.attachEngineToDOM({
      containerId: 'training-stream-content',
      kbContainerId: 'training-keyboard-container',
      text: dynamicPassage.text,
      mode: 'Key Training',
      title: dynamicPassage.title
    });
  }

  loadCodeTyping() {
    const list = PASSAGES.CodeTyping[this.currentSnippetLang] || PASSAGES.CodeTyping.JavaScript;
    const item = list[Math.floor(Math.random() * list.length)];

    document.getElementById('code-snippet-title').textContent = `${this.currentSnippetLang}: ${item.title}`;

    this.attachEngineToDOM({
      containerId: 'code-stream-content',
      kbContainerId: 'code-keyboard-container',
      text: item.text,
      mode: 'Code Typing',
      title: `${this.currentSnippetLang} - ${item.title}`,
      isCode: true
    });
  }

  loadCustomPassage(title, content) {
    this.attachEngineToDOM({
      containerId: 'typing-stream-content',
      kbContainerId: 'practice-keyboard-container',
      text: content,
      mode: 'Custom Text',
      title
    });
    document.getElementById('practice-passage-title').textContent = `Custom: ${title}`;
  }

  restartCurrentMode() {
    const p = this.navigation.getCurrentPage();
    if (p === 'practice') this.loadPracticePassage();
    else if (p === 'speed') this.loadSpeedTest();
    else if (p === 'training') this.loadKeyTraining('Home Row');
    else if (p === 'code') this.loadCodeTyping();
  }

  nextPassageCurrentMode() {
    const p = this.navigation.getCurrentPage();
    if (p === 'practice') this.loadPracticePassage(true);
    else if (p === 'speed') this.loadSpeedTest();
    else if (p === 'training') this.loadKeyTraining('Home Row');
    else if (p === 'code') this.loadCodeTyping();
  }

  // ================= RESULTS & DATA HANDLING =================

  handleSessionComplete(finalStats) {
    const summary = StorageManager.getSummaryStats();
    const isNewPB = finalStats.wpm > (summary.personalBestWpm || 0);

    const sessionRecord = {
      id: 'sess_' + Date.now(),
      date: new Date().toISOString(),
      mode: this.currentMode,
      difficulty: this.currentDifficulty,
      title: this.currentPassageTitle || 'Typing Session',
      wpm: finalStats.wpm,
      cpm: finalStats.cpm,
      accuracy: finalStats.accuracy,
      timeSeconds: finalStats.elapsedSeconds,
      correctChars: finalStats.correctChars,
      incorrectChars: finalStats.incorrectChars,
      totalChars: finalStats.totalTypedChars,
      errors: finalStats.errorsCount,
      characterStats: finalStats.charMap
    };

    // Save to local storage
    StorageManager.addSession(sessionRecord);

    // Trigger celebration if PB or high accuracy
    if (isNewPB || (finalStats.accuracy >= 98 && finalStats.wpm >= 50)) {
      triggerCelebrationConfetti();
      soundManager.playAchievement();
    }

    // Show Results Modal
    this.showResultsModal(sessionRecord, isNewPB);
  }

  showResultsModal(session, isNewPB) {
    const modal = document.getElementById('modal-results');
    if (!modal) return;

    document.getElementById('result-passage-title').textContent = session.title;

    // Grade calculation
    let grade = 'B';
    if (session.accuracy >= 98 && session.wpm >= 70) grade = 'S+';
    else if (session.accuracy >= 95 && session.wpm >= 60) grade = 'A+';
    else if (session.accuracy >= 92 && session.wpm >= 45) grade = 'A';
    else if (session.accuracy >= 85) grade = 'B+';
    else grade = 'C';

    document.getElementById('result-grade-badge').textContent = grade;

    const wpmEl = document.getElementById('result-wpm');
    const accEl = document.getElementById('result-acc');
    animateCountUp(wpmEl, session.wpm, 800);
    animateCountUp(accEl, session.accuracy, 800, '%', 1);

    document.getElementById('result-cpm').textContent = session.cpm;
    document.getElementById('result-correct').textContent = session.correctChars;
    document.getElementById('result-errors').textContent = session.errors;
    document.getElementById('result-time').textContent = `${Math.round(session.timeSeconds)}s`;

    const pbTag = document.getElementById('result-pb-indicator');
    if (pbTag) {
      if (isNewPB) pbTag.classList.remove('hidden');
      else pbTag.classList.add('hidden');
    }

    modal.classList.remove('hidden');
  }

  closeResultsModal() {
    document.getElementById('modal-results')?.classList.add('hidden');
  }

  updateDashboardMetrics() {
    const summary = StorageManager.getSummaryStats();
    const streak = StorageManager.getStreak();

    // Key Bento Stats
    const pbWpm = document.getElementById('home-stat-pb-wpm');
    const avgAcc = document.getElementById('home-stat-avg-acc');
    const avgWpm = document.getElementById('home-stat-avg-wpm');
    const totalTime = document.getElementById('home-stat-total-time');

    if (pbWpm) animateCountUp(pbWpm, summary.personalBestWpm || 68, 600);
    if (avgAcc) animateCountUp(avgAcc, summary.averageAccuracy || 97.4, 600, '', 1);
    if (avgWpm) animateCountUp(avgWpm, summary.averageWpm || 58, 600);
    if (totalTime) animateCountUp(totalTime, summary.totalTimeMinutes || 42, 600);

    // Streak & Goal Ring
    const streakBadge = document.getElementById('home-streak-badge');
    if (streakBadge) {
      streakBadge.textContent = `${streak.currentStreak} Day Streak`;
    }

    const todayMins = Math.round(streak.todayMinutes || 0);
    const goalMins = this.settings.dailyGoalMinutes || 15;
    const dailyMinsEl = document.getElementById('home-daily-minutes');
    if (dailyMinsEl) dailyMinsEl.textContent = `${todayMins}m`;

    const ring = document.getElementById('home-daily-ring');
    if (ring) {
      const circum = 2 * Math.PI * 42; // ~263.89
      const progress = Math.min(1, todayMins / goalMins);
      const offset = circum * (1 - progress);
      ring.style.strokeDashoffset = `${offset}`;
    }

    // Recent Sessions Table
    const tbody = document.getElementById('home-recent-table-body');
    if (tbody) {
      tbody.innerHTML = '';
      summary.recentSessions.slice(0, 5).forEach(s => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-white/5 transition-colors';
        tr.innerHTML = `
          <td class="py-2.5 font-medium text-white truncate max-w-[200px]">${s.title}</td>
          <td class="py-2.5"><span class="px-2 py-0.5 rounded-full bg-white/5 text-slate-300 text-[10px]">${s.mode}</span></td>
          <td class="py-2.5 font-bold text-cyan-400">${s.wpm}</td>
          <td class="py-2.5 text-emerald-400">${s.accuracy}%</td>
          <td class="py-2.5 text-slate-400">${Math.round(s.timeSeconds)}s</td>
          <td class="py-2.5 text-slate-400">${new Date(s.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  }

  renderWeakKeyChips() {
    const weakMap = StorageManager.getWeakKeys();
    const container = document.getElementById('training-weak-chips-container');
    if (!container) return;

    container.innerHTML = '';
    const sorted = Object.entries(weakMap)
      .filter(([_, stats]) => stats.errors > 0)
      .sort((a, b) => b[1].errors - a[1].errors)
      .slice(0, 8);

    if (sorted.length === 0) {
      container.innerHTML = `<span class="text-xs text-emerald-400">All keys performing flawlessly!</span>`;
      return;
    }

    sorted.forEach(([char, stats]) => {
      const chip = document.createElement('div');
      chip.className = 'px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono flex items-center gap-1.5';
      chip.innerHTML = `<span class="font-bold text-white uppercase">[ ${char} ]</span> <span class="text-[10px] text-rose-400">${stats.errors} errs (${Math.round((stats.rate || 0.1) * 100)}%)</span>`;
      container.appendChild(chip);
    });
  }

  renderStatisticsPage() {
    const sessions = StorageManager.getSessions();
    const streak = StorageManager.getStreak();
    const weakMap = StorageManager.getWeakKeys();

    // 1. WPM Progression Chart
    const wpmCanvas = document.getElementById('wpm-timeline-canvas');
    if (wpmCanvas) {
      if (!this.wpmChart) {
        this.wpmChart = new WpmTimelineChart(wpmCanvas);
      }
      this.wpmChart.setData(sessions.slice(0, 30).reverse());
    }

    // 2. Daily Practice Chart
    const dailyCanvas = document.getElementById('daily-practice-canvas');
    if (dailyCanvas) {
      if (!this.dailyChart) {
        this.dailyChart = new DailyPracticeChart(dailyCanvas);
      }
      this.dailyChart.setData(streak.history, this.settings.dailyGoalMinutes);
    }

    // 3. Weak Keys Grid Matrix
    const weakGrid = document.getElementById('stats-weak-keys-grid');
    if (weakGrid) {
      weakGrid.innerHTML = '';
      const keyStats = Object.entries(weakMap).sort((a, b) => (b[1].rate || 0) - (a[1].rate || 0));

      keyStats.forEach(([char, stats]) => {
        const card = document.createElement('div');
        const rate = Math.round((stats.rate || 0) * 100);
        let colorClass = 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5';
        if (rate > 15) colorClass = 'border-rose-500/30 text-rose-400 bg-rose-500/10';
        else if (rate > 8) colorClass = 'border-amber-500/20 text-amber-400 bg-amber-500/5';

        card.className = `p-2.5 rounded-xl border flex flex-col items-center justify-center ${colorClass}`;
        card.innerHTML = `
          <span class="text-sm font-black uppercase">${char}</span>
          <span class="text-[10px] opacity-75 font-mono">${rate}% err</span>
          <span class="text-[9px] opacity-50 font-mono">${stats.errors} misses</span>
        `;
        weakGrid.appendChild(card);
      });
    }

    // 4. Full Table History
    const fullTbody = document.getElementById('stats-full-table-body');
    if (fullTbody) {
      fullTbody.innerHTML = '';
      sessions.forEach(s => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-white/5 transition-colors';
        tr.innerHTML = `
          <td class="py-2.5 px-2 font-medium text-white truncate max-w-[200px]">${s.title}</td>
          <td class="py-2.5 px-2"><span class="px-2 py-0.5 rounded bg-white/5 text-slate-300 text-[10px]">${s.mode}</span></td>
          <td class="py-2.5 px-2 font-bold text-cyan-400">${s.wpm}</td>
          <td class="py-2.5 px-2 text-emerald-400">${s.accuracy}%</td>
          <td class="py-2.5 px-2 text-slate-300 font-mono">${s.cpm || s.wpm * 5}</td>
          <td class="py-2.5 px-2 text-rose-400">${s.errors || 0}</td>
          <td class="py-2.5 px-2 text-slate-400">${Math.round(s.timeSeconds)}s</td>
          <td class="py-2.5 px-2 text-slate-400">${new Date(s.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
        `;
        fullTbody.appendChild(tr);
      });
    }
  }

  openCustomTextModal() {
    const modal = document.getElementById('modal-custom-text');
    if (!modal) return;

    // Render saved custom texts
    const list = StorageManager.getCustomTexts();
    const savedContainer = document.getElementById('custom-text-saved-list');
    if (savedContainer) {
      savedContainer.innerHTML = '';
      list.forEach(item => {
        const row = document.createElement('div');
        row.className = 'p-2 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-between transition-colors';
        row.innerHTML = `
          <div class="flex flex-col truncate pr-2">
            <span class="text-xs font-semibold text-white">${item.title}</span>
            <span class="text-[10px] text-slate-400 truncate">${item.content}</span>
          </div>
          <button data-load-custom="${item.id}" class="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-[10px] font-bold shrink-0">
            Practice
          </button>
        `;
        savedContainer.appendChild(row);

        row.querySelector('[data-load-custom]')?.addEventListener('click', () => {
          modal.classList.add('hidden');
          this.navigation.navigateTo('practice');
          this.loadCustomPassage(item.title, item.content);
        });
      });
    }

    modal.classList.remove('hidden');
  }

  handleDataExport() {
    const jsonStr = StorageManager.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `liquidtype-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  handleDataImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const res = StorageManager.importAllData(event.target.result);
        if (res.success) {
          alert('Data backup imported successfully!');
          this.settings = StorageManager.getSettings();
          this.applySettingsToDOM();
          this.updateDashboardMetrics();
          this.renderStatisticsPage();
        } else {
          alert('Failed to import backup: ' + res.error);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  handleDataReset() {
    if (confirm('Are you sure you want to reset all typing sessions, weak keys, and progress? This cannot be undone.')) {
      StorageManager.resetAllData();
      this.updateDashboardMetrics();
      this.renderStatisticsPage();
      alert('All statistics have been reset.');
    }
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new LiquidTypeApp();
});
