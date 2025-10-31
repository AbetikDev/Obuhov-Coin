// Система UI сповіщень для Obuhov Coin
class NotificationSystem {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // Створюємо контейнер для сповіщень
        if (!document.getElementById('notification-container')) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('notification-container');
        }
    }

    show(message, type = 'info', duration = 4000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Іконки для різних типів сповіщень
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            question: '❓'
        };

        const icon = icons[type] || icons.info;
        
        notification.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">${message}</div>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;

        this.container.appendChild(notification);

        // Анімація появи
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Автоматичне закриття
        if (duration > 0) {
            setTimeout(() => {
                this.hide(notification);
            }, duration);
        }

        return notification;
    }

    hide(notification) {
        notification.classList.remove('show');
        notification.classList.add('hide');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }

    success(message, duration = 4000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 4000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 4000) {
        return this.show(message, 'info', duration);
    }

    confirm(message, onConfirm, onCancel) {
        const notification = document.createElement('div');
        notification.className = 'notification notification-question confirm-dialog';
        
        notification.innerHTML = `
            <div class="notification-icon">❓</div>
            <div class="notification-content">${message}</div>
            <div class="notification-actions">
                <button class="notification-btn notification-btn-confirm">Так</button>
                <button class="notification-btn notification-btn-cancel">Ні</button>
            </div>
        `;

        this.container.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        const confirmBtn = notification.querySelector('.notification-btn-confirm');
        const cancelBtn = notification.querySelector('.notification-btn-cancel');

        confirmBtn.addEventListener('click', () => {
            this.hide(notification);
            if (onConfirm) onConfirm();
        });

        cancelBtn.addEventListener('click', () => {
            this.hide(notification);
            if (onCancel) onCancel();
        });

        return notification;
    }

    clear() {
        const notifications = this.container.querySelectorAll('.notification');
        notifications.forEach(notification => {
            this.hide(notification);
        });
    }
}

// Ініціалізація глобальної системи сповіщень
const notify = new NotificationSystem();

// Заміна стандартного alert
window.showNotification = function(message, type = 'info') {
    // Визначаємо тип на основі емоджі в повідомленні
    if (message.includes('✅')) {
        notify.success(message);
    } else if (message.includes('❌')) {
        notify.error(message);
    } else if (message.includes('⚠️') || message.includes('⏰')) {
        notify.warning(message);
    } else {
        notify.info(message);
    }
};

// Заміна стандартного confirm
window.showConfirm = function(message, callback) {
    return new Promise((resolve) => {
        notify.confirm(message, 
            () => {
                if (callback) callback(true);
                resolve(true);
            },
            () => {
                if (callback) callback(false);
                resolve(false);
            }
        );
    });
};
