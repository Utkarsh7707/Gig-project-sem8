import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import FinancialConfig from '../components/Aggregator/FinancialConfig';
import AggregatorLedger from '../components/Aggregator/AggregatorLedger';
import AggregatorWallet from '../components/Aggregator/AggregatorWallet'; // <-- Import the new component

export default function AggregatorDashboard() {
  const navigate = useNavigate();
  const apiKey = localStorage.getItem('aggregatorApiKey');

  const [aggregatorInfo, setAggregatorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('config'); // 'config', 'ledger', or 'wallet'

  useEffect(() => {
    if (!apiKey) return navigate('/aggregator-login');

    const fetchAggregatorData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/aggregators/me', {
          headers: { 'x-api-key': apiKey }
        });
        setAggregatorInfo(response.data);
      } catch (err) {
        localStorage.removeItem('aggregatorApiKey');
        navigate('/aggregator-login');
      } finally {
        setLoading(false);
      }
    };

    fetchAggregatorData();
  }, [apiKey, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('aggregatorApiKey');
    navigate('/aggregator-login');
  };

  const handleLevySubmit = async (e, proposedLevy) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        'http://localhost:5000/api/aggregators/levy', 
        { levyPercentage: Number(proposedLevy) },
        { headers: { 'x-api-key': apiKey } }
      );
      setAggregatorInfo({ ...aggregatorInfo, ...response.data });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit levy change.');
    }
  };

  const handleCommissionSubmit = async (e, proposedCommission) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        'http://localhost:5000/api/aggregators/commission', 
        { platformFeePercentage: Number(proposedCommission) },
        { headers: { 'x-api-key': apiKey } }
      );
      setAggregatorInfo({ ...aggregatorInfo, platformFeePercentage: response.data.platformFeePercentage });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update commission.');
    }
  };

  if (loading) return <div className="p-10 text-white bg-neutral-950">Loading platform data...</div>;
  if (!aggregatorInfo) return null;

  const needsInitialSetup = aggregatorInfo.levyPercentage === null;
  const isPendingReview = aggregatorInfo.levyStatus === 'PENDING_LEVY' && !needsInitialSetup;

  return (
    <div className="min-h-screen font-sans bg-neutral-950 text-neutral-200 selection:bg-neutral-700">
      
      <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-6 border-b border-neutral-800 bg-neutral-900">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-white">{aggregatorInfo.name}</h1>
          <p className="mt-1 text-xs tracking-widest uppercase text-neutral-500">Partner Portal</p>
        </div>
        <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium transition-colors border rounded text-neutral-400 hover:text-white border-neutral-700 hover:border-neutral-500">
          Disconnect
        </button>
      </header>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row min-h-[calc(100vh-88px)]">
        
        <nav className="flex-shrink-0 w-full p-8 space-y-2 border-r md:w-64 border-neutral-800">
          <button 
            onClick={() => setActiveTab('config')}
            className={`w-full px-4 py-3 text-sm text-left transition-colors rounded ${activeTab === 'config' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}
          >
            Financial Config
          </button>
          <button 
            onClick={() => setActiveTab('ledger')}
            disabled={aggregatorInfo.isArchived || needsInitialSetup}
            className={`w-full px-4 py-3 text-sm text-left transition-colors rounded ${activeTab === 'ledger' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50 disabled:opacity-50 disabled:cursor-not-allowed'}`}
          >
            Transaction Ledger
          </button>
          {/* New Wallet Tab */}
          <button 
            onClick={() => setActiveTab('wallet')}
            disabled={aggregatorInfo.isArchived || needsInitialSetup}
            className={`w-full px-4 py-3 text-sm text-left transition-colors rounded ${activeTab === 'wallet' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50 disabled:opacity-50 disabled:cursor-not-allowed'}`}
          >
            Platform Wallet
          </button>
        </nav>

        <main className="flex-1 p-8 md:p-12 space-y-12 animate-in fade-in">
          
          {aggregatorInfo.isArchived && (
            <div className="p-6 border border-neutral-700 rounded-xl bg-neutral-900">
              <div className="flex items-center gap-3">
                <span className="flex w-3 h-3 bg-red-500 rounded-full"></span>
                <p className="font-medium text-white">System Suspended</p>
              </div>
              <p className="mt-2 text-sm text-neutral-400">
                This platform is currently archived. Transaction APIs are disabled until Admin approval.
              </p>
            </div>
          )}

          {/* Tab Routing Logic */}
          {activeTab === 'config' && (
            <FinancialConfig 
              aggregatorInfo={aggregatorInfo}
              handleLevySubmit={handleLevySubmit}
              handleCommissionSubmit={handleCommissionSubmit}
              needsInitialSetup={needsInitialSetup}
              isPendingReview={isPendingReview}
            />
          )}

          {activeTab === 'ledger' && (
            <div className="max-w-4xl">
              <h2 className="mb-8 text-2xl font-light tracking-tight text-white">Platform Revenue Ledger</h2>
              <AggregatorLedger apiKey={apiKey} />
            </div>
          )}

          {activeTab === 'wallet' && (
            <div className="max-w-4xl">
              <h2 className="mb-8 text-2xl font-light tracking-tight text-white">Platform Treasury</h2>
              <AggregatorWallet apiKey={apiKey} />
            </div>
          )}

        </main>
      </div>
    </div>
  );
}