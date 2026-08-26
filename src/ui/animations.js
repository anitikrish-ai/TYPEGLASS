/**
 * LiquidType Animation & Visual FX Engine
 * Ambient background fluid canvas, cursor-following refraction, count-up animations, confetti
 */

import confetti from 'canvas-confetti';

export class AmbientBackgroundEngine {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.orbs = [];
    this.animationFrameId = null;
    this.intensity = 1.0;
    this.mouseX = -1000;
    this.mouseY = -1000;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    // Create floating light orbs
    const colors = [
      'rgba(14, 165, 233, 0.15)', // Cyan
      'rgba(99, 102, 241, 0.14)', // Indigo
      'rgba(168, 85, 247, 0.12)', // Purple
      'rgba(236, 72, 153, 0.10)', // Pink
      'rgba(16, 185, 129, 0.08)'  // Emerald
    ];

    this.orbs = colors.map((color) => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      radius: 180 + Math.random() * 220,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      color,
      baseRadius: 180 + Math.random() * 220,
      phase: Math.random() * Math.PI * 2
    }));

    this.start();
  }

  resize() {
    if (!this.canvas) return;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  setIntensity(percent) {
    this.intensity = Math.max(0, Math.min(1, percent / 100));
  }

  start() {
    const loop = () => {
      this.draw();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  draw() {
    if (!this.ctx || this.intensity <= 0.05) {
      this.ctx.clearRect(0, 0, this.width, this.height);
      return;
    }

    this.ctx.clearRect(0, 0, this.width, this.height);

    // Render interactive cursor ambient glow
    if (this.mouseX > 0 && this.mouseY > 0) {
      const cursorGrad = this.ctx.createRadialGradient(
        this.mouseX, this.mouseY, 0,
        this.mouseX, this.mouseY, 350 * this.intensity
      );
      cursorGrad.addColorStop(0, 'rgba(56, 189, 248, 0.08)');
      cursorGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      this.ctx.fillStyle = cursorGrad;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // Render smooth floating orbs
    this.orbs.forEach((orb) => {
      orb.x += orb.vx * this.intensity;
      orb.y += orb.vy * this.intensity;
      orb.phase += 0.008 * this.intensity;

      // Bounce off screen boundaries
      if (orb.x < -orb.radius) orb.x = this.width + orb.radius;
      if (orb.x > this.width + orb.radius) orb.x = -orb.radius;
      if (orb.y < -orb.radius) orb.y = this.height + orb.radius;
      if (orb.y > this.height + orb.radius) orb.y = -orb.radius;

      const dynamicRadius = orb.baseRadius + Math.sin(orb.phase) * 35;

      const grad = this.ctx.createRadialGradient(
        orb.x, orb.y, 0,
        orb.x, orb.y, dynamicRadius * this.intensity
      );
      grad.addColorStop(0, orb.color);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(orb.x, orb.y, dynamicRadius * this.intensity, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}

/**
 * Animated number counter with smooth cubic easing
 */
export function animateCountUp(element, endVal, duration = 1000, suffix = '', decimals = 0) {
  if (!element) return;
  const startVal = parseFloat(element.dataset.currentVal) || 0;
  const startTime = performance.now();

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(1, elapsed / duration);
    const eased = easeOutCubic(progress);
    const current = startVal + (endVal - startVal) * eased;

    element.textContent = (decimals > 0 ? current.toFixed(decimals) : Math.round(current)) + suffix;

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      element.dataset.currentVal = endVal;
      element.textContent = (decimals > 0 ? endVal.toFixed(decimals) : Math.round(endVal)) + suffix;
    }
  }

  requestAnimationFrame(step);
}

/**
 * Celebration confetti burst
 */
export function triggerCelebrationConfetti() {
  confetti({
    particleCount: 90,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#06b6d4', '#a855f7', '#3b82f6', '#10b981', '#f43f5e'],
    disableForReducedMotion: true
  });
}
