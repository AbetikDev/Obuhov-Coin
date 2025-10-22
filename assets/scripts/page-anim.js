// Макс тут можна було зхробити бетер
(() => {
  const scrollToEl = (el, opt = {}) => { //скорлл плавній (не дуже плавний перероби)
    const header = document.querySelector('header');
    const rect = el.getBoundingClientRect();
    const top = window.pageYOffset + rect.top;
    const offset = header ? header.offsetHeight + 20 : 0; //шоб хедер не прятався
    const target = Math.max(0, top - offset);
    const start = window.pageYOffset;
    const distance = target - start;
    const duration = Number(opt.duration || 700);
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      const v = ease(t);
      window.scrollTo(0, Math.round(start + distance * v));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.classList.add('page-ready');
    if (location.hash) {
      const id = decodeURIComponent(location.hash.slice(1));
      const target = document.getElementById(id);
      if (target) setTimeout(() => scrollToEl(target, { behavior: 'smooth' }), 0);
    }
  });

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]'); // шоб работало по #
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    scrollToEl(target, { behavior: 'smooth' });
    history.pushState(null, '', `#${id}`);
  });

  // коли адрес странічки буде мінятися, то автоватом буде прокрут к елементу
  window.addEventListener('hashchange', () => {
    const id = decodeURIComponent(location.hash.slice(1));
    const target = document.getElementById(id);
    if (target) scrollToEl(target, { behavior: 'smooth' });
  });
})();