const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { nanoid } = require('nanoid');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const webpush = require('web-push');
const hashPassword = require('./security/hash/hashPassword');
const verifyPassword = require('./security/verify/verifyPassword');
const {
  setPasswordHash,
  getPasswordHash,
  clearPasswordHashes
} = require('./security/hash/store/hashStore');
const {
  setCredential,
  getUserIdByEmail,
  updateCredential,
  clearCredentials
} = require('./security/verify/store/credentialStore');
const {
  addRefreshToken,
  hasRefreshToken,
  removeRefreshToken,
  clearRefreshTokens
} = require('./security/tokens/store/refreshTokenStore');
const createJwtService = require('./security/tokens/jwtService');

const app = express();
const port = Number(process.env.PORT) || 3001;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST']
  }
});
const JWT_SECRET = 'access_secret';
const REFRESH_SECRET = 'refresh_secret';
const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BA8HaVqmKghQgcCb2IE21CmpbO9ANXUTsvF_wRPfCso4gHK8cylxNnU7SuDRhXDlvxaYg1o4dcFzUVmbwVepexQ';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'rfZIdsVkwOQ9xT_Ter3Yf5Ht_04sB-ZkNGiop1Ox6PU';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:student@example.com';
const jwtService = createJwtService({
  accessSecret: JWT_SECRET,
  refreshSecret: REFRESH_SECRET,
  accessExpiresIn: ACCESS_EXPIRES_IN,
  refreshExpiresIn: REFRESH_EXPIRES_IN
});
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${nanoid(10)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Только изображения разрешены'));
    }
    cb(null, true);
  }
});

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${res.statusCode} ${req.originalUrl}`);
  });
  next();
});

let users = [];
let subscriptions = [];
const reminders = new Map();
let products = [
  {
    id: nanoid(6),
    title: 'Капучино',
    category: 'Напитки',
    description: 'Классический капучино с нежной пенкой',
    price: 320,
    stock: 20,
    image: '/images/kapuchino.jpg'
  },
  {
    id: nanoid(6),
    title: 'Латте',
    category: 'Напитки',
    description: 'Нежный латте с бархатистой пенкой',
    price: 350,
    stock: 15,
    image: '/images/latte.jpg'
  },
  {
    id: nanoid(6),
    title: 'Эспрессо',
    category: 'Напитки',
    description: 'Крепкий эспрессо двойной порции',
    price: 250,
    stock: 30,
    image: '/images/aspreso.jpg'
  },
  {
    id: nanoid(6),
    title: 'Раф',
    category: 'Напитки',
    description: 'Раф кофейный с ванилью',
    price: 370,
    stock: 12,
    image: '/images/raf.jpg'
  },
  {
    id: nanoid(6),
    title: 'Круассан',
    category: 'Выпечка',
    description: 'Хрустящий французский круассан',
    price: 180,
    stock: 18,
    image: '/images/kruasan.jpg'
  },
  {
    id: nanoid(6),
    title: 'Чизкейк',
    category: 'Десерты',
    description: 'Нью-йоркский чизкейк классический',
    price: 450,
    stock: 8,
    image: '/images/chiskeyk.jpg'
  }
];

const ROLES = {
  USER: 'user',
  SELLER: 'seller',
  ADMIN: 'admin'
};

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Practice 7 API',
      version: '1.0.0',
      description: 'API для авторизации и управления товарами'
    },
    servers: [{ url: `http://localhost:${port}` }]
  },
  apis: [`${__filename}`]
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    isBlocked: Boolean(user.isBlocked)
  };
}

function findUserByEmail(email) {
  const userId = getUserIdByEmail(email);
  if (!userId) {
    return null;
  }

  return findUserById(userId);
}

function findUserById(id) {
  return users.find((user) => user.id === id);
}

function findProductById(id) {
  return products.find((product) => product.id === id);
}

function issueTokenPair(user) {
  const accessToken = jwtService.generateAccessToken(user);
  const refreshToken = jwtService.generateRefreshToken(user);

  addRefreshToken(refreshToken);

  return { accessToken, refreshToken };
}

