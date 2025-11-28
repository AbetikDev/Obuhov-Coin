// Система авторизації та управління користувачами

// Допоміжна функція для збереження акаунту в список
function saveAccountToList(username) {
    let savedAccounts = JSON.parse(localStorage.getItem('savedAccounts') || '[]');
    if (!savedAccounts.includes(username)) {
        savedAccounts.push(username);
        localStorage.setItem('savedAccounts', JSON.stringify(savedAccounts));
    }
}

// Допоміжна функція для видалення акаунту зі списку
function removeAccountFromList(username) {
    let savedAccounts = JSON.parse(localStorage.getItem('savedAccounts') || '[]');
    savedAccounts = savedAccounts.filter(acc => acc !== username);
    localStorage.setItem('savedAccounts', JSON.stringify(savedAccounts));
}

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', async () => {
    await initializeAuth();
    checkAuthStatus();
});

// Ініціалізація системи авторизації
async function initializeAuth() {
    // Перевірка з'єднання з сервером
    await checkServerConnection();
    
    // Обробники для модального вікна
    setupModalHandlers();
    
    // Оновлення UI авторизації (кнопка LOGIN)
    await updateAuthUI();
}

// Перевірка з'єднання з сервером
async function checkServerConnection() {
    const isConnected = await API.checkConnection();
    if (!isConnected) {
        console.warn('⚠️ Сервер недоступний! Переконайтесь що start.bat запущено.');
        // Можна показати повідомлення користувачу
        showServerWarning();
    } else {
        console.log('✅ З\'єднання з сервером встановлено');
    }
}

// Показати попередження про сервер
function showServerWarning() {
    const existingWarning = document.getElementById('server-warning');
    if (existingWarning) return;
    
    const warning = document.createElement('div');
    warning.id = 'server-warning';
    warning.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 68, 68, 0.95);
        color: white;
        padding: 15px 30px;
        border-radius: 10px;
        z-index: 10001;
        font-weight: bold;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;
    warning.innerHTML = '⚠️ Нестабільне з\'єднання з сервером!';
    document.body.appendChild(warning);
    
    setTimeout(() => warning.remove(), 5000);
}

// Відкриття модального вікна логіну
function openLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Закриття модального вікна
function closeLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        // Очистка форм
        document.getElementById('login-form')?.reset();
        document.getElementById('register-form')?.reset();
        clearErrors();
    }
}

// Налаштування обробників для модального вікна
function setupModalHandlers() {
    // Закриття при кліку на overlay
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeLoginModal();
            }
        });
    }

    // Кнопка закриття
    const closeBtn = document.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeLoginModal);
    }

    // Перемикання між формами
    const showRegisterBtn = document.getElementById('show-register');
    const showLoginBtn = document.getElementById('show-login');
    
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            switchToRegister();
        });
    }

    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            switchToLogin();
        });
    }

    // Обробка форми логіну
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Обробка форми реєстрації
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Кнопка виходу
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// Перемикання на форму реєстрації
function switchToRegister() {
    document.getElementById('login-form-container').style.display = 'none';
    document.getElementById('register-form-container').style.display = 'block';
    clearErrors();
}

// Перемикання на форму логіну
function switchToLogin() {
    document.getElementById('register-form-container').style.display = 'none';
    document.getElementById('login-form-container').style.display = 'block';
    clearErrors();
}

// Обробка логіну
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
        showError('login-error', 'Заповніть всі поля');
        return;
    }

    // Спроба логіну через API
    const result = await API.login(username, password);
    
    if (!result.success) {
        showError('login-error', result.error || 'Невірне ім\'я користувача або пароль');
        return;
    }

    const user = result.user;

    // Успішний логін
    localStorage.setItem('currentUser', username);
    saveAccountToList(username); // Зберігаємо акаунт в список
    closeLoginModal();
    await updateAuthUI();
    
    // Редірект для адміна
    if (user.isAdmin) {
        window.location.href = 'admin.html';
    } else {
        window.location.href = 'profile.html';
    }
}

