import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/auth';
import MainLayout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Users from './pages/Users';
import Promotions from './pages/Promotions';
import Reminders from './pages/Reminders';
import Whatsapp from './pages/Whatsapp';
import Documentation from './pages/Documentation';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="users" element={<Users />} />
          <Route path="promotions" element={<Promotions />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="whatsapp" element={<Whatsapp />} />
          <Route path="documentation" element={<Documentation />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
