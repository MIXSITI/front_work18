# MIX Coffee — Веб-приложение для управления меню кофейни

Итоговый проект по курсу **«Фронтенд и бэкенд разработка»** (4 семестр, 2025/2026).  
Проект объединяет результаты практических занятий **1–17** в единое веб-приложение: каталог товаров, аутентификация, ролевая модель доступа, PWA, WebSocket и push-уведомления.

---

## Стек технологий

| Слой | Технологии |
|------|------------|
| Фронтенд | React (CRA), Axios, Sass/SCSS, Socket.IO Client |
| Бэкенд | Node.js, Express.js, nanoid |
| Безопасность | bcrypt, JWT (access + refresh) |
| Файлы | Multer |
| API-документация | Swagger (`swagger-jsdoc` + `swagger-ui-express`) |
| Realtime / Push | Socket.IO, web-push |
| PWA | Service Worker, Web App Manifest, App Shell |

---

## Связь с практическими занятиями (1–17)

### Занятие 1 — CSS-препроцессоры (SASS)
Файлы: `frontend/src/styles/_variables.scss`, `frontend/src/styles/main.scss`  
Используются переменные, миксины и вложенность для стилизации карточек, кнопок, модальных окон и макета.

- **Переменные**: цвета, радиусы, размеры.
- **Миксины**: переиспользуемые стили UI-компонентов.
- **Вложенность**: структурированные SCSS-блоки интерфейса.

### Занятие 2 — Сервер на Node.js + Express
Файл: `backend/app.js`  
Реализовано API для товаров с CRUD-операциями и middleware.

- CRUD: `GET /api/products`, `GET /api/products/:id`, `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id`.
- Middleware: `express.json()`, `cors()`, логирование запросов, `express.static()`.
- Обработка изображений через `multer`.
- `404` и глобальный обработчик ошибок.

### Занятие 3 — JSON и API
Файл: `frontend/src/api/api.js`  
Фронтенд работает с backend API, данные передаются в JSON, загрузка/обновление товара поддерживает `FormData`.

- Методы работы с товарами и пользователями.
- Тестирование API возможно через Postman.

### Занятие 4 — API + React
Файлы: `frontend/src/App.jsx`, `frontend/src/components/*`  
Интерфейс связан с API, реализованы сценарии работы с каталогом.

- Просмотр, добавление, редактирование, удаление товара через UI.
- Поиск и фильтрация по категориям.
- Модальные формы для создания/редактирования.

### Занятие 5 — Расширенный REST API (Swagger)
Файл: `backend/app.js`  
Добавлены JSDoc-аннотации OpenAPI и интерактивная документация.

- Описаны схемы (`User`, `Product`, auth request/response).
- Документация доступна по `GET /api-docs`.

### Занятие 7 — Базовые методы аутентификации
Файлы: `backend/app.js`, `backend/security/hash/*`, `backend/security/verify/*`, `frontend/src/components/AuthForm.jsx`

- Регистрация/вход пользователя.
- Хеширование паролей через `bcrypt`.
- Разделены хранилища для учетных данных и хешей.

### Занятие 8 — JWT-токены и защищённые маршруты
Файлы: `backend/app.js`, `backend/security/tokens/jwtService.js`, `frontend/src/api/api.js`

- Выдача `accessToken` при логине.
- Маршрут `GET /api/auth/me`.
- Проверка `Authorization: Bearer <token>` через middleware.

### Занятие 9 — Refresh-токены
Файлы: `backend/app.js`, `backend/security/tokens/store/refreshTokenStore.js`, `frontend/src/api/api.js`

- Выдача пары `accessToken` + `refreshToken`.
- Маршрут `POST /api/auth/refresh`.
- Ротация refresh-токенов (старый инвалидируется, новая пара выдается).

### Занятие 10 — Хранение токенов на фронтенде
Файл: `frontend/src/api/api.js`

- Токены хранятся в `localStorage`.
- Axios interceptors:
  - подстановка `Authorization` в запросы;
  - авто-refresh и повтор исходного запроса при `401`.

### Занятие 11 — Управление доступом на основе ролей (RBAC)
Файлы: `backend/app.js`, `frontend/src/App.jsx`, `frontend/src/components/UserManagement.jsx`

