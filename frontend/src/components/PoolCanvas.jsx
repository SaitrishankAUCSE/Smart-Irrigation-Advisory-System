import React, { useEffect, useRef } from 'react';
// AgriSense
export default function PoolCanvas({ brandText = 'AgriSense' }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const cv = canvasRef.current;
    const container = containerRef.current;
    if (!cv || !container) return;
    
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const INK = '#0D0D0C';
    const SHEET = 'rgb(234,232,225)';
    const RED = [186, 58, 36];

    const CELL = 7;
    const BANDS = 5; 
    const HEAL = 0.9979; 
    const BRUSH = 8; 
    const WAVE_EVERY = 3; 

    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16 - 0.5);

    let W = 0, H = 0, dpr = 1, gw = 0, gh = 0;
    let shade, cover, warp;
    const WARP_DECAY = 0.972, WARP_AMT = 1.35;
    let warpLive = 0;
    
    let off, offCtx, offImg;
    let textCv, textCtx;
    let running = false, visible = false, raf = 0, tick = 0;
    const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

    function layout() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = container.clientWidth;
      H = container.clientHeight;
      if (!W || !H) return;
      
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      cv.style.width = W + 'px';
      cv.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;

      gw = Math.max(8, Math.ceil(W / CELL));
      gh = Math.max(8, Math.ceil(H / CELL));
      shade = new Float32Array(gw * gh);
      cover = new Float32Array(gw * gh);
      warp = new Float32Array(gw * gh);
      for (let i = 0; i < cover.length; i++) cover[i] = 1;

      off = off || document.createElement('canvas');
      off.width = gw;
      off.height = gh;
      offCtx = off.getContext('2d', { willReadFrequently: true });
      offImg = offCtx.createImageData(gw, gh);

      buildText();
      computeWave(0);
    }

    function buildText() {
      if (!W || !H) return;
      textCv = textCv || document.createElement('canvas');
      textCv.width = Math.round(W * dpr);
      textCv.height = Math.round(H * dpr);
      textCtx = textCv.getContext('2d');
      textCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      textCtx.clearRect(0, 0, W, H);
      
      const size = Math.max(40, Math.min(220, W * 0.15));
      textCtx.font = `500 ${size}px 'Instrument Serif', serif`;
      textCtx.fillStyle = SHEET;
      textCtx.textAlign = 'center';
      textCtx.textBaseline = 'middle';
      textCtx.letterSpacing = '-0.02em';
      textCtx.fillText(brandText, W / 2, H * 0.5);
    }

    function computeWave(t) {
      for (let y = 0; y < gh; y++) {
        const ny = y / gh;
        for (let x = 0; x < gw; x++) {
          const nx = x / gw;
          let v = Math.sin(nx * 3.0 + t * 0.00024) +
                  Math.sin(nx * 1.6 - ny * 2.4 + t * 0.00033) * 0.7 +
                  Math.sin(ny * 4.4 + nx * 0.8 - t * 0.00019) * 0.5;
          v = (v + 2.2) / 4.4; 
          
          const i = y * gw + x;
          v += warp[i] * WARP_AMT;
          const dith = BAYER[(y & 3) * 4 + (x & 3)] * (1 / BANDS);
          const q = Math.round((v + dith) * (BANDS - 1)) / (BANDS - 1);
          shade[i] = q < 0 ? 0 : q > 1 ? 1 : q;
        }
      }
    }

    function paint() {
      ctx.fillStyle = INK;
      ctx.fillRect(0, 0, W, H);
      if (textCv) ctx.drawImage(textCv, 0, 0, W, H);

      const d = offImg.data;
      for (let i = 0, p = 0; i < cover.length; i++, p += 4) {
        const s = 0.62 + shade[i] * 0.62;
        const r = RED[0] * s, g = RED[1] * s, b = RED[2] * s;
        d[p] = r > 255 ? 255 : r;
        d[p + 1] = g > 255 ? 255 : g;
        d[p + 2] = b > 255 ? 255 : b;
        d[p + 3] = cover[i] * 255;
      }
      offCtx.putImageData(offImg, 0, 0);
      ctx.drawImage(off, 0, 0, gw, gh, 0, 0, W, H);
    }

    function frame(now) {
      if (!visible) {
        running = false;
        return;
      }
      if (warpLive > 0.002 || tick % WAVE_EVERY === 0) computeWave(now);
      tick++;
      warpLive = 0;

      if (holding && holdX >= 0) {
        if (dwell < DWELL_MAX) dwell += 0.028;
        part(holdX, holdY, 0.14, BRUSH * (1 + dwell));
      }
      for (let i = 0; i < cover.length; i++) {
        if (cover[i] < 1) {
          cover[i] = 1 - (1 - cover[i]) * HEAL;
          if (cover[i] > 0.999) cover[i] = 1;
        }
        if (warp[i] !== 0) {
          warp[i] *= WARP_DECAY;
          const a = warp[i] < 0 ? -warp[i] : warp[i];
          if (a < 0.002) warp[i] = 0;
          else if (a > warpLive) warpLive = a;
        }
      }
      paint();
      raf = requestAnimationFrame(frame);
    }

    function kick() {
      if (!running && visible) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    }

    function paintStatic() {
      ctx.fillStyle = INK;
      ctx.fillRect(0, 0, W, H);
      if (textCv) ctx.drawImage(textCv, 0, 0, W, H);
      ctx.fillStyle = 'rgba(186,58,36,0.45)';
      ctx.fillRect(0, 0, W, H);
    }

    function part(gx, gy, strength, radius) {
      const R = radius || BRUSH;
      const r0 = Math.floor(gy - R), r1 = Math.ceil(gy + R);
      const c0 = Math.floor(gx - R), c1 = Math.ceil(gx + R);
      for (let y = r0; y <= r1; y++) {
        if (y < 0 || y >= gh) continue;
        for (let x = c0; x <= c1; x++) {
          if (x < 0 || x >= gw) continue;
          const dx = x - gx, dy = y - gy;
          const d = Math.sqrt(dx * dx + dy * dy) / R;
          if (d > 1) continue;
          const fall = (1 - d) * (1 - d);
          const i = y * gw + x;
          const v = cover[i] - fall * strength;
          cover[i] = v < 0.02 ? 0.02 : v;
          const wv = warp[i] + fall * strength * 1.6;
          warp[i] = wv > 1.1 ? 1.1 : wv;
          if (wv > warpLive) warpLive = wv;
        }
      }
    }

    let holdX = -1, holdY = -1, holding = false, dwell = 0;
    const DWELL_MAX = 2.6;
    let lx = -1, ly = -1;

    function toGrid(e) {
      const b = cv.getBoundingClientRect();
      return {
        x: (e.clientX - b.left) / b.width * gw,
        y: (e.clientY - b.top) / b.height * gh
      };
    }

    const handlePointerMove = (e) => {
      if (reduce || !gw) return;
      const g = toGrid(e);
      if (lx >= 0) {
        const n = Math.min(14, Math.ceil(Math.hypot(g.x - lx, g.y - ly) / 2));
        for (let s = 1; s <= n; s++) {
          part(lx + (g.x - lx) * (s / n), ly + (g.y - ly) * (s / n), 0.42);
        }
      } else {
        part(g.x, g.y, 0.34);
      }
      if (holdX >= 0 && Math.hypot(g.x - holdX, g.y - holdY) > 1.2) dwell = 0;
      holdX = g.x;
      holdY = g.y;
      holding = true;
      lx = g.x;
      ly = g.y;
      kick();
    };

    const handlePointerLeave = () => {
      lx = ly = -1;
      holding = false;
      dwell = 0;
      holdX = holdY = -1;
    };

    const handlePointerDown = (e) => {
      if (reduce || !gw) return;
      const g = toGrid(e);
      part(g.x, g.y, 0.85);
      kick();
    };

    const handleResize = () => {
      layout();
      if (reduce) paintStatic();
      else {
        paint();
        kick();
      }
    };

    cv.addEventListener('pointermove', handlePointerMove, { passive: true });
    cv.addEventListener('pointerleave', handlePointerLeave);
    cv.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    layout();
    if (reduce) paintStatic();
    else paint();

    let observer;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          visible = e.isIntersecting;
          if (!visible) {
            cancelAnimationFrame(raf);
            running = false;
            return;
          }
          if (reduce) return;
          if (!window.matchMedia('(hover:hover)').matches) {
            for (let k = 0; k <= 26; k++) {
              part(gw * (k / 26), gh * (0.42 + Math.sin(k * 0.45) * 0.08), 0.34);
            }
          }
          kick();
        });
      }, { threshold: 0.12 });
      observer.observe(container);
    } else {
      visible = true;
      kick();
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        buildText();
        if (reduce) paintStatic();
      });
    }

    return () => {
      cancelAnimationFrame(raf);
      running = false;
      cv.removeEventListener('pointermove', handlePointerMove);
      cv.removeEventListener('pointerleave', handlePointerLeave);
      cv.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', handleResize);
      if (observer) observer.disconnect();
    };
  }, [brandText]);

  return (
    <div ref={containerRef} className="pool" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: 'var(--proof)' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%', touchAction: 'pan-y' }} />
    </div>
  );
}
