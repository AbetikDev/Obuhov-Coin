// Скрипт для адмін-панелі

// Інтервал для автооновлення (кожні 5 секунд)
let autoUpdateInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Перевірка прав адміністратора
    const isAuthorized = await requireAdmin();
    if (!isAuthorized) return;

    // Завантаження даних
    await loadAdminData();
    await loadUsersTable();
    
    // Запуск автооновлення
    startAutoUpdate();
});

// Запуск автооновлення
function startAutoUpdate() {
    // Оновлення кожні 15 секунд для адмін-панелі
    autoUpdateInterval = setInterval(async () => {
        await loadStats();
        await loadUsersTable();
    }, 15000);
}

// Зупинка автооновлення
function stopAutoUpdate() {
    if (autoUpdateInterval) {
        clearInterval(autoUpdateInterval);
        autoUpdateInterval = null;
    }
}

// Завантаження даних адміністратора
async function loadAdminData() {
    const currentUser = await getCurrentUser();
    if (currentUser) {
        const adminNameElement = document.getElementById('admin-name');
        if (adminNameElement) {
            adminNameElement.textContent = currentUser.username;
        }
    }

    // Завантаження статистики
    loadStats();
}

// Завантаження статистики
async function loadStats() {
    try {
        // Отримуємо всіх користувачів з API
        const usersArray = await API.getAllUsers();
        
        // Поточний курс з API
        const rateElement = document.getElementById('admin-rate');
        if (rateElement) {
            const rate = await API.getExchangeRate();
            rateElement.textContent = '$' + rate.toFixed(2);
            
            // Додаємо анімацію оновлення
            rateElement.style.color = '#4caf50';
            rateElement.style.textShadow = '0 0 10px #4caf50';
            setTimeout(() => {
                rateElement.style.color = '';
                rateElement.style.textShadow = '';
            }, 1000);
        }
        
        // Загальна кількість користувачів
        const totalUsersElement = document.getElementById('total-users');
        if (totalUsersElement) {
            totalUsersElement.textContent = usersArray.length;
        }

        // Загальна кількість монет
        const totalCoins = usersArray.reduce((sum, user) => sum + (user.coins || 0) + (user.frozenCoins || 0), 0);
        const totalCoinsElement = document.getElementById('total-coins');
        if (totalCoinsElement) {
            totalCoinsElement.textContent = totalCoins.toFixed(2);
        }

        // Загальна кількість USD
        const totalUsd = usersArray.reduce((sum, user) => sum + (user.usd || 0) + (user.frozenUSD || 0), 0);
        const totalUsdElement = document.getElementById('total-usd');
        if (totalUsdElement) {
            totalUsdElement.textContent = '$' + totalUsd.toFixed(2);
        }

        // Кількість транзакцій (поки що з localStorage, якщо є API - треба буде додати)
        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        const totalTransactionsElement = document.getElementById('total-transactions');
        if (totalTransactionsElement) {
            totalTransactionsElement.textContent = transactions.length;
        }
        
        // Перевірка підключення до API
        await checkAPIStatus();
    } catch (error) {
        console.error('Помилка завантаження статистики:', error);
    }
}

// Перевірка статусу API
async function checkAPIStatus() {
    try {
        const isConnected = await API.checkConnection();
        const statusElement = document.getElementById('api-status');
        
        if (statusElement) {
            if (isConnected) {
                statusElement.textContent = '● API Connected';
                statusElement.style.color = '#4caf50';
            } else {
                statusElement.textContent = '● API Disconnected';
                statusElement.style.color = '#ff6b6b';
            }
        }
    } catch (error) {
        console.error('Помилка перевірки API:', error);
        const statusElement = document.getElementById('api-status');
        if (statusElement) {
            statusElement.textContent = '● API Error';
            statusElement.style.color = '#ff6b6b';
        }
    }
}

