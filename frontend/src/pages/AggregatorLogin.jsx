import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function AggregatorLogin() {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // Mock verification delay
    setTimeout(() => {
      localStorage.setItem('aggregatorApiKey', apiKey);
      navigate('/aggregator-dashboard');
      setLoading(false);
    }, 800);
  };

  return (
    <div className="flex items-center justify-center min-h-screen font-sans bg-neutral-950 text-neutral-200 selection:bg-neutral-700">
      <div className="w-full max-w-lg p-10 md:p-14 bg-neutral-900 border shadow-2xl rounded-2xl border-neutral-800">
        
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-light tracking-tighter text-white">Platform Portal</h2>
          <p className="mt-3 text-lg text-neutral-400">Authenticate your integration key.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block mb-3 text-sm font-medium tracking-widest uppercase text-neutral-500">
              API Key
            </label>
            <input 
              type="password" required value={apiKey} onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter 64-character key"
              className="w-full px-0 py-3 text-xl text-white bg-transparent border-b border-neutral-700 focus:outline-none focus:border-white placeholder-neutral-700 transition-colors"
            />
          </div>
          <button 
            type="submit" disabled={loading}
            className="w-full py-4 text-lg font-medium text-neutral-950 transition-colors bg-white rounded-lg hover:bg-neutral-200 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Connect System'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link to="/login" className="text-sm text-neutral-500 transition-colors hover:text-white">
            ← Back to Standard Login
          </Link>
        </div>

      </div>
    </div>
  );
}