function authMiddleware(req, res, next) {
  const token = jwtService.extractBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  try {
    const payload = jwtService.verifyAccessToken(token);
    const currentUser = findUserById(payload.sub);

    if (!currentUser) {
      return res.status(401).json({ error: 'user not found' });
    }

    if (currentUser.isBlocked) {
      return res.status(403).json({ error: 'user is blocked' });
    }

    req.user = {
      ...payload,
      role: currentUser.role
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
}

function deleteUploadedImage(imagePath) {
  if (!imagePath || !imagePath.startsWith('/uploads/')) {
    return;
  }

  const fullImagePath = path.join(__dirname, 'public', imagePath.replace(/^\//, ''));
  if (fs.existsSync(fullImagePath)) {
    fs.unlinkSync(fullImagePath);
  }
}

function buildProductPayload(body, imagePath) {
  const title = normalizeString(body.title);
  const category = normalizeString(body.category);
  const description = normalizeString(body.description);
  const price = Number(body.price);
  const stock = body.stock !== undefined ? Number(body.stock) : 0;

  if (!title || !category || !description) {
    return { error: 'title, category and description are required' };
  }

  if (Number.isNaN(price) || price <= 0) {
    return { error: 'price must be a positive number' };
  }

  if (!Number.isInteger(stock) || stock < 0) {
    return { error: 'stock must be a non-negative integer' };
  }

  return {
    payload: {
      title,
      category,
      description,
      price,
      stock,
      image: imagePath
    }
  };
}

function normalizeRole(role) {
  const normalizedRole = normalizeString(role).toLowerCase();
  const allowedRoles = Object.values(ROLES);
  return allowedRoles.includes(normalizedRole) ? normalizedRole : null;
}

async function createSeedUsers() {
  const seedUsers = [
    {
      id: 'seed-admin',
      email: 'admin@example.com',
      first_name: 'Admin',
      last_name: 'User',
      password: 'admin123',
      role: ROLES.ADMIN
    },
    {
      id: 'seed-seller',
      email: 'seller@example.com',
      first_name: 'Seller',
      last_name: 'User',
      password: 'seller123',
      role: ROLES.SELLER
    },
    {
      id: 'seed-user',
      email: 'user@example.com',
      first_name: 'Regular',
      last_name: 'User',
      password: 'user123',
      role: ROLES.USER
    }
  ];

  clearCredentials();
  clearPasswordHashes();
  clearRefreshTokens();

  users = await Promise.all(
    seedUsers.map(async (user) => {
      const id = user.id || nanoid(8);
      const passwordHash = await hashPassword(user.password);

      setCredential(user.email, id);
      setPasswordHash(id, passwordHash);

      return {
        id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        isBlocked: false
      };
    })
  );
}

/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - first_name
 *         - last_name
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           example: ivan@example.com
 *         first_name:
 *           type: string
 *           example: Иван
 *         last_name:
 *           type: string
 *           example: Иванов
 *         password:
 *           type: string
 *           example: qwerty123
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           example: ivan@example.com
 *         password:
 *           type: string
 *           example: qwerty123
 *     UpdateUserRequest:
 *       type: object
 *       required:
 *         - email
 *         - first_name
 *         - last_name
 *         - role
 *       properties:
 *         email:
 *           type: string
 *           example: ivan@example.com
 *         first_name:
 *           type: string
 *           example: Иван
 *         last_name:
 *           type: string
 *           example: Иванов
 *         role:
 *           type: string
 *           enum: [user, seller, admin]
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         email:
 *           type: string
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *         role:
 *           type: string
 *           enum: [user, seller, admin]
 *         isBlocked:
 *           type: boolean
 *     LoginResponse:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *         refreshToken:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 *     RefreshResponse:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *         refreshToken:
 *           type: string
 *     Product:
 *       type: object
 *       required:
 *         - id
 *         - title
 *         - category
 *         - description
 *         - price
 *       properties:
 *         id:
 *           type: string
 *           example: abc123
 *         title:
 *           type: string
 *           example: Капучино
 *         category:
 *           type: string
 *           example: Напитки
 *         description:
 *           type: string
 *           example: Классический капучино
 *         price:
 *           type: number
 *           example: 320
 *         stock:
 *           type: integer
 *           example: 20
 *         image:
 *           type: string
 *           example: /uploads/image.jpg
 */

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Регистрация пользователя
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Пользователь создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Некорректные данные
 *       409:
 *         description: Пользователь уже существует
 */
app.post('/api/auth/register', async (req, res, next) => {
  try {
    const email = normalizeString(req.body.email).toLowerCase();
    const firstName = normalizeString(req.body.first_name);
    const lastName = normalizeString(req.body.last_name);
    const password = normalizeString(req.body.password);
    const requestedRole = normalizeRole(req.body.role);
    const role = requestedRole === ROLES.SELLER ? ROLES.SELLER : ROLES.USER;

    if (!email || !firstName || !lastName || !password) {
      return res.status(400).json({ error: 'email, first_name, last_name and password are required' });
    }

    if (findUserByEmail(email)) {
      return res.status(409).json({ error: 'user already exists' });
    }

    const newUser = {
      id: nanoid(8),
      email,
      first_name: firstName,
      last_name: lastName,
      role,
      isBlocked: false
    };

    const passwordHash = await hashPassword(password);
    setCredential(email, newUser.id);
    setPasswordHash(newUser.id, passwordHash);

    users.push(newUser);
    res.status(201).json(sanitizeUser(newUser));
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Успешная авторизация
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Некорректные данные
 *       401:
 *         description: Неверный пароль
 *       404:
 *         description: Пользователь не найден
 */
app.post('/api/auth/login', async (req, res, next) => {
  try {
    const email = normalizeString(req.body.email).toLowerCase();
    const password = normalizeString(req.body.password);

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'user not found' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'Вы заблокированы' });
    }

    const passwordHash = getPasswordHash(user.id);
    if (!passwordHash) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const isAuthenticated = await verifyPassword(password, passwordHash);
    if (!isAuthenticated) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const tokens = issueTokenPair(user);

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     summary: Обновить пару токенов
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Новая пара токенов
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshResponse'
 *       400:
 *         description: Refresh-токен не передан
 *       401:
 *         description: Refresh-токен невалиден или истёк
 *       404:
 *         description: Пользователь не найден
 */
app.post('/api/auth/refresh', (req, res) => {
  const refreshToken = jwtService.extractBearerToken(req.headers.authorization);

  if (!refreshToken) {
    return res.status(400).json({ error: 'Missing or invalid Authorization header' });
  }

  if (!hasRefreshToken(refreshToken)) {
    return res.status(401).json({ error: 'invalid refresh token' });
  }

  try {
    const payload = jwtService.verifyRefreshToken(refreshToken);
    const user = users.find((item) => item.id === payload.sub);

    if (!user) {
      removeRefreshToken(refreshToken);
      return res.status(404).json({ error: 'user not found' });
    }

    removeRefreshToken(refreshToken);
    const nextTokens = issueTokenPair(user);

    res.json(nextTokens);
  } catch (error) {
    removeRefreshToken(refreshToken);
    return res.status(401).json({ error: 'invalid or expired refresh token' });
  }
});

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Получить текущего пользователя
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Текущий пользователь
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Токен отсутствует или невалиден
 *       404:
 *         description: Пользователь не найден
 */
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = users.find((item) => item.id === req.user.sub);
  if (!user) {
    return res.status(404).json({ error: 'user not found' });
  }

  res.json(sanitizeUser(user));
});

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Получить список пользователей
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список пользователей
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Токен отсутствует или невалиден
 *       403:
 *         description: Недостаточно прав
 */
app.get('/api/users', authMiddleware, roleMiddleware([ROLES.ADMIN]), (req, res) => {
  res.json(users.map(sanitizeUser));
});

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     summary: Получить пользователя по id
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Пользователь найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Токен отсутствует или невалиден
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Пользователь не найден
 */
app.get('/api/users/:id', authMiddleware, roleMiddleware([ROLES.ADMIN]), (req, res) => {
  const user = findUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'user not found' });
  }

  res.json(sanitizeUser(user));
});

/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     summary: Обновить пользователя
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: Пользователь обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Некорректные данные
 *       401:
 *         description: Токен отсутствует или невалиден
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Пользователь не найден
 *       409:
 *         description: Пользователь с таким email уже существует
 */
app.put('/api/users/:id', authMiddleware, roleMiddleware([ROLES.ADMIN]), (req, res) => {
  const user = findUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'user not found' });
  }

  const email = normalizeString(req.body.email).toLowerCase();
  const firstName = normalizeString(req.body.first_name);
  const lastName = normalizeString(req.body.last_name);
  const role = normalizeRole(req.body.role);

  if (!email || !firstName || !lastName || !role) {
    return res.status(400).json({ error: 'email, first_name, last_name and role are required' });
  }

  const existingUser = findUserByEmail(email);
  if (existingUser && existingUser.id !== user.id) {
    return res.status(409).json({ error: 'user already exists' });
  }

  updateCredential(user.email, email, user.id);
  user.email = email;
  user.first_name = firstName;
  user.last_name = lastName;
  user.role = role;

  res.json(sanitizeUser(user));
});

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     summary: Заблокировать пользователя
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Пользователь заблокирован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Нельзя заблокировать текущего администратора
 *       401:
 *         description: Токен отсутствует или невалиден
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Пользователь не найден
 */
