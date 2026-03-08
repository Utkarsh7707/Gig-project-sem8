import { useState } from 'react';

export default function FinancialConfig({ 
  aggregatorInfo, 
  handleLevySubmit, 
  handleCommissionSubmit,
  needsInitialSetup,
  isPendingReview
}) {
  const [proposedLevy, setProposedLevy] = useState('');
  const [isEditingLevy, setIsEditingLevy] = useState(false);
  
  const [proposedCommission, setProposedCommission] = useState('');
  const [isEditingCommission, setIsEditingCommission] = useState(false);

  const showLevyForm = isEditingLevy || needsInitialSetup;

  return (
    <div className="grid grid-cols-1 gap-8 max-w-5xl xl:grid-cols-2">
      
      {/* CARD 1: WELFARE LEVY */}
      <section className="flex flex-col p-8 border bg-neutral-900 border-neutral-800 rounded-2xl">
        <h2 className="mb-8 text-2xl font-light tracking-tight text-white">Welfare Levy</h2>
        
        {!showLevyForm ? (
          <div className="flex flex-col flex-1 duration-500 animate-in fade-in">
            {isPendingReview ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex w-3 h-3 bg-white rounded-full opacity-50 animate-pulse"></span>
                  <p className="text-lg text-white">Pending Review</p>
                </div>
                <p className="my-6 text-5xl font-light tracking-tighter text-white">{aggregatorInfo.levyPercentage}% <span className="text-lg text-neutral-500">(Requested)</span></p>
              </>
            ) : (
              <>
                <p className="mb-2 text-sm font-medium tracking-widest uppercase text-neutral-500">Authorized Rate</p>
                <p className="font-light tracking-tighter text-white text-7xl">{aggregatorInfo.levyPercentage}%</p>
              </>
            )}
            <div className="pt-6 mt-auto border-t border-neutral-800">
              <button 
                onClick={() => { setProposedLevy(aggregatorInfo.levyPercentage?.toString() || ''); setIsEditingLevy(true); }}
                className="w-full px-6 py-3 text-sm font-medium transition-colors bg-white rounded text-neutral-900 hover:bg-neutral-200"
              >
                Request Rate Change
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => { handleLevySubmit(e, proposedLevy); setIsEditingLevy(false); }} className="flex flex-col flex-1 space-y-6 duration-500 animate-in fade-in">
            <p className="text-sm leading-relaxed text-neutral-400">Requires Admin authorization.</p>
            <div>
              <input 
                type="number" min="1" max="5" step="0.1" required value={proposedLevy} onChange={(e) => setProposedLevy(e.target.value)} placeholder="e.g. 2.0"
                className="w-full px-0 py-4 text-4xl font-light text-white transition-colors bg-transparent border-b border-neutral-700 focus:outline-none focus:border-white" 
              />
            </div>
            <div className="flex gap-4 pt-6 mt-auto">
              <button type="submit" className="flex-1 py-3 text-sm font-medium transition-colors bg-white rounded text-neutral-900 hover:bg-neutral-200">Submit</button>
              {!needsInitialSetup && <button type="button" onClick={() => setIsEditingLevy(false)} className="px-6 py-3 text-sm font-medium text-white transition-colors border rounded border-neutral-700 hover:bg-neutral-800">Cancel</button>}
            </div>
          </form>
        )}
      </section>

      {/* CARD 2: PLATFORM COMMISSION */}
      <section className="flex flex-col p-8 border bg-neutral-900 border-neutral-800 rounded-2xl">
        <h2 className="mb-8 text-2xl font-light tracking-tight text-white">Platform Take-Rate</h2>
        
        {!isEditingCommission ? (
          <div className="flex flex-col flex-1 duration-500 animate-in fade-in">
            <p className="mb-2 text-sm font-medium tracking-widest uppercase text-neutral-500">Active Commission</p>
            <p className="font-light tracking-tighter text-white text-7xl">{aggregatorInfo.platformFeePercentage}%</p>
            <div className="pt-6 mt-auto border-t border-neutral-800">
              <button 
                onClick={() => { setProposedCommission(aggregatorInfo.platformFeePercentage.toString()); setIsEditingCommission(true); }}
                className="w-full px-6 py-3 text-sm font-medium transition-colors border border-neutral-600 rounded text-neutral-300 hover:text-white hover:border-white"
              >
                Update Commission
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => { handleCommissionSubmit(e, proposedCommission); setIsEditingCommission(false); }} className="flex flex-col flex-1 space-y-6 duration-500 animate-in fade-in">
            <p className="text-sm leading-relaxed text-neutral-400">Updates instantly. No approval required.</p>
            <div>
              <input 
                type="number" min="0" max="100" step="0.1" required value={proposedCommission} onChange={(e) => setProposedCommission(e.target.value)} placeholder="e.g. 25.0"
                className="w-full px-0 py-4 text-4xl font-light text-white transition-colors bg-transparent border-b border-neutral-700 focus:outline-none focus:border-white" 
              />
            </div>
            <div className="flex gap-4 pt-6 mt-auto">
              <button type="submit" className="flex-1 py-3 text-sm font-medium transition-colors bg-white rounded text-neutral-900 hover:bg-neutral-200">Save Rate</button>
              <button type="button" onClick={() => setIsEditingCommission(false)} className="px-6 py-3 text-sm font-medium text-white transition-colors border rounded border-neutral-700 hover:bg-neutral-800">Cancel</button>
            </div>
          </form>
        )}
      </section>

    </div>
  );
}