// Оновлення курсу валюти
async function updateRate() {
    const newRate = document.getElementById('new-rate').value;
    
    if (!newRate || parseFloat(newRate) <= 0) {
        alert('❌ Введіть коректний курс!');
        return;
    }
    
    try {
        const result = await API.updateExchangeRate(parseFloat(newRate));
        
        if (result.success) {
            alert(`✅ Курс успішно оновлено на $${parseFloat(newRate).toFixed(2)}!`);
            document.getElementById('new-rate').value = '';
            await loadStats();
            
            // Додаємо транзакцію про зміну курсу
            await API.addTransaction({
                type: 'rate_change',
                fromUser: 'admin',
                toUser: 'system',
                coins: 0,
                usd: 0,
                fee: 0,
                description: `Адмін змінив курс на $${parseFloat(newRate).toFixed(2)} за 1 OBUHOV`,
                timestamp: new Date().toISOString()
            });
        } else {
            alert('❌ Помилка оновлення курсу: ' + (result.error || 'Невідома помилка'));
        }
    } catch (error) {
        console.error('Помилка оновлення курсу:', error);
        alert('❌ Помилка оновлення курсу!');
    }
}

// Завантаження таблиці користувачів
async function loadUsersTable() {
    try {
        // Отримуємо всіх користувачів з API
        const usersArray = await API.getAllUsers();
        const tbody = document.getElementById('users-table-body');
        
        if (!tbody) return;

        tbody.innerHTML = '';

        usersArray.forEach(user => {
            const row = createUserRow(user);
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Помилка завантаження користувачів:', error);
        const tbody = document.getElementById('users-table-body');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #ff6b6b;">❌ Помилка завантаження користувачів</td></tr>';
        }
    }
}

// Створення рядка користувача
function createUserRow(user) {
    const tr = document.createElement('tr');
    tr.dataset.username = user.username;
    
    const date = new Date(user.registeredAt);
    const formattedDate = formatDate(date);
    
    tr.innerHTML = `
        <td>
            <img src="assets/images/icons/logo-maga.png" alt="${user.username}" class="user-avatar">
        </td>
        <td>${user.username}</td>
        <td>
            <span class="user-role ${user.isAdmin ? 'role-admin' : 'role-user'}">
                ${user.isAdmin ? '👑 Адмін' : '👤 Користувач'}
            </span>
        </td>
        <td>
            <span class="coin-badge">
                <img src="assets/images/icons/logo-2d.png" alt="coin" class="coin-icon-small">
                ${(user.coins || 0).toFixed(2)}
            </span>
            ${user.frozenCoins > 0 ? `<div class="frozen-info">🔒 ${user.frozenCoins.toFixed(2)}</div>` : ''}
        </td>
        <td>
            <span class="usd-badge">
                💵 $${(user.usd || 0).toFixed(2)}
            </span>
            ${user.frozenUSD > 0 ? `<div class="frozen-info">🔒 $${user.frozenUSD.toFixed(2)}</div>` : ''}
        </td>
        <td>${formattedDate}</td>
        <td>
            <div class="action-buttons">
                <button class="btn-small btn-edit" onclick="editUser('${user.username}')">
                    ✏️ Редагувати
                </button>
                <button class="btn-small btn-delete" onclick="deleteUser('${user.username}')" ${user.isAdmin ? 'disabled title="Неможливо видалити адміністратора"' : ''}>
                    🗑️ Видалити
                </button>
            </div>
        </td>
    `;
    
    return tr;
}

// Форматування дати
function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

// Фільтрація користувачів
function filterUsers() {
    const searchInput = document.getElementById('search-input');
    const filter = searchInput.value.toLowerCase();
    const rows = document.querySelectorAll('#users-table-body tr');
    
    rows.forEach(row => {
        const username = row.dataset.username.toLowerCase();
        if (username.includes(filter)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Редагування користувача
async function editUser(username) {
    try {
        // Отримуємо користувача з API
        const user = await API.getUser(username);
        
        if (!user) {
            alert('Користувача не знайдено!');
            return;
        }

        // Заповнення форми
        document.getElementById('edit-username').value = username;
        document.getElementById('edit-coins').value = (user.coins || 0).toFixed(2);
        document.getElementById('edit-usd').value = (user.usd || 0).toFixed(2);
        document.getElementById('edit-role').value = user.isAdmin ? 'true' : 'false';

        // Відкриття модального вікна
        const modal = document.getElementById('edit-modal');
        if (modal) {
            modal.classList.add('active');
        }
    } catch (error) {
        console.error('Помилка завантаження користувача:', error);
        alert('❌ Помилка завантаження даних користувача');
    }
}

// Закриття модального вікна редагування
function closeEditModal() {
    const modal = document.getElementById('edit-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Збереження змін користувача
async function saveUserChanges(event) {
    event.preventDefault();
    
    const username = document.getElementById('edit-username').value;
    const coins = parseFloat(document.getElementById('edit-coins').value);
    const usd = parseFloat(document.getElementById('edit-usd').value);
    const isAdmin = document.getElementById('edit-role').value === 'true';
    
    try {
        // Оновлення користувача через API
        const result = await API.updateUser(username, {
            coins: coins,
            usd: usd,
            isAdmin: isAdmin
        });
        
        if (!result.success) {
            alert('❌ Помилка оновлення користувача: ' + (result.error || 'Невідома помилка'));
            return;
        }
        
        // Логування зміни адміном
        logTransaction({
            type: 'admin_edit',
            from: 'admin',
            to: username,
            coins: coins,
            usd: usd,
            timestamp: new Date().toISOString(),
            description: `Адмін оновив баланс ${username}: ${coins.toFixed(2)} OBUHOV, $${usd.toFixed(2)}`
        });
        
        // Оновлення UI
        await loadStats();
        await loadUsersTable();
        closeEditModal();
        
        // Повідомлення
        alert(`✅ Дані користувача "${username}" успішно оновлено!`);
    } catch (error) {
        console.error('Помилка збереження змін:', error);
        alert('❌ Помилка збереження змін');
    }
}

// Видалення користувача
async function deleteUser(username) {
    try {
        // Отримуємо користувача з API для перевірки
        const user = await API.getUser(username);
        
        if (!user) {
            alert('Користувача не знайдено!');
            return;
        }

        if (user.isAdmin) {
            alert('❌ Неможливо видалити адміністратора!');
            return;
        }

        // Підтвердження видалення
        if (!confirm(`Ви впевнені, що хочете видалити користувача "${username}"?`)) {
            return;
        }

        // Видалення через API
        const result = await API.deleteUser(username);
        
        if (!result.success) {
            alert('❌ Помилка видалення користувача: ' + (result.error || 'Невідома помилка'));
            return;
        }
        
        // Якщо це поточний користувач - вийти
        const currentUsername = localStorage.getItem('currentUser');
        if (currentUsername === username) {
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
            return;
        }

        // Оновлення UI
        await loadStats();
        await loadUsersTable();
        
        alert(`✅ Користувача "${username}" успішно видалено!`);
    } catch (error) {
        console.error('Помилка видалення користувача:', error);
        alert('❌ Помилка видалення користувача');
    }
}

// Додавання монет користувачу
async function addCoins(username, amount) {
    try {
        const user = await API.getUser(username);
        if (!user) return;

        const newCoins = (user.coins || 0) + amount;
        const result = await API.updateUser(username, { coins: newCoins });
        
        if (result.success) {
            await loadStats();
            await loadUsersTable();
        }
    } catch (error) {
        console.error('Помилка додавання монет:', error);
    }
}

// Віднімання монет у користувача
async function removeCoins(username, amount) {
    try {
        const user = await API.getUser(username);
        if (!user) return;

        const newCoins = Math.max(0, (user.coins || 0) - amount);
        const result = await API.updateUser(username, { coins: newCoins });
        
        if (result.success) {
            await loadStats();
            await loadUsersTable();
        }
    } catch (error) {
        console.error('Помилка віднімання монет:', error);
    }
}
