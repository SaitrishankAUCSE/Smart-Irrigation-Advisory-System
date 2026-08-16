import React, { useRef, useEffect, useCallback } from 'react';

/**
 * PleatCanvas — Animated fabric-fold hero canvas
 * Inspired by AgriSense's pleat landing.
 * Renders warm earth-toned curtain folds on a canvas with cursor/scroll interactivity.
 * The brand name is drawn underneath and revealed as folds lift.
 */
export default function PleatCanvas({ brandText = 'AgriSense' }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const stateRef = useRef({
    N: 34, W: 0, H: 0, dpr: 1,
    bx: [], bw: [], lift: null,
    open: 0, scroll: 0, phase: 0, cursorX: -1,
    visible: true, running: false, raf: 0,
    markCanvas: null, MW: 0, MH: 0,
    narrow: false, fine: true, reduce: false,
  });

  const build = useCallback(() => {
    const s = stateRef.current;
    const band = containerRef.current;
    const cv = canvasRef.current;
    if (!band || !cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    s.dpr = Math.min(window.devicePixelRatio || 1, 2);
    s.W = band.clientWidth;
    s.H = band.clientHeight;
    if (!s.W || !s.H) return;

    s.narrow = s.W <= 820;
    s.N = Math.max(8, Math.min(40, Math.round(s.W / 42)));

    cv.width = Math.round(s.W * s.dpr);
    cv.height = Math.round(s.H * s.dpr);
    cv.style.width = s.W + 'px';
    cv.style.height = s.H + 'px';
    ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);

    s.lift = new Float32Array(s.N);

    // Irregular pleat widths — uniform bands read as CSS, not cloth
    s.bx = [];
    s.bw = [];
    const raw = [];
    let sum = 0;
    for (let i = 0; i < s.N; i++) {
      const v = 0.68 + 0.62 * Math.abs(Math.sin(i * 1.73 + 0.4));
      raw.push(v);
      sum += v;
    }
    let x = 0;
    for (let i = 0; i < s.N; i++) {
      const w = (raw[i] / sum) * s.W;
      s.bx.push(x);
      s.bw.push(w);
      x += w;
    }

    // Build the brand wordmark on an offscreen canvas
    const mark = document.createElement('canvas');
    const size = s.narrow
      ? Math.min(s.W * 0.16, s.H * 0.12)
      : Math.min(s.W * 0.065, s.H * 0.14);
    let m = mark.getContext('2d');
    m.font = `600 ${size}px 'Instrument Sans', system-ui, sans-serif`;
    s.MW = Math.ceil(m.measureText(brandText).width) + 8;
    s.MH = Math.ceil(size * 1.24);
    mark.width = Math.round(s.MW * s.dpr);
    mark.height = Math.round(s.MH * s.dpr);
    m = mark.getContext('2d');
    m.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
    m.font = `600 ${size}px 'Instrument Sans', system-ui, sans-serif`;
    m.fillStyle = '#EAE8E1';
    m.textBaseline = 'middle';
    m.fillText(brandText, 4, s.MH / 2);
    s.markCanvas = mark;
  }, [brandText]);

  const draw = useCallback(() => {
    const s = stateRef.current;
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx || !s.MW) return;

    ctx.fillStyle = '#0D0D0C';
    ctx.fillRect(0, 0, s.W, s.H);

    // Draw the brand wordmark underneath the folds
    const spread = 0.40 + 0.60 * s.open;
    const sw = s.MW / s.N;
    const dw = sw * spread;
    const totalW = dw * s.N;
    const x0 = s.narrow ? (s.W - totalW) / 2 : Math.max(s.W * 0.04, s.W * 0.95 - totalW);
    const y0 = s.narrow ? s.H * 0.58 - s.MH / 2 : s.H * 0.72 - s.MH / 2;

    for (let i = 0; i < s.N; i++) {
      const dx = x0 + i * dw;
      ctx.save();
      ctx.beginPath();
      ctx.rect(dx, 0, Math.ceil(dw) + 1, s.H);
      ctx.clip();
      ctx.drawImage(
        s.markCanvas,
        Math.round(i * sw * s.dpr), 0,
        Math.round(sw * s.dpr), s.markCanvas.height,
        dx, y0, dw + 1, s.MH
      );
      ctx.restore();
    }

    // Draw the pleated folds on top — earth tones (deep browns/greens)
    for (let i = 0; i < s.N; i++) {
      const facing = 0.5 + 0.5 * Math.sin(i * 0.8 + s.phase);
      const l = s.lift[i];
      const a = 0.97 - 0.92 * l;
      if (a <= 0.012) continue;

      const slide = l * s.bw[i] * 0.62;
      const px = s.bx[i] + slide;
      const pwid = s.bw[i] - slide + 1;
      if (pwid <= 0) continue;

      // Earth-toned folds: warm brown-green (R:120, G:62, B:38 base)
      const s1 = 0.50 + 0.58 * facing;
      const s2 = s1 * 1.16;
      const s3 = s1 * 0.86;

      const g = ctx.createLinearGradient(px, 0, px + pwid, 0);
      g.addColorStop(0,    `rgba(${(140*s1)|0},${(72*s1)|0},${(38*s1)|0},${a.toFixed(3)})`);
      g.addColorStop(0.62, `rgba(${(140*s2)|0},${(72*s2)|0},${(38*s2)|0},${a.toFixed(3)})`);
      g.addColorStop(1,    `rgba(${(140*s3)|0},${(72*s3)|0},${(38*s3)|0},${a.toFixed(3)})`);

      ctx.fillStyle = g;
      ctx.fillRect(px, 0, pwid, s.H);

      // Fold crease shadow
      ctx.fillStyle = `rgba(13,13,12,${(0.26 * (1 - l)).toFixed(3)})`;
      ctx.fillRect(px, 0, 1, s.H);
    }
  }, []);

  useEffect(() => {
    const s = stateRef.current;
    s.reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    s.fine = window.matchMedia('(hover:hover)').matches;

    build();

    const loop = () => {
      if (!s.visible) { s.running = false; return; }
      s.open += (s.scroll - s.open) * 0.07;
      s.phase += 0.005 + 0.010 * s.open;

      const sweepX = s.fine ? s.cursorX : (s.scroll * 1.25 - 0.12);
      const base = s.fine ? s.scroll * 0.34 : 0;

      for (let i = 0; i < s.N; i++) {
        const c = (s.bx[i] + s.bw[i] / 2) / s.W;
        let want = base;
        if (sweepX >= 0) {
          const d = Math.abs(c - sweepX);
          want = Math.min(1, want + Math.max(0, 0.98 - d * (s.fine ? 4.6 : 3.1)));
        }
        s.lift[i] += (want - s.lift[i]) * (want > s.lift[i] ? 0.16 : 0.045);
      }
      draw();
      s.raf = requestAnimationFrame(loop);
    };

    const kick = () => {
      if (!s.running && s.visible) {
        s.running = true;
        s.raf = requestAnimationFrame(loop);
      }
    };

    const onScroll = () => {
      const band = containerRef.current;
      if (!band) return;
      const b = band.getBoundingClientRect();
      s.scroll = Math.max(0, Math.min(1, (-b.top) / (b.height * 0.72)));
      kick();
    };

    const onPointerMove = (e) => {
      if (s.reduce || !s.fine) return;
      const band = containerRef.current;
      if (!band) return;
      const b = band.getBoundingClientRect();
      s.cursorX = (e.clientX - b.left) / b.width;
      kick();
    };

    const onPointerLeave = () => { s.cursorX = -1; };

    const onResize = () => {
      build();
      if (s.reduce) {
        s.open = 0.8; s.phase = 0.5;
        if (s.lift) for (let q = 0; q < s.N; q++) s.lift[q] = 0.66;
        draw();
      } else { draw(); kick(); }
    };

    const el = containerRef.current;

    if (s.reduce) {
      s.open = 0.8; s.phase = 0.5;
      if (s.lift) for (let q = 0; q < s.N; q++) s.lift[q] = 0.66;
      draw();
    } else {
      draw();
      window.addEventListener('scroll', onScroll, { passive: true });
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            s.visible = entry.isIntersecting;
            if (!s.visible) { cancelAnimationFrame(s.raf); s.running = false; }
            else kick();
          });
        }, { threshold: 0 });
        if (el) io.observe(el);
      } else {
        s.visible = true;
      }
      onScroll();
    }

    if (el) {
      el.addEventListener('pointermove', onPointerMove, { passive: true });
      el.addEventListener('pointerleave', onPointerLeave);
    }
    window.addEventListener('resize', onResize, { passive: true });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(onResize);
    }

    return () => {
      cancelAnimationFrame(s.raf);
      s.running = false;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (el) {
        el.removeEventListener('pointermove', onPointerMove);
        el.removeEventListener('pointerleave', onPointerLeave);
      }
    };
  }, [build, draw]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        height: '100vh',
        overflow: 'hidden',
        background: '#0D0D0C',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%', touchAction: 'pan-y' }}
      />
    </div>
  );
}
