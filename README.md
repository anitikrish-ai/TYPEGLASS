<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LiquidType — Premium Typing Experience</title>
  <style>
    :root {
      --bg-base: #07090c;
      --glass-surface: rgba(18, 22, 29, 0.65);
      --glass-border: rgba(255, 255, 255, 0.08);
      --accent-cyan: #7de2d1;
      --accent-coral: #ff6f61;
      --text-main: #f1f5f9;
      --text-muted: #64748b;
      --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
      --font-sans: 'Inter', system-ui, sans-serif;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-base);
      color: var(--text-main);
      font-family: var(--font-sans);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      overflow-x: hidden;
    }

    .glass-panel {
      background: var(--glass-surface);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--glass-border);
      border-radius: 16px;
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
      width: 100%;
      max-width: 900px;
      padding: 2.5rem;
    }

    .header-hud {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2.5rem;
      border-bottom: 1px solid var(--glass-border);
      padding-bottom: 1.25rem;
    }

    .brand {
      font-family: var(--font-sans);
      font-weight: 700;
      font-size: 1.25rem;
      color: var(--accent-cyan);
      letter-spacing: -0.02em;
    }

    .metrics-group {
      display: flex;
      gap: 2rem;
    }

    .metric-box {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .metric-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
    }

    .metric-value {
      font-family: var(--font-mono);
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .typing-area {
      position: relative;
      font-family: var(--font-mono);
      font-size: 1.35rem;
      line-height: 2;
      letter-spacing: 0.02em;
      min-height: 140px;
      cursor: text;
      user-select: none;
      margin-bottom: 2rem;
    }

    .char {
      position: relative;
      transition: color 0.1s ease;
    }

    .char.pending {
      color: var(--text-muted);
    }

    .char.correct {
      color: var(--accent-cyan);
    }

    .char.incorrect {
      color: var(--accent-coral);
      text-decoration: underline;
    }

    .cursor {
      position: absolute;
      width: 2px;
      height: 1.35rem;
      background-color: var(--accent-cyan);
      animation: blink 1s infinite;
      display: inline-block;
      vertical-align: middle;
    }

    .hud-keyboard {
      display: grid;
      gap: 6px;
      background: rgba(0, 0, 0, 0.2);
      padding: 1.25rem;
      border-radius: 12px;
      border: 1px solid var(--glass-border);
    }

    .kb-row {
      display: flex;
      justify-content: center;
      gap: 6px;
    }

    .key {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--glass-border);
      border-radius: 6px;
      height: 40px;
      min-width: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-mono);
      font-size: 0.85rem;
      color: var(--text-muted);
      transition: all 0.08s ease;
    }

    .key.active {
      background: var(--accent-cyan);
      color: var(--bg-base);
      border-color: var(--accent-cyan);
      box-shadow: 0 0 12px rgba(125, 226, 209, 0.4);
      transform: translateY(1px);
    }

    .key-space {
      min-width: 240px;
    }

    .footer-hints {
      margin-top: 1.5rem;
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      color: var(--text-muted);
      font-family: var(--font-mono);
    }

    .key-hint {
      background: rgba(255, 255, 255, 0.06);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid var(--glass-border);
    }

    @keyframes blink {
      0%, 49% { opacity: 1; }
      50%, 100% { opacity: 0; }
    }
  </style>
