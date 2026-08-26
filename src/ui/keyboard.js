/**
 * LiquidType Interactive Keyboard Visualizer
 * Renders an animated desktop QWERTY keyboard with real-time keypresses,
 * next-target glow, and 10-finger color coded placement guidance.
 */

export const FINGER_MAPPING = {
  // Left Hand
  'lp': { name: 'Left Pinky', color: '#ec4899', class: 'finger-lp' },
  'lr': { name: 'Left Ring', color: '#a855f7', class: 'finger-lr' },
  'lm': { name: 'Left Middle', color: '#6366f1', class: 'finger-lm' },
  'li': { name: 'Left Index', color: '#06b6d4', class: 'finger-li' },
  'th': { name: 'Thumbs', color: '#10b981', class: 'finger-th' },
  // Right Hand
  'ri': { name: 'Right Index', color: '#3b82f6', class: 'finger-ri' },
  'rm': { name: 'Right Middle', color: '#8b5cf6', class: 'finger-rm' },
  'rr': { name: 'Right Ring', color: '#d946ef', class: 'finger-rr' },
  'rp': { name: 'Right Pinky', color: '#f43f5e', class: 'finger-rp' }
};

export const KEY_LAYOUT = [
  // Function Row
  [
    { code: 'Escape', label: 'ESC', width: 'w-12', finger: 'lp' },
    { code: 'F1', label: 'F1', finger: 'lp' },
    { code: 'F2', label: 'F2', finger: 'lr' },
    { code: 'F3', label: 'F3', finger: 'lm' },
    { code: 'F4', label: 'F4', finger: 'li' },
    { code: 'F5', label: 'F5', finger: 'li' },
    { code: 'F6', label: 'F6', finger: 'ri' },
    { code: 'F7', label: 'F7', finger: 'ri' },
    { code: 'F8', label: 'F8', finger: 'rm' },
    { code: 'F9', label: 'F9', finger: 'rr' },
    { code: 'F10', label: 'F10', finger: 'rp' },
    { code: 'F11', label: 'F11', finger: 'rp' },
    { code: 'F12', label: 'F12', finger: 'rp' }
  ],
  // Number Row
  [
    { code: 'Backquote', label: '~', sub: '`', finger: 'lp' },
    { code: 'Digit1', label: '!', sub: '1', finger: 'lp' },
    { code: 'Digit2', label: '@', sub: '2', finger: 'lr' },
    { code: 'Digit3', label: '#', sub: '3', finger: 'lm' },
    { code: 'Digit4', label: '$', sub: '4', finger: 'li' },
    { code: 'Digit5', label: '%', sub: '5', finger: 'li' },
    { code: 'Digit6', label: '^', sub: '6', finger: 'ri' },
    { code: 'Digit7', label: '&', sub: '7', finger: 'ri' },
    { code: 'Digit8', label: '*', sub: '8', finger: 'rm' },
    { code: 'Digit9', label: '(', sub: '9', finger: 'rr' },
    { code: 'Digit0', label: ')', sub: '0', finger: 'rp' },
    { code: 'Minus', label: '_', sub: '-', finger: 'rp' },
    { code: 'Equal', label: '+', sub: '=', finger: 'rp' },
    { code: 'Backspace', label: 'BACK', width: 'w-20', finger: 'rp' }
  ],
  // Top Row (QWERTY)
  [
    { code: 'Tab', label: 'TAB', width: 'w-16', finger: 'lp' },
    { code: 'KeyQ', label: 'Q', finger: 'lp' },
    { code: 'KeyW', label: 'W', finger: 'lr' },
    { code: 'KeyE', label: 'E', finger: 'lm' },
    { code: 'KeyR', label: 'R', finger: 'li' },
    { code: 'KeyT', label: 'T', finger: 'li' },
    { code: 'KeyY', label: 'Y', finger: 'ri' },
    { code: 'KeyU', label: 'U', finger: 'ri' },
    { code: 'KeyI', label: 'I', finger: 'rm' },
    { code: 'KeyO', label: 'O', finger: 'rr' },
    { code: 'KeyP', label: 'P', finger: 'rp' },
    { code: 'BracketLeft', label: '{', sub: '[', finger: 'rp' },
    { code: 'BracketRight', label: '}', sub: ']', finger: 'rp' },
    { code: 'Backslash', label: '|', sub: '\\', width: 'w-14', finger: 'rp' }
  ],
  // Home Row (ASDF)
  [
    { code: 'CapsLock', label: 'CAPS', width: 'w-20', finger: 'lp' },
    { code: 'KeyA', label: 'A', finger: 'lp', home: true },
    { code: 'KeyS', label: 'S', finger: 'lr', home: true },
    { code: 'KeyD', label: 'D', finger: 'lm', home: true },
    { code: 'KeyF', label: 'F', finger: 'li', home: true, bump: true },
    { code: 'KeyG', label: 'G', finger: 'li' },
    { code: 'KeyH', label: 'H', finger: 'ri' },
    { code: 'KeyJ', label: 'J', finger: 'ri', home: true, bump: true },
    { code: 'KeyK', label: 'K', finger: 'rm', home: true },
    { code: 'KeyL', label: 'L', finger: 'rr', home: true },
    { code: 'Semicolon', label: ':', sub: ';', finger: 'rp', home: true },
    { code: 'Quote', label: '"', sub: "'", finger: 'rp' },
    { code: 'Enter', label: 'ENTER', width: 'w-24', finger: 'rp' }
  ],
  // Bottom Row (ZXCV)
  [
    { code: 'ShiftLeft', label: 'SHIFT', width: 'w-24', finger: 'lp' },
    { code: 'KeyZ', label: 'Z', finger: 'lp' },
    { code: 'KeyX', label: 'X', finger: 'lr' },
    { code: 'KeyC', label: 'C', finger: 'lm' },
    { code: 'KeyV', label: 'V', finger: 'li' },
    { code: 'KeyB', label: 'B', finger: 'li' },
    { code: 'KeyN', label: 'N', finger: 'ri' },
    { code: 'KeyM', label: 'M', finger: 'ri' },
    { code: 'Comma', label: '<', sub: ',', finger: 'rm' },
    { code: 'Period', label: '>', sub: '.', finger: 'rr' },
    { code: 'Slash', label: '?', sub: '/', finger: 'rp' },
    { code: 'ShiftRight', label: 'SHIFT', width: 'w-24', finger: 'rp' }
  ],
  // Space & Control Row
  [
    { code: 'ControlLeft', label: 'CTRL', width: 'w-16', finger: 'lp' },
    { code: 'AltLeft', label: 'ALT', width: 'w-14', finger: 'th' },
    { code: 'Space', label: 'SPACE', width: 'flex-1', finger: 'th' },
    { code: 'AltRight', label: 'ALT', width: 'w-14', finger: 'th' },
    { code: 'ControlRight', label: 'CTRL', width: 'w-16', finger: 'rp' }
  ]
];

