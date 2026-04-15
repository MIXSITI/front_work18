# MIX Coffee — Веб-приложение для управления меню кофейни

Итоговый проект по курсу **«Фронтенд и бэкенд разработка»** (4 семестр, 2025/2026).  
Проект объединяет результаты практических занятий **1–11** в единое полнофункциональное веб-приложение — каталог меню кофейни с возможностью просмотра, поиска, фильтрации, добавления, редактирования и удаления позиций, а также с авторизацией и ролевым доступом.

---

## Стек технологий

| Слой | Технологии |
|------|------------|
| Фронтенд | React (CRA), Axios, SASS/SCSS |
| Бэкенд | Node.js, Express.js, nanoid |
| Загрузка файлов | Multer |
| Документация API | Swagger (`swagger-jsdoc` + `swagger-ui-express`) |
| Тестирование | Postman |

---

## Связь с практическими занятиями

### Занятие 1 — CSS-препроцессоры (SASS)
Файлы: `frontend/src/styles/_variables.scss`, `frontend/src/styles/main.scss`  
Используются для оформления интерфейса сайта, карточек товаров, кнопок, модального окна и общей цветовой схемы приложения.

- **Переменные**: цвета, радиусы, базовые размеры и стилистические значения интерфейса.
- **Миксины**: `card`, `button`, `btn-base` для переиспользуемых блоков стилей.
- **Вложенность**: стили для `.app`, `.menu-card`, `.modal`, `.categories`, `.product-image`, `.btn` и других блоков.
- **UI-оформление**: карточки товаров, фильтры по категориям, форма поиска, модальное окно создания и редактирования.

### Занятие 2 — Сервер на Node.js + Express
Файл: `backend/app.js`  
Реализует backend-приложение для хранения и обработки данных меню кофейни.

- **5 CRUD-маршрутов**:
  - `GET /api/products`
  - `GET /api/products/:id`
  - `POST /api/products`
  - `PATCH /api/products/:id`
  - `DELETE /api/products/:id`
- **Middleware**:
  - `express.json()`
  - `cors()`
  - кастомный логгер запросов
  - `express.static()` для раздачи изображений
- **Обработка файлов**:
  - загрузка изображений через `multer`
  - сохранение файлов в `backend/public/uploads`
- **Обработчики ошибок**:
  - `404` для неизвестных маршрутов
  - глобальный обработчик ошибок `500`

### Занятие 3 — JSON и API
Файл: `frontend/src/api/api.js`  
Используется для работы фронтенда с backend API.

- Все данные товаров передаются в формате **JSON**
- Выполняются запросы через **Fetch API**
- Реализованы функции:
  - `getProducts()`
  - `deleteProduct(id)`
- Для создания и редактирования товаров используется `FormData`, так как запросы могут содержать изображение

### Занятие 4 — API + React
Файлы: `frontend/src/components/`, `frontend/src/App.jsx`  
Реализуют пользовательский интерфейс и связывают его с backend API.

- **React-компоненты**:
  - `ProductList`
  - `ProductItem`
  - `ProductModal`
  - `App`
- Полный **CRUD через UI**:
  - просмотр списка товаров
  - добавление новой позиции
  - редактирование позиции
  - удаление позиции
- **Фильтрация** по категориям
- **Поиск** по названию и описанию
- **Модальное окно** для добавления и редактирования товара

### Занятие 5 — Расширенный REST API (Swagger)
Файл: `backend/app.js`  
Содержит JSDoc-аннотации для автоматической генерации документации API.

- Описана схема **Product**
- Задокументированы все **5 эндпоинтов**
- Для каждого маршрута указаны:
  - параметры
  - тело запроса
  - возможные коды ответов
- Интерактивная документация доступна по адресу:
 
### Занятие 7 — Базовые методы аутентификации
Файлы: `backend/app.js`, `backend/security/hash/hashPassword.js`, `backend/security/verify/verifyPassword.js`, `backend/security/hash/store/hashStore.js`, `backend/security/verify/store/credentialStore.js`, `frontend/src/components/AuthForm.jsx`, `frontend/src/App.jsx`  
Реализованы регистрация и вход пользователей, пароли хешируются на сервере.

- **Для чего реализовано**: чтобы обеспечить безопасную регистрацию и вход пользователя, а также хранить пароли только в хешированном виде.

- Добавлены маршруты регистрации и входа.
- Реализовано хеширование паролей через `bcrypt`.
- Хеши паролей сохраняются в `hashStore`.
- Данные для проверки входа хранятся в `credentialStore`.
- **Хеширование паролей**:
  - `bcrypt`, соль учитывается внутри хеша
- **Поля пользователя**:
  - `id`, `email`, `first_name`, `last_name` (хеш хранится отдельно в `hashStore`)
