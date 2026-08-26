/**
 * LiquidType Local Data Storage Module
 * Completely offline, privacy-first local persistence using Web Storage & Electron bridge
 */

const STORAGE_KEYS = {
  SESSIONS: 'liquidtype_sessions_v1',
  STATS: 'liquidtype_stats_v1',
  WEAK_KEYS: 'liquidtype_weak_keys_v1',
  STREAK: 'liquidtype_streak_v1',
  SETTINGS: 'liquidtype_settings_v1',
  CUSTOM_TEXTS: 'liquidtype_custom_texts_v1'
};

const DEFAULT_SETTINGS = {
  theme: 'liquid-dark',
  glassOpacity: 75, // 40 - 95%
  blurIntensity: 24, // 8 - 40px
  animationIntensity: 100, // 0 - 100%
  fontSize: '24px', // '18px', '22px', '26px', '32px'
  fontFamily: 'JetBrains Mono',
  showKeyboard: true,
  showFingerGuide: true,
  soundEnabled: true,
  soundVolume: 65, // 0 - 100%
  soundProfile: 'liquid', // 'liquid', 'mechanical', 'thock', 'membrane', 'arcade'
  showLiveWpm: true,
  showLiveAccuracy: true,
  showTimer: true,
  showCpm: true,
  strictBackspace: false, // If true, must backspace immediately upon error
  reducedMotion: false,
  dailyGoalMinutes: 15,
  autoScroll: true
};

const DEFAULT_STREAK = {
  currentStreak: 1,
  highestStreak: 1,
  lastActiveDate: new Date().toISOString().split('T')[0],
  todayMinutes: 0,
  todaySessions: 0,
  history: {}
};

// Seed sample historical sessions if completely fresh
function getInitialSessions() {
  const today = new Date();
  const sessions = [];
  const samplePassages = [
    { title: 'The Liquid Canvas', wpm: 58, acc: 96, mode: 'Practice', diff: 'Intermediate', dur: 45 },
    { title: 'Flow State & Focus', wpm: 64, acc: 98, mode: 'Speed Test', diff: 'Advanced', dur: 60 },
    { title: 'Home Row Mastery', wpm: 52, acc: 99, mode: 'Key Training', diff: 'Beginner', dur: 30 },
    { title: 'Modern JavaScript Functions', wpm: 49, acc: 94, mode: 'Code Typing', diff: 'Intermediate', dur: 50 },
    { title: 'Algorithmic Harmony', wpm: 68, acc: 97, mode: 'Practice', diff: 'Advanced', dur: 65 }
  ];

  for (let i = 4; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const p = samplePassages[4 - i];
    sessions.push({
      id: 'seed_' + (5 - i),
      date: d.toISOString(),
      mode: p.mode,
      difficulty: p.diff,
      title: p.title,
      wpm: p.wpm,
      cpm: p.wpm * 5,
      accuracy: p.acc,
      timeSeconds: p.dur,
      correctChars: Math.round(p.wpm * 5 * (p.dur / 60)),
      incorrectChars: Math.max(1, Math.round((100 - p.acc) * 0.2 * (p.wpm * 5 * (p.dur / 60) / 100))),
      totalChars: Math.round(p.wpm * 5 * (p.dur / 60)),
      errors: Math.max(1, Math.round((100 - p.acc) * 0.15)),
      weakKeys: ['p', 'q', 'z', ';']
    });
  }
  return sessions;
}