// Maps printable characters to keyboard codes
export function getKeyCodeForChar(char) {
  if (!char) return null;
  if (char === ' ') return 'Space';
  if (char === '\n') return 'Enter';

  const c = char.toUpperCase();
  if (c >= 'A' && c <= 'Z') return `Key${c}`;
  if (c >= '0' && c <= '9') return `Digit${c}`;

  const symbolMap = {
    '!': 'Digit1', '@': 'Digit2', '#': 'Digit3', '$': 'Digit4', '%': 'Digit5',
    '^': 'Digit6', '&': 'Digit7', '*': 'Digit8', '(': 'Digit9', ')': 'Digit0',
    '-': 'Minus', '_': 'Minus', '=': 'Equal', '+': 'Equal',
    '[': 'BracketLeft', '{': 'BracketLeft', ']': 'BracketRight', '}': 'BracketRight',
    '\\': 'Backslash', '|': 'Backslash',
    ';': 'Semicolon', ':': 'Semicolon', "'": 'Quote', '"': 'Quote',
    ',': 'Comma', '<': 'Comma', '.': 'Period', '>': 'Period',
    '/': 'Slash', '?': 'Slash', '`': 'Backquote', '~': 'Backquote'
  };

  return symbolMap[char] || null;
}

export function requiresShift(char) {
  if (!char) return false;
  if (char >= 'A' && char <= 'Z') return true;
  const shiftSymbols = '!@#$%^&*()_+{}|:"<>?~';
  return shiftSymbols.includes(char);
}

export class KeyboardVisualizer {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = {
      showFingerGuide: true,
      visible: true,
      ...options
    };
    this.keyElements = new Map();
    this.activeTargetCode = null;
    this.shiftTargetCode = null;
    this.render();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = '';

