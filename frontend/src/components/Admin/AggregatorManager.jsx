import { useState } from 'react';
import axios from 'axios';

export default function AggregatorManager({ aggregators, refreshData }) {
  const [newAggregator, setNewAggregator] = useState({ name: '', email: '' });
  const [generatedKey, setGeneratedKey] = useState(null);
  
  // Modal State
  const [keyModal, setKeyModal] = useState({ isOpen: false, platformName: '', apiKey: '' });
  const [copied, setCopied] = useState(false);

  // Helper function to grab the auth token
  const getToken = () => localStorage.getItem('token');

  const handleCreateAggregator = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(
        'http://localhost:5000/api/admin/aggregators', 
        newAggregator,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setGeneratedKey(data.apiKey); 
      setNewAggregator({ name: '', email: '' });
      refreshData(); 
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create platform');
    }
  };

  const handleUpdateStatus = async (id, updates) => {
    try {
      await axios.put(
        `http://localhost:5000/api/admin/aggregators/${id}`, 
        updates,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      refreshData();
    } catch (error) {
      alert('Failed to update platform status');
    }
  };

  // --- THE NEW SECURE ROTATE FUNCTION ---
  const handleRegenerateKey = async (id, currentName) => {
    const isConfirmed = window.confirm(
      `CRITICAL ACTION: Regenerating the API key for ${currentName} will immediately break their current integration. Continue?`
    );
    
    if (!isConfirmed) return;

    try {
      const { data } = await axios.patch(
        `http://localhost:5000/api/admin/aggregators/${id}/rotate-key`,
        {}, // Empty body
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      
      refreshData(); // Updates the table seamlessly
      openKeyModal(currentName, data.apiKey); // Pops open the modal with the new key!
      
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to rotate API key');
    }
  };

  // --- Modal Handlers ---
  const openKeyModal = (name, apiKey) => {
    setKeyModal({ isOpen: true, platformName: name, apiKey });
    setCopied(false);
  };

  const closeKeyModal = () => {
    setKeyModal({ isOpen: false, platformName: '', apiKey: '' });
    setCopied(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(keyModal.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); 
  };

  return (
    <div className="grid grid-cols-1 gap-16 lg:grid-cols-3">
      {/* Registration Form */}
      <div className="lg:col-span-1">
        <h2 className="mb-8 text-2xl font-light tracking-tight text-white">Register Platform</h2>
        
        {generatedKey && (
          <div className="p-6 mb-8 border border-neutral-700 bg-neutral-900 rounded-xl animate-in fade-in">
            <p className="mb-2 text-sm font-medium tracking-widest uppercase text-neutral-400">Target API Key</p>
            <code className="block text-lg text-white break-all">{generatedKey}</code>
            <p className="mt-4 text-sm text-yellow-500">Copy this now. Hand this over to the platform integrator.</p>
          </div>
        )}

        <form onSubmit={handleCreateAggregator} className="space-y-8">
          <div>
            <label className="block mb-3 text-sm font-medium tracking-widest uppercase text-neutral-500">Company Name</label>
            <input 
              type="text" required value={newAggregator.name} 
              onChange={(e) => setNewAggregator({...newAggregator, name: e.target.value})} 
              className="w-full px-0 py-3 text-xl text-white transition-colors bg-transparent border-b border-neutral-700 focus:outline-none focus:border-white" 
            />
          </div>
          <div>
            <label className="block mb-3 text-sm font-medium tracking-widest uppercase text-neutral-500">Contact Email</label>
            <input 
              type="email" required value={newAggregator.email} 
              onChange={(e) => setNewAggregator({...newAggregator, email: e.target.value})} 
              className="w-full px-0 py-3 text-xl text-white transition-colors bg-transparent border-b border-neutral-700 focus:outline-none focus:border-white" 
            />
          </div>
          <button type="submit" className="w-full py-4 text-lg font-medium text-white transition-colors border border-white rounded-lg hover:bg-white hover:text-neutral-900">
            Generate Key
          </button>
        </form>
      </div>

      {/* Aggregators Table */}
      <div className="overflow-x-auto lg:col-span-2">
        <h2 className="mb-8 text-2xl font-light tracking-tight text-white">Active Platforms</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="text-sm font-medium tracking-widest uppercase border-b border-neutral-800 text-neutral-500">
              <th className="py-4 font-normal">Platform Details</th>
              <th className="py-4 font-normal">Levy</th>
              <th className="py-4 font-normal">Status</th>
              <th className="py-4 font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {aggregators.map((agg) => (
              <tr key={agg._id} className={`group text-lg ${agg.isArchived ? 'opacity-40' : ''}`}>
                
                <td className="py-6">
                  <p className="text-white">{agg.name}</p>
                  <div className="flex items-center gap-3 mt-2 font-mono text-sm">
                    <span className="text-neutral-500">Key:</span>
                    <span className="text-neutral-300">••••••••••••••••</span>
                    <button 
                      onClick={() => openKeyModal(agg.name, agg.apiKey)}
                      className="text-xs transition-colors text-neutral-500 hover:text-white"
                    >
                      [Reveal]
                    </button>
                  </div>
                </td>
                
                <td className="py-6 text-neutral-300">{agg.levyPercentage ? `${agg.levyPercentage}%` : '—'}</td>
                <td className="py-6">
                  {agg.levyStatus === 'PENDING_LEVY' && <span className="flex items-center gap-2 text-base text-white opacity-70 animate-pulse"><div className="w-2 h-2 bg-white rounded-full"></div> Pending</span>}
                  {agg.levyStatus === 'APPROVED' && <span className="text-base text-neutral-400">Approved</span>}
                </td>
                
                <td className="py-6 space-x-6 text-right">
                  {agg.levyStatus === 'PENDING_LEVY' && agg.levyPercentage && (
                    <button 
                      onClick={() => handleUpdateStatus(agg._id, { levyStatus: 'APPROVED', isArchived: false })}
                      className="text-base text-white transition-colors border-b border-white hover:text-neutral-300"
                    >
                      Approve Levy
                    </button>
                  )}
                  <button 
                    onClick={() => handleRegenerateKey(agg._id, agg.name)}
                    className="text-base text-yellow-500/70 transition-colors hover:text-yellow-400"
                  >
                    Rotate Key
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(agg._id, { isArchived: !agg.isArchived })}
                    className="text-base transition-colors text-neutral-500 hover:text-white"
                  >
                    {agg.isArchived ? 'Restore' : 'Archive'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* API Key Modal Overlay */}
      {keyModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg p-8 border shadow-2xl bg-neutral-900 border-neutral-700 rounded-2xl">
            
            <h3 className="mb-2 text-2xl font-light text-white">API Key: {keyModal.platformName}</h3>
            <p className="mb-8 text-sm text-neutral-400">This key grants full access to simulate transactions. Keep it secure and do not expose it in client-side code.</p>
            
            <div className="p-4 mb-8 border border-neutral-800 bg-neutral-950 rounded-xl">
              <code className="block text-sm text-white break-all">{keyModal.apiKey}</code>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={copyToClipboard}
                className={`flex-1 py-4 text-sm font-medium transition-colors rounded-lg ${copied ? 'bg-emerald-500 text-white' : 'bg-white text-neutral-900 hover:bg-neutral-200'}`}
              >
                {copied ? '✓ Copied to Clipboard' : 'Copy Full Key'}
              </button>
              <button 
                onClick={closeKeyModal}
                className="px-8 py-4 text-sm font-medium text-white transition-colors border border-neutral-700 rounded-lg hover:bg-neutral-800"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}