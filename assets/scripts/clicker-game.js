// Клікер гра для Obuhov Coin
let gameState = {
    coins: 0,
    clickPower: 0.001,
    totalClicks: 0,
    clicksInSession: 0,
    multiplier: 1,
    isTimedOut: false,
    timeoutEndTime: 0
};

// Елементи DOM
let coinsDisplay, balanceDisplay, progressBar, clickerButton, statusDesc, totalClicksDisplay, clickPowerDisplay;
let userNameDisplay, userStatusDisplay, profileBalanceDisplay, profileUsdDisplay, progressText, currentRateDisplay;

// Ініціалізація гри
document.addEventListener('DOMContentLoaded', async () => {
    const isAuthorized = await requireAuth();
    if (!isAuthorized) return;

    initializeElements();
    await loadUserData();
    startGame();
    
    setInterval(saveGameProgress, 5000);
    setInterval(loadExchangeRate, 60000);
    setInterval(checkTimeout, 1000);
    
    hideAutoClickerButton();
});

function initializeElements() {
    coinsDisplay = document.getElementById('user-coins');
    balanceDisplay = document.getElementById('balance');
    progressBar = document.getElementById('clicker-progress');
    clickerButton = document.getElementById('clicker-component');
    statusDesc = document.getElementById('status-desc');
    totalClicksDisplay = document.getElementById('total-clicks');
    clickPowerDisplay = document.getElementById('click-power');
    userNameDisplay = document.getElementById('user-name');
    userStatusDisplay = document.getElementById('user-status');
    profileBalanceDisplay = document.getElementById('profile-balance');
    profileUsdDisplay = document.getElementById('profile-usd');
    currentRateDisplay = document.getElementById('current-rate');
    progressText = document.getElementById('progress-text');
    
    if (clickerButton) {
        clickerButton.addEventListener('click', handleClick);
    }
    
    if (statusDesc) {
        statusDesc.addEventListener('click', updateBalanceFromProfile);
    }
}

function hideAutoClickerButton() {
    const autoClickerBtn = document.getElementById('auto-clicker-btn');
    const autoClickerCount = document.getElementById('auto-clicker-count');
    
    if (autoClickerBtn) {
        autoClickerBtn.style.display = 'none';
    }
    
    if (autoClickerCount) {
        autoClickerCount.style.display = 'none';
    }
}

async function loadUserData() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        
        if (balanceDisplay) {
            balanceDisplay.textContent = (user.coins || 0).toFixed(2);
        }
        
        updateUserInfoPanel(user);
        await loadExchangeRate();
        loadGameProgress();
        
    } catch (error) {
        console.error('Помилка завантаження даних користувача:', error);
    }
}

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

function startGame() {
    updateDisplay();
    
    if (clickerButton) {
        clickerButton.classList.add('clicker-idle');
    }
}

function handleClick(event) {
    if (gameState.isTimedOut) {
        showTimeoutMessage(event);
        return;
    }
    
    animateClick(event);
    
    const earnedAmount = gameState.clickPower * gameState.multiplier;
    gameState.coins += earnedAmount;
    gameState.totalClicks++;
    gameState.clicksInSession++;
    
    if (gameState.clicksInSession >= 200) {
        startTimeout();
    }
    
    updateDisplay();
    createClickEffect(event, earnedAmount);
    saveGameProgress();
}

function startTimeout() {
    gameState.isTimedOut = true;
    gameState.timeoutEndTime = Date.now() + (5 * 60 * 1000);
    gameState.clicksInSession = 0;
    
    notify.warning('⏰ Ви зробили 200 кліків! Таймаут на 5 хвилин активований.');
    
    saveGameProgress();
}

function checkTimeout() {
    if (gameState.isTimedOut && Date.now() >= gameState.timeoutEndTime) {
        gameState.isTimedOut = false;
        gameState.timeoutEndTime = 0;
        
        notify.success('✅ Таймаут закінчився! Можете продовжувати кликати.');
        
        saveGameProgress();
    }
    
    updateDisplay();
}

function showTimeoutMessage(event) {
    const timeLeft = Math.ceil((gameState.timeoutEndTime - Date.now()) / 1000);
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    const message = document.createElement('div');
    message.className = 'timeout-message';
    message.textContent = '⏰ Таймаут: ' + minutes + ':' + seconds.toString().padStart(2, '0');
    
    message.style.position = 'fixed';
    message.style.left = event.clientX + 'px';
    message.style.top = event.clientY + 'px';
    message.style.transform = 'translate(-50%, -50%)';
    message.style.pointerEvents = 'none';
    message.style.zIndex = '10001';
    message.style.color = '#ff6b6b';
    message.style.fontWeight = 'bold';
    message.style.fontSize = '14px';
    message.style.background = 'rgba(0,0,0,0.8)';
    message.style.padding = '5px 10px';
    message.style.borderRadius = '5px';
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        if (message.parentElement) {
            message.parentElement.removeChild(message);
        }
    }, 2000);
}

