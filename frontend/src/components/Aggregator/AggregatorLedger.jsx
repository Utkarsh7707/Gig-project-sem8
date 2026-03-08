import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AggregatorLedger({ apiKey }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/aggregators/transactions', {
          headers: { 'x-api-key': apiKey }
        });
        setTransactions(data);
      } catch (error) {
        console.error("Failed to fetch ledger");
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [apiKey]);

  if (loading) return <div className="text-neutral-500 animate-pulse">Loading ledger records...</div>;
  if (transactions.length === 0) return <div className="p-10 text-center border text-neutral-500 border-neutral-800 rounded-2xl bg-neutral-900">No transaction history found.</div>;

  return (
    <div className="overflow-hidden border border-neutral-800 rounded-2xl bg-neutral-900">
      <ul className="divide-y divide-neutral-800">
        {transactions.map((tx) => {
          // --- THE REAL MATH: True Net Revenue ---
          const netCommission = (tx.platformFee - tx.welfareLevy).toFixed(2);

          return (
            <li key={tx._id} className="flex items-center justify-between p-6 transition-colors md:p-8 hover:bg-neutral-800/30">
              <div>
                <p className="text-lg font-light text-white">
                  Worker: <span className="text-emerald-400">{tx.workerId?.name || 'Unknown'}</span>
                </p>
                <div className="flex flex-wrap gap-4 mt-2 font-mono text-xs text-neutral-500">
                  <span>Gross Fare: ₹{tx.totalFare}</span>
                  <span className="text-yellow-500/70">Fee Taken: ₹{tx.platformFee}</span>
                  <span className="text-red-400/70">Levy Paid: -₹{tx.welfareLevy}</span>
                </div>
              </div>
              <div className="text-right">
                {/* Displaying the properly calculated Net Commission */}
                <p className="text-2xl font-light text-white">+₹{netCommission}</p>
                <p className="mt-1 text-xs tracking-widest uppercase text-neutral-500">Net Commission</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}