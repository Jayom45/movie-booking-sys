import { motion } from 'framer-motion';
import { Lock, Mail, Ticket } from 'lucide-react';
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
    <section className="auth-screen">
      <motion.div className="auth-panel" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}>
        <span className="premium-label"><Ticket size={14} /> Member access</span>
        <h1>Welcome back</h1>
        <p>Sign in to continue booking premium movie experiences.</p>
        <form onSubmit={submit}>
          <label>Email<div className="input-wrap"><Mail size={17} /><input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div></label>
          <label>Password<div className="input-wrap"><Lock size={17} /><input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></div></label>
          <button className="button primary">Login</button>
        </form>
        {error && <div className="alert">{error}</div>}
        <p className="muted">New here? <Link to="/register">Create an account</Link></p>
      </motion.div>
    </section>
  );
}
