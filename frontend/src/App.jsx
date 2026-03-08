import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import WorkerDashboard from './pages/WorkerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AggregatorLogin from './pages/AggregatorLogin';
import AggregatorDashboard from './pages/AggregatorDashboard';

function App() {
  return (
    <Router>
      <Routes>
        {/* Default route redirects to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/aggregator-login" element={<AggregatorLogin />} />
        <Route path="/aggregator-dashboard" element={<AggregatorDashboard />} />
        {/* Dashboards */}
        <Route path="/worker-dashboard" element={<WorkerDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;