- **Маршруты аутентификации**:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
- **Товары** (CRUD по заданию):
  - `POST /api/products`
  - `GET /api/products`
  - `GET /api/products/:id`
  - `PUT /api/products/:id`
  - `DELETE /api/products/:id`

### Занятие 8 — JWT-токены и защищённые маршруты
Файлы: `backend/app.js`, `backend/security/tokens/jwtService.js`, `frontend/src/api/api.js`  

- При входе выдается `accessToken`.
- Добавлен защищенный маршрут `GET /api/auth/me`.
- Реализована проверка `Authorization: Bearer <token>` в middleware.

- **Для чего реализовано**: чтобы после входа пользователь получал токен доступа и мог обращаться к защищенным ресурсам API.
- **Выдача токена**:
  - при `POST /api/auth/login` сервер возвращает `accessToken`
- **Текущий пользователь**:
  - `GET /api/auth/me`
- **Защита маршрутов товаров** (нужен `Bearer`-токен):
  - `GET /api/products/:id`
  - `PUT /api/products/:id`
  - `DELETE /api/products/:id`

### Занятие 9 — Refresh-токены
Файлы: `backend/app.js`, `backend/security/tokens/store/refreshTokenStore.js`, `backend/security/tokens/jwtService.js`, `frontend/src/api/api.js`  
Реализована пара access/refresh и обновление токенов без повторного ввода пароля.

- Добавлен `refreshToken`.
- Реализован `POST /api/auth/refresh`.
- Настроена ротация refresh-токенов (старый токен инвалидируется, выдается новая пара).

- **Для чего реализовано**: чтобы автоматически продлевать сессию без повторного ввода логина и пароля после истечения access-токена.
- **Пара токенов**:
  - при входе выдаются `accessToken` и `refreshToken`
- **Обновление**:
  - `POST /api/auth/refresh`
  - refresh-токен передаётся в заголовке `Authorization: Bearer <refreshToken>`
- **Ответ**:
  - JSON с полями `accessToken` и `refreshToken`
- **Хранилище refresh-токенов**:
  - `refreshTokenStore.js` + `refreshTokens.json` (активные refresh JWT сохраняются в JSON)

### Занятие 10 — Хранение токенов на фронтенде
Файлы: `frontend/src/api/api.js`, `frontend/src/App.jsx`  
Токены хранятся на клиенте, запросы к API автоматизированы через interceptors.

- Токены сохраняются в `localStorage`.
- Настроены Axios interceptors для:
  - автоматической подстановки `accessToken` в запросы;
  - автоматического обновления токенов при ответе `401`.

- **Для чего реализовано**: чтобы связать клиентскую часть с API и автоматизировать авторизацию в интерфейсе.
- **localStorage**:
  - `accessToken`
  - `refreshToken`
- **Interceptors**:
  - подстановка `Authorization` для каждого запроса
  - при ответе `401` — запрос на refresh и повтор исходного запроса
- **Интерфейс**:
  - страницы входа и регистрации
  - работа с товарами через API после авторизации

<<<<<<< HEAD
### Занятие 11 — Управление доступом на основе ролей
=======
### Занятие 11 — Управление доступом на основе ролей 
>>>>>>> 2498035a2df18aad10bdbd3f5d4854d176429cfc
Файлы: `backend/app.js`, `frontend/src/App.jsx`, `frontend/src/components/UserManagement.jsx`  
Реализованы роли пользователя, продавца и администратора и проверка прав на сервере.

- Добавлены роли `user`, `seller`, `admin`.
- Реализованы ограничения доступа к маршрутам по ролям.
- Добавлено администрирование пользователей:
  - просмотр списка;
  - редактирование данных и роли;
  - блокировка пользователей.

- **Для чего реализовано**: чтобы разграничить права пользователей по ролям и ограничить доступ к операциям API.
- **Middleware**:
  - `authMiddleware` — проверка JWT
  - `roleMiddleware` — допуск по роли
- **Роли**:
  - **user** — просмотр каталога (и корзина в интерфейсе)
  - **seller** — создание и изменение товаров
  - **admin** — права продавца и управление пользователями
- **Маршруты и доступ**:
  - `GET /api/products` — пользователь
  - `GET /api/products/:id` — пользователь
  - `POST /api/products` — продавец
  - `PUT /api/products/:id` — продавец
  - `DELETE /api/products/:id` — администратор
  - `GET /api/users` — администратор
  - `GET /api/users/:id` — администратор
  - `PUT /api/users/:id` — администратор
  - `DELETE /api/users/:id` — администратор (блокировка пользователя)

---

## Возможности проекта

- Просмотр меню кофейни
- Поиск товаров по названию и описанию
- Фильтрация по категориям
- Добавление новой позиции
- Редактирование существующей позиции
- Удаление товара
- Загрузка изображения товара
- Просмотр Swagger-документации API

---

## Структура проекта

