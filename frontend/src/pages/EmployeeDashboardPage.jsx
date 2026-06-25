import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';

const EmployeeDashboardPage = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalAssignedTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    tasksDueToday: 0,
    recentTasks: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/employee/dashboard'); // Example API endpoint
        setDashboardData(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard data.');
        console.error('Error fetching employee dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Dashboard</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard title="Total Assigned Tasks" value={dashboardData.totalAssignedTasks} icon="📝" />
        <DashboardCard title="Completed Tasks" value={dashboardData.completedTasks} icon="✅" />
        <DashboardCard title="Pending Tasks" value={dashboardData.pendingTasks} icon="⏳" />
        <DashboardCard title="Tasks Due Today" value={dashboardData.tasksDueToday} icon="🗓️" />
      </div>

      {/* Recent Tasks */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Tasks</h2>
        {dashboardData.recentTasks.length > 0 ? (
          <ul className="space-y-3">
            {dashboardData.recentTasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md shadow-sm">
                <div>
                  <p className="font-medium text-gray-800">{task.title}</p>
                  <p className="text-sm text-gray-500">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {task.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No recent tasks assigned to you.</p>
        )}
      </div>
    </div>
  );
};

const DashboardCard = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
    <div>
      <h3 className="text-lg font-medium text-gray-500">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
    <div className="text-5xl text-indigo-500 opacity-75">{icon}</div>
  </div>
);

export default EmployeeDashboardPage;
