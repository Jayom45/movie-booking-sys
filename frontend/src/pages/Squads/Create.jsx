import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../../api.js';

export default function SquadCreate({ cities }) {
  const [form, setForm] = useState({ name: '', city: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.city) {
      setError('Please fill out all fields.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const squad = await api('/squads', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      navigate(`/squads/${squad._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '100px auto', padding: '0 20px' }}>
      <motion.div className="glass-panel" style={{ padding: '40px' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Create a Squad</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '32px' }}>Give your group a name and pick the city you want to watch in.</p>
        
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
          <label>
            Squad Name
            <div className="input-wrap">
              <input 
                placeholder="e.g. Avengers Weekend" 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
              />
            </div>
          </label>
          
          <label>
            City
            <div className="input-wrap">
              <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} style={{ width: '100%', background: 'transparent', color: 'white', border: 'none', outline: 'none' }}>
                <option value="" style={{ color: 'black' }}>Select City</option>
                {cities.map(c => <option key={c} value={c} style={{ color: 'black' }}>{c}</option>)}
              </select>
            </div>
          </label>

          {error && <div className="alert">{error}</div>}

          <button type="submit" className="button primary" disabled={loading} style={{ marginTop: '16px', padding: '14px', fontSize: '1.1rem' }}>
            {loading ? 'Creating...' : 'Create Squad'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