// Обробка реєстрації
async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    // Валідація
    if (!username || !password || !confirmPassword) {
        showError('register-error', 'Заповніть всі поля');
        return;
    }

    if (username.length < 3 || username.length > 8) {
        showError('register-error', 'Ім\'я користувача має бути від 3 до 8 символів');
        return;
    }

    if (password.length < 4 || password.length > 16) {
        showError('register-error', 'Пароль має бути від 4 до 16 символів');
        return;
    }

    if (password !== confirmPassword) {
        showError('register-error', 'Паролі не співпадають');
        return;
    }

    // Реєстрація через API
    const result = await API.register(username, password);
    
    if (!result.success) {
        showError('register-error', result.error || 'Помилка реєстрації');
        return;
    }
    
    // Автоматичний логін після реєстрації
    localStorage.setItem('currentUser', username);
    saveAccountToList(username); // Зберігаємо акаунт в список
    closeLoginModal();
    await updateAuthUI();
    window.location.href = 'profile.html';
}

// Вихід з поточного акаунту (повертає на головну з можливістю вибрати інший)
async function logoutFromCurrentAccount() {
    localStorage.removeItem('currentUser');
    closeAccountMenu();
    await updateAuthUI();
    window.location.href = 'index.html';
}

// Повний вихід з системи (застаріла функція, залишена для сумісності)
async function handleLogout() {
    await logoutFromCurrentAccount();
}

// Повний вихід (для кнопки в адмін-панелі)
async function handleFullLogout() {
    localStorage.removeItem('currentUser');
    closeAccountMenu();
    await updateAuthUI();
    updateAuthUI();
    window.location.href = 'index.html';
}

// Перевірка статусу авторизації
async function checkAuthStatus() {
    const currentUser = localStorage.getItem('currentUser');
    await updateAuthUI();
    return currentUser !== null;
}

// Оновлення UI в залежності від статусу авторизації
async function updateAuthUI() {
    const currentUsername = localStorage.getItem('currentUser');
    const loginBtn = document.querySelector('.h-login-btn');
    
    if (!loginBtn) {
        console.warn('⚠️ Кнопка .h-login-btn не знайдена');
        return;
    }
    
    // Очищаємо всі попередні обробники, створюючи новий елемент
    const newLoginBtn = loginBtn.cloneNode(true);
    loginBtn.parentNode.replaceChild(newLoginBtn, loginBtn);
    
    if (currentUsername) {
        // Отримуємо дані користувача з API
        const user = await API.getUser(currentUsername);
        
        if (user) {
            // Показати ім'я користувача
            newLoginBtn.textContent = user.username;
            
            // При кліку відкрити меню вибору акаунту (не модальне вікно!)
            newLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleAccountMenu();
            });
        } else {
            // Якщо користувача не знайдено в API - вийти
            console.warn('⚠️ Користувач не знайдений в БД, виходимо');
            localStorage.removeItem('currentUser');
            newLoginBtn.textContent = 'LOGIN';
            newLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                openLoginModal();
            });
        }
    } else {
        // Якщо не залогінений - показати LOGIN і відкривати модальне вікно
        newLoginBtn.textContent = 'LOGIN';
        newLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openLoginModal();
        });
    }
}

// Перемикання меню акаунтів
function toggleAccountMenu() {
    let menu = document.getElementById('account-menu');
    
    if (!menu) {
        menu = createAccountMenu();
        document.body.appendChild(menu);
    }
    
    if (menu.classList.contains('active')) {
        menu.classList.remove('active');
    } else {
        updateAccountMenu();
        menu.classList.add('active');
        
        // Позиціонування меню під кнопкою
        const loginBtn = document.querySelector('.h-login-btn');
        const rect = loginBtn.getBoundingClientRect();
        menu.style.top = (rect.bottom + 10) + 'px';
        menu.style.right = (window.innerWidth - rect.right) + 'px';
    }
}

// Створення меню акаунтів
function createAccountMenu() {
    const menu = document.createElement('div');
    menu.id = 'account-menu';
    menu.className = 'account-menu';
    
    // Закриття при кліку поза меню
    document.addEventListener('click', (e) => {
        const accountMenu = document.getElementById('account-menu');
        const loginBtn = document.querySelector('.h-login-btn');
        if (accountMenu && !accountMenu.contains(e.target) && e.target !== loginBtn) {
            accountMenu.classList.remove('active');
        }
    });
    
    return menu;
}

