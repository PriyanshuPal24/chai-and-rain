// Streaks falling past the viewer plus droplets that gather on the screen and slide down.
export function startRainCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  const trails = document.createElement("canvas");
  const tctx = trails.getContext("2d");
  const MAX_DROPS = 120;
  let w = 0, h = 0, streaks = [], drops = [], raf;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = trails.width = w * dpr;
    canvas.height = trails.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    streaks = Array.from({ length: Math.round(w / 6) }, () => newStreak(true));
  }

  function newStreak(anywhere) {
    return {
      x: Math.random() * (w + 200) - 100,
      y: anywhere ? Math.random() * h : -40,
      len: 14 + Math.random() * 26,
      v: 14 + Math.random() * 14,
      a: 0.08 + Math.random() * 0.2,
    };
  }

  function drawDrop(d) {
    const g = ctx.createRadialGradient(d.x - d.r * 0.3, d.y - d.r * 0.3, d.r * 0.1, d.x, d.y, d.r);
    g.addColorStop(0, "rgba(255,255,255,.04)");
    g.addColorStop(0.75, "rgba(200,220,255,.14)");
    g.addColorStop(1, "rgba(255,255,255,.4)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(d.x, d.y, d.r, d.r * 1.25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.75)";
    ctx.beginPath();
    ctx.arc(d.x - d.r * 0.35, d.y - d.r * 0.5, Math.max(d.r * 0.18, 0.5), 0, Math.PI * 2);
    ctx.fill();
  }

  function frame() {
    tctx.globalCompositeOperation = "destination-out";
    tctx.fillStyle = "rgba(0,0,0,.025)";
    tctx.fillRect(0, 0, w, h);
    tctx.globalCompositeOperation = "source-over";

    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1;
    for (const s of streaks) {
      ctx.strokeStyle = `rgba(190,210,255,${s.a})`;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.len * 0.22, s.y + s.len);
      ctx.stroke();
      s.y += s.v; s.x -= s.v * 0.22;
      if (s.y > h) Object.assign(s, newStreak(false));
    }

    if (drops.length < MAX_DROPS && Math.random() < 0.5) {
      drops.push({ x: Math.random() * w, y: Math.random() * h, r: 1.5 + Math.random() * 3.5, vy: 0, sliding: false, wait: 0 });
    }

    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      if (!d.sliding) {
        d.r += 0.006;
        if (d.r > 4.2 && Math.random() < 0.01) { d.sliding = true; d.vy = 0.6; }
      } else {
        d.vy = Math.min(d.vy + 0.05, 5);
        // Stop-and-go slide like a real droplet on glass.
        if (Math.random() < 0.03) d.wait = 6 + Math.random() * 14;
        const stepY = d.wait > 0 ? (d.wait--, 0) : d.vy;
        const nx = d.x + (Math.random() - 0.5) * 0.4;
        const ny = d.y + stepY;
        tctx.strokeStyle = "rgba(200,220,255,.22)";
        tctx.lineWidth = Math.max(d.r * 0.7, 1);
        tctx.lineCap = "round";
        tctx.beginPath();
        tctx.moveTo(d.x, d.y);
        tctx.lineTo(nx, ny);
        tctx.stroke();
        d.x = nx; d.y = ny;
        d.r = Math.max(d.r - 0.004, 1.6);
        if (d.y > h + 10) { drops.splice(i, 1); continue; }
      }
      drawDrop(d);
    }

    ctx.drawImage(trails, 0, 0, w, h);
    raf = requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize);
  resize();
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    ctx.clearRect(0, 0, w, h);
  };
}
