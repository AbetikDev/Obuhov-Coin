(() => {
  const scrollToEl = (el, opt = {}) => { //скорлл плавній
    const header = document.querySelector('header');
    const rect = el.getBoundingClientRect();
    const top = window.pageYOffset + rect.top;
    const offset = header ? header.offsetHeight + 20 : 0; //шоб хедер не прятався
    window.scrollTo({ top: Math.max(0, top - offset), behavior: opt.behavior || 'smooth' });
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