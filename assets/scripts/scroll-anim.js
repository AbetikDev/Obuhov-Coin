//jenia eto prosto top vot realno vot imba

// maxim logica shit peredelai mb bolshe plavnosti попробуй зробить коли скролл внизз усі елементи анімовані


(() => { 
  const els = Array.from(document.querySelectorAll('[data-anim]')); //шукає елементи дата-анім
  if (!els.length) return;
  const presets = {
    up: { from: 'translateY(24px)', to: 'translateY(0)' },
    down: { from: 'translateY(-24px)', to: 'translateY(0)' },
    left: { from: 'translateX(24px)', to: 'translateX(0)' },
    right: { from: 'translateX(-24px)', to: 'translateX(0)' },
    zoom: { from: 'scale(0.92)', to: 'scale(1)' },
    fade: { from: 'none', to: 'none' } //анімацки
  };
  let lastY = window.pageYOffset || document.documentElement.scrollTop || 0;
  let dir = 'down';
  window.addEventListener('scroll', () => {
    const y = window.pageYOffset || document.documentElement.scrollTop || 0;
    dir = y > lastY ? 'down' : (y < lastY ? 'up' : dir);
    lastY = y;
  }, { passive: true });

  const io = new IntersectionObserver((entries) => { //начало обработчика
    const visible = entries.filter(en => en.isIntersecting);
    if (!visible.length) return;
    const batch = dir === 'down'
      ? visible.sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top)
      : visible;
    for (let i = 0; i < batch.length; i++) {
      const en = batch[i];
      const el = en.target;
      const type = el.dataset.anim || 'up';
      const dur = Number(el.dataset.animDur || 700);
      const baseDel = Number(el.dataset.animDelay || 0);
      const easing = el.dataset.animEase || 'cubic-bezier(.22,.61,.36,1)';
      const once = (el.dataset.animOnce || 'true') !== 'false';
      const preset = presets[type] || presets.up;
      const delay = dir === 'down' ? baseDel + i * 60 : baseDel;
      el.animate([
        { opacity: 0, transform: preset.from },
        { opacity: 1, transform: preset.to }
      ], { duration: dur, delay, easing, fill: 'forwards' });
      if (once) io.unobserve(el);
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' }); //  14% елемента видно = анімуємо
  for (const el of els) {
    const type = el.dataset.anim || 'up';
    const preset = presets[type] || presets.up;
    el.style.opacity = '0'; //сначала він не видимий, а потом він стає відімім
    el.style.transform = preset.from;
    io.observe(el); //ну і анімка стартітса
  }
})();