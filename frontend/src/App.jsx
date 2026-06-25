import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import ManagerDashboardPage from './pages/ManagerDashboardPage';
import EmployeeDashboardPage from './pages/EmployeeDashboardPage';
import TasksPage from './pages/TasksPage';
import EmployeesPage from './pages/EmployeesPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

function App() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading application...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Redirect authenticated users from root to their dashboard */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                user?.role === 'Manager' ? (
                  <Navigate to="/manager/dashboard" replace />
                ) : user?.role === 'Employee' ? (
                  <Navigate to="/employee/dashboard" replace />
                ) : (
                  <Navigate to="/login" replace /> // Fallback if role is unknown
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Manager Routes */}
          <Route element={<ProtectedRoute roles={['Manager']} />}>
            <Route path="/manager/dashboard" element={<ManagerDashboardPage />} />
            <Route path="/manager/tasks" element={<TasksPage />} />
            <Route path="/manager/employees" element={<EmployeesPage />} />
          </Route>

          {/* Employee Routes */}
          <Route element={<ProtectedRoute roles={['Employee']} />}>
            <Route path="/employee/dashboard" element={<EmployeeDashboardPage />} />
            <Route path="/employee/tasks" element={<TasksPage />} />
          </Route>

          {/* Catch-all for unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
