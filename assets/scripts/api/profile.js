// Скрипт для сторінки профілю

document.addEventListener('DOMContentLoaded', async () => {
    // Перевірка авторизації
    const isAuthorized = await requireAuth();
    if (!isAuthorized) return;

    // Завантаження даних профілю
    await loadProfileData();
    await loadTransactions();
    await loadMyOrders();
    await loadMarketOrders();
    
    // Оновлення кожні 5 секунд
    setInterval(async () => {
        await loadMyOrders();
        await loadMarketOrders();
    }, 5000);
});

// Завантаження даних профілю
async function loadProfileData() {
    const user = await getCurrentUser();
    
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // Оновлення імені користувача
    const usernameElement = document.getElementById('username');
    if (usernameElement) {
        usernameElement.textContent = user.username;
    }

    // Оновлення балансів
    const balanceCoinsElement = document.getElementById('balance-coins');
    const balanceUsdElement = document.getElementById('balance-usd');
    const frozenCoinsElement = document.getElementById('frozen-coins');
    const frozenUsdElement = document.getElementById('frozen-usd');
    
    if (balanceCoinsElement) {
        balanceCoinsElement.textContent = (user.coins || 0).toFixed(2);
    }
    
    if (balanceUsdElement) {
        balanceUsdElement.textContent = '$' + (user.usd || 0).toFixed(2);
    }
    
    if (frozenCoinsElement && user.frozenCoins > 0) {
        frozenCoinsElement.textContent = `(🔒 ${user.frozenCoins.toFixed(2)})`;
        frozenCoinsElement.style.display = 'block';
    }
    
    if (frozenUsdElement && user.frozenUSD > 0) {
        frozenUsdElement.textContent = `(🔒 $${user.frozenUSD.toFixed(2)})`;
        frozenUsdElement.style.display = 'block';
    }

    // Оновлення курсу
    const rateElement = document.getElementById('current-rate');
    if (rateElement) {
        const rate = await getExchangeRate();
        rateElement.textContent = '$' + rate.toFixed(2);
    }

    // Оновлення дати реєстрації
    const memberSinceElement = document.getElementById('member-since');
    const registrationDateElement = document.getElementById('registration-date');
    
    if (user.registeredAt) {
        const date = new Date(user.registeredAt);
        const formattedDate = formatDate(date);
        const shortDate = formatShortDate(date);
        
        if (memberSinceElement) {
            memberSinceElement.textContent = formattedDate;
        }
        
        if (registrationDateElement) {
            registrationDateElement.textContent = shortDate;
        }
    }

    // Оновлення кількості транзакцій
    const transactionsElement = document.getElementById('total-transactions');
    if (transactionsElement) {
        const userTransactions = await getUserTransactions(user.username);
        transactionsElement.textContent = userTransactions.length;
    }

    // Оновлення статусу
    const statusElement = document.getElementById('account-status');
    if (statusElement) {
        if (user.isAdmin) {
            statusElement.textContent = 'Адміністратор';
            statusElement.style.color = '#ffd700';
        } else {
            statusElement.textContent = 'Активний';
        }
    }
}

// Перемикання табів
function switchTab(tabName) {
    // Деактивація всіх табів
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Активація вибраного табу
    event.target.classList.add('active');
    document.getElementById('tab-' + tabName).classList.add('active');
    
    // Оновлення даних для таба
    if (tabName === 'market') {
        loadMyOrders();
        loadMarketOrders();
    } else if (tabName === 'history') {
        loadTransactions();
    }
}

// Розрахунок купівлі
async function calculateBuy() {
    const usdAmount = parseFloat(document.getElementById('buy-usd').value) || 0;
    const rate = await getExchangeRate();
    const coins = usdAmount / rate;
    const fee = coins * 0.005;
    const result = coins - fee;
    
    document.getElementById('buy-coins-result').value = result.toFixed(4);
}