app.delete('/api/users/:id', authMiddleware, roleMiddleware([ROLES.ADMIN]), (req, res) => {
  const user = findUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'user not found' });
  }

  if (user.id === req.user.sub) {
    return res.status(400).json({ error: 'cannot block current admin user' });
  }

  user.isBlocked = true;
  res.json(sanitizeUser(user));
});

app.patch('/api/users/:id/block', authMiddleware, roleMiddleware([ROLES.ADMIN]), (req, res) => {
  const user = findUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'user not found' });
  }

  if (user.id === req.user.sub) {
    return res.status(400).json({ error: 'cannot change current admin user status' });
  }

  if (typeof req.body?.isBlocked !== 'boolean') {
    return res.status(400).json({ error: 'isBlocked must be boolean' });
  }

  user.isBlocked = req.body.isBlocked;
  res.json(sanitizeUser(user));
});

/**
 * @openapi
 * /api/products:
 *   get:
 *     summary: Получить список товаров
 *     tags:
 *       - Products
 *     responses:
 *       200:
 *         description: Список товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get('/api/products', authMiddleware, roleMiddleware([ROLES.USER, ROLES.SELLER, ROLES.ADMIN]), (req, res) => {
  res.json(products);
});

/**
 * @openapi
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по id
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Товар найден
 *       404:
 *         description: Товар не найден
 */
