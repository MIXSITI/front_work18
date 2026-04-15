import { useEffect, useState } from 'react';
import { getUsers, setUserBlocked, updateUser } from '../api/api';

const EMPTY_FORM = {
  id: '',
  email: '',
  first_name: '',
  last_name: '',
  role: 'user'
};

export default function UserManagement({ currentUser, onCurrentUserChange }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingUserId, setEditingUserId] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);

  const loadUsers = async () => {
    setLoading(true);

    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      alert(error.message || 'Не удалось загрузить пользователей');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const startEdit = (user) => {
    setEditingUserId(user.id);
    setForm({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role
    });
  };

  const cancelEdit = () => {
    setEditingUserId('');
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const updatedUser = await updateUser(form.id, {
        email: form.email.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        role: form.role
      });

      setUsers((prev) => prev.map((user) => (user.id === updatedUser.id ? updatedUser : user)));

      if (updatedUser.id === currentUser.id) {
        onCurrentUserChange(updatedUser);
      }

      cancelEdit();
    } catch (error) {
      alert(error.message || 'Не удалось сохранить пользователя');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBlocked = async (user) => {
    const nextBlocked = !user.isBlocked;
    const actionText = nextBlocked ? 'Заблокировать' : 'Разблокировать';
    if (!window.confirm(`${actionText} пользователя ${user.email}?`)) {
      return;
    }

    try {
      const updatedUser = await setUserBlocked(user.id, nextBlocked);
      setUsers((prev) => prev.map((item) => (item.id === updatedUser.id ? updatedUser : item)));
    } catch (error) {
      alert(error.message || 'Не удалось изменить статус пользователя');
    }
  };

  return (
    <section className="users-panel">
      <div className="section-header">
        <h2>Пользователи</h2>
      </div>

      <div className="users-table">
        {users.map((user) => {
          const isEditing = editingUserId === user.id;

          return (
            <div className="user-card" key={user.id}>
              {isEditing ? (
                <>
                  <input
                    value={form.first_name}
                    onChange={(event) => setForm({ ...form, first_name: event.target.value })}
                    placeholder="Имя"
                  />
                  <input
                    value={form.last_name}
                    onChange={(event) => setForm({ ...form, last_name: event.target.value })}
                    placeholder="Фамилия"
                  />
                  <input
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    placeholder="Email"
                    type="email"
                  />
                  <select
                    value={form.role}
                    onChange={(event) => setForm({ ...form, role: event.target.value })}
                  >
                    <option value="user">user</option>
                    <option value="seller">seller</option>
                    <option value="admin">admin</option>
                  </select>
                  <div className="user-card__actions">
                    <button className="btn edit" onClick={handleSave} disabled={saving}>
                      {saving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                    <button className="btn view" onClick={cancelEdit}>
                      Отмена
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>Имя:</strong> {user.first_name} {user.last_name}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Роль:</strong> {user.role}</p>
                  <p><strong>Статус:</strong> {user.isBlocked ? 'Заблокирован' : 'Активен'}</p>
                  <div className="user-card__actions">
                    <button className="btn edit" onClick={() => startEdit(user)} disabled={user.isBlocked}>
                      Редактировать
                    </button>
                    {user.role !== 'admin' ? (
                      <button
                        className="btn delete"
                        onClick={() => handleToggleBlocked(user)}
                        disabled={user.id === currentUser.id}
                      >
                        {user.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                      </button>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
