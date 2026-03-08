import { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

export default function WalletView({ wallet, transactions = [] }) {
  const [timeFilter, setTimeFilter] = useState('ALL'); // '7D', '30D', 'ALL'

  // --- DATA PROCESSING ENGINE FOR THE CHART ---
  const chartData = useMemo(() => {
    // 1. Filter transactions by selected timeframe
    const now = new Date();
    const filteredTxs = transactions.filter(tx => {
      const txDate = new Date(tx.createdAt);
      if (timeFilter === '7D') return (now - txDate) / (1000 * 60 * 60 * 24) <= 7;
      if (timeFilter === '30D') return (now - txDate) / (1000 * 60 * 60 * 24) <= 30;
      return true; // 'ALL'
    });

    // 2. Group by Date and Sum up the ESI/EPF splits
    const groupedData = filteredTxs.reduce((acc, tx) => {
      // Format date as "Mar 8"
      const dateStr = new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (!acc[dateStr]) {
        acc[dateStr] = { date: dateStr, ESI: 0, EPF: 0 };
      }
      
      acc[dateStr].ESI += tx.esiSplit || 0;
      acc[dateStr].EPF += tx.epfSplit || 0;
      return acc;
    }, {});

    // 3. Convert object back to array, sort chronologically, and format decimals
    return Object.values(groupedData)
      .reverse() // Reverse because the backend usually sends newest first
      .map(item => ({
        ...item,
        ESI: Number(item.ESI.toFixed(2)),
        EPF: Number(item.EPF.toFixed(2))
      }));
  }, [transactions, timeFilter]);

  // Custom tooltip styling for the dark theme
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-4 border border-neutral-700 bg-neutral-900 rounded-xl shadow-xl">
          <p className="mb-2 text-sm font-medium text-white">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: ₹{entry.value.toFixed(2)}
            </p>
          ))}
          <div className="pt-2 mt-2 border-t border-neutral-800">
            <p className="text-sm font-medium text-emerald-400">
              Total Day Welfare: ₹{(payload[0].value + (payload[1]?.value || 0)).toFixed(2)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-12">
      
      {/* TOP SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col justify-between p-8 border h-48 bg-neutral-900 border-neutral-800 rounded-2xl">
          <h3 className="text-sm tracking-widest uppercase text-neutral-500">Liquid Balance</h3>
          <p className="flex items-start text-5xl font-light tracking-tighter text-white">
            <span className="mt-1 mr-1 text-2xl text-neutral-500">₹</span>
            {wallet.balance_withdrawable?.toFixed(2) || '0.00'}
          </p>
        </div>
        
        <div className="relative flex flex-col justify-between overflow-hidden p-8 border h-48 bg-neutral-900 border-neutral-800 rounded-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full"></div>
          <h3 className="relative z-10 text-sm tracking-widest uppercase text-neutral-500">Health Reserve (ESI)</h3>
          <p className="relative z-10 flex items-start text-5xl font-light tracking-tighter text-white">
            <span className="mt-1 mr-1 text-2xl text-neutral-500">₹</span>
            {wallet.balance_esi?.toFixed(2) || '0.00'}
          </p>
        </div>
        
        <div className="relative flex flex-col justify-between overflow-hidden p-8 border h-48 bg-neutral-900 border-neutral-800 rounded-2xl md:col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-bl-full"></div>
          <h3 className="relative z-10 text-sm tracking-widest uppercase text-neutral-500">Pension Fund (EPF)</h3>
          <p className="relative z-10 flex items-start text-5xl font-light tracking-tighter text-white">
            <span className="mt-1 mr-1 text-2xl text-neutral-500">₹</span>
            {wallet.balance_epf?.toFixed(2) || '0.00'}
          </p>
        </div>
      </div>

      {/* TRACKER CHART SECTION */}
      <div className="p-8 border bg-neutral-900 border-neutral-800 rounded-2xl animate-in fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-light text-white">Welfare Growth Tracker</h3>
            <p className="mt-1 text-sm text-neutral-500">Daily contributions to your social security</p>
          </div>
          
          {/* Filters */}
          <div className="flex p-1 border rounded-lg bg-neutral-950 border-neutral-800">
            {['7D', '30D', 'ALL'].map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                  timeFilter === filter ? 'bg-neutral-800 text-white shadow' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* The Recharts Graph */}
        <div className="w-full h-80">
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center w-full h-full text-neutral-600 border border-dashed rounded-xl border-neutral-800">
              No contribution data available for this period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#737373" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10} 
                />
                <YAxis 
                  stroke="#737373" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#262626', opacity: 0.4 }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                {/* Stacked Bars for ESI and EPF */}
                <Bar dataKey="ESI" name="Health Fund (ESI)" stackId="a" fill="#60a5fa" radius={[0, 0, 4, 4]} />
                <Bar dataKey="EPF" name="Pension Fund (EPF)" stackId="a" fill="#c084fc" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
}