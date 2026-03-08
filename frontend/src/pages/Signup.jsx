import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Signup() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post('http://localhost:5000/api/auth/register', formData);
      alert('Wallet created successfully! Please log in.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong during signup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen font-sans bg-neutral-950 text-neutral-200 selection:bg-neutral-700">
      <div className="w-full max-w-md p-10 bg-neutral-900 border shadow-2xl md:p-12 rounded-2xl border-neutral-800">
        
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-light tracking-tighter text-white">Create Wallet</h2>
          <p className="mt-2 text-neutral-400">Track your ESI & EPF benefits.</p>
        </div>
        
        {error && <div className="p-4 mb-6 text-sm border rounded-lg text-red-400 bg-red-950/30 border-red-900/50">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 text-xs font-medium tracking-widest uppercase text-neutral-500">Full Name</label>
            <input 
              type="text" name="name" required value={formData.name} onChange={handleChange}
              placeholder="e.g. Rahul Kumar"
              className="w-full px-0 py-3 text-lg text-white bg-transparent border-b border-neutral-700 focus:outline-none focus:border-white placeholder-neutral-700 transition-colors"
            />
          </div>
          <div>
            <label className="block mb-2 text-xs font-medium tracking-widest uppercase text-neutral-500">Email Address</label>
            <input 
              type="email" name="email" required value={formData.email} onChange={handleChange}
              placeholder="rahul@example.com"
              className="w-full px-0 py-3 text-lg text-white bg-transparent border-b border-neutral-700 focus:outline-none focus:border-white placeholder-neutral-700 transition-colors"
            />
          </div>
          <div>
            <label className="block mb-2 text-xs font-medium tracking-widest uppercase text-neutral-500">Password</label>
            <input 
              type="password" name="password" required value={formData.password} onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-0 py-3 text-lg text-white bg-transparent border-b border-neutral-700 focus:outline-none focus:border-white placeholder-neutral-700 transition-colors"
            />
          </div>
          <button 
            type="submit" disabled={loading}
            className="w-full py-4 mt-6 text-lg font-medium text-neutral-950 transition-colors bg-white rounded-lg hover:bg-neutral-200 disabled:opacity-50"
          >
            {loading ? 'Provisioning...' : 'Initialize Wallet'}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-500">
            Already have a wallet? <Link to="/login" className="text-white transition-colors hover:text-neutral-300">Sign in here</Link>
          </p>
        </div>

      </div>
    </div>
  );
}