</head>
<body>

  <div class="glass-panel">
    <div class="header-hud">
      <div class="brand">◌ LiquidType</div>
      <div class="metrics-group">
        <div class="metric-box">
          <span class="metric-label">WPM</span>
          <span class="metric-value" id="wpm-display">0</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Accuracy</span>
          <span class="metric-value" id="acc-display">100%</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Time</span>
          <span class="metric-value" id="time-display">0s</span>
        </div>
      </div>
    </div>

    <div class="typing-area" id="typing-box">
      <span class="cursor" id="cursor"></span>
      <span id="text-container"></span>
    </div>

    <div class="hud-keyboard" id="keyboard">
      <div class="kb-row">
        <div class="key" data-key="q">Q</div>
        <div class="key" data-key="w">W</div>
        <div class="key" data-key="e">E</div>
        <div class="key" data-key="r">R</div>
        <div class="key" data-key="t">T</div>
        <div class="key" data-key="y">Y</div>
        <div class="key" data-key="u">U</div>
        <div class="key" data-key="i">I</div>
        <div class="key" data-key="o">O</div>
        <div class="key" data-key="p">P</div>
      </div>
      <div class="kb-row">
        <div class="key" data-key="a">A</div>
        <div class="key" data-key="s">S</div>
        <div class="key" data-key="d">D</div>
        <div class="key" data-key="f">F</div>
        <div class="key" data-key="g">G</div>
        <div class="key" data-key="h">H</div>
        <div class="key" data-key="j">J</div>
        <div class="key" data-key="k">K</div>
        <div class="key" data-key="l">L</div>
      </div>
      <div class="kb-row">
        <div class="key" data-key="z">Z</div>
        <div class="key" data-key="x">X</div>
        <div class="key" data-key="c">C</div>
        <div class="key" data-key="v">V</div>
        <div class="key" data-key="b">B</div>
        <div class="key" data-key="n">N</div>
        <div class="key" data-key="m">M</div>
      </div>
      <div class="kb-row">
        <div class="key key-space" data-key=" ">Space</div>
      </div>
    </div>

    <div class="footer-hints">
      <span><span class="key-hint">Tab</span> + <span class="key-hint">Enter</span> to restart</span>
      <span><span class="key-hint">Esc</span> to reset session</span>
    </div>
  </div>

  <script>
    const sampleText = "fluid interfaces require sub-millisecond precision and deliberate architecture";
    const textContainer = document.getElementById("text-container");
    const wpmDisplay = document.getElementById("wpm-display");
    const accDisplay = document.getElementById("acc-display");
    const timeDisplay = document.getElementById("time-display");

    let cursorIdx = 0;
    let totalErrors = 0;
    let totalStrokes = 0;
    let startTime = null;
    let timerInterval = null;

    // Initialize UI Characters
    function initDisplay() {
      textContainer.innerHTML = "";
      sampleText.split("").forEach((char) => {
        const span = document.createElement("span");
        span.className = "char pending";
        span.innerText = char;
        textContainer.appendChild(span);
      });
      cursorIdx = 0;
      totalErrors = 0;
      totalStrokes = 0;
      clearInterval(timerInterval);
      timerInterval = null;
      startTime = null;
      wpmDisplay.innerText = "0";
      accDisplay.innerText = "100%";
      timeDisplay.innerText = "0s";
    }

    initDisplay();

    // Procedural Audio Engine
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    function playClick(isError = false) {
      if (audioCtx.state === "suspended") audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = isError ? "sawtooth" : "triangle";
      osc.frequency.setValueAtTime(isError ? 120 : 600, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.04);
    }

    // Input Handling
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        initDisplay();
        return;
      }

      if (e.key === "Backspace" && cursorIdx > 0) {
        cursorIdx--;
        const prevChar = textContainer.children[cursorIdx];
        prevChar.className = "char pending";
        return;
      }

      if (e.key.length !== 1 || cursorIdx >= sampleText.length) return;

      if (!startTime) {
        startTime = performance.now();
        timerInterval = setInterval(updateTelemetry, 100);
      }

      const activeKey = document.querySelector(`.key[data-key="${e.key.toLowerCase()}"]`);
      if (activeKey) {
        activeKey.classList.add("active");
        setTimeout(() => activeKey.classList.remove("active"), 100);
      }

      const expected = sampleText[cursorIdx];
      const charEl = textContainer.children[cursorIdx];
      totalStrokes++;

      if (e.key === expected) {
        charEl.className = "char correct";
        playClick(false);
      } else {
        charEl.className = "char incorrect";
        totalErrors++;
        playClick(true);
      }

      cursorIdx++;
      updateTelemetry();

      if (cursorIdx === sampleText.length) {
        clearInterval(timerInterval);
      }
    });

    function updateTelemetry() {
      if (!startTime) return;
      const elapsedMinutes = (performance.now() - startTime) / 60000;
      const elapsedSeconds = Math.floor(elapsedMinutes * 60);

      const grossWpm = Math.round((cursorIdx / 5) / (elapsedMinutes || 0.001));
      const accuracy = totalStrokes > 0 ? Math.round(((totalStrokes - totalErrors) / totalStrokes) * 100) : 100;

      wpmDisplay.innerText = grossWpm > 0 ? grossWpm : 0;
      accDisplay.innerText = `${Math.max(0, accuracy)}%`;
      timeDisplay.innerText = `${elapsedSeconds}s`;
    }
  </script>
</body>
</html>

