import { motion } from 'framer-motion';
import { Lock, Mail, User, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';

export default function Register({ onLogin }) {
  const [searchParams] = useSearchParams();
  const inviteEmail = searchParams.get('email') || '';
  const squadInvite = searchParams.get('squad_invite') || '';
  
  const [form, setForm] = useState({ name: '', email: inviteEmail, password: '' });
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    try {
      setError('');
      const userData = await api('/auth/register', { method: 'POST', body: JSON.stringify(form) });
      
      // Store token immediately so subsequent api calls work
      localStorage.setItem('auth', JSON.stringify(userData));
      
      if (squadInvite) {
        try {
          await api(`/squads/${squadInvite}/respond`, { method: 'POST', body: JSON.stringify({ status: 'accepted' }) });
        } catch (e) {
          console.error("Failed to auto-accept squad invite", e);
        }
      }
      
      onLogin(userData);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="auth-screen">
      <motion.div className="auth-panel" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}>
        <div className="glow-blue" style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--gradient-blue)', display: 'grid', placeItems: 'center', marginBottom: '16px' }}>
          <UserPlus size={24} style={{ color: 'white' }} />
        </div>
        <h1>Create Account</h1>
        <p>Save tickets, book faster, and unlock premium offers</p>
        <form onSubmit={submit}>
          <label>Name<div className="input-wrap"><User size={17} /><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div></label>
          <label>Email<div className="input-wrap"><Mail size={17} /><input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div></label>
          <label>Password<div className="input-wrap"><Lock size={17} /><input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></div></label>
          <button className="button primary" style={{ background: 'linear-gradient(135deg, #ff3d55, #ff6b3d)', border: 'none', color: 'white', marginTop: '12px', padding: '14px', borderRadius: '12px', fontWeight: 'bold' }}>Register</button>
        </form>
        {error && <div className="alert">{error}</div>}
        <p className="muted">Already registered? <Link to="/login">Login</Link></p>
      </motion.div>
    </section>
  );
}
