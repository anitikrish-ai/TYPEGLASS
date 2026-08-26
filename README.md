# LiquidType - Desktop Typing Learning App

A desktop typing learning application built with **Electron**, **Vanilla HTML/CSS/JavaScript**, and a **Liquid Glass** aesthetic.

## Features

- **Liquid Glass Interface**: Semi-transparent frosted glass panels, dynamic backdrop blur, cursor-following light reflections, and 60 FPS ambient fluid animations.
- **Accurate Typing Engine**:
  - Real-time WPM calculation: `(Correct characters / 5) / elapsed minutes`
  - Real-time Accuracy calculation: `(Correct characters / total typed characters) * 100`
  - Real-time CPM calculation: `Correct characters / elapsed minutes`
  - Real-time progress tracking, error detection, backspace management, and strict backspace mode.
- **6 Comprehensive Typing Modes**:
  1. **Practice**: Curated passages across Beginner, Intermediate, and Advanced difficulties.
  2. **Speed Test**: Timed challenges (15s, 30s, 60s, 120s) with live rush countdown.
  3. **Accuracy Test**: Strict punctuation, symbols, and precision challenges.
  4. **Key Training**: Home row, top row, bottom row, and **Dynamic Weak Key Targeted Drills**.
  5. **Code Typing**: Real syntax challenges in JavaScript, TypeScript, Python, HTML/CSS, and Rust.
  6. **Custom Text**: Paste, load, and practice any custom articles, lyrics, or notes.
- **Interactive Keyboard Visualizer**:
  - Full desktop QWERTY layout.
  - 10-finger color-coded placement guidance.
  - Animated next-key breathing liquid glow.
  - Tactile physical keypress compression & feedback flash.
- **Telemetry & Offline Analytics**:
  - Smooth Bézier WPM & Accuracy progression timeline canvas chart.
  - Daily & weekly practice minutes bar chart.
  - Weak keys matrix with error rate percentages and 1-click drill launcher.
  - Full session history table with JSON backup export and import.
- **Procedural Web Audio Synthesizer**:
  - 100% offline, zero-asset Web Audio API sound engine.
  - Selectable switch profiles: *Liquid Glass*, *Mechanical Blue*, *Cream Thock*, *Soft Membrane*, and *Retro Arcade*.
  - Level-up / Personal Best fanfare chords with celebration confetti.
- **Keyboard-First Navigation**:
  - Complete keyboard navigation with hotkeys (`ESC`, `CTRL+R`, `CTRL+1..6`, `CTRL+,`, `Enter`, `Tab`).

---

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `ESC` | Pause / Resume session or close overlays |
| `CTRL + R` | Restart current typing exercise |
| `CTRL + 1` | Switch to Practice Mode |
| `CTRL + 2` | Switch to Speed Test Mode |
| `CTRL + 3` | Switch to Key Training Mode |
| `CTRL + 4` | Switch to Code Typing Mode |
| `CTRL + 5` | Switch to Statistics Dashboard |
| `CTRL + ,` | Open Settings & Preferences |
| `Enter` | Try Again (on Results Screen) |
| `Tab` | Next Passage (on Results Screen) |

---

## Getting Started

### 1. Installation
```bash
npm install
```

### 2. Development & Web Preview
```bash
npm run dev
```

### 3. Run as Native Desktop App (Electron)
```bash
npm start
```

### 4. Production Build
```bash
npm run build
```

---

## Testing & Verification Checklist

- [x] **Real-time typing engine**: Correct characters highlight in blue/teal, errors highlight with red underline and soft buzz.
- [x] **Accurate formulas**: Real-time WPM, CPM, and Accuracy update smoothly.
- [x] **Interactive Keyboard**: Highlights the next required key and flashes upon keystroke.
- [x] **Adaptive Weak Keys**: Automatically detects problematic keys and generates custom drill passages.
- [x] **Sound Engine**: Responsive tactile feedback across all switch sound profiles.
- [x] **Offline Storage**: All sessions, streak history, settings, and custom texts persist in local storage.
- [x] **Fluid Liquid Glass**: High-performance backdrop blur and dark/light theme switching.
