// Obuhov Coin - Node.js Server з SQLite
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Ініціалізація бази даних SQLite
const db = new sqlite3.Database('./obuhov_coin.db', (err) => {
    if (err) {
        console.error('Помилка підключення до БД:', err.message);
    } else {
        console.log('Підключено до бази даних SQLite');
        initializeDatabase();
    }
});

// Створення таблиць
function initializeDatabase() {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password TEXT NOT NULL,
            coins REAL DEFAULT 0,
            usd REAL DEFAULT 100,
            frozenCoins REAL DEFAULT 0,
            frozenUSD REAL DEFAULT 0,
            isAdmin INTEGER DEFAULT 0,
            registeredAt TEXT NOT NULL
        )
    `, (err) => {
        if (err) {
            console.error('Помилка створення таблиці users:', err.message);
        } else {
            console.log('Таблиця users готова');
            createDefaultAdmin();
        }
    });

    db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            fromUser TEXT,
            toUser TEXT,
            coins REAL DEFAULT 0,
            usd REAL DEFAULT 0,
            fee REAL DEFAULT 0,
            timestamp TEXT NOT NULL,
            description TEXT
        )
    `, (err) => {
        if (err) {
            console.error('Помилка створення таблиці transactions:', err.message);
        } else {
            console.log('Таблиця transactions готова');
        }
    });

    db.run(`
        CREATE TABLE IF NOT EXISTS market_orders (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            username TEXT NOT NULL,
            amount REAL NOT NULL,
            price REAL NOT NULL,
            total REAL NOT NULL,
            timestamp TEXT NOT NULL
        )
    `, (err) => {
        if (err) {
            console.error('Помилка створення таблиці market_orders:', err.message);
        } else {
            console.log('Таблиця market_orders готова');
        }
    });

    db.run(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    `, (err) => {
        if (err) {
            console.error('Помилка створення таблиці settings:', err.message);
        } else {
            console.log('Таблиця settings готова');
            setDefaultExchangeRate();
        }
    });
}

// Створення адміна за замовчуванням
function createDefaultAdmin() {
    db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, row) => {
        if (err) {
            console.error('Помилка перевірки адміна:', err.message);
        } else if (!row) {
            db.run(`
                INSERT INTO users (username, password, coins, usd, frozenCoins, frozenUSD, isAdmin, registeredAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, ['admin', 'admin', 0, 10000, 0, 0, 1, new Date().toISOString()], (err) => {
                if (err) {
                    console.error('Помилка створення адміна:', err.message);
                } else {
                    console.log('Адмін створено: admin/admin');
                }
            });
        }
    });
}

// Встановлення курсу за замовчуванням
function setDefaultExchangeRate() {
    db.get('SELECT * FROM settings WHERE key = ?', ['exchangeRate'], (err, row) => {
        if (err) {
            console.error('Помилка перевірки курсу:', err.message);
        } else if (!row) {
            db.run(`
                INSERT INTO settings (key, value) VALUES (?, ?)
            `, ['exchangeRate', '2.65'], (err) => {
                if (err) {
                    console.error('Помилка встановлення курсу:', err.message);
                } else {
                    console.log('Курс встановлено: 2.65');
                }
            });
        }
    });
}

// ==================== API Endpoints ====================

