// Оновлення курсу з API
        async function updateExchangeRate() {
            try {
                const priceElement = document.getElementById('exchange-rate');
                if (priceElement) {
                    // Індикатор завантаження
                    priceElement.style.opacity = '0.6';
                    priceElement.style.transform = 'scale(0.95)';
                    
                    const rate = await API.getExchangeRate();
                    
                    // Оновлюємо курс з анімацією
                    setTimeout(() => {
                        priceElement.textContent = '$' + rate.toFixed(2);
                        priceElement.style.opacity = '1';
                        priceElement.style.transform = 'scale(1)';
                        
                        // Ефект спалаху при оновленні
                        priceElement.style.textShadow = '0 0 30px rgba(100, 255, 218, 0.8)';
                        setTimeout(() => {
                            priceElement.style.textShadow = '0 0 20px rgba(100, 255, 218, 0.5)';
                        }, 500);
                    }, 300);
                }
            } catch (error) {
                console.error('Помилка оновлення курсу:', error);
                const priceElement = document.getElementById('exchange-rate');
                if (priceElement) {
                    priceElement.style.opacity = '1';
                    priceElement.style.transform = 'scale(1)';
                    priceElement.textContent = '$2.65'; // Fallback курс
                    priceElement.style.color = '#ff6b6b'; // Червоний при помилці
                }
            }
        }

        // Оновлення кількості активних трейдерів
        async function updateActiveTraders() {
            try {
                const users = await API.getAllUsers();
                const traderCount = users.length;
                const traderElement = document.getElementById('active-traders');
                if (traderElement) {
                    // Анімація оновлення
                    traderElement.style.transform = 'scale(1.1)';
                    traderElement.textContent = traderCount;
                    setTimeout(() => {
                        traderElement.style.transform = 'scale(1)';
                    }, 200);
                }
            } catch (error) {
                console.error('Помилка оновлення трейдерів:', error);
                const traderElement = document.getElementById('active-traders');
                if (traderElement) {
                    traderElement.textContent = '?';
                    traderElement.style.color = '#ff6b6b';
                }
            }
        }

        // Перевірка підключення до API
        async function checkAPIConnection() {
            try {
                const isConnected = await API.checkConnection();
                const liveIndicator = document.querySelector('.live-indicator');
                const liveDot = document.querySelector('.live-dot');
                const connectionStatus = document.getElementById('connection-status');
                
                if (isConnected) {
                    if (liveIndicator) {
                        liveIndicator.classList.remove('disconnected');
                        liveIndicator.style.borderColor = 'rgba(76, 175, 80, 0.3)';
                        liveIndicator.style.color = '#4caf50';
                    }
                    if (liveDot) {
                        liveDot.style.background = '#4caf50';
                    }
                    if (connectionStatus) {
                        connectionStatus.textContent = 'Live Updates';
                    }
                } else {
                    if (liveIndicator) {
                        liveIndicator.classList.add('disconnected');
                        liveIndicator.style.borderColor = 'rgba(255, 107, 107, 0.3)';
                        liveIndicator.style.color = '#ff6b6b';
                    }
                    if (liveDot) {
                        liveDot.style.background = '#ff6b6b';
                    }
                    if (connectionStatus) {
                        connectionStatus.textContent = 'Offline Mode';
                    }
                }
            } catch (error) {
                console.error('Помилка перевірки підключення:', error);
            }
        }

        // Автооновлення кожні 10 секунд
        setInterval(async () => {
            await checkAPIConnection();
            await updateExchangeRate();
            await updateActiveTraders();
        }, 10000);

        // Початкове оновлення при завантаженні сторінки
        window.addEventListener('DOMContentLoaded', async () => {
            await checkAPIConnection();
            await updateExchangeRate();
            await updateActiveTraders();
        });