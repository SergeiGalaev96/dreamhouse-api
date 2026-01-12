# Stage 1: Build
FROM node:20-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем только production-зависимости
RUN npm install --production

# Копируем весь проект
COPY . .

# Stage 2: Final image
FROM node:20-alpine

WORKDIR /app

# Копируем зависимости и код из build stage
COPY --from=builder /app /app

# Указываем порт (для контейнера)
EXPOSE 3000

# Устанавливаем команду запуска
CMD ["node", "server.js"]