// Клікер гра для Obuhov Coin
let gameState = {
    coins: 0,
    clickPower: 0.001, // Змінено на 0.001 OBUHOV за клік (1000 кліків = 1 монета)
    progressToNextCoin: 0,
    clicksNeeded: 1000, // 1000 кліків для 1 повної монети
    totalClicks: 0,
    multiplier: 1,
    autoClickers: 0,
    lastClickTime: 0, // Для затримки між кліками
    clickCooldown: 250, // 250 мс затримка
    autoClickerPrice: 100, // Ціна автоклікера
    upgrades: {
        clickPower: 1,
        autoClicker: 0,
        multiplier: 1
    }
};

// Елементи DOM
let coinsDisplay, balanceDisplay, progressBar, clickerButton, statusDesc, totalClicksDisplay, clickPowerDisplay;
let userNameDisplay, userStatusDisplay, profileBalanceDisplay, profileUsdDisplay, cooldownBar, cooldownText, progressText;

// Ініціалізація гри
document.addEventListener('DOMContentLoaded', async () => {
    // Перевірка авторизації
    const isAuthorized = await requireAuth();
    if (!isAuthorized) return;

    // Ініціалізація елементів
    initializeElements();
    
    // Завантаження даних користувача
    await loadUserData();
    
    // Запуск гри
    startGame();
    
    // Автозбереження кожні 5 секунд
    setInterval(saveGameProgress, 5000);
    
    // Авто-клікери кожну секунду
    setInterval(autoClick, 5);
    
    // Оновлення курсу кожну хвилину
    setInterval(loadExchangeRate, 60000);
});

// Ініціалізація елементів DOM
function initializeElements() {
    coinsDisplay = document.getElementById('user-coins');
    balanceDisplay = document.getElementById('balance');
    progressBar = document.getElementById('clicker-progress');
    clickerButton = document.getElementById('clicker-component');
    statusDesc = document.getElementById('status-desc');
    totalClicksDisplay = document.getElementById('total-clicks');
    clickPowerDisplay = document.getElementById('click-power');
    
    // Нові елементи панелі користувача
    userNameDisplay = document.getElementById('user-name');
    userStatusDisplay = document.getElementById('user-status');
    profileBalanceDisplay = document.getElementById('profile-balance');
    profileUsdDisplay = document.getElementById('profile-usd');
    currentRateDisplay = document.getElementById('current-rate');
    cooldownBar = document.getElementById('cooldown-bar');
    cooldownText = document.querySelector('.cooldown-text');
    progressText = document.getElementById('progress-text');
    
    // Додаємо обробник кліку
    if (clickerButton) {
        clickerButton.addEventListener('click', handleClick);
    }
    
    // Додаємо обробник для статусу
    if (statusDesc) {
        statusDesc.addEventListener('click', updateBalanceFromProfile);
    }
}

// Завантаження даних користувача
async function loadUserData() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        
        // Оновлюємо основний баланс
        if (balanceDisplay) {
            balanceDisplay.textContent = (user.coins || 0).toFixed(2);
        }
        
        // Оновлюємо панель користувача
        updateUserInfoPanel(user);
        
        // Завантажуємо курс валюти
        await loadExchangeRate();
        
        // Завантажуємо збережений прогрес гри
        loadGameProgress();
        
    } catch (error) {
        console.error('Помилка завантаження даних користувача:', error);
    }
}

// Оновлення панелі інформації про користувача
function updateUserInfoPanel(user) {
    if (userNameDisplay) {
        userNameDisplay.textContent = user.username;
    }
    
    if (userStatusDisplay) {
        if (user.isAdmin) {
            userStatusDisplay.textContent = '👑 Адміністратор';
            userStatusDisplay.style.color = '#ffd700';
        } else {
            userStatusDisplay.textContent = '👤 Користувач';
            userStatusDisplay.style.color = '#ccc';
        }
    }
    
    if (profileBalanceDisplay) {
        profileBalanceDisplay.textContent = (user.coins || 0).toFixed(2);
    }
    
    if (profileUsdDisplay) {
        profileUsdDisplay.textContent = '$' + (user.usd || 0).toFixed(2);
    }
}

// Завантаження курсу валюти
async function loadExchangeRate() {
    try {
        if (currentRateDisplay) {
            const rate = await API.getExchangeRate();
            currentRateDisplay.textContent = '$' + rate.toFixed(2);
        }
    } catch (error) {
        console.error('Помилка завантаження курсу:', error);
        if (currentRateDisplay) {
            currentRateDisplay.textContent = '$2.65';
        }
    }
}

