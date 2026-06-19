import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: 'user@example.com', password: 'user123' });
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    try {
      setError('');
      onLogin(await api('/auth/login', { method: 'POST', body: JSON.stringify(form) }));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="auth-panel">
      <h1>Login</h1>
      <form onSubmit={submit}>
        <label>Email<input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
        <label>Password<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
        <button className="button primary">Login</button>
      </form>
      {error && <div className="alert">{error}</div>}
      <p className="muted">New here? <Link to="/register">Create an account</Link></p>
    </section>
  );
}
