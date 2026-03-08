import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
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
      const response = await axios.post('http://localhost:5000/api/auth/login', formData);
      const { token, role, name } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(response.data));

      if (role === 'ADMIN') {
        navigate('/admin-dashboard');
      } else if (role === 'WORKER') {
        navigate('/worker-dashboard');
      } else {
        setError('Unauthorized role.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen font-sans bg-neutral-950 text-neutral-200 selection:bg-neutral-700">
      <div className="w-full max-w-md p-10 bg-neutral-900 border shadow-2xl md:p-12 rounded-2xl border-neutral-800">
        
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-light tracking-tighter text-white">Sign In</h2>
          <p className="mt-2 text-neutral-400">Access your social security wallet.</p>
        </div>
        
        {error && <div className="p-4 mb-6 text-sm border rounded-lg text-red-400 bg-red-950/30 border-red-900/50">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 text-xs font-medium tracking-widest uppercase text-neutral-500">Email</label>
            <input 
              type="email" name="email" required value={formData.email} onChange={handleChange}
              placeholder="worker@example.com"
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
            className="w-full py-4 mt-4 text-lg font-medium text-neutral-950 transition-colors bg-white rounded-lg hover:bg-neutral-200 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Log In'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-500">
            Need an account? <Link to="/signup" className="text-white transition-colors hover:text-neutral-300">Register Wallet</Link>
          </p>
        </div>

        {/* Distinct Aggregator Section */}
        <div className="pt-8 mt-8 border-t border-neutral-800">
          <p className="mb-4 text-xs font-medium tracking-widest text-center uppercase text-neutral-500">
            For Platforms & Aggregators
          </p>
          <Link 
            to="/aggregator-login" 
            className="flex items-center justify-center w-full py-3 text-sm font-medium transition-colors border rounded-lg text-neutral-300 border-neutral-700 hover:bg-neutral-800 hover:text-white"
          >
            Authenticate via API Key →
          </Link>
        </div>

      </div>
    </div>
  );
}