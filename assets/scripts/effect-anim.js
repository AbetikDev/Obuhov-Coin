(() => {
  // мінєтка наклонілась как в 3д
  const coinWrap = document.querySelector('.coin-3d-wrapper');
  const coin = document.querySelector('.coin-image-3d');
  if (coinWrap && coin) {
    const maxTilt = 12; // 12 градусів прєдєл
    let timeout;
    const reset = () => {
      //ісход
      coin.style.transition = 'transform 200ms ease, filter 200ms ease';
      coin.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)';
      coin.style.filter = 'drop-shadow(0 10px 20px rgba(38,212,81,0.25))';
      clearTimeout(timeout);
      timeout = setTimeout(() => { coin.style.transition = ''; }, 220);
    };
    coinWrap.addEventListener('mousemove', (e) => {
      // накланяєм мінєтку по мишкє
      const r = coinWrap.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      const rotY = (x - 0.5) * 2 * maxTilt;
      const rotX = -(y - 0.5) * 2 * maxTilt;
      coin.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.03)`;
      coin.style.filter = 'drop-shadow(0 18px 30px rgba(38,212,81,0.35))';
    });
    coinWrap.addEventListener('mouseleave', reset);
    reset();
  }

  // логін батон (хуйня крива ой кнопочка)
  const btn = document.querySelector('.h-login-btn');
  if (btn) {
    btn.style.overflow = 'hidden';
    btn.addEventListener('click', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const ripple = document.createElement('span');
      ripple.style.position = 'absolute';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.style.width = '10px';
      ripple.style.height = '10px';
      ripple.style.borderRadius = '9999px';
      ripple.style.pointerEvents = 'none';
      ripple.style.background = 'rgba(255,255,255,0.35)';
      btn.appendChild(ripple);
      const maxDim = Math.max(rect.width, rect.height) * 2.2;
      ripple.animate([
        { transform: 'translate(-50%,-50%) scale(1)', opacity: 0.6 },
        { transform: `translate(-50%,-50%) scale(${maxDim / 10})`, opacity: 0 }
      ], { duration: 600, easing: 'ease-out', fill: 'forwards' });
      setTimeout(() => ripple.remove(), 620);
    });
  }
})();