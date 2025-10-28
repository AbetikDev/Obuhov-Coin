// Плавна анімація скролу з покращеною логікою
// Оптимізована версія для кращої продуктивності та плавності

(() => {
  const els = Array.from(document.querySelectorAll('[data-anim]'));
  if (!els.length) return;

  // Покращені пресети з м'якшими переходами
  const presets = {
    up: { 
      from: 'translateY(40px)', 
      to: 'translateY(0)', 
      opacity: { from: 0, to: 1 }
    },
    down: { 
      from: 'translateY(-40px)', 
      to: 'translateY(0)', 
      opacity: { from: 0, to: 1 }
    },
    left: { 
      from: 'translateX(40px)', 
      to: 'translateX(0)', 
      opacity: { from: 0, to: 1 }
    },
    right: { 
      from: 'translateX(-40px)', 
      to: 'translateX(0)', 
      opacity: { from: 0, to: 1 }
    },
    zoom: { 
      from: 'scale(0.8)', 
      to: 'scale(1)', 
      opacity: { from: 0, to: 1 }
    },
    fade: { 
      from: 'scale(1)', 
      to: 'scale(1)', 
      opacity: { from: 0, to: 1 }
    }
  };

  // Відстеження напрямку скролу з throttling для плавності
  let lastY = window.pageYOffset || document.documentElement.scrollTop || 0;
  let scrollDir = 'down';
  let ticking = false;

  const updateScrollDirection = () => {
    const currentY = window.pageYOffset || document.documentElement.scrollTop || 0;
    scrollDir = currentY > lastY ? 'down' : (currentY < lastY ? 'up' : scrollDir);
    lastY = currentY;
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateScrollDirection);
      ticking = true;
    }
  }, { passive: true });

  // Intersection Observer з покращеною логікою
  const observer = new IntersectionObserver((entries) => {
    const visibleEntries = entries.filter(entry => entry.isIntersecting);
    if (!visibleEntries.length) return;

    // Сортування елементів за позицією для послідовної анімації
    const sortedEntries = scrollDir === 'down'
      ? visibleEntries.sort((a, b) => 
          a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top
        )
      : visibleEntries.sort((a, b) => 
          b.target.getBoundingClientRect().top - a.target.getBoundingClientRect().top
        );

    sortedEntries.forEach((entry, index) => {
      const element = entry.target;
      
      // Отримання параметрів анімації
      const animType = element.dataset.anim || 'up';
      const duration = Number(element.dataset.animDur || 600); // Збільшена тривалість
      const baseDelay = Number(element.dataset.animDelay || 0);
      const easing = element.dataset.animEase || 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'; // М'якший easing
      const playOnce = (element.dataset.animOnce || 'true') !== 'false';
      
      const preset = presets[animType] || presets.up;
      
      // Каскадна затримка для плавного ефекту
      const cascadeDelay = scrollDir === 'down' ? index * 80 : index * 40;
      const totalDelay = baseDelay + cascadeDelay;

      // Створення анімації з покращеними параметрами
      const animation = element.animate([
        { 
          opacity: preset.opacity.from,
          transform: preset.from,
          filter: 'blur(2px)' // Додаємо легкий blur для м'якості
        },
        { 
          opacity: preset.opacity.to,
          transform: preset.to,
          filter: 'blur(0px)'
        }
      ], {
        duration: duration,
        delay: totalDelay,
        easing: easing,
        fill: 'forwards'
      });

      // Додаємо callback для завершення анімації
      animation.addEventListener('finish', () => {
        element.style.filter = 'none'; // Видаляємо filter після анімації
      });

      if (playOnce) {
        observer.unobserve(element);
      }
    });
  }, {
    threshold: [0.1, 0.2], // Множинні пороги для більш точного контролю
    rootMargin: '0px 0px -8% 0px' // Анімація починається раніше
  });

  // Ініціалізація елементів
  els.forEach(element => {
    const animType = element.dataset.anim || 'up';
    const preset = presets[animType] || presets.up;
    
    // Встановлення початкового стану
    element.style.opacity = '0';
    element.style.transform = preset.from;
    element.style.transition = 'none'; // Вимикаємо CSS переходи
    element.style.willChange = 'transform, opacity'; // Оптимізація для GPU
    
    observer.observe(element);
  });

  // Cleanup при виході зі сторінки
  window.addEventListener('beforeunload', () => {
    observer.disconnect();
  });
})();