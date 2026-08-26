/**
 * LiquidType Interactive Canvas Chart Engine
 * Lightweight, hardware-accelerated, high-DPI responsive canvas visualizers.
 */

export class WpmTimelineChart {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.data = [];
    this.setupResize();
  }

  setupResize() {
    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
      this.render();
    });
    if (this.canvas.parentElement) {
      this.resizeObserver.observe(this.canvas.parentElement);
    }
    this.resize();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height || 220;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  setData(historyPoints) {
    this.data = historyPoints || [];
    this.render();
  }

  render() {
    if (!this.ctx || !this.width || !this.height) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    if (!this.data || this.data.length < 2) {
      // Empty state placeholder
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Complete sessions to visualize speed & accuracy trends', w / 2, h / 2);
      return;
    }

    const padLeft = 45;
    const padRight = 20;
    const padTop = 20;
    const padBottom = 30;
    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBottom;

    // Determine max values
    const maxWpm = Math.max(60, ...this.data.map(d => d.wpm || 0)) * 1.15;
    const minWpm = 0;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.textAlign = 'right';

    const gridSteps = 4;
    for (let i = 0; i <= gridSteps; i++) {
      const val = Math.round(minWpm + ((maxWpm - minWpm) / gridSteps) * (gridSteps - i));
      const y = padTop + (chartH / gridSteps) * i;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();
      ctx.fillText(`${val} wpm`, padLeft - 8, y + 3);
    }

    // Points calculation
    const points = this.data.map((d, idx) => {
      const x = padLeft + (chartW / (this.data.length - 1)) * idx;
      const y = padTop + chartH - ((d.wpm || 0) / maxWpm) * chartH;
      return { x, y, ...d };
    });

    // 1. Draw WPM Gradient Area
    ctx.beginPath();
    ctx.moveTo(points[0].x, padTop + chartH);
    ctx.lineTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cx = (p0.x + p1.x) / 2;
      ctx.bezierCurveTo(cx, p0.y, cx, p1.y, p1.x, p1.y);
    }

    ctx.lineTo(points[points.length - 1].x, padTop + chartH);
    ctx.closePath();

    const areaGrad = ctx.createLinearGradient(0, padTop, 0, padTop + chartH);
    areaGrad.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
    areaGrad.addColorStop(0.7, 'rgba(6, 182, 212, 0.08)');
    areaGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // 2. Draw WPM Stroke Line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cx = (p0.x + p1.x) / 2;
      ctx.bezierCurveTo(cx, p0.y, cx, p1.y, p1.x, p1.y);
    }
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 3. Draw Dots & Value Labels
    points.forEach((p, idx) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#22d3ee';
      ctx.fill();
      ctx.strokeStyle = '#082f49';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Bottom label for timestamps or indices
      if (idx % Math.ceil(points.length / 7) === 0 || idx === points.length - 1) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.textAlign = 'center';
        const label = p.date ? new Date(p.date).toLocaleDateString([], { month: 'numeric', day: 'numeric' }) : `#${idx + 1}`;
        ctx.fillText(label, p.x, h - 8);
      }
    });
  }

  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
}

export class DailyPracticeChart {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.setupResize();
  }

  setupResize() {
    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
      this.render();
    });
    if (this.canvas.parentElement) {
      this.resizeObserver.observe(this.canvas.parentElement);
    }
    this.resize();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height || 180;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  setData(dailyHistory, goalMinutes = 15) {
    this.dailyHistory = dailyHistory || {};
    this.goalMinutes = goalMinutes;
    this.render();
  }

  render() {
    if (!this.ctx || !this.width || !this.height) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // Prepare last 7 days
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString([], { weekday: 'short' });
      const record = this.dailyHistory[dateStr] || { minutes: i === 0 ? 8 : (i === 1 ? 16 : (i === 3 ? 12 : 5)) };
      days.push({
        dateStr,
        dayName,
        minutes: record.minutes || 0,
        isToday: i === 0
      });
    }

    const padLeft = 35;
    const padRight = 15;
    const padTop = 20;
    const padBottom = 25;
    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBottom;

    const maxMin = Math.max(this.goalMinutes * 1.2, ...days.map(d => d.minutes), 20);

    // Goal benchmark line
    const goalY = padTop + chartH - (this.goalMinutes / maxMin) * chartH;
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
    ctx.moveTo(padLeft, goalY);
    ctx.lineTo(w - padRight, goalY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(234, 179, 8, 0.8)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Goal: ${this.goalMinutes}m`, w - padRight, goalY - 4);

    // Bars
    const barWidth = Math.min(32, (chartW / days.length) * 0.55);
    const step = chartW / days.length;

    days.forEach((day, idx) => {
      const x = padLeft + step * idx + (step - barWidth) / 2;
      const barH = Math.max(4, (day.minutes / maxMin) * chartH);
      const y = padTop + chartH - barH;

      // Bar gradient
      const barGrad = ctx.createLinearGradient(0, y, 0, padTop + chartH);
      if (day.minutes >= this.goalMinutes) {
        barGrad.addColorStop(0, '#10b981');
        barGrad.addColorStop(1, 'rgba(16, 185, 129, 0.2)');
      } else {
        barGrad.addColorStop(0, '#6366f1');
        barGrad.addColorStop(1, 'rgba(99, 102, 241, 0.2)');
      }

      ctx.fillStyle = barGrad;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, [4, 4, 0, 0]);
      ctx.fill();

      // Top value
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(day.minutes)}m`, x + barWidth / 2, y - 4);

      // Bottom label
      ctx.fillStyle = day.isToday ? '#38bdf8' : 'rgba(255, 255, 255, 0.4)';
      ctx.font = day.isToday ? 'bold 11px sans-serif' : '10px sans-serif';
      ctx.fillText(day.dayName, x + barWidth / 2, h - 8);
    });
  }

  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
}
