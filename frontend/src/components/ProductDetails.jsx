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

export default function ProductDetails({ product, canShowProductId = true, onClose }) {
  if (!product) {
    return (
      <div className="details-card details-card--empty">
        Нажмите "Подробнее" в карточке товара.
      </div>
    );
  }

  const imageSrc = getProductImageSrc(product);

  return (
    <div className="details-card">
      <div className="details-card__header">
        <h3>Информация о товаре</h3>
        <button type="button" className="btn view" onClick={onClose}>
          Закрыть
        </button>
      </div>
      {canShowProductId ? <p><strong>ID:</strong> {product.id}</p> : null}
      <p><strong>Название:</strong> {product.title}</p>
      <p><strong>Категория:</strong> {product.category}</p>
      <p><strong>Описание:</strong> {product.description}</p>
      <p><strong>Цена:</strong> {product.price} ₽</p>
      <p><strong>Остаток:</strong> {product.stock} шт.</p>

      <img
        className="details-image"
        src={imageSrc}
        alt={product.title}
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = getFallbackImageSrc(product);
        }}
      />
    </div>
  );
}