```bash
work 12/
├── backend/
│   ├── public/
│   │   ├── images/                   # Стандартные изображения товаров
│   │   └── uploads/                  # Загруженные изображения
│   ├── app.js                        # Express API + JWT + роли + Swagger
│   ├── security/
│   │   ├── hash/
│   │   │   ├── hashPassword.js       # Хеширование пароля
│   │   │   └── store/
│   │   │       └── hashStore.js      # Хранилище хешей (userId -> hash)
│   │   ├── verify/
│   │   │   ├── verifyPassword.js     # Проверка пароля по хешу
│   │   │   └── store/
│   │   │       └── credentialStore.js # Хранилище login-данных (email -> userId)
│   │   └── tokens/
│   │       ├── jwtService.js         # Генерация/проверка JWT
│   │       └── store/
│   │           ├── refreshTokenStore.js # Логика хранения refresh-токенов
│   │           └── refreshTokens.json   # Файл с активными refresh JWT (массив строк)
│   ├── requests.http                 # Примеры HTTP-запросов
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── postman/
│   │   └── coffee-shop.postman_collection.json  # Коллекция для тестов API
│   ├── public/
│   │   ├── images/                   # Изображения для фронтенда
│   │   └── index.html
│   ├── src/
│   │   ├── api/
│   │   │   └── api.js                # API-клиент + токены + refresh
│   │   ├── components/
│   │   │   ├── AuthForm.jsx          # Форма входа/регистрации
│   │   │   ├── ProductDetails.jsx    # Детальная карточка товара
│   │   │   ├── ProductItem.jsx       # Карточка товара + кнопки корзины
│   │   │   ├── ProductList.jsx       # Сетка товаров
│   │   │   ├── ProductModal.jsx      # Добавление/редактирование товара
│   │   │   └── UserManagement.jsx    # Панель управления пользователями
│   │   ├── styles/
│   │   │   ├── _variables.scss       # Переменные и миксины
│   │   │   └── main.scss             # Основные стили интерфейса
│   │   ├── App.jsx                   # Главный компонент приложения
│   │   ├── index.css
│   │   └── index.js
│   ├── package.json
│   └── package-lock.json
│
└── README.md
```

---

## Запуск проекта

### 1. Запуск backend

```bash
cd backend
npm install
npm start
```

Backend будет доступен по адресу:

```bash
http://localhost:3001
```

Swagger-документация:

```bash
http://localhost:3001/api-docs
```

### 2. Запуск frontend

```bash
cd frontend
npm install
npm start
```

Frontend будет доступен по адресу:

```bash
http://localhost:3000
```

---

## API эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/products` | Получить список всех товаров |
| `GET` | `/api/products/:id` | Получить товар по ID |
| `POST` | `/api/products` | Создать новый товар |
| `PATCH` | `/api/products/:id` | Обновить товар |
| `DELETE` | `/api/products/:id` | Удалить товар |

---

## Объект товара (JSON)

```json
{
  "id": "abc123",
  "title": "Капучино",
  "category": "Напитки",
  "description": "Классический капучино с нежной пенкой",
  "price": 320,
  "stock": 20,
  "image": "/uploads/example.jpg"
}
```

---

## Работа с изображениями

В проекте используются два варианта изображений:

1. **Стандартные изображения**  
   Хранятся в папке `frontend/public/images` и подключаются по путям вида:

```bash
/images/kapuchino.jpg
/images/latte.jpg
/images/aspreso.jpg
/images/raf.jpg
/images/kruasan.jpg
/images/chiskeyk.jpg
```

2. **Загруженные пользователем изображения**  
   Сохраняются через backend в папку:

```bash
backend/public/uploads
```

и доступны по путям вида:

```bash
/uploads/filename.jpg
```

---

## Тестирование в Postman

В проекте присутствует коллекция Postman:

```bash
frontend/postman/coffee-shop.postman_collection.json
```

Примеры запросов:

### Получить все товары
```http
GET http://localhost:3001/api/products
```

### Получить товар по ID
```http
GET http://localhost:3001/api/products/{id}
```

### Создать новый товар
```http
POST http://localhost:3001/api/products
Content-Type: multipart/form-data
```

Поля формы:
- `title`
- `category`
- `description`
- `price`
- `stock`
- `image`

### Обновить товар
```http
PATCH http://localhost:3001/api/products/{id}
Content-Type: multipart/form-data
```

### Удалить товар
```http
DELETE http://localhost:3001/api/products/{id}
```

---

## Категории товаров

| Категория | Примеры |
|-----------|---------|
| Напитки | Капучино, Латте, Эспрессо, Раф |
| Выпечка | Круассан |
| Десерты | Чизкейк |

---

## Кобылянский С.С.
Проект выполнен в рамках учебной дисциплины  
**«Фронтенд и бэкенд разработка»**, 4 семестр, 2025/2026.
#   f r o n t _ w o r k 1 8  
 