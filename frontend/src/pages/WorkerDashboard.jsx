import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import GigRadar from '../components/Worker/GigRadar';
import TransactionHistory from '../components/Worker/TransactionHistory';
import WalletView from '../components/Worker/WalletView';

// Helper to dynamically inject the Razorpay SDK script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function WorkerDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  
  const [activeTab, setActiveTab] = useState('gigs');
  const [wallet, setWallet] = useState({});
  const [openOrders, setOpenOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      const headers = { Authorization: `Bearer ${token}` };
      
      const [walletRes, ordersRes, txRes] = await Promise.all([
        axios.get('http://localhost:5000/api/worker/wallet', { headers }),
        axios.get('http://localhost:5000/api/worker/orders/open', { headers }),
        axios.get('http://localhost:5000/api/worker/transactions', { headers })
      ]);
      
      setWallet(walletRes.data);
      setOpenOrders(ordersRes.data);
      setTransactions(txRes.data);
    } catch (error) {
      if (error.response?.status === 401) handleLogout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // --- NEW RAZORPAY PAYMENT FLOW ---
  const handleAcceptOrder = async (orderId) => {
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      alert('Razorpay SDK failed to load. Check your connection.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Tell backend to create a pending Razorpay order
      const { data } = await axios.post(
        `http://localhost:5000/api/payments/create-order`, 
        { orderId }, 
        { headers }
      );

      // 2. Configure the Razorpay Checkout Modal
      const options = {
        key: 'rzp_test_SOmjcRXne2E0Dk', // ⚠️ CRITICAL: Replace with your actual Razorpay Test Key ID
        amount: data.rzpOrder.amount,
        currency: data.rzpOrder.currency,
        name: 'Gig Welfare Simulation',
        description: `Customer Fare Payment`,
        order_id: data.rzpOrder.id,
        theme: { color: '#10b981' }, // Matches the emerald green theme
        
        // 3. What happens when the customer successfully pays?
        handler: async function (response) {
          try {
            // Send the cryptographic proof to the backend to execute the atomic split
            await axios.post(
              `http://localhost:5000/api/payments/verify`,
              {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                dbOrderId: data.dbOrderId
              },
              { headers }
            );
            
            alert('💳 Payment verified! Atomic Split executed successfully.');
            fetchDashboardData(); // Refresh the UI instantly!
          } catch (err) {
            alert('Verification Failed: ' + (err.response?.data?.message || err.message));
          }
        }
      };

      // 4. Open the Razorpay Modal
      const paymentObject = new window.Razorpay(options);
      
      // Handle the case where the user closes the modal without paying
      paymentObject.on('payment.failed', function (response) {
        alert('Payment failed or was cancelled. The gig remains open.');
      });

      paymentObject.open();

    } catch (error) {
      alert(error.response?.data?.message || 'Failed to initiate payment gateway.');
    }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-neutral-700 bg-neutral-950 text-neutral-200">
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        <header className="flex flex-col gap-6 pb-8 mb-12 border-b md:flex-row md:items-end justify-between border-neutral-800">
          <div>
            <h1 className="text-4xl md:text-5xl font-light tracking-tighter text-white">{user.name}</h1>
            <p className="mt-2 text-lg text-neutral-400">Social Security Hub</p>
          </div>
          <button onClick={handleLogout} className="text-base text-neutral-500 transition-colors hover:text-white self-start md:self-auto">
            Sign Out
          </button>
        </header>

        <nav className="flex space-x-10 border-b border-neutral-800 mb-10">
          <button 
            className={`pb-4 text-lg transition-colors ${activeTab === 'gigs' ? 'text-white border-b-2 border-white' : 'text-neutral-500 hover:text-neutral-300'}`}
            onClick={() => setActiveTab('gigs')}
          >
            Gig Radar
          </button>
          <button 
            className={`pb-4 text-lg transition-colors ${activeTab === 'wallet' ? 'text-white border-b-2 border-white' : 'text-neutral-500 hover:text-neutral-300'}`}
            onClick={() => setActiveTab('wallet')}
          >
            My Wallet
          </button>
        </nav>

        <main className="animate-in fade-in duration-500">
          {activeTab === 'gigs' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <section>
                <h2 className="mb-8 text-2xl font-light tracking-tight text-white">Open Broadcasts</h2>
                <GigRadar openOrders={openOrders} onAccept={handleAcceptOrder} isLoading={loading} />
              </section>
              <section>
                <h2 className="mb-8 text-2xl font-light tracking-tight text-white">Recent Ledger</h2>
                {loading ? <div className="animate-pulse text-neutral-500">Loading...</div> : <TransactionHistory transactions={transactions} />}
              </section>
            </div>
          ) : (
            <div className="max-w-4xl">
              <h2 className="mb-8 text-2xl font-light tracking-tight text-white">Benefit Distribution</h2>
              {loading ? <div className="animate-pulse text-neutral-500">Loading...</div> :
<WalletView wallet={wallet} transactions={transactions} />}
            </div>
          )}
        </main>

      </div>
    </div>
  );
}