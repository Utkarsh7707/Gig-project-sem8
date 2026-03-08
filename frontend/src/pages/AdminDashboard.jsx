import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AggregatorManager from '../components/Admin/AggregatorManager';
import RideSimulator from '../components/Admin/RideSimulator';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('aggregators');
  const [aggregators, setAggregators] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAggregators = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const { data } = await axios.get('http://localhost:5000/api/admin/aggregators', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAggregators(data);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAggregators();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen font-sans selection:bg-neutral-700 bg-neutral-950 text-neutral-200">
      <div className="px-6 py-16 mx-auto max-w-7xl">
        
        <header className="flex flex-col gap-6 pb-8 mb-12 border-b md:flex-row md:items-end justify-between border-neutral-800">
          <div>
            <h1 className="text-4xl md:text-5xl font-light tracking-tighter text-white">Master Console</h1>
            <p className="mt-2 text-lg text-neutral-400">System architecture & ecosystem oversight</p>
          </div>
          <button onClick={handleLogout} className="text-base text-neutral-500 transition-colors hover:text-white">
            Sign Out
          </button>
        </header>

        <nav className="flex space-x-10 border-b border-neutral-800">
          <button 
            className={`pb-4 text-lg transition-colors ${activeTab === 'aggregators' ? 'text-white border-b-2 border-white' : 'text-neutral-500 hover:text-neutral-300'}`}
            onClick={() => setActiveTab('aggregators')}
          >
            Platforms
          </button>
          <button 
            className={`pb-4 text-lg transition-colors ${activeTab === 'simulate' ? 'text-white border-b-2 border-white' : 'text-neutral-500 hover:text-neutral-300'}`}
            onClick={() => setActiveTab('simulate')}
          >
            Broadcast Simulation
          </button>
        </nav>

        <main className="pt-10 duration-500 animate-in fade-in">
          {loading ? (
            <div className="text-lg animate-pulse text-neutral-500">Syncing with ledger...</div>
          ) : activeTab === 'aggregators' ? (
            <AggregatorManager aggregators={aggregators} refreshData={fetchAggregators} />
          ) : (
            <RideSimulator aggregators={aggregators} />
          )}
        </main>

      </div>
    </div>
  );
}