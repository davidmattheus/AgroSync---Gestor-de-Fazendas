import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FarmDataProvider, useFarmData } from './context/FarmDataContext';
import Login from './pages/Login';
import FarmSetup from './pages/FarmSetup';
import Dashboard from './pages/Dashboard';
import Machines from './pages/Machines';
import MachineDetail from './pages/MachineDetail';
import Fueling from './pages/Fueling';
import Maintenance from './pages/Maintenance';
import MaintenanceDetail from './pages/MaintenanceDetail';
import Warehouse from './pages/Almoxarifado';
import Purchases from './pages/Purchases'; // Import the new Purchases page
import Collaborators from './pages/Collaborators';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <FarmDataProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="machines" element={<Machines />} />
              <Route path="machines/:id" element={<MachineDetail />} />
              <Route path="fueling" element={<Fueling />} />
              <Route path="maintenance" element={<Maintenance />} />
              <Route path="maintenance/:id" element={<MaintenanceDetail />} />
              <Route path="warehouse" element={<Warehouse />} />
              <Route path="purchases" element={<Purchases />} /> {/* Add the new route */}
              <Route path="collaborators" element={<Collaborators />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="/setup-farm" element={
                <ProtectedRoute>
                    <FarmSetup />
                </ProtectedRoute>
            } />
          </Routes>
        </HashRouter>
      </FarmDataProvider>
    </AuthProvider>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const { farm } = useFarmData();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-agro-light-green"><div className="text-agro-green font-bold text-xl">Loading AgroSync...</div></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (!farm.name && location.pathname !== '/setup-farm') {
    return <Navigate to="/setup-farm" replace />;
  }

  return children;
};

const AppLayout: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    return (
        <div className="flex h-screen bg-agro-gray-100 app-layout">
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible">
                <Header setSidebarOpen={setSidebarOpen} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-agro-gray-100 p-4 md:p-6 lg:p-8 app-main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default App;