(() => {
  const coinWrap = document.querySelector('.coin-3d-wrapper');
  const coin = document.querySelector('.coin-image-3d');
  if (!coinWrap || !coin) return;

  const maxTilt = 12;

  const idleGlow  = { y: 8,  blur: 16, a: 0.18 };
  const activeGlow = { y: 14, blur: 24, a: 0.26 };

  let target = { rx: 0, ry: 0, s: 1.01, glow: { ...idleGlow } };
  let state  = { rx: 0, ry: 0, s: 1.01, glow: { ...idleGlow } };

  const amp = 3;
  const speed = 0.0018;
  const drift = 0.0007;

  let interacting = false;
  let idleStart = performance.now();
  let lastTime = performance.now();

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const dropShadow = (y, blur, a) =>
    `drop-shadow(0 ${y.toFixed(1)}px ${blur.toFixed(1)}px rgba(38,212,81,${a.toFixed(3)}))`;

  const damp = (current, target, lambda, dt) =>
    current + (target - current) * (1 - Math.exp(-lambda * dt));

  const updateIdleTarget = (t) => {
    const dt = t - idleStart;
    target.rx = Math.sin(dt * speed) * amp;
    target.ry = Math.cos(dt * (speed + drift)) * amp;
    target.s  = 1.01;
    target.glow = idleGlow;
  };

  const pointerToTilt = (e) => {
    const r = coinWrap.getBoundingClientRect();
    const nx = clamp((e.clientX - r.left) / r.width, 0, 1);
    const ny = clamp((e.clientY - r.top) / r.height, 0, 1);
    const ry = (nx - 0.5) * 2 * maxTilt;
    const rx = -(ny - 0.5) * 2 * maxTilt;
    return { rx, ry };
  };

  const tick = (now) => {
    const dt = Math.min(32, now - lastTime)
    lastTime = now;

    if (!interacting) updateIdleTarget(now);

    state.rx = damp(state.rx, target.rx, 0.020, dt);
    state.ry = damp(state.ry, target.ry, 0.020, dt);
    state.s  = damp(state.s,  target.s,  0.016, dt);
    state.glow.y    = damp(state.glow.y,    target.glow.y,    0.020, dt);
    state.glow.blur = damp(state.glow.blur, target.glow.blur, 0.020, dt);
    state.glow.a    = damp(state.glow.a,    target.glow.a,    0.020, dt);

    coin.style.transform = `rotateX(${state.rx.toFixed(3)}deg) rotateY(${state.ry.toFixed(3)}deg) scale(${state.s.toFixed(3)})`;
    coin.style.filter = dropShadow(state.glow.y, state.glow.blur, state.glow.a);

    requestAnimationFrame(tick);
  };

  coinWrap.addEventListener('mouseenter', () => {
    interacting = true;
  });

  coinWrap.addEventListener('mousemove', (e) => {
    interacting = true;
    const { rx, ry } = pointerToTilt(e);
    target.rx = rx;
    target.ry = ry;
    target.s  = 1.03;
    target.glow = activeGlow;
  });

  coinWrap.addEventListener('mouseleave', () => {
    interacting = false;
    idleStart = performance.now();
  });

  requestAnimationFrame((t) => {
    lastTime = t;
    idleStart = t;
    requestAnimationFrame(tick);
  });
})();