app.get('/api/products/:id', authMiddleware, roleMiddleware([ROLES.USER, ROLES.SELLER, ROLES.ADMIN]), (req, res) => {
  const product = findProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'product not found' });
  }

  res.json(product);
});

/**
 * @openapi
 * /api/products:
 *   post:
 *     summary: Создать товар
 *     tags:
 *       - Products
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - description
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Товар создан
 *       400:
 *         description: Некорректные данные
 */
app.post('/api/products', authMiddleware, roleMiddleware([ROLES.SELLER, ROLES.ADMIN]), upload.single('image'), (req, res) => {
  const imagePath = req.file ? `/uploads/${req.file.filename}` : undefined;
  const result = buildProductPayload(req.body, imagePath);

  if (result.error) {
    deleteUploadedImage(imagePath);
    return res.status(400).json({ error: result.error });
  }

  const newProduct = {
    id: nanoid(6),
    ...result.payload
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

/**
 * @openapi
 * /api/products/{id}:
 *   put:
 *     summary: Обновить параметры товара
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - description
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Товар обновлён
 *       400:
 *         description: Некорректные данные
 *       404:
 *         description: Товар не найден
 */
app.put('/api/products/:id', authMiddleware, roleMiddleware([ROLES.SELLER, ROLES.ADMIN]), upload.single('image'), (req, res) => {
  const product = findProductById(req.params.id);
  if (!product) {
    if (req.file) {
      deleteUploadedImage(`/uploads/${req.file.filename}`);
    }
    return res.status(404).json({ error: 'product not found' });
  }

  const imagePath = req.file ? `/uploads/${req.file.filename}` : product.image;
  const result = buildProductPayload(req.body, imagePath);

  if (result.error) {
    if (req.file) {
      deleteUploadedImage(imagePath);
    }
    return res.status(400).json({ error: result.error });
  }

  if (req.file && product.image !== imagePath) {
    deleteUploadedImage(product.image);
  }

  Object.assign(product, result.payload);
  res.json(product);
});

/**
 * @openapi
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Товар удалён
 *       404:
 *         description: Товар не найден
 */
app.delete('/api/products/:id', authMiddleware, roleMiddleware([ROLES.ADMIN]), (req, res) => {
  const index = products.findIndex((product) => product.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'product not found' });
  }

  deleteUploadedImage(products[index].image);
  products.splice(index, 1);
  res.status(204).send();
});

app.get('/api/push/public-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

const sendPushToAll = async (payload) => {
  const settled = await Promise.allSettled(
    subscriptions.map((subscription) => webpush.sendNotification(subscription, payload))
  );

  const invalidEndpoints = settled
    .map((result, index) => ({ result, endpoint: subscriptions[index]?.endpoint }))
    .filter(({ result }) => result.status === 'rejected' && result.reason?.statusCode === 410)
    .map(({ endpoint }) => endpoint)
    .filter(Boolean);

  if (invalidEndpoints.length) {
    subscriptions = subscriptions.filter((sub) => !invalidEndpoints.includes(sub.endpoint));
  }
};

app.post('/subscribe', (req, res) => {
  const subscription = req.body;
  if (!subscription?.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription' });
  }

  const exists = subscriptions.some((item) => item.endpoint === subscription.endpoint);
  if (!exists) {
    subscriptions.push(subscription);
  }

  res.status(201).json({ message: 'Подписка сохранена' });
});

app.post('/unsubscribe', (req, res) => {
  const { endpoint } = req.body || {};
  if (!endpoint) {
    return res.status(400).json({ error: 'endpoint is required' });
  }

  subscriptions = subscriptions.filter((item) => item.endpoint !== endpoint);
  res.status(200).json({ message: 'Подписка удалена' });
});

app.post('/snooze', (req, res) => {
  const reminderId = Number.parseInt(req.query.reminderId, 10);
  if (!Number.isFinite(reminderId) || !reminders.has(reminderId)) {
    return res.status(404).json({ error: 'Reminder not found' });
  }

  const reminder = reminders.get(reminderId);
  clearTimeout(reminder.timeoutId);

  const newDelay = 5 * 60 * 1000;
  const newTimeoutId = setTimeout(async () => {
    const payload = JSON.stringify({
      title: 'Напоминание отложено',
      body: reminder.text,
      reminderId
    });

    try {
      await sendPushToAll(payload);
    } catch (error) {
      console.error('Push error:', error);
    } finally {
      reminders.delete(reminderId);
    }
  }, newDelay);

  reminders.set(reminderId, {
    timeoutId: newTimeoutId,
    text: reminder.text,
    reminderTime: Date.now() + newDelay
  });

  return res.status(200).json({ message: 'Reminder snoozed for 5 minutes' });
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }

  if (err.message === 'Только изображения разрешены') {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: 'Internal server error' });
});

