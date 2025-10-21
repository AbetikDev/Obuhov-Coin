(() => {
    document.addEventListener('DOMContentLoaded', () => {
        document.documentElement.classList.add('page-ready');
    });

    document.addEventListener('click', (e) => {
        const a = e.target.closest('a[href^="#"]');
        if (!a) { 
            return; 
        }
        const id = a.getAttribute('href').slice(1);
        const target = document.getElementById(id); : null;
        if(!target) return;
        e.preventDefault();
    });
})();