export class StorageManager {
  static getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return { ...DEFAULT_SETTINGS };
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  static saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }

  static getSessions() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (!data) {
        const initial = getInitialSessions();
        this.saveSessions(initial);
        return initial;
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static saveSessions(sessions) {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions:', e);
    }
  }

  static addSession(session) {
    const sessions = this.getSessions();
    sessions.unshift(session);
    // Keep last 300 sessions to ensure quick rendering
    if (sessions.length > 300) {
      sessions.pop();
    }
    this.saveSessions(sessions);

    // Update streak and daily progress
    this.updateDailyStreak(session.timeSeconds);

    // Update weak keys aggregate
    if (session.characterStats) {
      this.updateWeakKeys(session.characterStats);
    }

    return sessions;
  }

  static getWeakKeys() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WEAK_KEYS);
      if (!data) {
        return {
          'p': { errors: 12, hits: 110, rate: 0.109 },
          'q': { errors: 8, hits: 60, rate: 0.133 },
          'z': { errors: 9, hits: 75, rate: 0.120 },
          ';': { errors: 14, hits: 95, rate: 0.147 },
          'b': { errors: 7, hits: 140, rate: 0.050 }
        };
      }
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  static updateWeakKeys(charStats) {
    const current = this.getWeakKeys();
    for (const [char, stats] of Object.entries(charStats)) {
      if (!current[char]) {
        current[char] = { errors: 0, hits: 0, rate: 0 };
      }
      current[char].errors += stats.errors || 0;
      current[char].hits += (stats.hits || 0) + (stats.errors || 0);
      current[char].rate = current[char].hits > 0 ? (current[char].errors / current[char].hits) : 0;
    }
    try {
      localStorage.setItem(STORAGE_KEYS.WEAK_KEYS, JSON.stringify(current));
    } catch (e) {
      console.error('Failed to save weak keys:', e);
    }
  }

  static getStreak() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STREAK);
      if (!data) return { ...DEFAULT_STREAK };
      return { ...DEFAULT_STREAK, ...JSON.parse(data) };
    } catch {
      return { ...DEFAULT_STREAK };
    }
  }

  static updateDailyStreak(durationSeconds = 0) {
    const streakData = this.getStreak();
    const todayStr = new Date().toISOString().split('T')[0];
    const lastDateStr = streakData.lastActiveDate;

    if (!streakData.history) streakData.history = {};
    if (!streakData.history[todayStr]) {
      streakData.history[todayStr] = { minutes: 0, sessions: 0 };
    }

    streakData.history[todayStr].minutes += Math.round((durationSeconds / 60) * 10) / 10;
    streakData.history[todayStr].sessions += 1;

    if (lastDateStr !== todayStr) {
      const lastDate = new Date(lastDateStr);
      const today = new Date(todayStr);
      const diffDays = Math.round((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

      if (diffDays === 1) {
        streakData.currentStreak += 1;
      } else if (diffDays > 1) {
        streakData.currentStreak = 1;
      }
      streakData.lastActiveDate = todayStr;
    }

    if (streakData.currentStreak > (streakData.highestStreak || 1)) {
      streakData.highestStreak = streakData.currentStreak;
    }

    streakData.todayMinutes = streakData.history[todayStr].minutes;
    streakData.todaySessions = streakData.history[todayStr].sessions;

    try {
      localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(streakData));
    } catch (e) {
      console.error('Failed to update streak:', e);
    }
    return streakData;
  }

  static getSummaryStats() {
    const sessions = this.getSessions();
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        personalBestWpm: 0,
        personalBestAccuracy: 0,
        averageWpm: 0,
        averageAccuracy: 0,
        totalTimeMinutes: 0,
        totalCharacters: 0,
        recentSessions: []
      };
    }

    let maxWpm = 0;
    let maxAcc = 0;
    let totalWpm = 0;
    let totalAcc = 0;
    let totalSecs = 0;
    let totalChars = 0;

    sessions.forEach(s => {
      if (s.wpm > maxWpm) maxWpm = s.wpm;
      if (s.accuracy > maxAcc) maxAcc = s.accuracy;
      totalWpm += s.wpm;
      totalAcc += s.accuracy;
      totalSecs += s.timeSeconds || 0;
      totalChars += s.totalChars || (s.wpm * 5);
    });

    return {
      totalSessions: sessions.length,
      personalBestWpm: Math.round(maxWpm),
      personalBestAccuracy: Math.round(maxAcc),
      averageWpm: Math.round(totalWpm / sessions.length),
      averageAccuracy: Math.round((totalAcc / sessions.length) * 10) / 10,
      totalTimeMinutes: Math.round(totalSecs / 60),
      totalCharacters: totalChars,
      recentSessions: sessions.slice(0, 10)
    };
  }

  static getCustomTexts() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_TEXTS);
      if (!data) {
        return [
          {
            id: 'custom_1',
            title: 'Reflections on Clean Code',
            content: 'Simplicity is prerequisite for reliability. Writing clean, expressive code transforms complex engineering problems into intuitive digital art.',
            dateAdded: new Date().toISOString()
          },
          {
            id: 'custom_2',
            title: 'The Cyberpunk Manifesto',
            content: 'The digital realm is fluid and unconstrained. Light glimmers through neon glass, whispering secrets of decentralized logic and boundless computational freedom.',
            dateAdded: new Date().toISOString()
          }
        ];
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static saveCustomText(title, content) {
    const list = this.getCustomTexts();
    const newItem = {
      id: 'custom_' + Date.now(),
      title: title.trim() || 'Untitled Custom Text',
      content: content.trim(),
      dateAdded: new Date().toISOString()
    };
    list.unshift(newItem);
    localStorage.setItem(STORAGE_KEYS.CUSTOM_TEXTS, JSON.stringify(list));
    return newItem;
  }

  static deleteCustomText(id) {
    let list = this.getCustomTexts();
    list = list.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.CUSTOM_TEXTS, JSON.stringify(list));
    return list;
  }

  static exportAllData() {
    const payload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      sessions: this.getSessions(),
      weakKeys: this.getWeakKeys(),
      streak: this.getStreak(),
      customTexts: this.getCustomTexts()
    };
    return JSON.stringify(payload, null, 2);
  }

  static importAllData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
      if (data.sessions) localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(data.sessions));
      if (data.weakKeys) localStorage.setItem(STORAGE_KEYS.WEAK_KEYS, JSON.stringify(data.weakKeys));
      if (data.streak) localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(data.streak));
      if (data.customTexts) localStorage.setItem(STORAGE_KEYS.CUSTOM_TEXTS, JSON.stringify(data.customTexts));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  static resetAllData() {
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.STATS);
    localStorage.removeItem(STORAGE_KEYS.WEAK_KEYS);
    localStorage.removeItem(STORAGE_KEYS.STREAK);
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_TEXTS);
  }
}
