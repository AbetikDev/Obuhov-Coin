// API клієнт для роботи з сервером Якщо хостити то міняти на айпі хоста
const API_URL = 'http://localhost:28015/api';

// Клас для роботи з API
class API {
    // ==================== Користувачі ====================
    
    // Отримати всіх користувачів
    static async getAllUsers() {
        try {
            const response = await fetch(`${API_URL}/users`);
            if (!response.ok) throw new Error('Помилка отримання користувачів');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    }

    // Отримати користувача
    static async getUser(username) {
        try {
            const response = await fetch(`${API_URL}/users/${username}`);
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    }

    // Реєстрація
    static async register(username, password) {
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Помилка реєстрації');
            }
            
            return { success: true, data };
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: error.message };
        }
    }

    // Логін
    static async login(username, password) {
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Помилка входу');
            }
            
            return { success: true, user: data };
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: error.message };
        }
    }

    // Оновити користувача
    static async updateUser(username, userData) {
        try {
            const response = await fetch(`${API_URL}/users/${username}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Помилка оновлення');
            }
            
            return { success: true, data };
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: error.message };
        }
    }

    // Видалити користувача
    static async deleteUser(username) {
        try {
            const response = await fetch(`${API_URL}/users/${username}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Помилка видалення');
            }
            
            return { success: true, data };
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== Транзакції ====================
    
    // Отримати транзакції
    static async getTransactions(username = null) {
        try {
            const url = username 
                ? `${API_URL}/transactions?username=${username}`
                : `${API_URL}/transactions`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Помилка отримання транзакцій');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    }

    // Додати транзакцію
    static async addTransaction(transaction) {
        try {
            const response = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transaction)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Помилка додавання транзакції');
            }
            
            return { success: true, data };
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== Ордери ====================
    
    // Отримати ордери
    static async getOrders(filters = {}) {
        try {
            const params = new URLSearchParams();
            if (filters.type) params.append('type', filters.type);
            if (filters.username) params.append('username', filters.username);
            
            const url = `${API_URL}/orders${params.toString() ? '?' + params.toString() : ''}`;
            const response = await fetch(url);
            
            if (!response.ok) throw new Error('Помилка отримання ордерів');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    }

    // Створити ордер
    static async createOrder(order) {
        try {
            const response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(order)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Помилка створення ордера');
            }
            
            return { success: true, data };
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: error.message };
        }
    }

    // Видалити ордер
    static async deleteOrder(orderId) {
        try {
            const response = await fetch(`${API_URL}/orders/${orderId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Помилка видалення ордера');
            }
            
            return { success: true, data };
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== Курс валюти ====================
    
    // Отримати курс
    static async getExchangeRate() {
        try {
            const response = await fetch(`${API_URL}/exchange-rate`);
            if (!response.ok) throw new Error('Помилка отримання курсу');
            const data = await response.json();
            return data.rate;
        } catch (error) {
            console.error('API Error:', error);
            return 2.65; // Курс за замовчуванням
        }
    }

    // Оновити курс
    static async updateExchangeRate(rate) {
        try {
            const response = await fetch(`${API_URL}/exchange-rate`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rate })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Помилка оновлення курсу');
            }
            
            return { success: true, data };
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== Перевірка з'єднання ====================
    
    // Перевірити з'єднання з сервером
    static async checkConnection() {
        try {
            const response = await fetch(`${API_URL}/users`);
            return response.ok;
        } catch (error) {
            console.error('Сервер недоступний:', error);
            return false;
        }
    }
}

// Експорт для використання
window.API = API;
