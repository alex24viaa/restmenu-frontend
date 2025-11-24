# Инструкции по настройке автоматического деплоя

Я создал GitHub Actions workflows для автоматического деплоя. Чтобы они работали, нужно настроить секреты в GitHub.

## Настройка секретов в GitHub

1. Перейдите в ваш репозиторий на GitHub
2. Откройте **Settings** → **Secrets and variables** → **Actions**
3. Добавьте следующие секреты:

### Для фронтенда (restmenu-frontend):
- `SSH_HOST` - IP адрес или домен вашего сервера (например: `restmenu.online` или `123.45.67.89`)
- `SSH_USER` - имя пользователя для SSH (например: `root` или `deploy`)
- `SSH_PRIVATE_KEY` - приватный SSH ключ для доступа к серверу
- `SSH_PORT` - порт SSH (обычно 22, можно не указывать)
- `DEPLOY_PATH_FRONTEND` - путь к директории фронтенда на сервере (например: `/var/www/restmenu-frontend` или `/home/user/restmenu-frontend`)
- `VITE_API_URL` - URL API (опционально, по умолчанию будет использоваться `https://www.restmenu.online`)

### Для бэкенда (restmenu-backend):
- `SSH_HOST` - IP адрес или домен вашего сервера
- `SSH_USER` - имя пользователя для SSH
- `SSH_PRIVATE_KEY` - приватный SSH ключ
- `SSH_PORT` - порт SSH (опционально)
- `DEPLOY_PATH_BACKEND` - путь к директории бэкенда на сервере (например: `/var/www/restmenu-backend`)

## Альтернативный вариант: Ручной деплой через скрипт

Если у вас нет SSH ключа или вы предпочитаете ручной деплой, создайте скрипт:

### deploy.sh (для Linux/Mac):
```bash
#!/bin/bash
cd /path/to/restmenu-frontend
git pull origin main
npm install
npm run build
# Перезапустите веб-сервер
sudo systemctl reload nginx
```

### deploy.ps1 (для Windows):
```powershell
cd C:\path\to\restmenu-frontend
git pull origin main
npm install
npm run build
# Перезапустите веб-сервер
```

## Быстрый деплой прямо сейчас

Если нужно задеплоить прямо сейчас без настройки автоматизации:

### На сервере выполните:

**Фронтенд:**
```bash
cd /path/to/restmenu-frontend
git pull origin main
npm install
npm run build
# Перезапустите веб-сервер (nginx/apache)
sudo systemctl reload nginx
```

**Бэкенд:**
```bash
cd /path/to/restmenu-backend
git pull origin main
npm install
pm2 restart restmenu-backend
```

---

**Примечание:** Если у вас нет доступа к серверу через SSH, или используете другой метод деплоя (FTP, панель управления и т.д.), дайте знать - я помогу настроить под ваш вариант.

