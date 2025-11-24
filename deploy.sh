#!/bin/bash
# Скрипт для деплоя фронтенда и бэкенда

echo "🚀 Начинаю деплой..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Пути (измените на ваши реальные пути)
FRONTEND_PATH="/path/to/restmenu-frontend"
BACKEND_PATH="/path/to/restmenu-backend"

# Функция для деплоя фронтенда
deploy_frontend() {
    echo -e "${YELLOW}📦 Деплой фронтенда...${NC}"
    cd "$FRONTEND_PATH" || exit 1
    
    echo "  → Обновляю код из Git..."
    git pull origin main || exit 1
    
    echo "  → Устанавливаю зависимости..."
    npm install || exit 1
    
    echo "  → Собираю проект..."
    npm run build || exit 1
    
    echo -e "${GREEN}✅ Фронтенд успешно задеплоен!${NC}"
    echo "  → Перезапустите веб-сервер: sudo systemctl reload nginx"
}

# Функция для деплоя бэкенда
deploy_backend() {
    echo -e "${YELLOW}📦 Деплой бэкенда...${NC}"
    cd "$BACKEND_PATH" || exit 1
    
    echo "  → Обновляю код из Git..."
    git pull origin main || exit 1
    
    echo "  → Устанавливаю зависимости..."
    npm install --production || exit 1
    
    echo "  → Перезапускаю приложение..."
    pm2 restart restmenu-backend || pm2 start ecosystem.config.js || exit 1
    pm2 save
    
    echo -e "${GREEN}✅ Бэкенд успешно задеплоен!${NC}"
}

# Меню выбора
echo "Что вы хотите задеплоить?"
echo "1) Только фронтенд"
echo "2) Только бэкенд"
echo "3) Фронтенд и бэкенд"
read -p "Выберите вариант (1-3): " choice

case $choice in
    1)
        deploy_frontend
        ;;
    2)
        deploy_backend
        ;;
    3)
        deploy_backend
        deploy_frontend
        ;;
    *)
        echo -e "${RED}❌ Неверный выбор${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}🎉 Деплой завершен!${NC}"

