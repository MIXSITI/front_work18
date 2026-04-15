import axios from 'axios';

const API_HOST = 'http://localhost:3001';
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

let onUnauthorized = () => {};
let refreshRequest = null;

const apiClient = axios.create({
  baseURL: `${API_HOST}/api`,
  headers: {
    Accept: 'application/json'
  }
});

function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function storeTokens(accessToken, refreshToken) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function hasStoredTokens() {
  return Boolean(getAccessToken() && getRefreshToken());
}

export function setUnauthorizedHandler(handler) {
  onUnauthorized = typeof handler === 'function' ? handler : () => {};
}

function getErrorMessage(error, fallbackMessage) {
  return error.response?.data?.error || error.message || fallbackMessage;
}

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (!originalRequest || status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/register') || originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!getAccessToken() || !refreshToken) {
      clearTokens();
      onUnauthorized();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshRequest) {
        refreshRequest = axios.post(
          `${API_HOST}/api/auth/refresh`,
          null,
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`
            }
          }
        );
      }

      const response = await refreshRequest;
      const { accessToken, refreshToken: nextRefreshToken } = response.data;
      storeTokens(accessToken, nextRefreshToken);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      return apiClient(originalRequest);
    } catch (refreshError) {
      clearTokens();
      onUnauthorized();
      return Promise.reject(refreshError);
    } finally {
      refreshRequest = null;
    }
  }
);

export async function registerUser(payload) {
  try {
    const response = await apiClient.post('/auth/register', payload);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Не удалось зарегистрироваться'));
  }
}

export async function loginUser(payload) {
  try {
    const response = await apiClient.post('/auth/login', payload);
    const { accessToken, refreshToken, user } = response.data;
    storeTokens(accessToken, refreshToken);
    return user;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Не удалось выполнить вход'));
  }
}

export async function getCurrentUser() {
  try {
    const response = await apiClient.get('/auth/me');
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Не удалось получить данные пользователя'));
  }
}

export async function getProducts() {
  try {
    const response = await apiClient.get('/products');
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Не удалось загрузить список товаров'));
  }
}

export async function getProductById(id) {
  try {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Не удалось загрузить товар'));
  }
}

export async function createProduct(data) {
  try {
    const response = await apiClient.post('/products', data);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Не удалось создать товар'));
  }
}

export async function updateProduct(id, data) {
  try {
    const response = await apiClient.put(`/products/${id}`, data);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Не удалось обновить товар'));
  }
}

export async function deleteProduct(id) {
  try {
    await apiClient.delete(`/products/${id}`);
    return true;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Не удалось удалить товар'));
  }
}

export async function getUsers() {
  try {
    const response = await apiClient.get('/users');
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Не удалось загрузить пользователей'));
  }
}

export async function updateUser(id, payload) {
  try {
    const response = await apiClient.put(`/users/${id}`, payload);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Не удалось обновить пользователя'));
  }
}

export async function blockUser(id) {
  try {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Не удалось заблокировать пользователя'));
  }
}

export async function setUserBlocked(id, isBlocked) {
  try {
    const response = await apiClient.patch(`/users/${id}/block`, { isBlocked });
    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        isBlocked ? 'Не удалось заблокировать пользователя' : 'Не удалось разблокировать пользователя'
      )
    );
  }
}

export { API_HOST };

