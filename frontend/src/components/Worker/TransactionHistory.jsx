import { useState } from 'react';

export default function TransactionHistory({ transactions }) {
  // State to track which transaction is currently expanded
  const [expandedTxId, setExpandedTxId] = useState(null);

  if (transactions.length === 0) {
    return <div className="p-10 text-center text-neutral-500 border border-neutral-800 rounded-2xl bg-neutral-900">No ledger history found.</div>;
  }

  const toggleExpand = (id) => {
    setExpandedTxId(expandedTxId === id ? null : id);
  };

  return (
    <div className="border border-neutral-800 rounded-2xl bg-neutral-900 overflow-hidden">
      <ul className="divide-y divide-neutral-800">
        {transactions.map((tx) => {
          const isExpanded = expandedTxId === tx._id;
          
          // Reverse-engineer the historical percentages so they are always 100% accurate 
          // to the moment the transaction occurred, even if the platform changes fees later!
          const feePercent = Math.round((tx.platformFee / tx.totalFare) * 100) || 0;
          const levyPercent = ((tx.welfareLevy / tx.workerPayout) * 100).toFixed(1);

          return (
            <li key={tx._id} className="flex flex-col transition-colors hover:bg-neutral-800/30">
              
              {/* --- CLICKABLE HEADER ROW --- */}
              <div 
                onClick={() => toggleExpand(tx._id)}
                className="p-6 md:p-8 flex justify-between items-center cursor-pointer group"
              >
                <div>
                  <p className="text-lg font-light text-white group-hover:text-emerald-400 transition-colors">
                    {tx.aggregatorId?.name || 'Platform'}
                  </p>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs font-mono text-neutral-500">
                    <span>Fare: ₹{tx.totalFare}</span>
                    <span className="text-red-400/70">Fee: -₹{tx.platformFee}</span>
                    <span>Welfare: ₹{tx.welfareLevy}</span>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div>
                    <p className="text-2xl font-light text-white">+₹{tx.workerPayout?.toFixed(2)}</p>
                    <p className="mt-1 text-xs tracking-widest uppercase text-emerald-500/70">Split Complete</p>
                  </div>
                  {/* Dropdown Arrow */}
                  <svg 
                    className={`w-5 h-5 text-neutral-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* --- EXPANDABLE RECEIPT DETAILS --- */}
              {isExpanded && (
                <div className="px-6 pb-8 md:px-8 animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="p-6 rounded-xl bg-neutral-950 border border-neutral-800 space-y-6">
                    
                    {/* The Earnings Math */}
                    <div>
                      <h4 className="text-xs tracking-widest uppercase text-neutral-500 mb-4 border-b border-neutral-800 pb-2">Your Earnings Calculation</h4>
                      <div className="space-y-2 text-sm font-mono">
                        <div className="flex justify-between text-neutral-400">
                          <span>Customer Paid:</span>
                          <span>₹{tx.totalFare?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-red-400/70">
                          <span>Platform Fee ({feePercent}%):</span>
                          <span>-₹{tx.platformFee?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-white text-base pt-2 border-t border-neutral-800 border-dashed">
                          <span>Take-Home Pay:</span>
                          <span>₹{tx.workerPayout?.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* The Welfare Math */}
                    <div>
                      <h4 className="text-xs tracking-widest uppercase text-neutral-500 mb-4 border-b border-neutral-800 pb-2">Welfare Contribution <span className="text-emerald-500/70 lowercase tracking-normal">(Paid by Platform)</span></h4>
                      <div className="space-y-2 text-sm font-mono">
                        <div className="flex justify-between text-neutral-400">
                          <span>Total Levy ({levyPercent}% of earnings):</span>
                          <span>₹{tx.welfareLevy?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-blue-400/70 ml-4">
                          <span>↳ Health Reserve (25%):</span>
                          <span>+₹{tx.esiSplit?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-purple-400/70 ml-4">
                          <span>↳ Pension Fund (75%):</span>
                          <span>+₹{tx.epfSplit?.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-center text-neutral-600 italic mt-4">
                      Transaction ID: {tx._id}
                    </p>
                  </div>
                </div>
              )}
              
            </li>
          );
        })}
      </ul>
    </div>
  );
}