// Розрахунок продажу
async function calculateSell() {
    const coins = parseFloat(document.getElementById('sell-coins').value) || 0;
    const rate = await getExchangeRate();
    const usd = coins * rate;
    const fee = usd * 0.005;
    const result = usd - fee;
    
    document.getElementById('sell-usd-result').value = result.toFixed(2);
}

// Виконання купівлі
async function executeBuy() {
    const user = await getCurrentUser();
    if (!user) return;
    
    const usdAmount = parseFloat(document.getElementById('buy-usd').value);
    
    if (!usdAmount || usdAmount <= 0) {
        notify.error('❌ Введіть коректну суму!');
        return;
    }
    
    const result = await buyCoins(user.username, usdAmount);
    
    if (result.success) {
        notify.success(result.message);
        document.getElementById('buy-usd').value = '';
        document.getElementById('buy-coins-result').value = '';
        await loadProfileData();
    } else {
        notify.error('❌ ' + result.message);
    }
}

// Виконання продажу
async function executeSell() {
    const user = await getCurrentUser();
    if (!user) return;
    
    const coinsAmount = parseFloat(document.getElementById('sell-coins').value);
    
    if (!coinsAmount || coinsAmount <= 0) {
        notify.error('❌ Введіть коректну кількість!');
        return;
    }
    
    const result = await sellCoins(user.username, coinsAmount);
    
    if (result.success) {
        notify.success(result.message);
        document.getElementById('sell-coins').value = '';
        document.getElementById('sell-usd-result').value = '';
        await loadProfileData();
    } else {
        notify.error('❌ ' + result.message);
    }
}

// Розрахунок загальної вартості для ордера на купівлю
document.addEventListener('DOMContentLoaded', () => {
    const buyCoinsInput = document.getElementById('order-buy-coins');
    const buyPriceInput = document.getElementById('order-buy-price');
    
    if (buyCoinsInput && buyPriceInput) {
        [buyCoinsInput, buyPriceInput].forEach(input => {
            input.addEventListener('input', () => {
                const coins = parseFloat(buyCoinsInput.value) || 0;
                const price = parseFloat(buyPriceInput.value) || 0;
                document.getElementById('buy-total').textContent = (coins * price).toFixed(2);
            });
        });
    }
    
    const sellCoinsInput = document.getElementById('order-sell-coins');
    const sellPriceInput = document.getElementById('order-sell-price');
    
    if (sellCoinsInput && sellPriceInput) {
        [sellCoinsInput, sellPriceInput].forEach(input => {
            input.addEventListener('input', () => {
                const coins = parseFloat(sellCoinsInput.value) || 0;
                const price = parseFloat(sellPriceInput.value) || 0;
                document.getElementById('sell-total').textContent = (coins * price).toFixed(2);
            });
        });
    }
    
    const transferInput = document.getElementById('transfer-amount');
    if (transferInput) {
        transferInput.addEventListener('input', () => {
            const amount = parseFloat(transferInput.value) || 0;
            const fee = amount * 0.01;
            const received = amount - fee;
            document.getElementById('transfer-received').textContent = received.toFixed(2);
        });
    }
});

// Створення ордера на купівлю
async function createBuyOrderUI() {
    const user = await getCurrentUser();
    if (!user) return;
    
    const coins = parseFloat(document.getElementById('order-buy-coins').value);
    const price = parseFloat(document.getElementById('order-buy-price').value);
    
    if (!coins || coins <= 0 || !price || price <= 0) {
        notify.error('❌ Заповніть всі поля коректно!');
        return;
    }
    
    const result = await createBuyOrder(user.username, coins, price);
    
    if (result.success) {
        notify.success(result.message);
        document.getElementById('order-buy-coins').value = '';
        document.getElementById('order-buy-price').value = '';
        document.getElementById('buy-total').textContent = '0.00';
        await loadProfileData();
        await loadMyOrders();
        await loadMarketOrders();
    } else {
        notify.error('❌ ' + result.message);
    }
}

