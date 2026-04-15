import { useEffect, useMemo, useState } from 'react';
import AuthForm from './components/AuthForm';
import AppShellNotes from './components/AppShellNotes';
import ProductDetails from './components/ProductDetails';
import ProductList from './components/ProductList';
import ProductModal from './components/ProductModal';
import UserManagement from './components/UserManagement';
import {
  clearTokens,
  deleteProduct,
  getCurrentUser,
  getProductById,
  getProducts,
  hasStoredTokens,
  loginUser,
  registerUser,
  setUnauthorizedHandler
} from './api/api';
import './styles/main.scss';

const CART_STORAGE_KEY = 'cartItems';

function App() {
  const [products, setProducts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('все');
  const [authMode, setAuthMode] = useState('login');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [detailId, setDetailId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  const canViewProducts = Boolean(user);
  const canManageProducts = user?.role === 'seller' || user?.role === 'admin';
  const canDeleteProducts = user?.role === 'admin';
  const canManageUsers = user?.role === 'admin';
  const canLookupProductById = user?.role !== 'user';
  const canAddToCart = user?.role === 'user';
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartItemsMap = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      acc[item.id] = item.quantity;
      return acc;
    }, {});
  }, [cartItems]);

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      alert(error.message || 'Не удалось загрузить товары');
    }
  };

  const handleLogout = () => {
    clearTokens();
    setUser(null);
    setAuthError('');
    setProducts([]);
    setCartItems([]);
    setSelectedProduct(null);
    setDetailId('');
    setAuthMode('login');
  };

  useEffect(() => {
    setUnauthorizedHandler(handleLogout);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      if (!hasStoredTokens()) {
        setAuthLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        clearTokens();
      } finally {
        setAuthLoading(false);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (canViewProducts) {
      loadProducts();
    }
  }, [canViewProducts]);

  useEffect(() => {
    if (user?.role === 'user') {
      try {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        setCartItems(savedCart ? JSON.parse(savedCart) : []);
      } catch (error) {
        setCartItems([]);
      }
    } else {
      setCartItems([]);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'user') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    }
  }, [cartItems, user]);

  useEffect(() => {
    setAuthError('');
  }, [authMode]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = searchTerm
        ? product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description.toLowerCase().includes(searchTerm.toLowerCase())
        : true;

      const matchesCategory = selectedCategory === 'все' || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const categories = useMemo(() => {
    return ['все', ...new Set(products.map((product) => product.category))];
  }, [products]);

  const openModal = (product = null) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить позицию из меню?')) {
      return;
    }

    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((product) => product.id !== id));
      if (selectedProduct?.id === id) {
        setSelectedProduct(null);
      }
    } catch (error) {
      alert(error.message || 'Не удалось удалить товар');
    }
  };

  const handleAuthSubmit = async (payload) => {
    setFormLoading(true);
    setAuthError('');

    try {
      if (authMode === 'register') {
        await registerUser(payload);
      }

      const currentUser = await loginUser({
        email: payload.email,
        password: payload.password
      });

      setUser(currentUser);
    } catch (error) {
      const message = error.message || 'Ошибка авторизации';

      if (authMode === 'login') {
        if (message === 'Вы заблокированы') {
          setAuthError('Вы заблокированы');
        } else {
          setAuthError('Проверьте Email и пароль');
        }
      } else {
        setAuthError(message);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleLoadProduct = async (id) => {
    if (!id.trim()) {
      alert('Введите id товара');
      return;
    }

    setDetailLoading(true);

    try {
      const product = await getProductById(id.trim());
      setSelectedProduct(product);
      setDetailId(product.id);
    } catch (error) {
      alert(error.message || 'Не удалось загрузить товар');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);

      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [
        ...prev,
        {
          id: product.id,
          title: product.title,
          price: product.price,
          quantity: 1
        }
      ];
    });
  };

  const handleRemoveFromCart = (productId) => {
    setCartItems((prev) =>
      prev.flatMap((item) => {
        if (item.id !== productId) {
          return [item];
        }

        if (item.quantity <= 1) {
          return [];
        }

        return [{ ...item, quantity: item.quantity - 1 }];
      })
    );
  };

  if (authLoading) {
    return <div className="app-status">Проверка сессии...</div>;
  }

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>MIX Coffee</h1>
          <p>Авторизуйтесь, чтобы управлять товарами и работать с API.</p>
          <p>
            Тестовые аккаунты: admin@example.com / admin123, seller@example.com / seller123,
            user@example.com / user123
          </p>

          <div className="auth-tabs">
            <button
              className={`category-btn ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => setAuthMode('login')}
            >
              Вход
            </button>
            <button
              className={`category-btn ${authMode === 'register' ? 'active' : ''}`}
              onClick={() => setAuthMode('register')}
            >
              Регистрация
            </button>
          </div>

          <AuthForm
            mode={authMode}
            onSubmit={handleAuthSubmit}
            loading={formLoading}
            errorMessage={authError}
          />

          <AppShellNotes />
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="app-hero">
        <div className="app-title">
          <h1>MIX Coffee</h1>
        </div>

        <div className="app-topbar">
          <div className="app-topbar__account">
            <span>{user.first_name} {user.last_name}</span>
            {user.role !== 'user' ? (
              <>
                <span>{user.email}</span>
                <span>Роль: {user.role}</span>
              </>
            ) : null}
          </div>
          <button className="btn delete app-topbar__logout" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </div>

      <div className="controls">
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Поиск по названию или описанию..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="categories">
          {categories.map((category) => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {canAddToCart ? (
          <div className="cart-summary">
            <span>Корзина: {cartCount}</span>
          </div>
        ) : null}

        {canManageProducts ? (
          <div className="controls__add">
            <button className="btn btn-add controls__add-btn" onClick={() => openModal()}>
              + Добавить товар
            </button>
          </div>
        ) : null}

        {canLookupProductById ? (
          <div className="product-id-panel">
            <input
              type="text"
              placeholder="Введите id товара"
              value={detailId}
              onChange={(event) => setDetailId(event.target.value)}
            />
            <button className="btn view" onClick={() => handleLoadProduct(detailId)} disabled={detailLoading}>
              {detailLoading ? 'Загрузка...' : 'Получить по id'}
            </button>
          </div>
        ) : null}
      </div>

      <div className="content-layout">
        <ProductList
          products={filteredProducts}
          cartItemsMap={cartItemsMap}
          onAddToCart={handleAddToCart}
          onRemoveFromCart={handleRemoveFromCart}
          onEdit={openModal}
          onDelete={handleDelete}
          onView={handleLoadProduct}
          canAddToCart={canAddToCart}
          canManageProducts={canManageProducts}
          canDeleteProducts={canDeleteProducts}
        />

        <ProductDetails
          product={selectedProduct}
          canShowProductId={user?.role !== 'user'}
          onClose={() => setSelectedProduct(null)}
        />
      </div>

      {canManageUsers ? (
        <UserManagement currentUser={user} onCurrentUserChange={setUser} />
      ) : null}

      <AppShellNotes />

      <ProductModal
        open={modalOpen}
        product={editingProduct}
        onClose={closeModal}
        onSave={loadProducts}
      />
    </div>
  );
}

export default App;