    const kbWrapper = document.createElement('div');
    kbWrapper.className = 'keyboard-container flex flex-col gap-1.5 p-4 rounded-2xl select-none';
    kbWrapper.id = 'visual-keyboard';

    KEY_LAYOUT.forEach(row => {
      const rowEl = document.createElement('div');
      rowEl.className = 'keyboard-row flex items-center justify-center gap-1.5 w-full';

      row.forEach(k => {
        const keyEl = document.createElement('div');
        const widthClass = k.width || 'w-11 min-w-[2.75rem]';
        const fingerInfo = FINGER_MAPPING[k.finger] || FINGER_MAPPING['th'];

        keyEl.className = `key-cap ${widthClass} h-11 flex flex-col items-center justify-center relative rounded-lg text-xs font-semibold tracking-wider transition-all duration-75 cursor-default`;
        keyEl.dataset.code = k.code;
        keyEl.dataset.finger = k.finger;

        // Set finger dot / accent if guide is enabled
        if (k.bump) {
          const bump = document.createElement('div');
          bump.className = 'key-tactile-bump';
          keyEl.appendChild(bump);
        }

        if (k.sub) {
          const mainChar = document.createElement('span');
          mainChar.className = 'text-[11px] font-bold opacity-90';
          mainChar.textContent = k.label;

          const subChar = document.createElement('span');
          subChar.className = 'text-[9px] opacity-50';
          subChar.textContent = k.sub;

          keyEl.appendChild(mainChar);
          keyEl.appendChild(subChar);
        } else {
          const label = document.createElement('span');
          label.className = k.label === 'SPACE' ? 'text-[9px] opacity-40 font-mono tracking-widest' : 'text-xs font-bold';
          label.textContent = k.label;
          keyEl.appendChild(label);
        }

        if (this.options.showFingerGuide && k.finger) {
          const guideDot = document.createElement('div');
          guideDot.className = 'finger-indicator-dot';
          guideDot.style.backgroundColor = fingerInfo.color;
          keyEl.appendChild(guideDot);
        }

        rowEl.appendChild(keyEl);
        this.keyElements.set(k.code, keyEl);
      });

      kbWrapper.appendChild(rowEl);
    });

    this.container.appendChild(kbWrapper);
  }

  setNextTarget(char) {
    // Clear previous targets
    if (this.activeTargetCode) {
      const prevEl = this.keyElements.get(this.activeTargetCode);
      if (prevEl) prevEl.classList.remove('key-target-glow');
    }
    if (this.shiftTargetCode) {
      const shiftEl = this.keyElements.get(this.shiftTargetCode);
      if (shiftEl) shiftEl.classList.remove('key-target-glow');
    }

    if (!char) {
      this.activeTargetCode = null;
      this.shiftTargetCode = null;
      return;
    }

    const code = getKeyCodeForChar(char);
    const needShift = requiresShift(char);

    if (code) {
      this.activeTargetCode = code;
      const targetEl = this.keyElements.get(code);
      if (targetEl) {
        targetEl.classList.add('key-target-glow');
      }
    }

    if (needShift) {
      this.shiftTargetCode = 'ShiftLeft';
      const shiftEl = this.keyElements.get(this.shiftTargetCode);
      if (shiftEl) {
        shiftEl.classList.add('key-target-glow');
      }
    }
  }

  pressKey(code, isError = false) {
    const el = this.keyElements.get(code);
    if (!el) return;

    el.classList.add('key-pressed');
    if (isError) {
      el.classList.add('key-error-flash');
      setTimeout(() => el.classList.remove('key-error-flash'), 180);
    } else {
      el.classList.add('key-success-flash');
      setTimeout(() => el.classList.remove('key-success-flash'), 180);
    }

    setTimeout(() => {
      el.classList.remove('key-pressed');
    }, 120);
  }

  releaseKey(code) {
    const el = this.keyElements.get(code);
    if (el) {
      el.classList.remove('key-pressed');
    }
  }

  updateFingerGuide(show) {
    this.options.showFingerGuide = show;
    this.render();
  }

  setVisible(visible) {
    this.options.visible = visible;
    if (this.container) {
      this.container.style.display = visible ? 'block' : 'none';
    }
  }
}