// Запуск гри
function startGame() {
    updateDisplay();
    updateAutoClickerButton();
    
    // Додаємо анімацію idle для кнопки
    if (clickerButton) {
        clickerButton.classList.add('clicker-idle');
    }
}

// Обробка кліку
function handleClick(event) {
    const currentTime = Date.now();
    
    // Перевіряємо затримку між кліками
    if (currentTime - gameState.lastClickTime < gameState.clickCooldown) {
        // Показуємо повідомлення про затримку
        showCooldownMessage(event);
        return;
    }
    
    // Оновлюємо час останнього кліку
    gameState.lastClickTime = currentTime;
    
    // Запускаємо індикатор затримки та прозорість
    startCooldownIndicator();
    makeClickerTransparent();
    
    // Анімація кліку
    animateClick(event);
    
    // Додаємо прогрес (0.1 OBUHOV за клік)
    const earnedAmount = gameState.clickPower * gameState.multiplier;
    gameState.progressToNextCoin += earnedAmount;
    gameState.totalClicks++;
    
    // Перевіряємо, чи зароблена повна монета
    if (gameState.progressToNextCoin >= 1) {
        const fullCoins = Math.floor(gameState.progressToNextCoin);
        gameState.coins += fullCoins;
        gameState.progressToNextCoin -= fullCoins;
        
        // Ефект заробітку повної монети
        if (fullCoins > 0) {
            showCoinEarnedEffect(fullCoins);
        }
    }
    
    // Оновлюємо відображення
    updateDisplay();
    
    // Ефекти кліку з місця кліку
    createClickEffect(event, earnedAmount);
    
    // Зберігаємо прогрес
    saveGameProgress();
}

// Заробляємо монету (оновлено для нової системи)
function earnCoin() {
    // Ця функція тепер використовується тільки для авто-кліків
    gameState.progressToNextCoin += gameState.clickPower * gameState.multiplier * 0.5;
    
    if (gameState.progressToNextCoin >= 1) {
        const fullCoins = Math.floor(gameState.progressToNextCoin);
        gameState.coins += fullCoins;
        gameState.progressToNextCoin -= fullCoins;
        
        if (fullCoins > 0) {
            showCoinEarnedEffect(fullCoins);
        }
    }
    
    // Зберігаємо прогрес
    saveGameProgress();
}

// Авто-клік
function autoClick() {
    if (gameState.autoClickers > 0) {
        const earnedAmount = gameState.autoClickers * gameState.multiplier * 0.05; // Менше ніж ручний клік
        gameState.progressToNextCoin += earnedAmount;
        
        if (gameState.progressToNextCoin >= 1) {
            const fullCoins = Math.floor(gameState.progressToNextCoin);
            gameState.coins += fullCoins;
            gameState.progressToNextCoin -= fullCoins;
        }
        
        updateDisplay();
    }
}

// Оновлення відображення
function updateDisplay() {
    if (coinsDisplay) {
        coinsDisplay.textContent = `${gameState.coins.toFixed(3)} OBUHOV`;
    }
    
    if (progressBar) {
        // Прогрес до наступної повної монети (від 0 до 1000 кліків)
        const progressPercent = (gameState.progressToNextCoin * 1000) % 1000 / 10; // Перетворюємо в відсотки
        progressBar.value = progressPercent;
        progressBar.max = 100;
    }
    
    // Відображення прогресу в кліках та відсотках
    if (progressText) {
        const clicksToNext = Math.ceil((1 - (gameState.progressToNextCoin % 1)) * 1000);
        const progressPercent = ((gameState.progressToNextCoin % 1) * 100).toFixed(1);
        progressText.textContent = `До наступної монети: ${clicksToNext} кліків (${progressPercent}%)`;
    }
    
    // Оновлюємо статистику
    if (totalClicksDisplay) {
        totalClicksDisplay.textContent = gameState.totalClicks;
    }
    
    if (clickPowerDisplay) {
        clickPowerDisplay.textContent = (gameState.clickPower * gameState.multiplier * 1000).toFixed(1);
    }
}

// Анімація кліку
function animateClick(event) {
    if (!clickerButton) return;
    
    // Анімація стиснення
    clickerButton.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        clickerButton.style.transform = 'scale(1)';
    }, 100);
    
    // Анімація пульсації
    clickerButton.classList.add('clicker-pulse');
    setTimeout(() => {
        clickerButton.classList.remove('clicker-pulse');
    }, 300);
}

