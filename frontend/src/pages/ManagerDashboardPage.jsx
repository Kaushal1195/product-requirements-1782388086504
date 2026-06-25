import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ManagerDashboardPage = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    employees: 0,
    recentActivity: [],
    taskStatusDistribution: {}, // For charts
    employeePerformance: {}, // For charts
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/manager/dashboard'); // Example API endpoint
        setDashboardData(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard data.');
        console.error('Error fetching manager dashboard:', err);
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Manager Dashboard</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard title="Total Tasks" value={dashboardData.totalTasks} icon="📊" />
        <DashboardCard title="Completed Tasks" value={dashboardData.completedTasks} icon="✅" />
        <DashboardCard title="Pending Tasks" value={dashboardData.pendingTasks} icon="⏳" />
        <DashboardCard title="Total Employees" value={dashboardData.employees} icon="👥" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
          {dashboardData.recentActivity.length > 0 ? (
            <ul className="space-y-3">
              {dashboardData.recentActivity.map((activity, index) => (
                <li key={index} className="flex items-center text-gray-700">
                  <span className="text-sm text-gray-500 mr-3">{new Date(activity.timestamp).toLocaleString()}</span>
                  <span>{activity.description}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No recent activity.</p>
          )}
        </div>

        {/* Task Status Distribution (Placeholder for Chart) */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Task Status Distribution</h2>
          {Object.keys(dashboardData.taskStatusDistribution).length > 0 ? (
            <ul className="space-y-2">
              {Object.entries(dashboardData.taskStatusDistribution).map(([status, count]) => (
                <li key={status} className="flex justify-between items-center text-gray-700">
                  <span>{status}</span>
                  <span className="font-medium">{count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No task status data available.</p>
          )}
          <p className="text-sm text-gray-500 mt-4">
            (A chart library like Chart.js or Recharts would be used here for visualization)
          </p>
        </div>

        {/* Employee Performance (Placeholder for Chart/List) */}
        <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Employee Performance (Tasks Completed)</h2>
          {Object.keys(dashboardData.employeePerformance).length > 0 ? (
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(dashboardData.employeePerformance).map(([employeeName, completedTasks]) => (
                <li key={employeeName} className="bg-gray-50 p-4 rounded-md shadow-sm flex justify-between items-center">
                  <span className="font-medium text-gray-700">{employeeName}</span>
                  <span className="text-indigo-600 font-bold">{completedTasks} tasks</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No employee performance data available.</p>
          )}
          <p className="text-sm text-gray-500 mt-4">
            (This section would typically feature a bar chart or similar visualization.)
          </p>
        </div>
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

export default ManagerDashboardPage;
