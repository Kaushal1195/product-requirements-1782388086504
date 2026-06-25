import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';

const TasksPage = () => {
  const { user, hasRole } = useAuth();
  const isManager = hasRole('Manager');

  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]); // Only for Manager to assign tasks
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [currentTask, setCurrentTask] = useState(null); // For editing
  const [formState, setFormState] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    dueDate: '',
    assignedTo: '', // Employee ID
    status: 'Pending', // Default for new tasks, employee can update
  });

  useEffect(() => {
    fetchTasks();
    if (isManager) {
      fetchEmployees();
    }
  }, [isManager]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const endpoint = isManager ? '/tasks' : `/tasks/employee/${user.id}`; // Assuming employee ID is in user object
      const response = await axiosInstance.get(endpoint);
      setTasks(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch tasks.');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axiosInstance.get('/employees'); // Example endpoint for managers to get employees
      setEmployees(response.data);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const handleFormChange = (e) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const handleCreateOrUpdateTask = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (currentTask) {
        // Update task (Manager only)
        await axiosInstance.put(`/tasks/${currentTask.id}`, formState);
        alert('Task updated successfully!');
      } else {
        // Create task (Manager only)
        await axiosInstance.post('/tasks', formState);
        alert('Task created successfully!');
      }
      setShowTaskForm(false);
      setCurrentTask(null);
      setFormState({
        title: '', description: '', priority: 'Medium', dueDate: '', assignedTo: '', status: 'Pending'
      });
      fetchTasks(); // Refresh tasks list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task.');
      console.error('Error saving task:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    setError('');
    try {
      await axiosInstance.delete(`/tasks/${taskId}`);
      alert('Task deleted successfully!');
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task.');
      console.error('Error deleting task:', err);
    }
  };

  const handleEditClick = (task) => {
    setCurrentTask(task);
    setFormState({
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate.split('T')[0], // Format for input type="date"
      assignedTo: task.assignedTo.id, // Assuming assignedTo is an object with id
      status: task.status,
    });
    setShowTaskForm(true);
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    setError('');
    try {
      await axiosInstance.patch(`/tasks/${taskId}/status`, { status: newStatus });
      alert('Task status updated!');
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task status.');
      console.error('Error updating status:', err);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading tasks...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {isManager ? 'All Tasks' : 'My Assigned Tasks'}
      </h1>

      {isManager && (
        <button
          onClick={() => {
            setShowTaskForm(true);
            setCurrentTask(null);
            setFormState({
              title: '', description: '', priority: 'Medium', dueDate: '', assignedTo: '', status: 'Pending'
            });
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md mb-6 transition duration-300"
        >
          Create New Task
        </button>
      )}

      {showTaskForm && isManager && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {currentTask ? 'Edit Task' : 'Create New Task'}
          </h2>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}
          <form onSubmit={handleCreateOrUpdateTask} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
              <input type="text" name="title" id="title" value={formState.title} onChange={handleFormChange} required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea name="description" id="description" value={formState.description} onChange={handleFormChange}
                rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
            </div>
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
              <select name="priority" id="priority" value={formState.priority} onChange={handleFormChange} required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
              <input type="date" name="dueDate" id="dueDate" value={formState.dueDate} onChange={handleFormChange} required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">Assign To</label>
              <select name="assignedTo" id="assignedTo" value={formState.assignedTo} onChange={handleFormChange} required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.email}</option>
                ))}
              </select>
            </div>
            {currentTask && ( // Manager can also change status when editing
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                <select name="status" id="status" value={formState.status} onChange={handleFormChange} required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            )}
            <div className="md:col-span-2 flex justify-end space-x-3 mt-4">
              <button type="button" onClick={() => setShowTaskForm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-md transition duration-300">
                Cancel
              </button>
              <button type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition duration-300">
                {currentTask ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      )}

      {tasks.length === 0 ? (
        <p className="text-gray-500 text-center text-lg">No tasks found.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                {isManager && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>}
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.priority}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(task.dueDate).toLocaleDateString()}</td>
                  {isManager && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.assignedTo?.email || 'N/A'}</td>}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {isManager ? (
                      <>
                        <button onClick={() => handleEditClick(task)} className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                        <button onClick={() => handleDeleteTask(task.id)} className="text-red-600 hover:text-red-900">Delete</button>
                      </>
                    ) : (
                      <select
                        value={task.status}
                        onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
