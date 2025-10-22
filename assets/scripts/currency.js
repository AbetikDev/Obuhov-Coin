// Система управління валютами та транзакціями

// Ініціалізація курсу валюти (тепер не потрібна, все на сервері)
function initializeCurrency() {
    console.log('✅ Currency система ініціалізована (використовується API)');
}

// Отримання поточного курсу з сервера
async function getExchangeRate() {
    const rate = await API.getExchangeRate();
    return rate || 2.65;
}

// Встановлення нового курсу (тільки для адміна)
async function setExchangeRate(newRate) {
    const admin = await isAdmin();
    if (!admin) {
        alert('❌ Тільки адміністратор може змінювати курс!');
        return false;
    }
    
    const rate = parseFloat(newRate);
    if (isNaN(rate) || rate <= 0) {
        alert('❌ Невірний курс валюти!');
        return false;
    }
    
    // Оновлення курсу через API
    const result = await API.updateExchangeRate(rate);
    
    if (!result.success) {
        alert('❌ Помилка оновлення курсу: ' + result.error);
        return false;
    }
    
    // Записати історію зміни курсу
    await logTransaction({
        type: 'rate_change',
        fromUser: 'admin',
        toUser: 'system',
        coins: 0,
        usd: 0,
        fee: 0,
        description: `Курс змінено на $${rate.toFixed(2)} за 1 OBUHOV`
    });
    
    return true;
}

// Конвертація OBUHOV в USD
async function coinsToUSD(coins) {
    const rate = await getExchangeRate();
    return coins * rate;
}

// Конвертація USD в OBUHOV
async function usdToCoins(usd) {
    const rate = await getExchangeRate();
    return usd / rate;
}

// Отримання балансу користувача
async function getUserBalance(username) {
    const user = await API.getUser(username);
    
    if (!user) return null;
    
    return {
        coins: user.coins || 0,
        usd: user.usd || 0,
        frozenCoins: user.frozenCoins || 0,
        frozenUSD: user.frozenUSD || 0
    };
}

// Оновлення балансу користувача
async function updateUserBalance(username, coins, usd) {
    const user = await API.getUser(username);
    if (!user) return false;
    
    const result = await API.updateUser(username, {
        coins: parseFloat(coins) || 0,
        usd: parseFloat(usd) || 0,
        frozenCoins: user.frozenCoins || 0,
        frozenUSD: user.frozenUSD || 0,
        isAdmin: user.isAdmin
    });
    
    return result.success;
}

// Переказ монет між користувачами
async function transferCoins(fromUsername, toUsername, amount, note = '') {
    const fromUser = await API.getUser(fromUsername);
    const toUser = await API.getUser(toUsername);
    
    // Валідація
    if (!fromUser || !toUser) {
        return { success: false, message: 'Користувача не знайдено!' };
    }
    
    if (fromUsername === toUsername) {
        return { success: false, message: 'Неможливо переказати самому собі!' };
    }
    
    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
        return { success: false, message: 'Невірна сума переказу!' };
    }
    
    if (fromUser.coins < transferAmount) {
        return { success: false, message: 'Недостатньо коштів на балансі!' };
    }
    
    // Комісія 1%
    const fee = transferAmount * 0.01;
    const receivedAmount = transferAmount - fee;
    
    // Виконання переказу
    await API.updateUser(fromUsername, {
        coins: fromUser.coins - transferAmount,
        usd: fromUser.usd,
        frozenCoins: fromUser.frozenCoins || 0,
        frozenUSD: fromUser.frozenUSD || 0,
        isAdmin: fromUser.isAdmin
    });
    
    await API.updateUser(toUsername, {
        coins: toUser.coins + receivedAmount,
        usd: toUser.usd,
        frozenCoins: toUser.frozenCoins || 0,
        frozenUSD: toUser.frozenUSD || 0,
        isAdmin: toUser.isAdmin
    });
    
    // Запис транзакції
    await logTransaction({
        type: 'transfer',
        fromUser: fromUsername,
        toUser: toUsername,
        coins: transferAmount,
        usd: 0,
        fee: fee,
        description: `Переказ ${transferAmount.toFixed(2)} OBUHOV від ${fromUsername} до ${toUsername}${note ? '\nПримітка: ' + note : ''}`
    });
    
    return {
        success: true,
        message: `✅ Успішно переказано ${transferAmount.toFixed(2)} OBUHOV\n💰 Отримувач отримає: ${receivedAmount.toFixed(2)} OBUHOV\n💸 Комісія: ${fee.toFixed(2)} OBUHOV (1%)`,
        fee: fee,
        received: receivedAmount
    };
}