// Створення ордера на продаж
async function createSellOrderUI() {
    const user = await getCurrentUser();
    if (!user) return;
    
    const coins = parseFloat(document.getElementById('order-sell-coins').value);
    const price = parseFloat(document.getElementById('order-sell-price').value);
    
    if (!coins || coins <= 0 || !price || price <= 0) {
        notify.error('❌ Заповніть всі поля коректно!');
        return;
    }
    
    const result = await createSellOrder(user.username, coins, price);
    
    if (result.success) {
        notify.success(result.message);
        document.getElementById('order-sell-coins').value = '';
        document.getElementById('order-sell-price').value = '';
        document.getElementById('sell-total').textContent = '0.00';
        await loadProfileData();
        await loadMyOrders();
        await loadMarketOrders();
    } else {
        notify.error('❌ ' + result.message);
    }
}

// Виконання переказу
async function executeTransfer() {
    const user = await getCurrentUser();
    if (!user) return;
    
    const to = document.getElementById('transfer-to').value.trim();
    const amount = parseFloat(document.getElementById('transfer-amount').value);
    const note = document.getElementById('transfer-note').value.trim();
    
    if (!to || !amount || amount <= 0) {
        notify.error('❌ Заповніть всі обов\'язкові поля!');
        return;
    }
    
    const result = await transferCoins(user.username, to, amount, note);
    
    if (result.success) {
        notify.success(result.message);
        document.getElementById('transfer-to').value = '';
        document.getElementById('transfer-amount').value = '';
        document.getElementById('transfer-note').value = '';
        document.getElementById('transfer-received').textContent = '0.00';
        await loadProfileData();
        await loadTransactions();
    } else {
        notify.error('❌ ' + result.message);
    }
}

