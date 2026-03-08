export default function GigRadar({ openOrders, onAccept, isLoading }) {
  if (isLoading) return <div className="p-10 text-neutral-500 animate-pulse">Scanning frequencies...</div>;

  if (openOrders.length === 0) {
    return (
      <div className="p-10 border border-neutral-800 rounded-2xl bg-neutral-900 text-center">
        <div className="w-4 h-4 rounded-full bg-neutral-700 animate-ping mx-auto mb-4"></div>
        <p className="text-neutral-400">Listening for incoming gigs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {openOrders.map((order) => (
        <div key={order._id} className="p-6 md:p-8 border border-neutral-800 rounded-xl bg-neutral-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group transition-colors hover:border-neutral-600">
          <div>
            <p className="text-sm uppercase tracking-widest text-neutral-500 mb-1">{order.aggregatorId?.name || 'Platform Order'}</p>
            <p className="text-4xl font-light tracking-tight text-white flex items-start">
              <span className="text-xl mt-1 mr-1 text-neutral-500">₹</span>{order.grossFare}
            </p>
            <p className="text-xs text-neutral-600 mt-2">Levy Deduction: {order.aggregatorId?.levyPercentage || 2}%</p>
          </div>
          <button 
            onClick={() => onAccept(order._id)}
            className="w-full md:w-auto px-8 py-4 text-sm font-medium text-neutral-950 transition-colors bg-white rounded-lg hover:bg-neutral-200"
          >
            Accept Gig
          </button>
        </div>
      ))}
    </div>
  );
}