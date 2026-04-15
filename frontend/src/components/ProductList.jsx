import ProductItem from './ProductItem';

export default function ProductList({
  products,
  cartItemsMap,
  onAddToCart,
  onRemoveFromCart,
  onEdit,
  onDelete,
  onView,
  canAddToCart,
  canManageProducts,
  canDeleteProducts
}) {
  if (!products.length) {
    return <p className="empty-text">Товары не найдены</p>;
  }

  return (
    <div className="product-grid">
      {products.map(product => (
        <ProductItem
          key={product.id}
          product={product}
          cartQuantity={cartItemsMap?.[product.id] || 0}
          onAddToCart={onAddToCart}
          onRemoveFromCart={onRemoveFromCart}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          canAddToCart={canAddToCart}
          canManageProducts={canManageProducts}
          canDeleteProducts={canDeleteProducts}
        />
      ))}
    </div>
  );
}

