import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiUsers, FiDollarSign, FiPieChart, FiSettings, FiPlus, 
  FiMenu, FiX, FiBell, FiEdit, FiTrash2, FiLogOut,
  FiSun, FiMoon, FiSearch, FiRefreshCw, FiArrowUp, FiArrowDown, FiBarChart2
} from 'react-icons/fi';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import './AdminDashboard.css';
import { apiRequest } from '../api';
import Report from './Report';
import Users from './Users';
import UniversityAnalytics from './UniversityAnalytics';

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, []);
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // Check if we're on mobile first
    if (window.innerWidth < 1025) return false;
    // Otherwise, get the saved preference or default to true
    return localStorage.getItem('sidebarCollapsed') !== 'true';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1025);
  
  // Handle window resize and device detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1025; // 1025px and above is considered desktop
      setIsMobile(mobile);
      
      if (mobile) {
        // On mobile, collapse the sidebar by default
        setIsSidebarOpen(false);
        document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'auto';
      } else {
        // On desktop, show the sidebar by default
        const savedState = localStorage.getItem('sidebarCollapsed');
        setIsSidebarOpen(savedState !== 'true');
        setIsMobileMenuOpen(false);
        document.body.style.overflow = 'auto';
      }
    };
    
    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = 'auto';
    };
  }, [isMobileMenuOpen]);
  
  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isMobileMenuOpen && !e.target.closest('.sidebar') && !e.target.closest('.mobile-menu-toggle')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);
  
  const toggleSidebar = () => {
    if (isMobile) {
      // On mobile, toggle the mobile menu
      const newMobileState = !isMobileMenuOpen;
      setIsMobileMenuOpen(newMobileState);
      document.body.style.overflow = newMobileState ? 'hidden' : 'auto';
    } else {
      // On desktop, toggle between expanded and collapsed states
      const newState = !isSidebarOpen;
      setIsSidebarOpen(newState);
      localStorage.setItem('sidebarCollapsed', !newState);
    }
  };
  
  // Update body overflow when mobile menu is open/closed
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMobileMenuOpen, isMobile]);
  
  const closeMobileMenu = () => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };
  const [selectedSection, setSelectedSection] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Get page title based on selected section
  const getPageTitle = useCallback(() => {
    switch (selectedSection) {
      case 'dashboard':
        return 'Dashboard';
      case 'restaurants':
        return 'Restaurants';
      case 'users':
        return 'Users';
      case 'logs':
        return 'Meal Logs';
      case 'report':
        return 'Reports';
      case 'university':
        return 'University Analytics';
      case 'settings':
        return 'Settings';
      default:
        return 'Dashboard';
    }
  }, [selectedSection]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // User State
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  
  // Data State
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState('');
  
  const [reports, setReports] = useState({
    totalUsers: 0,
    dailyTransactions: 0,
    monthlyRevenue: 'Frw 0',
    activeUsers: 0,
    weeklyGrowth: 0,
  });
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportsError, setReportsError] = useState('');
  
  const [restaurants, setRestaurants] = useState([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [restaurantsError, setRestaurantsError] = useState('');
  
  const [newRestaurant, setNewRestaurant] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    mealPrice: '', 
    devices: '' 
  });
  
  const [restaurantFormError, setRestaurantFormError] = useState('');
  const [restaurantFormSuccess, setRestaurantFormSuccess] = useState('');
  
  const [editRestaurant, setEditRestaurant] = useState(null);
  const [editForm, setEditForm] = useState({ 
    name: '', 
    email: '', 
    mealPrice: '', 
    devices: '' 
  });
  
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  
  const [mealLogs, setMealLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState('');
  
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [adminsError, setAdminsError] = useState('');
  
  const [newAdmin, setNewAdmin] = useState({ 
    username: '', 
    password: '' 
  });
  
  const [adminFormError, setAdminFormError] = useState('');
  const [adminFormSuccess, setAdminFormSuccess] = useState('');
  
  // New Client Form State
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    idNumber: '',
    cardNumber: '',
    yearOfStudy: '',
    fieldOfStudy: ''
  });
  const [addingClient, setAddingClient] = useState(false);
  const [clientFormError, setClientFormError] = useState('');
  const [clientFormSuccess, setClientFormSuccess] = useState('');
  
  // Chart data state
  const [revenueChartData, setRevenueChartData] = useState({
    labels: [],
    datasets: [{
      label: 'Monthly Revenue (Frw)',
      data: [],
      backgroundColor: '#667eea',
      borderColor: '#4c51bf',
      borderWidth: 1,
    }],
  });
  
  const [userActivityData, setUserActivityData] = useState({
    labels: ['Active', 'Inactive'],
    datasets: [{
      data: [0, 0],
      backgroundColor: ['#48bb78', '#e2e8f0'],
      hoverBackgroundColor: ['#38a169', '#cbd5e0'],
    }],
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // Memoized filtered data
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(restaurant => 
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [restaurants, searchQuery]);

  const filteredAdmins = useMemo(() => {
    return admins.filter(admin => 
      admin.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [admins, searchQuery]);

  const filteredLogs = useMemo(() => {
    return mealLogs.filter(log => 
      (log.clientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.restaurantName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [mealLogs, searchQuery]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [users, searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };



  // Data fetching functions
  const fetchRestaurants = useCallback(async () => {
    try {
      setLoadingRestaurants(true);
      setRestaurantsError('');
      const data = await apiRequest('/admin/restaurants', {
        method: 'GET',
        token: localStorage.getItem('token'),
      });
      setRestaurants(data);
    } catch (err) {
      setRestaurantsError(err.message || 'Failed to fetch restaurants.');
    } finally {
      setLoadingRestaurants(false);
    }
  }, []);

  const fetchMealLogs = useCallback(async () => {
    try {
      setLoadingLogs(true);
      setLogsError('');
      const data = await apiRequest('/admin/logs', {
        method: 'GET',
        token: localStorage.getItem('token'),
      });
      setMealLogs(data);
    } catch (err) {
      setLogsError(err.message || 'Failed to fetch meal logs.');
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  const fetchAdmins = useCallback(async () => {
    try {
      setLoadingAdmins(true);
      setAdminsError('');
      const data = await apiRequest('/admin/admins', {
        method: 'GET',
        token: localStorage.getItem('token'),
      });
      setAdmins(data);
    } catch (err) {
      setAdminsError(err.message || 'Failed to fetch admins.');
    } finally {
      setLoadingAdmins(false);
    }
  }, []);

  // Fetch clients/users data
  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      setUsersError('');
      const data = await apiRequest('/client', {
        method: 'GET',
        token: localStorage.getItem('token'),
      });
      setUsers(data);
    } catch (err) {
      setUsersError(err.message || 'Failed to fetch users.');
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Fetch dashboard statistics
  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoadingReports(true);
      setReportsError('');
      
      // Fetch all necessary data
      const [clients, logs, restaurants] = await Promise.all([
        apiRequest('/client', { method: 'GET', token: localStorage.getItem('token') }),
        apiRequest('/admin/logs', { method: 'GET', token: localStorage.getItem('token') }),
        apiRequest('/admin/restaurants', { method: 'GET', token: localStorage.getItem('token') })
      ]);

      // Calculate statistics
      const totalUsers = clients.length;
      const dailyTransactions = logs.filter(log => {
        const logDate = new Date(log.timestamp);
        const today = new Date();
        return logDate.toDateString() === today.toDateString();
      }).length;
      
      const monthlyRevenue = logs.reduce((total, log) => {
        const logDate = new Date(log.timestamp);
        const now = new Date();
        if (logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear()) {
          return total + (log.initialBalance - log.remainingBalance);
        }
        return total;
      }, 0);

      const activeUsers = clients.filter(client => 
        client.subscriptions && client.subscriptions.some(sub => sub.balance > 0)
      ).length;

      // Calculate weekly growth (simple calculation)
      const lastWeekLogs = logs.filter(log => {
        const logDate = new Date(log.timestamp);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return logDate >= weekAgo;
      }).length;
      
      const previousWeekLogs = logs.filter(log => {
        const logDate = new Date(log.timestamp);
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return logDate >= twoWeeksAgo && logDate < weekAgo;
      }).length;

      const weeklyGrowth = previousWeekLogs > 0 
        ? Math.round(((lastWeekLogs - previousWeekLogs) / previousWeekLogs) * 100)
        : lastWeekLogs > 0 ? 100 : 0;

      setReports({
        totalUsers,
        dailyTransactions,
        monthlyRevenue: `Frw ${monthlyRevenue.toLocaleString()}`,
        activeUsers,
        weeklyGrowth,
      });

    } catch (err) {
      setReportsError(err.message || 'Failed to fetch dashboard statistics.');
    } finally {
      setLoadingReports(false);
    }
  }, []);

  // Fetch chart data
  const fetchChartData = useCallback(async () => {
    try {
      const logs = await apiRequest('/admin/logs', {
        method: 'GET',
        token: localStorage.getItem('token'),
      });

      // Generate monthly revenue data for the last 6 months
      const months = [];
      const revenueData = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(month.toLocaleDateString('en-US', { month: 'short' }));
        
        const monthRevenue = logs.reduce((total, log) => {
          const logDate = new Date(log.timestamp);
          if (logDate.getMonth() === month.getMonth() && logDate.getFullYear() === month.getFullYear()) {
            return total + (log.initialBalance - log.remainingBalance);
          }
          return total;
        }, 0);
        
        revenueData.push(monthRevenue);
      }

      setRevenueChartData({
        labels: months,
        datasets: [{
          label: 'Monthly Revenue (Frw)',
          data: revenueData,
          backgroundColor: '#667eea',
          borderColor: '#4c51bf',
          borderWidth: 1,
        }],
      });

      // Update user activity data
      const clients = await apiRequest('/client', {
        method: 'GET',
        token: localStorage.getItem('token'),
      });

      const activeUsers = clients.filter(client => 
        client.subscriptions && client.subscriptions.some(sub => sub.balance > 0)
      ).length;

      setUserActivityData({
        labels: ['Active', 'Inactive'],
        datasets: [{
          data: [activeUsers, clients.length - activeUsers],
          backgroundColor: ['#48bb78', '#e2e8f0'],
          hoverBackgroundColor: ['#38a169', '#cbd5e0'],
        }],
      });

    } catch (err) {
      console.error('Failed to fetch chart data:', err);
    }
  }, []);

  // Fetch recent activity
  const fetchRecentActivity = useCallback(async () => {
    try {
      setLoadingActivity(true);
      const logs = await apiRequest('/admin/logs', {
        method: 'GET',
        token: localStorage.getItem('token'),
      });

      // Get the 5 most recent logs and format them
      const recentLogs = logs
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5)
        .map((log, index) => {
          const timeAgo = getTimeAgo(new Date(log.timestamp));
          const balanceDifference = log.initialBalance - log.remainingBalance;
          const isTopup = balanceDifference < 0;
          const amount = log.initialBalance && log.remainingBalance 
            ? `Frw ${Math.abs(balanceDifference)}`
            : '';
          
          return {
            id: index + 1,
            user: log.clientName || 'Unknown',
            action: isTopup ? 'Topped up' : 'Purchased meal',
            time: timeAgo,
            amount: amount,
            isTopup: isTopup,
          };
        });

      setRecentActivity(recentLogs);
    } catch (err) {
      console.error('Failed to fetch recent activity:', err);
    } finally {
      setLoadingActivity(false);
    }
  }, []);

  // Helper function to calculate time ago
  const getTimeAgo = (date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  // Fetch current user information
  const fetchCurrentUser = useCallback(async () => {
    try {
      setUserLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setUserLoading(false);
        return;
      }
      
      // Decode JWT token to get user info
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id;
      
      // Fetch user details from admins list
      const admins = await apiRequest('/admin/admins', {
        method: 'GET',
        token: token,
      });
      
      const user = admins.find(admin => admin._id === userId);
      if (user) {
        setCurrentUser({ ...user, role: 'admin' });
      }
    } catch (err) {
      console.error('Failed to fetch current user:', err);
    } finally {
      setUserLoading(false);
    }
  }, []);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    // Redirect to login page
    window.location.href = '/login';
  };

  // Calculate restaurant amount (total revenue from meal logs)
  const calculateRestaurantAmount = (restaurant) => {
    // This is a placeholder - in a real implementation, you would calculate this from meal logs
    // For now, we'll return a calculated value based on meal price and some mock data
    const mockTransactionCount = Math.floor(Math.random() * 100) + 50; // Random between 50-150
    return restaurant.mealPrice * mockTransactionCount;
  };

  // Form handlers
  const handleAddRestaurant = async (e) => {
    e.preventDefault();
    setRestaurantFormError('');
    setRestaurantFormSuccess('');
    
    if (!newRestaurant.name || !newRestaurant.email || !newRestaurant.password) {
      setRestaurantFormError('Please fill all required fields');
      return;
    }

    try {
      setIsLoading(true);
      await apiRequest('/admin/restaurants', {
        method: 'POST',
        body: { 
          ...newRestaurant, 
          mealPrice: Number(newRestaurant.mealPrice), 
          devices: newRestaurant.devices.split(',').map(d => d.trim()).filter(d => d.length > 0).map(deviceId => ({ deviceId }))
        },
        token: localStorage.getItem('token'),
      });
      setRestaurantFormSuccess('Restaurant created successfully!');
      setNewRestaurant({ name: '', email: '', password: '', mealPrice: '', devices: '' });
      await fetchRestaurants();
    } catch (err) {
      setRestaurantFormError(err.message || 'Failed to create restaurant.');
    } finally {
      setIsLoading(false);
    }
  };

  // Client form handlers
  const handleNewClientChange = (e) => {
    const { name, value } = e.target;
    setNewClient(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    setClientFormError('');
    setClientFormSuccess('');
    
    if (!newClient.name || !newClient.email || !newClient.phone || !newClient.idNumber || !newClient.cardNumber || !newClient.yearOfStudy || !newClient.fieldOfStudy) {
      setClientFormError('Please fill all required fields');
      return;
    }

    try {
      setAddingClient(true);
      await apiRequest('/client', {
        method: 'POST',
        body: newClient,
        token: localStorage.getItem('token'),
      });
      setClientFormSuccess('Client created successfully!');
      setNewClient({
        name: '',
        email: '',
        phone: '',
        idNumber: '',
        cardNumber: '',
        yearOfStudy: '',
        fieldOfStudy: ''
      });
      // Refresh users list to show the new client
      await fetchUsers();
    } catch (err) {
      setClientFormError(err.message || 'Failed to create client.');
    } finally {
      setAddingClient(false);
    }
  };

     const startEditRestaurant = (restaurant) => {
     setEditRestaurant(restaurant._id);
     setEditForm({
       name: restaurant.name,
       email: restaurant.email,
       mealPrice: restaurant.mealPrice,
       devices: Array.isArray(restaurant.devices)
         ? restaurant.devices.map(d => d.deviceId || d).join(', ')
         : ''
     });
     setEditError('');
     setEditSuccess('');
   };

  const handleEditRestaurant = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');
    
    try {
      setIsLoading(true);
      await apiRequest(`/admin/restaurants/${editRestaurant}`, {
        method: 'PUT',
        body: {
          ...editForm,
          mealPrice: Number(editForm.mealPrice),
          devices: editForm.devices.split(',').map(d => d.trim()).filter(d => d.length > 0).map(deviceId => ({ deviceId })),
        },
        token: localStorage.getItem('token'),
      });
      setEditSuccess('Restaurant updated successfully!');
      setEditRestaurant(null);
      await fetchRestaurants();
    } catch (err) {
      setEditError(err.message || 'Failed to update restaurant.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRestaurant = async (id) => {
    if (!window.confirm('Are you sure you want to delete this restaurant?')) return;
    
    try {
      setIsLoading(true);
      await apiRequest(`/admin/restaurants/${id}`, {
        method: 'DELETE',
        token: localStorage.getItem('token'),
      });
      setRestaurants(restaurants.filter(r => r._id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete restaurant.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setAdminFormError('');
    setAdminFormSuccess('');
    
    if (!newAdmin.username || !newAdmin.password) {
      setAdminFormError('Please fill all required fields');
      return;
    }

    try {
      setIsLoading(true);
      await apiRequest('/auth/admin/signup', {
        method: 'POST',
        body: newAdmin,
        token: localStorage.getItem('token'),
      });
      setAdminFormSuccess('Admin created successfully!');
      setNewAdmin({ username: '', password: '' });
      await fetchAdmins();
    } catch (err) {
      if (err.status === 400) {
        setAdminFormError('Admin already exists.');
      } else {
        setAdminFormError(err.message || 'Failed to create admin.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAdmin = async (id) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    
    try {
      setIsLoading(true);
      await apiRequest(`/admin/admins/${id}`, {
        method: 'DELETE',
        token: localStorage.getItem('token'),
      });
      setAdmins(admins.filter(a => a._id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete admin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBalanceUpdate = async (userId, amount) => {
    try {
      // Find the user
      const user = users.find(u => u._id === userId);
      if (!user) return;

      // Find a restaurant to add balance to (you might want to show a restaurant selector)
      const restaurants = await apiRequest('/admin/restaurants', {
        method: 'GET',
        token: localStorage.getItem('token'),
      });

      if (restaurants.length > 0) {
        const restaurantId = restaurants[0]._id; // Use first restaurant for now
        
        await apiRequest(`/client/${userId}/balance`, {
          method: 'POST',
          body: { restaurantId, amount },
          token: localStorage.getItem('token'),
        });

        // Refresh users data
        fetchUsers();
      }
    } catch (err) {
      console.error('Failed to update balance:', err);
      alert('Failed to update balance: ' + err.message);
    }
  };

  // Fetch current user on component mount
  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Fetch dashboard data on component mount
  useEffect(() => {
    if (selectedSection === 'dashboard') {
      fetchDashboardStats();
      fetchChartData();
      fetchRecentActivity();
      fetchUsers();
    }
  }, [selectedSection, fetchDashboardStats, fetchChartData, fetchRecentActivity, fetchUsers]);

  // Fetch data when section changes
  useEffect(() => {
    if (selectedSection === 'restaurants') {
      fetchRestaurants();
    } else if (selectedSection === 'logs') {
      fetchMealLogs();
    } else if (selectedSection === 'users') {
      fetchAdmins();
    }
  }, [selectedSection, fetchRestaurants, fetchMealLogs, fetchAdmins]);

  return (
    <div className={`dashboard-container ${!isSidebarOpen && 'collapsed'} ${darkMode && 'dark-mode'}`}>
      {/* Mobile Menu Overlay */}
      <div 
        className={`mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={closeMobileMenu}
      />
      
      {/* Mobile Header */}
      {isMobile && (
        <div className="mobile-header">
          <button 
            className="mobile-menu-toggle"
            onClick={toggleSidebar}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <FiX /> : <FiMenu />}
          </button>
          <h3>Tape & Eat</h3>
        </div>
      )}
      
      {/* Sidebar */}
      <div className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''} ${!isMobile && isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Tape & Eat</h2>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item${selectedSection === 'dashboard' ? ' active' : ''}`} 
            onClick={() => setSelectedSection('dashboard')}
          >
            <FiPieChart /> {isSidebarOpen && 'Dashboard'}
          </button>
          
          <button 
            className={`nav-item${selectedSection === 'restaurants' ? ' active' : ''}`} 
            onClick={() => setSelectedSection('restaurants')}
          >
            <FiUsers /> {isSidebarOpen && 'Restaurants'}
          </button>
          
          <button 
            className={`nav-item${selectedSection === 'users' ? ' active' : ''}`} 
            onClick={() => setSelectedSection('users')}
          >
            <FiUsers /> {isSidebarOpen && 'Users'}
          </button>
          
          <button 
            className={`nav-item${selectedSection === 'logs' ? ' active' : ''}`} 
            onClick={() => setSelectedSection('logs')}
          >
            <FiPieChart /> {isSidebarOpen && 'Meal Logs'}
          </button>
          
          <button 
            className={`nav-item${selectedSection === 'report' ? ' active' : ''}`} 
            onClick={() => setSelectedSection('report')}
          >
            <FiPieChart style={{ marginRight: 8 }} />
            Report
          </button>
          
          <button 
            className={`nav-item${selectedSection === 'university' ? ' active' : ''}`} 
            onClick={() => setSelectedSection('university')}
          >
            <FiBarChart2 style={{ marginRight: 8 }} />
            University Analytics
          </button>
          
          <button 
            className={`nav-item${selectedSection === 'settings' ? ' active' : ''}`} 
            onClick={() => setSelectedSection('settings')}
          >
            <FiSettings /> {isSidebarOpen && 'Settings'}
          </button>
        </nav>
        
        <div className="sidebar-footer">
          <button 
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <FiSun /> : <FiMoon />}
            {isSidebarOpen && (darkMode ? 'Light Mode' : 'Dark Mode')}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Navigation */}
        <div className="top-navbar">
          <div className="nav-left">
            {!isMobile && (
              <button 
                className="desktop-menu-toggle"
                onClick={toggleSidebar}
                aria-label="Toggle sidebar"
              >
                {isSidebarOpen ? <FiX /> : <FiMenu />}
              </button>
            )}
            <h3>{getPageTitle()}</h3>
          </div>
          
          <div className="nav-right">
            <div className="search-bar">
              <FiSearch className="search-icon" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <button className="notification-btn" aria-label="Notifications">
              <FiBell size={20} />
              <span className="notification-badge">3</span>
            </button>
            
            <div 
              className="profile-section" 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              role="button"
              tabIndex={0}
              aria-expanded={isProfileMenuOpen}
              onKeyDown={(e) => e.key === 'Enter' && setIsProfileMenuOpen(!isProfileMenuOpen)}
            >
              <div className="profile-default">
                {userLoading ? (
                  <FiRefreshCw className="spinner" />
                ) : currentUser ? (
                  <div className="user-info">
                    <span className="user-name">{currentUser.username}</span>
                    <span className="user-role">Admin</span>
                  </div>
                ) : (
                  <FiUsers />
                )}
              </div>
              
              {isProfileMenuOpen && (
                <div className="profile-dropdown">
                  {currentUser && (
                    <div className="user-details">
                      <div className="user-name">{currentUser.username}</div>
                      <div className="user-role">Administrator</div>
                    </div>
                  )}
                  <button onClick={() => setSelectedSection('settings')}>
                    <FiSettings /> Settings
                  </button>
                  <button onClick={handleLogout}>
                    <FiLogOut /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {selectedSection === 'dashboard' && (
            <>
              <div className="stats-grid">
                {/* Stats Cards */}
                <div className="stats-card">
                  <div className="stats-icon-container">
                    <FiUsers className="stats-icon" />
                  </div>
                  <div className="stats-info">
                    <h4>Total Users</h4>
                    {loadingReports ? (
                      <p><FiRefreshCw className="spinner" /> Loading...</p>
                    ) : (
                      <>
                        <p>{reports.totalUsers}</p>
                        <span className={`stats-trend ${reports.weeklyGrowth >= 0 ? 'positive' : 'negative'}`}>
                          {reports.weeklyGrowth >= 0 ? <FiArrowUp /> : <FiArrowDown />}
                          {Math.abs(reports.weeklyGrowth)}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="stats-card">
                  <div className="stats-icon-container">
                    <FiUsers className="stats-icon" />
                  </div>
                  <div className="stats-info">
                    <h4>Active Users</h4>
                    {loadingReports ? (
                      <p><FiRefreshCw className="spinner" /> Loading...</p>
                    ) : (
                      <>
                        <p>{reports.activeUsers}</p>
                        <span className="stats-trend positive">
                          <FiArrowUp /> {reports.totalUsers > 0 ? Math.round((reports.activeUsers / reports.totalUsers) * 100) : 0}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="stats-card">
                  <div className="stats-icon-container">
                    <FiDollarSign className="stats-icon" />
                  </div>
                  <div className="stats-info">
                    <h4>Daily Transactions</h4>
                    {loadingReports ? (
                      <p><FiRefreshCw className="spinner" /> Loading...</p>
                    ) : (
                      <>
                        <p>{reports.dailyTransactions}</p>
                        <span className="stats-trend positive">
                          <FiArrowUp /> Today
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="stats-card">
                  <div className="stats-icon-container">
                    <FiDollarSign className="stats-icon" />
                  </div>
                  <div className="stats-info">
                    <h4>Monthly Revenue</h4>
                    {loadingReports ? (
                      <p><FiRefreshCw className="spinner" /> Loading...</p>
                    ) : (
                      <>
                        <p>Frw {reports.monthlyRevenue.toLocaleString()}</p>
                        <span className="stats-trend positive">
                          <FiArrowUp /> This Month
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="charts-section">
                <div className="chart-card">
                  <h3>Monthly Revenue</h3>
                  <div className="chart-container">
                    <Bar 
                      data={revenueChartData} 
                      options={{ 
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                        },
                      }} 
                    />
                  </div>
                </div>
                
                <div className="chart-card">
                  <h3>User Activity</h3>
                  <div className="chart-container">
                    <Pie 
                      data={userActivityData} 
                      options={{ 
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                        },
                      }} 
                    />
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="recent-activity">
                <div className="activity-header">
                  <h3>Recent Activity</h3>
                  <button 
                    className="btn btn-outline" 
                    onClick={() => {
                      fetchRecentActivity();
                      fetchDashboardStats();
                      fetchChartData();
                    }}
                    disabled={loadingActivity}
                  >
                    <FiRefreshCw /> {loadingActivity ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
                <div className="activity-list">
                  {loadingActivity ? (
                    <div className="activity-item">
                      <div className="activity-icon">
                        <FiRefreshCw className="spinner" />
                      </div>
                      <div className="activity-details">
                        <div className="activity-title">Loading recent activity...</div>
                      </div>
                    </div>
                  ) : recentActivity.length === 0 ? (
                    <div className="activity-item">
                      <div className="activity-icon">
                        <FiUsers />
                      </div>
                      <div className="activity-details">
                        <div className="activity-title">No recent activity</div>
                      </div>
                    </div>
                  ) : (
                    recentActivity.map(activity => (
                      <div className="activity-item" key={activity.id}>
                        <div className="activity-icon">
                          <FiUsers />
                        </div>
                        <div className="activity-details">
                          <div className="activity-title">
                            <strong>{activity.user}</strong> {activity.action}
                          </div>
                          <div className="activity-meta">
                            <span>{activity.time}</span>
                            {activity.amount && <span className="activity-amount">{activity.amount}</span>}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add Client Form */}
              <div className="add-client-form">
                <h3>Add New Client</h3>
                <form onSubmit={handleAddClient} className="form-card">
                  {/* Error and Success Messages */}
                  {clientFormError && (
                    <div className="error-message">
                      <p>{clientFormError}</p>
                    </div>
                  )}
                  {clientFormSuccess && (
                    <div className="success-message">
                      <p>{clientFormSuccess}</p>
                    </div>
                  )}
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Name</label>
                      <input 
                        type="text" 
                        name="name"
                        value={newClient.name} 
                        onChange={handleNewClientChange} 
                        required 
                        placeholder="Enter client name"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Email</label>
                      <input 
                        type="email" 
                        name="email"
                        value={newClient.email} 
                        onChange={handleNewClientChange} 
                        required 
                        placeholder="Enter email address"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Phone</label>
                      <input 
                        type="tel" 
                        name="phone"
                        value={newClient.phone} 
                        onChange={handleNewClientChange} 
                        required 
                        placeholder="Enter phone number"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>ID Number</label>
                      <input 
                        type="text" 
                        name="idNumber"
                        value={newClient.idNumber} 
                        onChange={handleNewClientChange} 
                        required 
                        placeholder="Enter ID number"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Card Number</label>
                      <input 
                        type="text" 
                        name="cardNumber"
                        value={newClient.cardNumber} 
                        onChange={handleNewClientChange} 
                        required 
                        placeholder="Enter card number"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Year of Study</label>
                      <select 
                        name="yearOfStudy"
                        value={newClient.yearOfStudy} 
                        onChange={handleNewClientChange} 
                        required 
                      >
                        <option value="">Select year</option>
                        <option value="Y1">Y1 - First Year</option>
                        <option value="Y2">Y2 - Second Year</option>
                        <option value="Y3">Y3 - Third Year</option>
                        <option value="Y4">Y4 - Fourth Year</option>
                        <option value="Y5+">Y5+ - Fifth Year+</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Field of Study</label>
                      <input 
                        type="text" 
                        name="fieldOfStudy"
                        value={newClient.fieldOfStudy} 
                        onChange={handleNewClientChange} 
                        required 
                        placeholder="e.g., IT, Engineering, Medicine"
                      />
                    </div>
                  </div>
                  
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={addingClient}>
                      {addingClient ? <FiRefreshCw className="spinner" /> : <FiPlus />}
                      {addingClient ? 'Adding Client...' : 'Add Client'}
                    </button>
                  </div>
                </form>
              </div>

              {/* User Balances */}
              <div className="user-balances">
                <h3>User Balances</h3>
                <div className="table-container">
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Year</th>
                          <th>Field</th>
                          <th>Balance</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingUsers ? (
                          <tr>
                            <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                              <FiRefreshCw className="spinner" /> Loading users...
                            </td>
                          </tr>
                        ) : usersError ? (
                          <tr>
                            <td colSpan="7" style={{ textAlign: 'center', color: 'var(--error-color)' }}>
                              {usersError}
                            </td>
                          </tr>
                        ) : filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                              No users found
                            </td>
                          </tr>
                        ) : (
                          paginatedUsers.map(user => {
                            // Calculate total balance across all subscriptions
                            const totalBalance = user.subscriptions 
                              ? user.subscriptions.reduce((total, sub) => total + (sub.balance || 0), 0)
                              : 0;
                            
                            // Count total meals (this would need to be calculated from meal logs)
                            const mealCount = 0; // Placeholder - would need to count from meal logs
                            
                            // Get last active date from subscriptions or use a default
                            const lastActive = user.subscriptions && user.subscriptions.length > 0
                              ? new Date().toLocaleDateString() // Placeholder - would need real last active data
                              : 'Never';

                            return (
                              <tr key={user._id}>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>{user.phone}</td>
                                <td>{user.yearOfStudy || '-'}</td>
                                <td>{user.fieldOfStudy || '-'}</td>
                                <td>Frw {totalBalance.toLocaleString()}</td>
                                <td className="actions">
                                  <button 
                                    className="btn btn-outline btn-sm"
                                    onClick={() => handleBalanceUpdate(user._id, 500)}
                                  >
                                    +500
                                  </button>
                                  <button 
                                    className="btn btn-outline btn-sm"
                                    onClick={() => handleBalanceUpdate(user._id, -500)}
                                  >
                                    -500
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="pagination">
                    <button 
                      className="btn btn-outline" 
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                    >
                      First
                    </button>
                    <button 
                      className="btn btn-outline" 
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button 
                        key={page} 
                        className={`btn ${currentPage === page ? 'active' : 'outline'}`} 
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button 
                      className="btn btn-outline" 
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                    <button 
                      className="btn btn-outline" 
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      Last
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {selectedSection === 'restaurants' && (
            <div className="section-container">
              <div className="section-header">
                <h2>Restaurant Management</h2>
                <div className="section-actions">
                  <span className="results-count">
                    Showing {filteredRestaurants.length} of {restaurants.length} restaurants
                  </span>
                </div>
              </div>
              
              <form onSubmit={handleAddRestaurant} className="form-card">
                <h3>Add New Restaurant</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Name</label>
                    <input 
                      type="text" 
                      value={newRestaurant.name} 
                      onChange={e => setNewRestaurant({ ...newRestaurant, name: e.target.value })} 
                      required 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Email</label>
                    <input 
                      type="email" 
                      value={newRestaurant.email} 
                      onChange={e => setNewRestaurant({ ...newRestaurant, email: e.target.value })} 
                      required 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Password</label>
                    <input 
                      type="password" 
                      value={newRestaurant.password} 
                      onChange={e => setNewRestaurant({ ...newRestaurant, password: e.target.value })} 
                      required 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Meal Price</label>
                    <input 
                      type="number" 
                      value={newRestaurant.mealPrice} 
                      onChange={e => setNewRestaurant({ ...newRestaurant, mealPrice: e.target.value })} 
                      required 
                    />
                  </div>
                  
                                     <div className="form-group">
                     <label>Devices (comma separated device IDs)</label>
                     <input 
                       type="text" 
                       value={newRestaurant.devices} 
                       onChange={e => setNewRestaurant({ ...newRestaurant, devices: e.target.value })} 
                       placeholder="e.g., ABCD3444, EFGH5678, IJKL9012"
                     />
                   </div>
                </div>
                
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? 'Processing...' : 'Add Restaurant'}
                </button>
                
                {restaurantFormError && <div className="error-message">{restaurantFormError}</div>}
                {restaurantFormSuccess && <div className="success-message">{restaurantFormSuccess}</div>}
              </form>
              
              {loadingRestaurants ? (
                <div className="loading-state">
                  <FiRefreshCw className="spinner" /> Loading restaurants...
                </div>
              ) : restaurantsError ? (
                <div className="error-state">
                  {restaurantsError}
                  <button className="btn btn-outline" onClick={fetchRestaurants}>
                    <FiRefreshCw /> Retry
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Meal Price</th>
                        <th>Amount</th>
                        <th>Devices</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRestaurants.map((restaurant) => (
                        editRestaurant === restaurant._id ? (
                          <tr key={restaurant._id}>
                            <td colSpan="6">
                              <form onSubmit={handleEditRestaurant} className="edit-form">
                                <div className="form-grid">
                                  <div className="form-group">
                                    <input 
                                      type="text" 
                                      value={editForm.name} 
                                      onChange={e => setEditForm({ ...editForm, name: e.target.value })} 
                                      required 
                                    />
                                  </div>
                                  
                                  <div className="form-group">
                                    <input 
                                      type="email" 
                                      value={editForm.email} 
                                      onChange={e => setEditForm({ ...editForm, email: e.target.value })} 
                                      required 
                                    />
                                  </div>
                                  
                                  <div className="form-group">
                                    <input 
                                      type="number" 
                                      value={editForm.mealPrice} 
                                      onChange={e => setEditForm({ ...editForm, mealPrice: e.target.value })} 
                                      required 
                                    />
                                  </div>
                                  
                                                                     <div className="form-group">
                                     <input 
                                       type="text" 
                                       value={editForm.devices} 
                                       onChange={e => setEditForm({ ...editForm, devices: e.target.value })} 
                                       placeholder="e.g., ABCD3444, EFGH5678"
                                     />
                                   </div>
                                  
                                  <div className="form-group actions">
                                    <button type="submit" className="btn btn-primary btn-sm" disabled={isLoading}>
                                      Save
                                    </button>
                                    <button 
                                      type="button" 
                                      className="btn btn-outline btn-sm" 
                                      onClick={() => setEditRestaurant(null)}
                                      disabled={isLoading}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </form>
                            </td>
                          </tr>
                        ) : (
                          <tr key={restaurant._id}>
                            <td>{restaurant.name}</td>
                            <td>{restaurant.email}</td>
                            <td>Frw {restaurant.mealPrice}</td>
                            <td>Frw {calculateRestaurantAmount(restaurant).toLocaleString()}</td>
                                                         <td>
                               {Array.isArray(restaurant.devices)
                                 ? restaurant.devices.map(d => d.deviceId || d).join(', ')
                                 : ''}
                             </td>
                            <td className="actions">
                              <button 
                                className="btn btn-outline btn-sm"
                                onClick={() => startEditRestaurant(restaurant)}
                              >
                                <FiEdit /> Edit
                              </button>
                              <button 
                                className="btn btn-outline btn-sm"
                                onClick={() => handleDeleteRestaurant(restaurant._id)}
                              >
                                <FiTrash2 /> Delete
                              </button>
                            </td>
                          </tr>
                        )
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {editError && <div className="error-message">{editError}</div>}
              {editSuccess && <div className="success-message">{editSuccess}</div>}
            </div>
          )}

{selectedSection === 'users' && <Users />}

          {selectedSection === 'logs' && (
            <div className="section-container">
              <div className="section-header">
                <h2>Meal Logs</h2>
                <div className="section-actions">
                  <span className="results-count">
                    Showing {filteredLogs.length} of {mealLogs.length} logs
                  </span>
                </div>
              </div>
              
              {loadingLogs ? (
                <div className="loading-state">
                  <FiRefreshCw className="spinner" /> Loading meal logs...
                </div>
              ) : logsError ? (
                <div className="error-state">
                  {logsError}
                  <button className="btn btn-outline" onClick={fetchMealLogs}>
                    <FiRefreshCw /> Retry
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Client</th>
                        <th>Restaurant</th>
                        <th>Meal</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log) => (
                        <tr key={log._id}>
                          <td>{log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</td>
                          <td>{log.clientName || (log.client && typeof log.client === 'object' ? log.client.name : log.client) || ''}</td>
                          <td>{log.restaurantName || (log.restaurant && typeof log.restaurant === 'object' ? log.restaurant.name : log.restaurant) || ''}</td>
                          <td>{log.mealName || log.meal || 'Meal'}</td>
                          <td>{log.initialBalance && log.remainingBalance ? `Frw ${log.initialBalance - log.remainingBalance}` : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {selectedSection === 'report' && (
            <Report />
          )}

          {selectedSection === 'university' && (
            <UniversityAnalytics />
          )}

          {selectedSection === 'settings' && (
            <div className="section-container">
              <h2>Settings</h2>
              <div className="settings-grid">
                <div className="settings-card">
                  <h3>System Settings</h3>
                  <div className="form-group">
                    <label>Default Meal Price</label>
                    <input type="number" placeholder="Enter default price" />
                  </div>
                  <div className="form-group">
                    <label>Daily Meal Limit</label>
                    <input type="number" placeholder="Enter daily limit" />
                  </div>
                  <button className="btn btn-primary">Save Settings</button>
                </div>
                
                <div className="settings-card">
                  <h3>Account Settings</h3>
                  <div className="form-group">
                    <label>Change Password</label>
                    <input type="password" placeholder="Current password" />
                    <input type="password" placeholder="New password" />
                    <input type="password" placeholder="Confirm new password" />
                  </div>
                  <button className="btn btn-primary">Update Password</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;