// Оновлення вмісту меню акаунтів
async function updateAccountMenu() {
    const menu = document.getElementById('account-menu');
    if (!menu) return;
    
    // Отримуємо тільки збережені в localStorage акаунти (локальні облікові записи користувача)
    const savedAccounts = JSON.parse(localStorage.getItem('savedAccounts') || '[]');
    const currentUser = localStorage.getItem('currentUser');
    
    let html = '<div class="account-menu-header">Мої акаунти</div>';
    
    // Якщо є збережені акаунти, показуємо їх
    if (savedAccounts.length > 0) {
        for (const username of savedAccounts) {
            try {
                const user = await API.getUser(username);
                if (user) {
                    const isActive = user.username === currentUser;
                    const icon = user.isAdmin ? '👑' : '👤';
                    
                    html += `
                        <div class="account-item ${isActive ? 'active' : ''}" onclick="switchAccount('${user.username}')">
                            <div class="account-info">
                                <span class="account-icon">${icon}</span>
                                <span class="account-name">${user.username}</span>
                                ${isActive ? '<span class="account-badge">Активний</span>' : ''}
                            </div>
                            <div class="account-balances">
                                <div class="account-coins">
                                    <img src="assets/images/icons/logo-2d.png" class="coin-mini-icon" alt="coin">
                                    ${(user.coins || 0).toFixed(2)}
                                </div>
                                <div class="account-usd">
                                    💵 $${(user.usd || 0).toFixed(2)}
                                </div>
                            </div>
                        </div>
                    `;
                }
            } catch (error) {
                console.error(`Помилка завантаження акаунту ${username}:`, error);
            }
        }
    } else if (currentUser) {
        // Якщо немає збережених акаунтів, але є поточний користувач - показуємо його
        try {
            const user = await API.getUser(currentUser);
            if (user) {
                const icon = user.isAdmin ? '👑' : '👤';
                html += `
                    <div class="account-item active" onclick="switchAccount('${user.username}')">
                        <div class="account-info">
                            <span class="account-icon">${icon}</span>
                            <span class="account-name">${user.username}</span>
                            <span class="account-badge">Активний</span>
                        </div>
                        <div class="account-balances">
                            <div class="account-coins">
                                <img src="assets/images/icons/logo-2d.png" class="coin-mini-icon" alt="coin">
                                ${(user.coins || 0).toFixed(2)}
                            </div>
                            <div class="account-usd">
                                💵 $${(user.usd || 0).toFixed(2)}
                            </div>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Помилка завантаження поточного користувача:', error);
        }
    }
    
    // Кнопки дій
    html += `
        <div class="account-menu-divider"></div>
        <div class="account-menu-actions">
            <button class="account-action-btn" onclick="openProfilePage()">
                📊 Мій профіль
            </button>
            <button class="account-action-btn" onclick="openLoginModal(); closeAccountMenu();">
                ➕ Додати акаунт
            </button>
            <button class="account-action-btn" onclick="logoutFromCurrentAccount()">
                ↩️ Вийти з акаунту
            </button>
            <button class="account-action-btn logout" onclick="handleFullLogout()">
                🚪 Повний вихід
            </button>
        </div>
    `;
    
    menu.innerHTML = html;
}

// Перемикання між акаунтами
async function switchAccount(username) {
    const currentUser = localStorage.getItem('currentUser');
    
    if (username === currentUser) {
        // Якщо клік по поточному акаунту - відкрити профіль
        await openProfilePage();
        return;
    }
    
    localStorage.setItem('currentUser', username);
    closeAccountMenu();
    await updateAuthUI();
    
    // Перезавантаження сторінки для оновлення контенту
    location.reload();
}

// Відкрити профіль
async function openProfilePage() {
    const user = await getCurrentUser();
    if (user) {
        if (user.isAdmin) {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'profile.html';
        }
    }
    closeAccountMenu();
}

// Закрити меню акаунтів
function closeAccountMenu() {
    const menu = document.getElementById('account-menu');
    if (menu) {
        menu.classList.remove('active');
    }
}

// Отримання поточного користувача
async function getCurrentUser() {
    const username = localStorage.getItem('currentUser');
    if (!username) return null;
    
    // Отримуємо дані з API
    const user = await API.getUser(username);
    return user;
}

// Показ помилки
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

// Очищення помилок
function clearErrors() {
    const errors = document.querySelectorAll('.error-message');
    errors.forEach(error => {
        error.style.display = 'none';
        error.textContent = '';
    });
}

// Перевірка чи є адміністратором
async function isAdmin() {
    const user = await getCurrentUser();
    return user && user.isAdmin === 1; // SQLite повертає 1 для true
}

// Захист сторінки (викликати на сторінках що потребують авторизації)
async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Захист адмін-панелі
async function requireAdmin() {
    const hasAuth = await requireAuth();
    if (!hasAuth) return false;
    
    const admin = await isAdmin();
    if (!admin) {
        notify.error('❌ Доступ заборонено! Ви не адміністратор.');
        window.location.href = 'profile.html';
        return false;
    }
    return true;
}
