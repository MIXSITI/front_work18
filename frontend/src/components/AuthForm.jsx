import { useEffect, useState } from 'react';

const initialForm = {
  email: '',
  password: '',
  first_name: '',
  last_name: ''
};

export default function AuthForm({ mode, onSubmit, loading, errorMessage = '' }) {
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    setForm(initialForm);
  }, [mode]);

  const isRegister = mode === 'register';

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit({
      email: form.email.trim(),
      password: form.password.trim(),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      role: 'user'
    });
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>{isRegister ? 'Регистрация' : 'Вход'}</h2>

      {isRegister ? (
        <>
          <input
            type="text"
            placeholder="Имя"
            value={form.first_name}
            onChange={(event) => setForm({ ...form, first_name: event.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Фамилия"
            value={form.last_name}
            onChange={(event) => setForm({ ...form, last_name: event.target.value })}
            required
          />
        </>
      ) : null}

      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(event) => setForm({ ...form, email: event.target.value })}
        required
      />
      <input
        type="password"
        placeholder="Пароль"
        value={form.password}
        onChange={(event) => setForm({ ...form, password: event.target.value })}
        minLength="6"
        required
      />

      <button type="submit" className="btn btn-add" disabled={loading}>
        {loading ? 'Подождите...' : isRegister ? 'Создать аккаунт' : 'Войти'}
      </button>

      {errorMessage ? <div className="auth-error">{errorMessage}</div> : null}
    </form>
  );
}
