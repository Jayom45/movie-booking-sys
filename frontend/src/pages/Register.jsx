import { motion } from 'framer-motion';
import { Lock, Mail, User, UserPlus } from 'lucide-react';
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
    <section className="auth-screen">
      <motion.div className="auth-panel" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}>
        <span className="premium-label"><UserPlus size={14} /> Join CineBook</span>
        <h1>Create account</h1>
        <p>Save tickets, book faster, and unlock premium offers.</p>
        <form onSubmit={submit}>
          <label>Name<div className="input-wrap"><User size={17} /><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div></label>
          <label>Email<div className="input-wrap"><Mail size={17} /><input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div></label>
          <label>Password<div className="input-wrap"><Lock size={17} /><input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></div></label>
          <button className="button primary">Register</button>
        </form>
        {error && <div className="alert">{error}</div>}
        <p className="muted">Already registered? <Link to="/login">Login</Link></p>
      </motion.div>
    </section>
  );
}