// Купівля OBUHOV за USD
async function buyCoins(username, usdAmount) {
    const user = await API.getUser(username);
    
    if (!user) {
        return { success: false, message: 'Користувача не знайдено!' };
    }
    
    const amount = parseFloat(usdAmount);
    if (isNaN(amount) || amount <= 0) {
        return { success: false, message: 'Невірна сума!' };
    }
    
    if (user.usd < amount) {
        return { success: false, message: 'Недостатньо USD на балансі!' };
    }
    
    const rate = await getExchangeRate();
    const coinsAmount = amount / rate;
    
    // Комісія 0.5%
    const fee = coinsAmount * 0.005;
    const receivedCoins = coinsAmount - fee;
    
    // Виконання покупки
    await API.updateUser(username, {
        coins: user.coins + receivedCoins,
        usd: user.usd - amount,
        frozenCoins: user.frozenCoins || 0,
        frozenUSD: user.frozenUSD || 0,
        isAdmin: user.isAdmin
    });
    
    // Запис транзакції
    await logTransaction({
        type: 'buy',
        fromUser: username,
        toUser: 'system',
        coins: receivedCoins,
        usd: amount,
        fee: fee,
        description: `Купівля ${receivedCoins.toFixed(2)} OBUHOV за $${amount.toFixed(2)} (курс: $${rate.toFixed(2)})`
    });
    
    return {
        success: true,
        message: `✅ Успішно куплено ${receivedCoins.toFixed(2)} OBUHOV\n💵 Витрачено: $${amount.toFixed(2)}\n💸 Комісія: ${fee.toFixed(4)} OBUHOV (0.5%)`,
        coins: receivedCoins,
        fee: fee
    };
}

// Продаж OBUHOV за USD
async function sellCoins(username, coinsAmount) {
    const user = await API.getUser(username);
    
    if (!user) {
        return { success: false, message: 'Користувача не знайдено!' };
    }
    
    const amount = parseFloat(coinsAmount);
    if (isNaN(amount) || amount <= 0) {
        return { success: false, message: 'Невірна кількість монет!' };
    }
    
    if (user.coins < amount) {
        return { success: false, message: 'Недостатньо OBUHOV на балансі!' };
    }
    
    const rate = await getExchangeRate();
    const usdAmount = amount * rate;
    
    // Комісія 0.5%
    const fee = usdAmount * 0.005;
    const receivedUSD = usdAmount - fee;
    
    // Виконання продажу
    await API.updateUser(username, {
        coins: user.coins - amount,
        usd: user.usd + receivedUSD,
        frozenCoins: user.frozenCoins || 0,
        frozenUSD: user.frozenUSD || 0,
        isAdmin: user.isAdmin
    });
    
    // Запис транзакції
    await logTransaction({
        type: 'sell',
        fromUser: username,
        toUser: 'system',
        coins: amount,
        usd: receivedUSD,
        fee: fee,
        description: `Продаж ${amount.toFixed(2)} OBUHOV за $${receivedUSD.toFixed(2)} (курс: $${rate.toFixed(2)})`
    });
    
    return {
        success: true,
        message: `✅ Успішно продано ${amount.toFixed(2)} OBUHOV\n💵 Отримано: $${receivedUSD.toFixed(2)}\n💸 Комісія: $${fee.toFixed(2)} (0.5%)`,
        usd: receivedUSD,
        fee: fee
    };
}