createSeedUsers()
  .then(() => {
    io.on('connection', (socket) => {
      console.log('WebSocket client connected:', socket.id);

      socket.on('newTask', async (task) => {
        io.emit('taskAdded', task);

        const payload = JSON.stringify({
          title: 'Новая задача',
          body: task?.text || 'Добавлена новая задача'
        });

        await sendPushToAll(payload);
      });

      socket.on('newReminder', (reminder) => {
        const { id, text, reminderTime } = reminder || {};
        const reminderId = Number.parseInt(id, 10);
        const reminderTimestamp = Number.parseInt(reminderTime, 10);
        const delay = reminderTimestamp - Date.now();

        if (!Number.isFinite(reminderId) || !Number.isFinite(reminderTimestamp) || delay <= 0 || !text) {
          return;
        }

        const existing = reminders.get(reminderId);
        if (existing) {
          clearTimeout(existing.timeoutId);
        }

        const timeoutId = setTimeout(async () => {
          const payload = JSON.stringify({
            title: 'Напоминание',
            body: text,
            reminderId
          });

          try {
            await sendPushToAll(payload);
          } catch (error) {
            console.error('Push error:', error);
          } finally {
            reminders.delete(reminderId);
          }
        }, delay);

        reminders.set(reminderId, {
          timeoutId,
          text,
          reminderTime: reminderTimestamp
        });
      });

      socket.on('disconnect', () => {
        console.log('WebSocket client disconnected:', socket.id);
      });
    });

    server.listen(port, () => {
      console.log(`Сервер запущен: http://localhost:${port}`);
      console.log(`Swagger: http://localhost:${port}/api-docs`);
      console.log('Тестовые аккаунты: admin@example.com/admin123, seller@example.com/seller123, user@example.com/user123');
      console.log('VAPID public key:', VAPID_PUBLIC_KEY);
    });
  })
  .catch((error) => {
    console.error('Не удалось инициализировать пользователей', error);
    process.exit(1);
  });
