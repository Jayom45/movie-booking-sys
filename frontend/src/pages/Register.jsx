import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function Register({ onLogin }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    try {
      setError('');
      onLogin(await api('/auth/register', { method: 'POST', body: JSON.stringify(form) }));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="auth-panel">
      <h1>Create account</h1>
      <form onSubmit={submit}>
        <label>Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
        <label>Email<input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
        <label>Password<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
        <button className="button primary">Register</button>
      </form>
      {error && <div className="alert">{error}</div>}
      <p className="muted">Already registered? <Link to="/login">Login</Link></p>
    </section>
  );
}