// Отримання всіх користувачів
app.get('/api/users', (req, res) => {
    db.all('SELECT * FROM users', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Отримання конкретного користувача
app.get('/api/users/:username', (req, res) => {
    db.get('SELECT * FROM users WHERE username = ?', [req.params.username], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (!row) {
            res.status(404).json({ error: 'Користувача не знайдено' });
        } else {
            res.json(row);
        }
    });
});

// Реєстрація
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Заповніть всі поля' });
    }

    db.run(`
        INSERT INTO users (username, password, coins, usd, frozenCoins, frozenUSD, isAdmin, registeredAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [username, password, 0, 100, 0, 0, 0, new Date().toISOString()], (err) => {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                res.status(400).json({ error: 'Користувач вже існує' });
            } else {
                res.status(500).json({ error: err.message });
            }
        } else {
            res.json({ success: true, message: 'Користувача створено' });
        }
    });
});

// Логін
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (!row) {
            res.status(401).json({ error: 'Невірний логін або пароль' });
        } else {
            res.json(row);
        }
    });
});

// Оновлення користувача
app.put('/api/users/:username', (req, res) => {
    const { coins, usd, frozenCoins, frozenUSD, isAdmin } = req.body;

    db.run(`
        UPDATE users 
        SET coins = ?, usd = ?, frozenCoins = ?, frozenUSD = ?, isAdmin = ?
        WHERE username = ?
    `, [coins, usd, frozenCoins, frozenUSD, isAdmin, req.params.username], (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ success: true, message: 'Користувача оновлено' });
        }
    });
});

// Видалення користувача
app.delete('/api/users/:username', (req, res) => {
    db.run('DELETE FROM users WHERE username = ?', [req.params.username], (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ success: true, message: 'Користувача видалено' });
        }
    });
});

// Отримання транзакцій
app.get('/api/transactions', (req, res) => {
    const { username } = req.query;

    let query = 'SELECT * FROM transactions';
    let params = [];

    if (username) {
        query += ' WHERE fromUser = ? OR toUser = ?';
        params = [username, username];
    }

    query += ' ORDER BY timestamp DESC';

    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Додавання транзакції
app.post('/api/transactions', (req, res) => {
    const { type, fromUser, toUser, coins, usd, fee, description } = req.body;

    db.run(`
        INSERT INTO transactions (type, fromUser, toUser, coins, usd, fee, timestamp, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [type, fromUser, toUser, coins || 0, usd || 0, fee || 0, new Date().toISOString(), description], (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ success: true, message: 'Транзакцію додано' });
        }
    });
});

// Отримання ордерів
app.get('/api/orders', (req, res) => {
    const { type, username } = req.query;

    let query = 'SELECT * FROM market_orders';
    let params = [];
    let conditions = [];

    if (type) {
        conditions.push('type = ?');
        params.push(type);
    }

    if (username) {
        conditions.push('username = ?');
        params.push(username);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY price ' + (type === 'buy' ? 'DESC' : 'ASC');

    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Створення ордера
app.post('/api/orders', (req, res) => {
    const { id, type, username, amount, price, total } = req.body;

    db.run(`
        INSERT INTO market_orders (id, type, username, amount, price, total, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, type, username, amount, price, total, new Date().toISOString()], (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ success: true, message: 'Ордер створено' });
        }
    });
});

// Видалення ордера
app.delete('/api/orders/:id', (req, res) => {
    db.run('DELETE FROM market_orders WHERE id = ?', [req.params.id], (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ success: true, message: 'Ордер видалено' });
        }
    });
});

// Отримання курсу
app.get('/api/exchange-rate', (req, res) => {
    db.get('SELECT value FROM settings WHERE key = ?', ['exchangeRate'], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ rate: parseFloat(row?.value || 2.65) });
        }
    });
});

// Оновлення курсу
app.put('/api/exchange-rate', (req, res) => {
    const { rate } = req.body;

    db.run(`
        INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)
    `, ['exchangeRate', rate.toString()], (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ success: true, message: 'Курс оновлено' });
        }
    });
});

// Запуск сервера на фіксованому порту
const PORT = process.env.PORT || 22;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log('==============================================');
    console.log('Obuhov Coin Server запущено');
    console.log('Локально:  http://localhost:' + PORT);
    console.log('Ззовні:    http://' + HOST + ':' + PORT + ' (якщо порт відкритий у фаєрволі)');
    console.log('База даних: SQLite (obuhov_coin.db)');
    console.log('Порт: ' + PORT);
    console.log('==============================================');
});

// Закриття БД при зупинці
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Помилка закриття БД:', err.message);
        } else {
            console.log('База даних закрита');
        }
        process.exit(0);
    });
});
