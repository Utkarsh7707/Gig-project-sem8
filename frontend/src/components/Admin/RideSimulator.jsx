import { useState } from 'react';
import axios from 'axios';

export default function RideSimulator({ aggregators }) {
  const [simulatedOrder, setSimulatedOrder] = useState({ aggregatorId: '', grossFare: '' });
  const [status, setStatus] = useState('');

 const handleBroadcastOrder = async (e) => {
    e.preventDefault();
    setStatus('');

    try {
      const token = localStorage.getItem('token');
      
      await axios.post(
        'http://localhost:5000/api/admin/orders/broadcast', 
        simulatedOrder,
        { headers: { Authorization: `Bearer ${token}` } } // Must prove we are admin!
      );
      
      setStatus('SUCCESS');
      setSimulatedOrder({ aggregatorId: '', grossFare: '' });
      
      // Clear success message after 3 seconds
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      console.error(err);
      setStatus('ERROR');
    }
  };

  const activePlatforms = aggregators.filter(a => a.levyStatus === 'APPROVED' && !a.isArchived);

  return (
    <div className="max-w-xl mx-auto mt-10">
      <div className="mb-10">
        <h2 className="text-3xl font-light tracking-tight text-white">Job Broadcast Pool</h2>
        <p className="mt-3 text-lg text-neutral-400">Create an open gig. The first worker to accept it will trigger the atomic split.</p>
      </div>
      
      {status === 'ERROR' && <div className="p-4 mb-8 text-red-400 border border-red-900 rounded bg-red-950/30">Failed to broadcast order.</div>}
      {status === 'SUCCESS' && (
        <div className="p-6 mb-8 border rounded-xl border-neutral-800 bg-neutral-900 animate-in fade-in">
          <p className="text-lg text-white">📡 Order broadcasted to all workers.</p>
          <p className="mt-1 text-sm text-neutral-500">Waiting for a worker to accept...</p>
        </div>
      )}

      <form onSubmit={handleBroadcastOrder} className="space-y-8">
        <div>
          <label className="block mb-3 text-sm font-medium tracking-widest uppercase text-neutral-500">Originating Platform</label>
          <select 
            required value={simulatedOrder.aggregatorId} 
            onChange={(e) => setSimulatedOrder({...simulatedOrder, aggregatorId: e.target.value})}
            className="w-full px-0 py-3 text-xl text-white transition-colors bg-transparent border-b border-neutral-700 focus:outline-none focus:border-white"
          >
            <option value="" className="bg-neutral-900">-- Choose Platform --</option>
            {activePlatforms.map(a => (
              <option key={a._id} value={a._id} className="bg-neutral-900">{a.name} ({a.levyPercentage}% Levy)</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block mb-3 text-sm font-medium tracking-widest uppercase text-neutral-500">Gross Fare (₹)</label>
          <input 
            type="number" required min="1" placeholder="e.g. 600"
            value={simulatedOrder.grossFare} 
            onChange={(e) => setSimulatedOrder({...simulatedOrder, grossFare: e.target.value})}
            className="w-full px-0 py-3 text-xl text-white transition-colors bg-transparent border-b border-neutral-700 focus:outline-none focus:border-white placeholder-neutral-700" 
          />
        </div>

        <button type="submit" className="w-full py-4 mt-6 text-lg font-medium text-neutral-900 transition-colors bg-white rounded-lg hover:bg-neutral-200">
          Broadcast Order
        </button>
      </form>
    </div>
  );
}