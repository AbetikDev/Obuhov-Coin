// логін + регістр 
(() => {
  const ensureStyles = () => {
    const existing = document.querySelector('link[data-auth-style]');
    if (existing) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'assets/styles/auth.css';
    link.setAttribute('data-auth-style', '');
    document.head.appendChild(link);
  };

  const openAuth = () => {
    ensureStyles();
    if (document.getElementById('auth-modal-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'auth-modal-overlay';
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    const wrap = document.createElement('div');
    wrap.style.position = 'relative';
    const header = document.createElement('div');
    header.className = 'auth-header';
    const tabLogin = document.createElement('button');
    tabLogin.type = 'button';
    tabLogin.className = 'auth-tab active';
    tabLogin.textContent = 'Login';
    const tabReg = document.createElement('button');
    tabReg.type = 'button';
    tabReg.className = 'auth-tab';
    tabReg.textContent = 'Register';
    header.appendChild(tabLogin);
    header.appendChild(tabReg);
    const close = document.createElement('button');
    close.className = 'auth-close';
    close.textContent = '×';
    const body = document.createElement('div');
    body.className = 'auth-body';
    const error = document.createElement('div');
    error.className = 'auth-error';

    const formLogin = document.createElement('form');
    formLogin.innerHTML = `
      <div class="auth-field"><label>Email</label><input type="email" name="email" required></div>
      <div class="auth-field"><label>Password</label><input type="password" name="password" minlength="6" required></div>
      <div class="auth-actions">
        <button class="btn-ghost" type="button" id="switch-to-reg">Register</button>
        <button class="btn-primary" type="submit">Login</button>
      </div>
    `;

    const formReg = document.createElement('form');
    formReg.style.display = 'none';
    formReg.innerHTML = `
      <div class="auth-field"><label>Name</label><input type="text" name="name" required></div>
      <div class="auth-field"><label>Email</label><input type="email" name="email" required></div>
      <div class="auth-field"><label>Password</label><input type="password" name="password" minlength="6" required></div>
      <div class="auth-actions">
        <button class="btn-ghost" type="button" id="switch-to-login">Back</button>
        <button class="btn-primary" type="submit">Create account</button>
      </div>
    `;

    body.appendChild(formLogin);
    body.appendChild(formReg);
    body.appendChild(error);
    wrap.appendChild(header);
    wrap.appendChild(close);
    wrap.appendChild(body);
    modal.appendChild(wrap);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.body.classList.add('auth-no-scroll');

    requestAnimationFrame(() => overlay.classList.add('show'));

    const setTab = (name) => {
      if (name === 'login') {
        tabLogin.classList.add('active');
        tabReg.classList.remove('active');
        formLogin.style.display = '';
        formReg.style.display = 'none';
      } else {
        tabReg.classList.add('active');
        tabLogin.classList.remove('active');
        formReg.style.display = '';
        formLogin.style.display = 'none';
      }
      error.textContent = '';
    };

    const closeModal = () => {
      overlay.classList.remove('show');
      document.body.classList.remove('auth-no-scroll');
      setTimeout(() => overlay.remove(), 220);
    };

    overlay.addEventListener('click', (ev) => { if (ev.target === overlay) closeModal(); });
    close.addEventListener('click', closeModal);
    tabLogin.addEventListener('click', () => setTab('login'));
    tabReg.addEventListener('click', () => setTab('reg'));
    formLogin.querySelector('#switch-to-reg').addEventListener('click', () => setTab('reg'));
    formReg.querySelector('#switch-to-login').addEventListener('click', () => setTab('login'));

    formLogin.addEventListener('submit', (ev) => {
      ev.preventDefault();
      error.textContent = '';
      const fd = new FormData(formLogin);
      const email = String(fd.get('email')||'').trim();
      const password = String(fd.get('password')||'');
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { error.textContent = 'Invalid email'; return; }
      if (password.length < 6) { error.textContent = 'Min 6 characters'; return; }
      try {
        localStorage.setItem('auth_user', JSON.stringify({ email }));
        document.dispatchEvent(new CustomEvent('auth:login', { detail: { email } }));
        closeModal();
      } catch {}
    });

    formReg.addEventListener('submit', (ev) => {
      ev.preventDefault();
      error.textContent = '';
      const fd = new FormData(formReg);
      const name = String(fd.get('name')||'').trim();
      const email = String(fd.get('email')||'').trim();
      const password = String(fd.get('password')||'');
      if (!name) { error.textContent = 'Enter your name'; return; }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { error.textContent = 'Invalid email'; return; }
      if (password.length < 6) { error.textContent = 'Min 6 characters'; return; }
      try {
        localStorage.setItem('auth_user', JSON.stringify({ name, email }));
        document.dispatchEvent(new CustomEvent('auth:register', { detail: { name, email } }));
        closeModal();
      } catch {}
    });
  };

  const init = () => {
    ensureStyles();
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.h-login-btn');
      if (btn) openAuth();
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