// Створення ордеру на купівлю
async function createBuyOrder(username, coinsAmount, pricePerCoin) {
    const user = await API.getUser(username);
    
    if (!user) {
        return { success: false, message: 'Користувача не знайдено!' };
    }
    
    const coins = parseFloat(coinsAmount);
    const price = parseFloat(pricePerCoin);
    
    if (isNaN(coins) || coins <= 0 || isNaN(price) || price <= 0) {
        return { success: false, message: 'Невірні параметри ордеру!' };
    }
    
    const totalCost = coins * price;
    
    if (user.usd < totalCost) {
        return { success: false, message: 'Недостатньо USD для створення ордеру!' };
    }
    
    // Заморозити USD
    await API.updateUser(username, {
        coins: user.coins,
        usd: user.usd - totalCost,
        frozenCoins: user.frozenCoins || 0,
        frozenUSD: (user.frozenUSD || 0) + totalCost,
        isAdmin: user.isAdmin
    });
    
    // Створення ордеру через API
    const result = await API.createOrder({
        username: username,
        type: 'buy',
        coins: coins,
        pricePerCoin: price,
        status: 'active'
    });
    
    if (!result.success) {
        return { success: false, message: 'Помилка створення ордеру!' };
    }
    
    // Спроба автоматичного виконання
    await tryMatchOrders();
    
    return {
        success: true,
        message: `✅ Ордер на купівлю створено!\n💰 ${coins.toFixed(2)} OBUHOV по $${price.toFixed(2)}\n💵 Заморожено: $${totalCost.toFixed(2)}`,
        orderId: result.orderId
    };
}

// Створення ордеру на продаж
async function createSellOrder(username, coinsAmount, pricePerCoin) {
    const user = await API.getUser(username);
    
    if (!user) {
        return { success: false, message: 'Користувача не знайдено!' };
    }
    
    const coins = parseFloat(coinsAmount);
    const price = parseFloat(pricePerCoin);
    
    if (isNaN(coins) || coins <= 0 || isNaN(price) || price <= 0) {
        return { success: false, message: 'Невірні параметри ордеру!' };
    }
    
    if (user.coins < coins) {
        return { success: false, message: 'Недостатньо OBUHOV для створення ордеру!' };
    }
    
    // Заморозити OBUHOV
    await API.updateUser(username, {
        coins: user.coins - coins,
        usd: user.usd,
        frozenCoins: (user.frozenCoins || 0) + coins,
        frozenUSD: user.frozenUSD || 0,
        isAdmin: user.isAdmin
    });
    
    // Створення ордеру через API
    const result = await API.createOrder({
        username: username,
        type: 'sell',
        coins: coins,
        pricePerCoin: price,
        status: 'active'
    });
    
    if (!result.success) {
        return { success: false, message: 'Помилка створення ордеру!' };
    }
    
    // Спроба автоматичного виконання
    await tryMatchOrders();
    
    return {
        success: true,
        message: `✅ Ордер на продаж створено!\n💰 ${coins.toFixed(2)} OBUHOV по $${price.toFixed(2)}\n🔒 Заморожено: ${coins.toFixed(2)} OBUHOV`,
        orderId: result.orderId
    };
}

// Скасування ордеру
async function cancelOrder(username, orderId, orderType) {
    const user = await API.getUser(username);
    
    if (!user) {
        return { success: false, message: 'Користувача не знайдено!' };
    }
    
    const allOrders = await API.getOrders();
    const order = allOrders.find(o => o.id === orderId && o.username === username);
    
    if (!order) {
        return { success: false, message: 'Ордер не знайдено!' };
    }
    
    if (order.status !== 'active') {
        return { success: false, message: 'Ордер вже не активний!' };
    }
    
    // Повернути заморожені кошти
    if (order.type === 'buy') {
        const totalCost = order.coins * order.pricePerCoin;
        await API.updateUser(username, {
            coins: user.coins,
            usd: user.usd + totalCost,
            frozenCoins: user.frozenCoins || 0,
            frozenUSD: (user.frozenUSD || 0) - totalCost,
            isAdmin: user.isAdmin
        });
    } else {
        await API.updateUser(username, {
            coins: user.coins + order.coins,
            usd: user.usd,
            frozenCoins: (user.frozenCoins || 0) - order.coins,
            frozenUSD: user.frozenUSD || 0,
            isAdmin: user.isAdmin
        });
    }
    
    // Видалити ордер через API
    await API.deleteOrder(orderId);
    
    return {
        success: true,
        message: '✅ Ордер успішно скасовано!'
    };
}