// Створення ефекту кліку
function createClickEffect(event, earnedAmount) {
    const effect = document.createElement('div');
    effect.className = 'click-effect';
    effect.textContent = `+${(earnedAmount * 1000).toFixed(1)}`; // Показуємо в тисячних
    
    // Позиціонування відносно кліку на сторінці
    effect.style.position = 'fixed';
    effect.style.left = `${event.clientX}px`;
    effect.style.top = `${event.clientY}px`;
    effect.style.transform = 'translate(-50%, -50%)';
    effect.style.pointerEvents = 'none';
    effect.style.zIndex = '10000';
    
    document.body.appendChild(effect);
    
    // Видаляємо ефект через 1 секунду
    setTimeout(() => {
        if (effect.parentElement) {
            effect.parentElement.removeChild(effect);
        }
    }, 250);
}

// Показати повідомлення про затримку
function showCooldownMessage(event) {
    const message = document.createElement('div');
    message.className = 'cooldown-message';
    message.textContent = 'Зачекайте...';
    
    // Позиціонування відносно кліку
    message.style.position = 'fixed';
    message.style.left = `${event.clientX}px`;
    message.style.top = `${event.clientY}px`;
    message.style.transform = 'translate(-50%, -50%)';
    message.style.pointerEvents = 'none';
    message.style.zIndex = '10001';
    
    document.body.appendChild(message);
    
    // Видаляємо повідомлення через 1 секунду
    setTimeout(() => {
        if (message.parentElement) {
            message.parentElement.removeChild(message);
        }
    }, 1000);
}

// Запуск індикатора затримки
function startCooldownIndicator() {
    if (cooldownBar && cooldownText) {
        cooldownBar.classList.add('active');
        cooldownText.textContent = 'Зачекайте...';
        
        setTimeout(() => {
            cooldownBar.classList.remove('active');
            cooldownText.textContent = 'Готово до кліку';
        }, gameState.clickCooldown);
    }
}

// Робить клікер прозорим під час кулдауну
function makeClickerTransparent() {
    if (clickerButton) {
        clickerButton.classList.add('cooldown-transparent');
        
        setTimeout(() => {
            clickerButton.classList.remove('cooldown-transparent');
        }, gameState.clickCooldown);
    }
}

// Покупка автоклікера
async function buyAutoClicker() {
    const user = await getCurrentUser();
    if (!user) {
        alert('❌ Користувач не знайдений!');
        return;
    }
    
    if (user.coins < gameState.autoClickerPrice) {
        alert(`❌ Недостатньо коштів! Потрібно ${gameState.autoClickerPrice} OBUHOV`);
        return;
    }
    
    try {
        // Оновлюємо баланс користувача
        const updatedUserData = {
            ...user,
            coins: user.coins - gameState.autoClickerPrice
        };
        
        const result = await API.updateUser(user.username, updatedUserData);
        
        if (result.success) {
            // Додаємо автоклікер
            gameState.autoClickers++;
            gameState.autoClickerPrice = Math.floor(gameState.autoClickerPrice * 1.5); // Збільшуємо ціну
            
            // Додаємо транзакцію
            await API.addTransaction({
                type: 'clicker_purchase',
                description: `Покупка автоклікера`,
                fromUser: user.username,
                toUser: 'clicker',
                coins: gameState.autoClickerPrice / 1.5,
                usd: 0,
                fee: 0,
                timestamp: new Date().toISOString()
            });
            
            // Зберігаємо стан
            saveGameProgress();
            updateDisplay();
            updateAutoClickerButton();
            
            // Оновлюємо баланс
            await updateBalanceFromProfile();
            
            alert(`✅ Куплено автоклікер! Тепер у вас ${gameState.autoClickers} автоклікерів`);
            
        } else {
            alert('❌ Помилка покупки: ' + (result.error || 'Невідома помилка'));
        }
        
    } catch (error) {
        console.error('Помилка покупки автоклікера:', error);
        alert('❌ Помилка покупки автоклікера!');
    }
}

// Оновлення кнопки автоклікера
function updateAutoClickerButton() {
    const autoClickerBtn = document.getElementById('auto-clicker-btn');
    const autoClickerCount = document.getElementById('auto-clicker-count');
    
    if (autoClickerBtn) {
        autoClickerBtn.textContent = `🤖 Купити автоклікер (${gameState.autoClickerPrice} OBUHOV)`;
    }
    
    if (autoClickerCount) {
        autoClickerCount.textContent = `Автоклікери: ${gameState.autoClickers}`;
    }
}

