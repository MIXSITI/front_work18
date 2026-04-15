import { API_HOST } from '../api/api';

function getFallbackImageSrc(product) {
  const title = product.title || 'Product';
  const category = product.category || 'Menu item';

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#8b5a2b"/>
          <stop offset="100%" stop-color="#f0c27b"/>
        </linearGradient>
      </defs>
      <rect width="600" height="400" fill="url(#bg)"/>
      <circle cx="300" cy="145" r="78" fill="#fff4e8" opacity="0.92"/>
      <rect x="220" y="205" width="160" height="18" rx="9" fill="#fff4e8" opacity="0.92"/>
      <text x="300" y="308" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#ffffff">${title}</text>
      <text x="300" y="346" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#fff4e8">${category}</text>
    </svg>`
  )}`;
}

function getProductImageSrc(product) {
  if (product.image) {
    if (product.image.startsWith('http')) {
      return product.image;
    }

    if (product.image.startsWith('/uploads/')) {
      return `${API_HOST}${product.image}`;
    }

    return product.image;
  }

  return getFallbackImageSrc(product);
}

export default function ProductItem({
  product,
  cartQuantity,
  onAddToCart,
  onRemoveFromCart,
  onEdit,
  onDelete,
  onView,
  canAddToCart,
  canManageProducts,
  canDeleteProducts
}) {
  if (!product) return <div>Ошибка загрузки товара</div>;

  const imageSrc = getProductImageSrc(product);
  const isInCart = cartQuantity > 0;

  return (
    <div className="menu-card">
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={product.title}
          className="product-image"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = getFallbackImageSrc(product);
          }}
        />
      ) : (
        <div className="product-image product-image--placeholder">
          Нет фото
        </div>
      )}

      <h3>{product.title}</h3>
      <p>{product.description}</p>
      <p><strong>Цена:</strong> {product.price} ₽</p>

      <div className="menu-card__actions">
        <button className="btn view" onClick={() => onView(product.id)}>
          Подробнее
        </button>
        {canAddToCart ? (
          <div className="menu-card__cart">
            <button className={`btn cart ${isInCart ? 'active' : ''}`} onClick={() => onAddToCart(product)}>
              {isInCart ? 'В корзине' : 'В корзину'}
            </button>
            {isInCart ? <span className="menu-card__cart-count">Количество: {cartQuantity}</span> : null}
            {isInCart ? (
              <button className="btn cart-remove" onClick={() => onRemoveFromCart(product.id)}>
                Убрать
              </button>
            ) : null}
          </div>
        ) : null}
        {canManageProducts ? (
          <button className="btn edit" onClick={() => onEdit(product)}>
            Редактировать
          </button>
        ) : null}
        {canDeleteProducts ? (
          <button className="btn delete" onClick={() => onDelete(product.id)}>
            Удалить
          </button>
        ) : null}
      </div>
    </div>
  );
}


