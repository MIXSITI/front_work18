import { useState, useEffect } from 'react';
import { createProduct, updateProduct } from '../api/api';

export default function ProductModal({ open, product, onClose, onSave }) {
  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    price: '',
    stock: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setForm({
        title: product.title || '',
        category: product.category || '',
        description: product.description || '',
        price: product.price || '',
        stock: product.stock || ''
      });
    } else {
      setForm({
        title: '',
        category: '',
        description: '',
        price: '',
        stock: ''
      });
    }
    setImageFile(null);
  }, [product, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const data = new FormData();
    data.append('title', form.title.trim());
    data.append('category', form.category.trim());
    data.append('description', form.description.trim());
    data.append('price', String(Number(form.price)));
    data.append('stock', String(Number(form.stock)));

    if (imageFile) {
      data.append('image', imageFile);
    }

    try {
      if (product) {
        await updateProduct(product.id, data);
      } else {
        await createProduct(data);
      }

      await onSave();
      onClose();
    } catch (err) {
      alert(err.message || 'Не удалось сохранить позицию');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{product ? 'Редактировать' : 'Новая позиция'}</h2>

        <form onSubmit={handleSubmit}>
          <input
            name="title"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="Название"
            required
          />

          <input
            name="category"
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
            placeholder="Категория"
            required
          />

          <textarea
            name="description"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Описание"
            required
          />

          <input
            type="number"
            name="price"
            value={form.price}
            onChange={e => setForm({ ...form, price: e.target.value })}
            placeholder="Цена"
            min="1"
            required
          />

          <input
            type="number"
            name="stock"
            value={form.stock}
            onChange={e => setForm({ ...form, stock: e.target.value })}
            placeholder="Остаток"
            min="0"
            required
          />

          <input
            type="file"
            accept="image/*"
            onChange={e => setImageFile(e.target.files[0] || null)}
          />

          <div className="modal-buttons">
            <button type="submit" className="btn btn-add" disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button type="button" className="btn delete" onClick={onClose}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

