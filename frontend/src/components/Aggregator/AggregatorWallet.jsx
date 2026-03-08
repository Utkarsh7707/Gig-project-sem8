import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AggregatorWallet({ apiKey }) {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/aggregators/wallet', {
          headers: { 'x-api-key': apiKey }
        });
        setWallet(data);
      } catch (error) {
        console.error("Failed to fetch platform wallet");
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, [apiKey]);

  if (loading) return <div className="text-neutral-500 animate-pulse">Syncing financial data...</div>;
  if (!wallet) return <div className="text-neutral-500">No wallet data found.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl animate-in fade-in">
      
      {/* CARD 1: Net Profit (Revenue) */}
      <div className="p-8 border bg-neutral-900 border-neutral-800 rounded-2xl flex flex-col justify-between h-48 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full"></div>
        <h3 className="text-sm uppercase tracking-widest text-neutral-500 relative z-10">Net Profit (Revenue)</h3>
        <p className="text-5xl font-light tracking-tighter text-white flex items-start relative z-10">
          <span className="text-2xl mt-1 mr-1 text-neutral-500">₹</span>
          {wallet.balance_revenue?.toFixed(2) || '0.00'}
        </p>
      </div>

      {/* CARD 2: Total Welfare Paid */}
      <div className="p-8 border bg-neutral-900 border-neutral-800 rounded-2xl flex flex-col justify-between h-48 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full"></div>
        <h3 className="text-sm uppercase tracking-widest text-neutral-500 relative z-10">Total Welfare Funded</h3>
        <p className="text-5xl font-light tracking-tighter text-white flex items-start relative z-10">
          <span className="text-2xl mt-1 mr-1 text-neutral-500">₹</span>
          {wallet.total_welfare_paid?.toFixed(2) || '0.00'}
        </p>
      </div>

    </div>
  );
}