function updateDisplay() {
    if (coinsDisplay) {
        coinsDisplay.textContent = gameState.coins.toFixed(3) + ' OBUHOV';
    }
    
    if (progressBar) {
        const progressPercent = (gameState.clicksInSession / 200) * 100;
        progressBar.value = progressPercent;
        progressBar.max = 100;
    }
    
    if (progressText) {
        if (gameState.isTimedOut) {
            const timeLeft = Math.ceil((gameState.timeoutEndTime - Date.now()) / 1000);
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            progressText.textContent = '⏰ Таймаут: ' + minutes + ':' + seconds.toString().padStart(2, '0');
            progressText.style.color = '#ff6b6b';
        } else {
            const clicksLeft = 200 - gameState.clicksInSession;
            progressText.textContent = 'До таймауту: ' + clicksLeft + ' кліків (' + gameState.clicksInSession + '/200)';
            progressText.style.color = '';
        }
    }
    
    if (totalClicksDisplay) {
        totalClicksDisplay.textContent = gameState.totalClicks;
    }
    
    if (clickPowerDisplay) {
        clickPowerDisplay.textContent = '1.0';
    }
    
    if (clickerButton) {
        if (gameState.isTimedOut) {
            clickerButton.style.opacity = '0.5';
            clickerButton.style.pointerEvents = 'none';
        } else {
            clickerButton.style.opacity = '1';
            clickerButton.style.pointerEvents = 'auto';
        }
    }
}

function animateClick(event) {
    if (!clickerButton) return;
    
    clickerButton.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        clickerButton.style.transform = 'scale(1)';
    }, 100);
    
    clickerButton.classList.add('clicker-pulse');
    setTimeout(() => {
        clickerButton.classList.remove('clicker-pulse');
    }, 300);
}

function createClickEffect(event, earnedAmount) {
    const effect = document.createElement('div');
    effect.className = 'click-effect';
    effect.textContent = '+' + earnedAmount.toFixed(3) + ' OBUHOV';
    
    effect.style.position = 'fixed';
    effect.style.left = event.clientX + 'px';
    effect.style.top = event.clientY + 'px';
    effect.style.transform = 'translate(-50%, -50%)';
    effect.style.pointerEvents = 'none';
    effect.style.zIndex = '10000';
    effect.style.color = '#14e21b';
    effect.style.fontWeight = 'bold';
    effect.style.fontSize = '16px';
    effect.style.textShadow = '0 0 10px rgba(20, 226, 27, 0.8)';
    
    document.body.appendChild(effect);
    
    setTimeout(() => {
        if (effect.parentElement) {
            effect.parentElement.removeChild(effect);
        }
    }, 1000);
}

async function updateBalanceFromProfile() {
    try {
        const user = await getCurrentUser();
        if (user) {
            if (balanceDisplay) {
                balanceDisplay.textContent = (user.coins || 0).toFixed(2);
            }
            
            updateUserInfoPanel(user);
        }
        
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

function saveGameProgress() {
    try {
        localStorage.setItem('obuhov-clicker-game', JSON.stringify(gameState));
    } catch (error) {
        console.error('Помилка збереження гри:', error);
    }
}

function loadGameProgress() {
    try {
        const saved = localStorage.getItem('obuhov-clicker-game');
        if (saved) {
            const savedState = JSON.parse(saved);
            // Зберігаємо тільки необхідні дані, але не clickPower та multiplier
            gameState.coins = savedState.coins || 0;
            gameState.totalClicks = savedState.totalClicks || 0;
            gameState.clicksInSession = savedState.clicksInSession || 0;
            gameState.isTimedOut = savedState.isTimedOut || false;
            gameState.timeoutEndTime = savedState.timeoutEndTime || 0;
            // clickPower завжди 0.001, multiplier завжди 1
            gameState.clickPower = 0.001;
            gameState.multiplier = 1;
        }
    } catch (error) {
        console.error('Помилка завантаження гри:', error);
    }
}

async function transferCoinsToAccount() {
    if (gameState.coins <= 0) {
        notify.error('❌ Немає монет для переносу!');
        return;
    }
    
    try {
        const user = await getCurrentUser();
        if (!user) {
            notify.error('❌ Користувач не знайдений!');
            return;
        }
        
        const coinsToTransfer = gameState.coins;
        
        const updatedUserData = {
            ...user,
            coins: (user.coins || 0) + coinsToTransfer
        };
        
        const result = await API.updateUser(user.username, updatedUserData);
        
        if (result.success) {
            await API.addTransaction({
                type: 'clicker_earning',
                description: 'Заробіток з клікера: ' + coinsToTransfer.toFixed(3) + ' OBUHOV',
                fromUser: 'clicker',
                toUser: user.username,
                coins: coinsToTransfer,
                usd: 0,
                fee: 0,
                timestamp: new Date().toISOString()
            });
            
            gameState.coins = 0;
            
            saveGameProgress();
            updateDisplay();
            
            await updateBalanceFromProfile();
            
            notify.success('✅ Перенесено ' + coinsToTransfer.toFixed(3) + ' OBUHOV на ваш рахунок!');
            
        } else {
            notify.error('❌ Помилка переносу монет: ' + (result.error || 'Невідома помилка'));
        }
        
    } catch (error) {
        console.error('Помилка переносу монет:', error);
        notify.error('❌ Помилка переносу монет!');
    }
}

window.transferCoinsToAccount = transferCoinsToAccount;