- Роли: `user`, `seller`, `admin`.
- Middleware: `authMiddleware`, `roleMiddleware`.
- Разграничение прав к товарам и пользователям.
- Админ-панель управления пользователями (обновление/блокировка).

### Занятие 13 — Service Worker
Файлы: `frontend/public/sw.js`, `frontend/src/index.js`, `frontend/src/components/AppShellNotes.jsx`, `frontend/public/content/home.html`

- Регистрация Service Worker.
- Кэширование ресурсов.
- Офлайн-работа заметок с сохранением в `localStorage`.

### Занятие 14 — Web App Manifest
Файлы: `frontend/public/manifest.json`, `frontend/public/index.html`, `frontend/public/icons/*`, `frontend/public/sw.js`

- Подключен `manifest.json` и meta-теги.
- Подготовлены иконки PWA:
  - `icon-192x192.png`
  - `icon-256x256.png`
  - `icon-512x512.png`
- Manifest и иконки кэшируются в Service Worker.

### Занятие 15 — HTTPS + App Shell
Файлы: `backend/app.js`, `frontend/src/components/AppShellNotes.jsx`, `frontend/public/content/home.html`, `frontend/public/content/about.html`, `frontend/public/sw.js`

- Реализован App Shell (каркас + динамический контент страниц).
- Для `content/*` используется стратегия `Network First` с fallback.
- Добавлен опциональный HTTPS-режим backend:
  - `HTTPS_ENABLED=true`
  - `SSL_KEY_PATH`
  - `SSL_CERT_PATH`

### Занятие 16 — WebSocket + Push
Файлы: `backend/app.js`, `frontend/src/components/AppShellNotes.jsx`, `frontend/public/sw.js`

- Realtime-события через Socket.IO (`newTask`, `taskAdded`).
- Push-подписка и отписка:
  - `POST /subscribe`
  - `POST /unsubscribe`
- Публичный VAPID-ключ:
  - `GET /api/push/public-key`
- Отображение push через `self.addEventListener('push', ...)`.

### Занятие 17 — Детализация Push (напоминания)
Файлы: `frontend/public/content/home.html`, `frontend/src/components/AppShellNotes.jsx`, `backend/app.js`, `frontend/public/sw.js`

- Добавлена форма заметки с датой/временем напоминания.
- В `localStorage` заметки сохраняются с `id` и `reminder` (timestamp).
- На сервере реализовано планирование push-напоминаний через `setTimeout`.
- Добавлен маршрут `POST /snooze` для отложенного напоминания.
- В уведомлении доступна кнопка «Отложить на 5 минут».

---

## Возможности проекта

- Авторизация и регистрация пользователей.
- Разграничение доступа по ролям (user/seller/admin).
- CRUD товаров с загрузкой изображений.
- Поиск и фильтрация каталога.
- Управление пользователями для администратора.
- Swagger-документация API.
- PWA-режим с офлайн-доступом.
- Realtime-обновления и push-уведомления.

---

## Структура проекта

```bash
work 18/
├── backend/
│   ├── app.js
│   ├── public/
│   │   └── uploads/
│   ├── security/
│   │   ├── hash/
│   │   ├── verify/
│   │   └── tokens/
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── public/
│   │   ├── content/
│   │   ├── icons/
│   │   ├── manifest.json
│   │   ├── sw.js
│   │   └── index.html
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── index.js
│   ├── package.json
│   └── package-lock.json
└── README.md
```

---

## Запуск проекта

### 1) Backend

```bash
cd backend
npm install
npm start
```

По умолчанию:

- API: `http://localhost:3001`
- Swagger: `http://localhost:3001/api-docs`

### 2) Frontend

```bash
cd frontend
npm install
npm start
```

По умолчанию:

- UI: `http://localhost:3000`

### Опционально: запуск backend по HTTPS

```powershell
$env:HTTPS_ENABLED="true"
$env:SSL_KEY_PATH="C:\certs\localhost-key.pem"
$env:SSL_CERT_PATH="C:\certs\localhost.pem"
cd backend
npm start
```

---

## Тестовые аккаунты

- `admin@example.com / admin123`
- `seller@example.com / seller123`
- `user@example.com / user123`
