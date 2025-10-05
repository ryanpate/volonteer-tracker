import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Volunteers from './pages/Volunteers';
import VolunteerDetail from './pages/VolunteerDetail';
import Interactions from './pages/Interactions';
import CreateInteraction from './pages/CreateInteraction';
import TeamMembers from './pages/TeamMembers';
import Profile from './pages/Profile';
import Layout from './components/Layout';
import './styles/cherry-hills-theme.css';

// Import Admin Components
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTeamMembers from './pages/admin/AdminTeamMembers';
import AdminInteractions from './pages/admin/AdminInteractions';
import AdminSettings from './pages/admin/AdminSettings';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4]">
        <div className="text-center">
          <div className="spinner mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto card">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to access this page. Admin privileges are required.</p>
          <Link to="/dashboard" className="btn-primary inline-block">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="volunteers" element={<Volunteers />} />
        <Route path="volunteers/:id" element={<VolunteerDetail />} />
        <Route path="interactions" element={<Interactions />} />
        <Route path="interactions/new" element={<CreateInteraction />} />
        <Route path="profile" element={<Profile />} />
        
        {/* Team Management - Admin Only */}
        <Route path="team" element={<AdminRoute><TeamMembers /></AdminRoute>} />
        
        {/* Admin Section - All Admin Routes Protected */}
        <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="admin/team-members" element={<AdminRoute><AdminTeamMembers /></AdminRoute>} />
        <Route path="admin/interactions" element={<AdminRoute><AdminInteractions /></AdminRoute>} />
        <Route path="admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;