// Показати ефект заробленої монети
function showCoinEarnedEffect(coinsEarned = 1) {
    const effect = document.createElement('div');
    effect.className = 'coin-earned-effect';
    effect.textContent = `+${coinsEarned} OBUHOV`;
    
    if (clickerButton && clickerButton.parentElement) {
        effect.style.position = 'absolute';
        effect.style.top = '-30px';
        effect.style.left = '50%';
        effect.style.transform = 'translateX(-50%)';
        
        clickerButton.parentElement.appendChild(effect);
        
        setTimeout(() => {
            if (effect.parentElement) {
                effect.parentElement.removeChild(effect);
            }
        }, 2000);
    }
}

// Оновлення балансу з профілю
async function updateBalanceFromProfile() {
    try {
        const user = await getCurrentUser();
        if (user) {
            if (balanceDisplay) {
                balanceDisplay.textContent = (user.coins || 0).toFixed(2);
            }
            
            // Оновлюємо панель користувача
            updateUserInfoPanel(user);
        }
        
        // Показуємо повідомлення
        if (statusDesc) {
            const originalText = statusDesc.textContent;
            statusDesc.textContent = 'Оновлено!';
            statusDesc.style.color = '#14e21b';
            
            setTimeout(() => {
                statusDesc.textContent = originalText;
                statusDesc.style.color = '';
            }, 2000);
        }
        
    } catch (error) {
        console.error('Помилка оновлення балансу:', error);
        
        if (statusDesc) {
            const originalText = statusDesc.textContent;
            statusDesc.textContent = 'Помилка!';
            statusDesc.style.color = '#ff4444';
            
            setTimeout(() => {
                statusDesc.textContent = originalText;
                statusDesc.style.color = '';
            }, 2000);
        }
    }
}

// Збереження прогресу гри
function saveGameProgress() {
    try {
        localStorage.setItem('obuhov-clicker-game', JSON.stringify(gameState));
    } catch (error) {
        console.error('Помилка збереження гри:', error);
    }
}

// Завантаження прогресу гри
function loadGameProgress() {
    try {
        const saved = localStorage.getItem('obuhov-clicker-game');
        if (saved) {
            const savedState = JSON.parse(saved);
            gameState = { ...gameState, ...savedState };
        }
    } catch (error) {
        console.error('Помилка завантаження гри:', error);
    }
}

// Функції для апгрейдів (можна розширити в майбутньому)
function buyUpgrade(type) {
    // Тут буде логіка покупки апгрейдів
    console.log(`Покупка апгрейду: ${type}`);
}

// Перенесення монет в основний баланс
async function transferCoinsToAccount() {
    if (gameState.coins <= 0) {
        alert('❌ Немає монет для переносу!');
        return;
    }
    
    try {
        const user = await getCurrentUser();
        if (!user) {
            alert('❌ Користувач не знайдений!');
            return;
        }
        
        const coinsToTransfer = gameState.coins;
        
        // Оновлюємо баланс користувача в API
        const updatedUserData = {
            ...user,
            coins: (user.coins || 0) + coinsToTransfer
        };
        
        const result = await API.updateUser(user.username, updatedUserData);
        
        if (result.success) {
            // Додаємо транзакцію
            await API.addTransaction({
                type: 'clicker_earning',
                description: `Заробіток з клікера: ${coinsToTransfer.toFixed(2)} OBUHOV`,
                fromUser: 'clicker',
                toUser: user.username,
                coins: coinsToTransfer,
                usd: 0,
                fee: 0,
                timestamp: new Date().toISOString()
            });
            
            // Скидаємо монети в грі
            gameState.coins = 0;
            
            // Зберігаємо стан
            saveGameProgress();
            updateDisplay();
            
            // Оновлюємо баланс
            await updateBalanceFromProfile();
            
            alert(`✅ Перенесено ${coinsToTransfer.toFixed(2)} OBUHOV на ваш рахунок!`);
            
        } else {
            alert('❌ Помилка переносу монет: ' + (result.error || 'Невідома помилка'));
        }
        
    } catch (error) {
        console.error('Помилка переносу монет:', error);
        alert('❌ Помилка переносу монет!');
    }
}

// Експорт функцій для використання в HTML
window.transferCoinsToAccount = transferCoinsToAccount;
window.buyUpgrade = buyUpgrade;
window.buyAutoClicker = buyAutoClicker;