// Завантаження моїх ордерів
async function loadMyOrders() {
    const user = await getCurrentUser();
    if (!user) return;
    
    const orders = await getUserOrders(user.username);
    const container = document.getElementById('my-orders-list');
    
    if (!container) return;
    
    if (orders.buy.length === 0 && orders.sell.length === 0) {
        container.innerHTML = '<p class="no-data">Немає активних ордерів</p>';
        return;
    }
    
    let html = '';
    
    orders.buy.forEach(order => {
        const totalCost = order.coins * order.pricePerCoin;
        html += `
            <div class="order-item buy">
                <div class="order-info">
                    <span class="order-type">📈 Купівля</span>
                    <span>${order.coins.toFixed(2)} OBUHOV по $${order.pricePerCoin.toFixed(2)}</span>
                </div>
                <div class="order-actions">
                    <span class="order-total">$${totalCost.toFixed(2)}</span>
                    <button class="btn-cancel" onclick="cancelOrderUI('${order.id}', 'buy')">❌</button>
                </div>
            </div>
        `;
    });
    
    orders.sell.forEach(order => {
        const totalCost = order.coins * order.pricePerCoin;
        html += `
            <div class="order-item sell">
                <div class="order-info">
                    <span class="order-type">📉 Продаж</span>
                    <span>${order.coins.toFixed(2)} OBUHOV по $${order.pricePerCoin.toFixed(2)}</span>
                </div>
                <div class="order-actions">
                    <span class="order-total">$${totalCost.toFixed(2)}</span>
                    <button class="btn-cancel" onclick="cancelOrderUI('${order.id}', 'sell')">❌</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Скасування ордера
async function cancelOrderUI(orderId, type) {
    const user = await getCurrentUser();
    if (!user) return;
    
    notify.confirm('Скасувати цей ордер?', async () => {
        const result = await cancelOrder(user.username, orderId, type);
        
        if (result.success) {
            notify.success(result.message);
            await loadProfileData();
            await loadMyOrders();
            await loadMarketOrders();
        } else {
            notify.error('❌ ' + result.message);
        }
    });
}

// Завантаження ринкових ордерів
async function loadMarketOrders() {
    const orders = await getMarketOrders();
    
    const buyContainer = document.getElementById('market-buy-orders');
    const sellContainer = document.getElementById('market-sell-orders');
    
    if (!buyContainer || !sellContainer) return;
    
    // Ордери на купівлю (від найвищої ціни)
    const buyOrders = [...orders.buy].sort((a, b) => b.pricePerCoin - a.pricePerCoin).slice(0, 10);
    
    if (buyOrders.length === 0) {
        buyContainer.innerHTML = '<p class="no-data">Немає ордерів</p>';
    } else {
        let html = '';
        buyOrders.forEach(order => {
            html += `
                <div class="market-order-item">
                    <span class="order-price">$${order.pricePerCoin.toFixed(2)}</span>
                    <span class="order-amount">${order.coins.toFixed(2)}</span>
                </div>
            `;
        });
        buyContainer.innerHTML = html;
    }
    
    // Ордери на продаж (від найнижчої ціни)
    const sellOrders = [...orders.sell].sort((a, b) => a.pricePerCoin - b.pricePerCoin).slice(0, 10);
    
    if (sellOrders.length === 0) {
        sellContainer.innerHTML = '<p class="no-data">Немає ордерів</p>';
    } else {
        let html = '';
        sellOrders.forEach(order => {
            html += `
                <div class="market-order-item">
                    <span class="order-price">$${order.pricePerCoin.toFixed(2)}</span>
                    <span class="order-amount">${order.coins.toFixed(2)}</span>
                </div>
            `;
        });
        sellContainer.innerHTML = html;
    }
}

// Завантаження історії транзакцій
async function loadTransactions() {
    const user = await getCurrentUser();
    if (!user) return;
    
    const transactions = await getUserTransactions(user.username, 50);
    const container = document.getElementById('transactions-list');
    
    if (!container) return;
    
    if (transactions.length === 0) {
        container.innerHTML = '<p class="no-data">Історія порожня</p>';
        return;
    }
    
    let html = '';
    
    transactions.forEach(tx => {
        const date = new Date(tx.timestamp);
        const timeStr = date.toLocaleString('uk-UA');
        
        let icon = '💱';
        let title = tx.description || 'Транзакція';
        let details = '';
        
        if (tx.type === 'transfer') {
            icon = '💸';
            if (tx.fromUser === user.username) {
                details = `→ ${tx.toUser} | Комісія: ${tx.fee.toFixed(2)} OBUHOV`;
            } else {
                const received = tx.coins - tx.fee;
                details = `← ${tx.fromUser} | Отримано: ${received.toFixed(2)} OBUHOV`;
            }
        } else if (tx.type === 'buy') {
            icon = '💰';
            details = `+${tx.coins.toFixed(2)} OBUHOV | -$${tx.usd.toFixed(2)}`;
        } else if (tx.type === 'sell') {
            icon = '💵';
            details = `-${tx.coins.toFixed(2)} OBUHOV | +$${tx.usd.toFixed(2)}`;
        } else if (tx.type === 'market_trade') {
            icon = '🤝';
            if (tx.toUser === user.username) {
                details = `Купівля від ${tx.fromUser} | +${tx.coins.toFixed(2)} OBUHOV`;
            } else {
                details = `Продаж до ${tx.toUser} | +$${(tx.usd - tx.fee).toFixed(2)}`;
            }
        }
        
        html += `
            <div class="transaction-item">
                <div class="tx-icon">${icon}</div>
                <div class="tx-details">
                    <div class="tx-title">${title}</div>
                    <div class="tx-info">${details}</div>
                    <div class="tx-time">${timeStr}</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Форматування дати (повний формат)
function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('uk-UA', options);
}

// Форматування дати (короткий формат)
function formatShortDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}