// Спроба знайти відповідні ордери та виконати їх
async function tryMatchOrders() {
    const allOrders = await API.getOrders();
    
    // Розділити ордери на купівлю та продаж
    const buyOrders = allOrders.filter(o => o.type === 'buy' && o.status === 'active');
    const sellOrders = allOrders.filter(o => o.type === 'sell' && o.status === 'active');
    
    // Сортування: купівля від найвищої ціни, продаж від найнижчої
    buyOrders.sort((a, b) => b.pricePerCoin - a.pricePerCoin);
    sellOrders.sort((a, b) => a.pricePerCoin - b.pricePerCoin);
    
    let matched = false;
    
    for (let i = 0; i < buyOrders.length; i++) {
        for (let j = 0; j < sellOrders.length; j++) {
            const buyOrder = buyOrders[i];
            const sellOrder = sellOrders[j];
            
            if (buyOrder.status !== 'active' || sellOrder.status !== 'active') continue;
            if (buyOrder.username === sellOrder.username) continue;
            
            // Перевірка чи ціна купівлі >= ціни продажу
            if (buyOrder.pricePerCoin >= sellOrder.pricePerCoin) {
                // Виконання угоди
                const buyer = await API.getUser(buyOrder.username);
                const seller = await API.getUser(sellOrder.username);
                
                if (!buyer || !seller) continue;
                
                // Визначення ціни та кількості
                const executionPrice = sellOrder.pricePerCoin;
                const coinsToTrade = Math.min(buyOrder.coins, sellOrder.coins);
                const tradeCost = coinsToTrade * executionPrice;
                
                // Комісія 0.3% від угоди
                const fee = tradeCost * 0.003;
                
                // Оновлення балансів
                await API.updateUser(buyOrder.username, {
                    coins: buyer.coins + coinsToTrade,
                    usd: buyer.usd,
                    frozenCoins: buyer.frozenCoins || 0,
                    frozenUSD: (buyer.frozenUSD || 0) - tradeCost,
                    isAdmin: buyer.isAdmin
                });
                
                await API.updateUser(sellOrder.username, {
                    coins: seller.coins,
                    usd: seller.usd + (tradeCost - fee),
                    frozenCoins: (seller.frozenCoins || 0) - coinsToTrade,
                    frozenUSD: seller.frozenUSD || 0,
                    isAdmin: seller.isAdmin
                });
                
                // Оновлення ордерів
                buyOrder.coins -= coinsToTrade;
                sellOrder.coins -= coinsToTrade;
                
                if (buyOrder.coins <= 0) {
                    await API.deleteOrder(buyOrder.id);
                    buyOrder.status = 'completed';
                }
                if (sellOrder.coins <= 0) {
                    await API.deleteOrder(sellOrder.id);
                    sellOrder.status = 'completed';
                }
                
                // Запис транзакції
                await logTransaction({
                    type: 'market_trade',
                    fromUser: sellOrder.username,
                    toUser: buyOrder.username,
                    coins: coinsToTrade,
                    usd: tradeCost,
                    fee: fee,
                    description: `Ринкова угода: ${coinsToTrade.toFixed(2)} OBUHOV по $${executionPrice.toFixed(2)}\nПродавець: ${sellOrder.username}\nПокупець: ${buyOrder.username}`
                });
                
                matched = true;
            }
        }
    }
    
    return matched;
}

// Логування транзакції
async function logTransaction(transaction) {
    await API.addTransaction(transaction);
}

// Отримання історії транзакцій користувача
async function getUserTransactions(username, limit = 50) {
    const allTransactions = await API.getTransactions();
    
    return allTransactions.filter(t => 
        t.fromUser === username || 
        t.toUser === username
    ).slice(0, limit);
}

// Отримання всіх транзакцій (для адміна)
async function getAllTransactions(limit = 100) {
    const transactions = await API.getTransactions();
    return transactions.slice(0, limit);
}

// Отримання активних ордерів користувача
async function getUserOrders(username) {
    const allOrders = await API.getOrders();
    
    return {
        buy: allOrders.filter(o => o.username === username && o.type === 'buy' && o.status === 'active'),
        sell: allOrders.filter(o => o.username === username && o.type === 'sell' && o.status === 'active')
    };
}

// Отримання всіх активних ордерів на ринку
async function getMarketOrders() {
    const allOrders = await API.getOrders();
    
    return {
        buy: allOrders.filter(o => o.type === 'buy' && o.status === 'active'),
        sell: allOrders.filter(o => o.type === 'sell' && o.status === 'active')
    };
}

// Ініціалізація при завантаженні
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeCurrency();
    });
}
