import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-purple-700 p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-white text-2xl font-bold tracking-wide">
          TaskFlow
        </Link>
        <div className="flex items-center space-x-6">
          {isAuthenticated ? (
            <>
              {user && user.role === 'Manager' && (
                <>
                  <Link to="/manager/dashboard" className="text-white hover:text-indigo-200 transition duration-300">
                    Dashboard
                  </Link>
                  <Link to="/manager/tasks" className="text-white hover:text-indigo-200 transition duration-300">
                    All Tasks
                  </Link>
                  <Link to="/manager/employees" className="text-white hover:text-indigo-200 transition duration-300">
                    Employees
                  </Link>
                </>
              )}
              {user && user.role === 'Employee' && (
                <>
                  <Link to="/employee/dashboard" className="text-white hover:text-indigo-200 transition duration-300">
                    Dashboard
                  </Link>
                  <Link to="/employee/tasks" className="text-white hover:text-indigo-200 transition duration-300">
                    My Tasks
                  </Link>
                </>
              )}
              <span className="text-white text-sm opacity-80">
                Welcome, {user?.email} ({user?.role})
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md transition duration-300"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-white hover:text-indigo-200 transition duration-300">
                Login
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
