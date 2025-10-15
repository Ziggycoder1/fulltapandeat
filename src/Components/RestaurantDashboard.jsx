import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FiUsers, FiDollarSign, FiPieChart, FiSettings, FiMenu, FiX, FiBell, FiEdit, FiCreditCard, FiArrowUpCircle, FiRefreshCw, FiLogOut, FiArrowUp, FiArrowDown, FiSun, FiMoon } from 'react-icons/fi';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import './AdminDashboard.css';
import { apiRequest } from '../api';
import { useNavigate } from 'react-router-dom';
import RestaurantReport from './RestaurantReport';
import RestaurantAnalytics from './RestaurantAnalytics';

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

const RestaurantDashboard = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, []);
  // UI state (aligned with AdminDashboard responsiveness)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1025) return false;
    const saved = localStorage.getItem('sidebarCollapsedRestaurant');
    return saved ? saved !== 'true' : true;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1025 : false);
  const [selectedSection, setSelectedSection] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  
  // User State
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientsError, setClientsError] = useState('');
  const [newClient, setNewClient] = useState({ name: '', phone: '', idNumber: '', cardNumber: '', yearOfStudy: '', fieldOfStudy: '' });
  const [clientFormError, setClientFormError] = useState('');
  const [clientFormSuccess, setClientFormSuccess] = useState('');
  const [clientActionError, setClientActionError] = useState('');
  const [clientActionSuccess, setClientActionSuccess] = useState('');
  const [mealLogs, setMealLogs] = useState([]);
const [downloadMessage, setDownloadMessage] = useState('');
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState('');
  
  // Dashboard statistics state
  const [reports, setReports] = useState({
    totalClients: 0,
    dailyTransactions: 0,
    monthlyRevenue: 'Frw 0',
    activeClients: 0,
    weeklyGrowth: 0,
  });
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportsError, setReportsError] = useState('');
  
  // Chart data state
  const [revenueChartData, setRevenueChartData] = useState({
    labels: [],
    datasets: [{
      label: 'Daily Revenue (Frw)',
      data: [],
      backgroundColor: '#667eea',
      borderColor: '#4c51bf',
      borderWidth: 1,
    }],
  });
  
  const [clientActivityData, setClientActivityData] = useState({
    labels: ['Active', 'Inactive'],
    datasets: [{
      data: [0, 0],
      backgroundColor: ['#48bb78', '#e2e8f0'],
      hoverBackgroundColor: ['#38a169', '#cbd5e0'],
    }],
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  
  // Get restaurantId from current user or localStorage
  const [restaurantId, setRestaurantId] = useState(localStorage.getItem('restaurantId') || 'mock-restaurant-id');

  // Handle window resize and device detection (match AdminDashboard)
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1025;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
        document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'auto';
      } else {
        const savedState = localStorage.getItem('sidebarCollapsedRestaurant');
        setIsSidebarOpen(savedState !== 'true');
        setIsMobileMenuOpen(false);
        document.body.style.overflow = 'auto';
      }
    };
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

  // Update body overflow when mobile menu is open/closed
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isMobileMenuOpen, isMobile]);

  const toggleSidebar = () => {
    if (isMobile) {
      const next = !isMobileMenuOpen;
      setIsMobileMenuOpen(next);
      document.body.style.overflow = next ? 'hidden' : 'auto';
    } else {
      const next = !isSidebarOpen;
      setIsSidebarOpen(next);
      localStorage.setItem('sidebarCollapsedRestaurant', String(!next));
    }
  };

  const closeMobileMenu = () => {
    if (isMobile) setIsMobileMenuOpen(false);
  };

  // Tap & Balance state
  const [tapDeviceId, setTapDeviceId] = useState('');
  const [tapCardNumber, setTapCardNumber] = useState('');
  const [tapResult, setTapResult] = useState(null);
  const [tapError, setTapError] = useState('');
  const [tapLoading, setTapLoading] = useState(false);

  const [lookupCardNumber, setLookupCardNumber] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);

  // Register Card via MQTT state
  const [registerDeviceId, setRegisterDeviceId] = useState('');
  const [registerResult, setRegisterResult] = useState(null);
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);

  // Sync Device Data state
  const [syncDeviceId, setSyncDeviceId] = useState('');
  const [syncTaps, setSyncTaps] = useState([{ cardNumber: '', offlineDeducted: '' }]);
  const [syncResult, setSyncResult] = useState(null);
  const [syncError, setSyncError] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);

  // Settings state
  const [settingsForm, setSettingsForm] = useState({ name: '', email: '', mealPrice: '', password: '' });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Fetch dashboard statistics
  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoadingReports(true);
      setReportsError('');
      
      if (!restaurantId || restaurantId === 'mock-restaurant-id') {
        setLoadingReports(false);
        return;
      }
      
      // Fetch all necessary data
      const [clients, logs] = await Promise.all([
        apiRequest(`/restaurants/clients?restaurantId=${restaurantId}`, { 
          method: 'GET', 
          token: localStorage.getItem('token') 
        }),
        apiRequest(`/restaurants/logs?restaurantId=${restaurantId}`, { 
          method: 'GET', 
          token: localStorage.getItem('token') 
        })
      ]);

      // Calculate statistics
      const totalClients = clients.length;
      const dailyTransactions = logs.filter(log => {
        const logDate = new Date(log.timestamp);
        const today = new Date();
        return logDate.toDateString() === today.toDateString();
      }).length;
      
      const monthlyRevenue = logs.reduce((total, log) => {
        const logDate = new Date(log.timestamp);
        const now = new Date();
        // Only count successful meal purchases with positive deduction
        if (
          logDate.getMonth() === now.getMonth() &&
          logDate.getFullYear() === now.getFullYear() &&
          log.status === 'success'
        ) {
          const mealAmount = log.initialBalance - log.remainingBalance;
          return mealAmount > 0 ? total + mealAmount : total;
        }
        return total;
      }, 0);

      const activeClients = clients.filter(client => 
        client.subscriptions && client.subscriptions.some(sub => sub.balance > 0)
      ).length;

      // Calculate weekly growth
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
        totalClients,
        dailyTransactions,
        monthlyRevenue: `Frw ${monthlyRevenue.toLocaleString()}`,
        activeClients,
        weeklyGrowth,
      });

    } catch (err) {
      setReportsError(err.message || 'Failed to fetch dashboard statistics.');
    } finally {
      setLoadingReports(false);
    }
  }, [restaurantId]);

  // Fetch chart data
  const fetchChartData = useCallback(async () => {
    try {
      if (!restaurantId || restaurantId === 'mock-restaurant-id') return;
      
      const logs = await apiRequest(`/restaurants/logs?restaurantId=${restaurantId}`, {
        method: 'GET',
        token: localStorage.getItem('token'),
      });

      // Generate daily revenue data for the last 7 days
      const days = [];
      const revenueData = [];
      const now = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        days.push(day.toLocaleDateString('en-US', { weekday: 'short' }));
        
        const dayRevenue = logs.reduce((total, log) => {
          const logDate = new Date(log.timestamp);
          if (logDate.toDateString() === day.toDateString()) {
            return total + (log.initialBalance - log.remainingBalance);
          }
          return total;
        }, 0);
        
        revenueData.push(dayRevenue);
      }

      setRevenueChartData({
        labels: days,
        datasets: [{
          label: 'Daily Revenue (Frw)',
          data: revenueData,
          backgroundColor: '#667eea',
          borderColor: '#4c51bf',
          borderWidth: 1,
        }],
      });

      // Update client activity data
      const clients = await apiRequest(`/restaurants/clients?restaurantId=${restaurantId}`, {
        method: 'GET',
        token: localStorage.getItem('token'),
      });

      const activeClients = clients.filter(client => 
        client.subscriptions && client.subscriptions.some(sub => sub.balance > 0)
      ).length;

      setClientActivityData({
        labels: ['Active', 'Inactive'],
        datasets: [{
          data: [activeClients, clients.length - activeClients],
          backgroundColor: ['#48bb78', '#e2e8f0'],
          hoverBackgroundColor: ['#38a169', '#cbd5e0'],
        }],
      });

    } catch (err) {
      console.error('Failed to fetch chart data:', err);
    }
  }, [restaurantId]);



  // Update restaurantId when currentUser is set
  useEffect(() => {
    if (currentUser && currentUser._id) {
      setRestaurantId(currentUser._id);
      localStorage.setItem('restaurantId', currentUser._id);
    }
  }, [currentUser]);

  // Fetch dashboard data when section changes
  useEffect(() => {
    if (selectedSection === 'dashboard') {
      fetchDashboardStats();
      fetchChartData();
      fetchRecentActivity();
    } else if (selectedSection === 'clients') {
      setLoadingClients(true);
      setClientsError('');
      apiRequest(`/restaurants/clients?restaurantId=${restaurantId}`, {
        method: 'GET',
        token: localStorage.getItem('token'),
      })
        .then((data) => {
          setClients(data);
          setLoadingClients(false);
        })
        .catch((err) => {
          setClientsError(err.message || 'Failed to fetch clients.');
          setLoadingClients(false);
        });
    } else if (selectedSection === 'logs') {
      setLoadingLogs(true);
      setLogsError('');
      apiRequest(`/restaurants/logs?restaurantId=${restaurantId}`, {
        method: 'GET',
        token: localStorage.getItem('token'),
      })
        .then((data) => {
          setMealLogs(data);
          setLoadingLogs(false);
        })
        .catch((err) => {
          setLogsError(err.message || 'Failed to fetch meal logs.');
          setLoadingLogs(false);
        });
    }
  }, [selectedSection, restaurantId]);

  // Fetch current user information
  const fetchCurrentUser = async () => {
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
      
      // Fetch restaurant details
      const restaurants = await apiRequest('/admin/restaurants', {
        method: 'GET',
        token: token,
      });
      
      const user = restaurants.find(restaurant => restaurant._id === userId);
      if (user) {
        setCurrentUser({ ...user, role: 'restaurant' });
      }
    } catch (err) {
      console.error('Failed to fetch current user:', err);
    } finally {
      setUserLoading(false);
    }
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('restaurantId');
    setCurrentUser(null);
    navigate('/login');
  };

  // Fetch current user on component mount
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Fetch meal logs on component mount and when restaurantId changes
  useEffect(() => {
    if (restaurantId && restaurantId !== 'mock-restaurant-id') {
      setLoadingLogs(true);
      setLogsError('');
      apiRequest(`/restaurants/logs?restaurantId=${restaurantId}`, {
        method: 'GET',
        token: localStorage.getItem('token'),
      })
        .then((data) => {
          setMealLogs(data);
          setLoadingLogs(false);
        })
        .catch((err) => {
          setLogsError(err.message || 'Failed to fetch meal logs.');
          setLoadingLogs(false);
        });
    }
  }, [restaurantId]);

  // Fetch recent activity
  const fetchRecentActivity = useCallback(async () => {
    try {
      setLoadingActivity(true);
      if (!restaurantId || restaurantId === 'mock-restaurant-id') {
        setLoadingActivity(false);
        return;
      }
      
      const logs = await apiRequest(`/restaurants/logs?restaurantId=${restaurantId}`, {
        method: 'GET',
        token: localStorage.getItem('token'),
      });

      // Get the 5 most recent logs and format them
      const recentLogs = logs
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5)
        .map((log, index) => {
          const timeAgo = getTimeAgo(new Date(log.timestamp));
          const actionText = log.actionType === 'topup' 
            ? 'Topped up balance' 
            : 'Purchased meal';
          const amount = log.amount ? `Frw ${log.amount}` : '';
          
          return {
            id: index + 1,
            user: log.clientName || 'Unknown',
            action: actionText,
            time: timeAgo,
            amount: amount,
          };
        });

      setRecentActivity(recentLogs);
    } catch (err) {
      console.error('Failed to fetch recent activity:', err);
    } finally {
      setLoadingActivity(false);
    }
  }, [restaurantId]);

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

  const handleAddClient = async (e) => {
    e.preventDefault();
    setClientFormError('');
    setClientFormSuccess('');
    try {
      await apiRequest('/restaurants/clients', {
        method: 'POST',
        body: { ...newClient, restaurantId },
        token: localStorage.getItem('token'),
      });
      setClientFormSuccess('Client created successfully!');
      setNewClient({ name: '', phone: '', idNumber: '', cardNumber: '', yearOfStudy: '', fieldOfStudy: '' });
      // Refresh client list
      setLoadingClients(true);
      apiRequest(`/restaurants/clients?restaurantId=${restaurantId}`, {
        method: 'GET',
        token: localStorage.getItem('token'),
      })
        .then((data) => {
          setClients(data);
          setLoadingClients(false);
        })
        .catch((err) => {
          setClientsError(err.message || 'Failed to fetch clients.');
          setLoadingClients(false);
        });
    } catch (err) {
      if (err.status === 400) {
        setClientFormError('Card number already exists.');
      } else if (err.status === 404) {
        setClientFormError('Restaurant not found.');
      } else {
        setClientFormError(err.message || 'Failed to create client.');
      }
    }
  };

  // Calculate client amount (total balance across all subscriptions)
  const calculateClientAmount = (client) => {
    // Calculate total balance from all subscriptions
    if (client.subscriptions && Array.isArray(client.subscriptions)) {
      return client.subscriptions.reduce((total, sub) => total + (sub.balance || 0), 0);
    }
    return 0;
  };

  const refreshClients = () => {
    setLoadingClients(true);
    apiRequest(`/restaurants/clients?restaurantId=${restaurantId}`, {
      method: 'GET',
      token: localStorage.getItem('token'),
    })
      .then((data) => {
        setClients(data);
        setLoadingClients(false);
      })
      .catch((err) => {
        setClientsError(err.message || 'Failed to fetch clients.');
        setLoadingClients(false);
      });
  };

  const handleUpdateCard = async (cardNumber) => {
    setClientActionError('');
    setClientActionSuccess('');
    const newCardNumber = window.prompt('Enter new card number:');
    if (!newCardNumber) return;
    try {
      await apiRequest(`/restaurants/clients/${cardNumber}`, {
        method: 'PUT',
        body: { newCardNumber },
        token: localStorage.getItem('token'),
      });
      setClientActionSuccess('Card number updated successfully!');
      refreshClients();
    } catch (err) {
      setClientActionError(err.message || 'Failed to update card number.');
    }
  };

  const handleEditDetails = async (client) => {
    setClientActionError('');
    setClientActionSuccess('');
    const name = window.prompt('Edit name:', client.name);
    const phone = window.prompt('Edit phone:', client.phone);
    const idNumber = window.prompt('Edit ID number:', client.idNumber);
    if (!name || !phone || !idNumber) return;
    try {
      await apiRequest(`/restaurants/clients/${client.cardNumber}?restaurantId=${restaurantId}`, {
        method: 'PATCH',
        body: { name, phone, idNumber },
        token: localStorage.getItem('token'),
      });
      setClientActionSuccess('Client details updated successfully!');
      refreshClients();
    } catch (err) {
      setClientActionError(err.message || 'Failed to update client details.');
    }
  };

  const handleTopUp = async (client) => {
    setClientActionError('');
    setClientActionSuccess('');
    const amount = window.prompt('Enter top-up amount:');
    if (!amount || isNaN(amount)) return;
    try {
      await apiRequest(`/restaurants/topup/${client.cardNumber}?restaurantId=${restaurantId}`, {
        method: 'POST',
        body: { amount: Number(amount) },
        token: localStorage.getItem('token'),
      });
      setClientActionSuccess('Top-up successful!');
      refreshClients();
    } catch (err) {
      setClientActionError(err.message || 'Failed to top up meals.');
    }
  };

  const handleTap = async (e) => {
    e.preventDefault();
    setTapError('');
    setTapResult(null);
    setTapLoading(true);
    try {
      const data = await apiRequest('/devices/tap', {
        method: 'POST',
        body: { deviceId: tapDeviceId, cardNumber: tapCardNumber },
        token: localStorage.getItem('token'),
      });
      setTapResult(data);
    } catch (err) {
      setTapError(err.message || 'Tap failed.');
    }
    setTapLoading(false);
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    setLookupError('');
    setLookupResult(null);
    setLookupLoading(true);
    try {
      const data = await apiRequest(`/client/balance/${lookupCardNumber}`, {
        method: 'GET',
        token: localStorage.getItem('token'),
      });
      setLookupResult(data);
    } catch (err) {
      setLookupError(err.message || 'Lookup failed.');
    }
    setLookupLoading(false);
  };

  const handleRegisterCard = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterResult(null);
    setRegisterLoading(true);
    try {
      const data = await apiRequest(`/devices/register?deviceId=${registerDeviceId}`, {
        method: 'GET',
        token: localStorage.getItem('token'),
      });
      setRegisterResult(data);
    } catch (err) {
      setRegisterError(err.message || 'Register card failed.');
    }
    setRegisterLoading(false);
  };

  const handleSyncDevice = async (e) => {
    e.preventDefault();
    setSyncError('');
    setSyncResult(null);
    setSyncLoading(true);
    try {
      const taps = syncTaps.map(t => ({ cardNumber: t.cardNumber, offlineDeducted: Number(t.offlineDeducted) }));
      const data = await apiRequest('/devices/sync-device', {
        method: 'POST',
        body: { deviceId: syncDeviceId, taps },
        token: localStorage.getItem('token'),
      });
      setSyncResult(data);
    } catch (err) {
      setSyncError(err.message || 'Sync device failed.');
    }
    setSyncLoading(false);
  };

  const handleAddSyncTap = () => {
    setSyncTaps([...syncTaps, { cardNumber: '', offlineDeducted: '' }]);
  };
  const handleRemoveSyncTap = (idx) => {
    setSyncTaps(syncTaps.filter((_, i) => i !== idx));
  };
  const handleSyncTapChange = (idx, field, value) => {
    setSyncTaps(syncTaps.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  // Fetch current restaurant info for settings
  const fetchSettings = useCallback(async () => {
    try {
      setSettingsLoading(true);
      setSettingsError('');
      setSettingsSuccess('');
      const token = localStorage.getItem('token');
      if (!token || !restaurantId || restaurantId === 'mock-restaurant-id') return;
      const restaurants = await apiRequest('/admin/restaurants', { method: 'GET', token });
      const restaurant = restaurants.find(r => r._id === restaurantId);
      if (restaurant) {
        setSettingsForm({
          name: restaurant.name || '',
          email: restaurant.email || '',
          mealPrice: restaurant.mealPrice ? String(restaurant.mealPrice) : '',
          password: '',
        });
      }
    } catch (err) {
      setSettingsError('Failed to fetch settings.');
    } finally {
      setSettingsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (selectedSection === 'settings') {
      fetchSettings();
    }
  }, [selectedSection, fetchSettings]);

  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setSettingsForm(f => ({ ...f, [name]: value }));
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsSuccess('');
    setSettingsLoading(true);
    try {
      const token = localStorage.getItem('token');
      await apiRequest(`/admin/restaurants/${restaurantId}`, {
        method: 'PUT',
        body: {
          name: settingsForm.name,
          email: settingsForm.email,
          mealPrice: Number(settingsForm.mealPrice),
          ...(settingsForm.password ? { password: settingsForm.password } : {}),
        },
        token,
      });
      setSettingsSuccess('Settings updated successfully!');
      setSettingsForm(f => ({ ...f, password: '' }));
      fetchSettings();
    } catch (err) {
      setSettingsError(err.message || 'Failed to update settings.');
    } finally {
      setSettingsLoading(false);
    }
  };

  // Add DeepSeek-style card and table enhancements
  const deepseekCardStyle = {
    background: 'white',
    borderRadius: '1.25rem',
    boxShadow: '0 8px 32px 0 rgba(60, 72, 100, 0.18)',
    padding: '2.5rem 2rem',
    margin: '2rem auto',
    maxWidth: 900,
    border: '1px solid #e2e8f0',
  };
  const deepseekTableContainer = {
    background: 'white',
    borderRadius: '1.25rem',
    boxShadow: '0 8px 32px 0 rgba(60, 72, 100, 0.12)',
    padding: '1.5rem 1rem',
    margin: '2rem auto',
    maxWidth: 900,
    border: '1px solid #e2e8f0',
    overflowX: 'auto',
  };
  const deepseekTable = {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
    background: 'white',
    borderRadius: '1rem',
    overflow: 'hidden',
    boxShadow: '0 2px 8px 0 rgba(60, 72, 100, 0.08)',
  };
  const deepseekTh = {
    background: '#f7fafc',
    color: '#2c3e50',
    padding: '1.1rem',
    fontWeight: 700,
    fontSize: '1.05rem',
    position: 'sticky',
    top: 0,
    zIndex: 2,
    borderBottom: '2px solid #e2e8f0',
  };
  const deepseekTd = {
    padding: '1.1rem',
    borderBottom: '1px solid #e2e8f0',
    fontSize: '1.01rem',
  };
  const deepseekRow = idx => ({
    background: idx % 2 === 0 ? '#fcfcfd' : 'white',
    transition: 'background 0.2s',
  });
  const deepseekFormTitle = {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: '2rem',
    color: '#2c3e50',
    letterSpacing: '-0.5px',
  };
  const deepseekFormGroup = {
    marginBottom: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  };
  const deepseekInput = {
    padding: '1.1rem',
    borderRadius: '0.75rem',
    border: '1px solid #e2e8f0',
    fontSize: '1.05rem',
    background: '#f8fafc',
    transition: 'border 0.2s',
  };
  const deepseekButton = {
    padding: '1.1rem 2.5rem',
    borderRadius: '0.75rem',
    fontSize: '1.1rem',
    fontWeight: 600,
    background: 'linear-gradient(90deg, #667eea 0%, #5a67d8 100%)',
    color: 'white',
    border: 'none',
    boxShadow: '0 2px 8px 0 rgba(60, 72, 100, 0.10)',
    cursor: 'pointer',
    marginTop: '0.5rem',
    transition: 'background 0.2s',
  };

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
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileMenuOpen ? <FiX /> : <FiMenu />}
          </button>
          <h3>Restaurant Panel</h3>
        </div>
      )}

      <div className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''} ${!isMobile && isSidebarOpen ? 'open' : ''}`}>
  <div className="sidebar-header">
    {isSidebarOpen && <h2>Restaurant Panel</h2>}
    <button
      className="toggle-btn"
      onClick={toggleSidebar}
      aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
    >
      {isSidebarOpen ? <FiX /> : <FiMenu />}
    </button>
  </div>
        <nav className="sidebar-nav">
          <button className={`nav-item${selectedSection === 'dashboard' ? ' active' : ''}`} onClick={() => setSelectedSection('dashboard')}>
            <FiPieChart /> {isSidebarOpen && 'Dashboard'}
          </button>
          <button className={`nav-item${selectedSection === 'analytics' ? ' active' : ''}`} onClick={() => setSelectedSection('analytics')}>
            <FiPieChart /> {isSidebarOpen && 'Analytics'}
          </button>
          <button className={`nav-item${selectedSection === 'clients' ? ' active' : ''}`} onClick={() => setSelectedSection('clients')}>
            <FiUsers /> {isSidebarOpen && 'Clients'}
          </button>
          <button className={`nav-item${selectedSection === 'logs' ? ' active' : ''}`} onClick={() => setSelectedSection('logs')}>
            <FiDollarSign /> {isSidebarOpen && 'Meal Logs'}
          </button>
          <button className={`nav-item${selectedSection === 'report' ? ' active' : ''}`} onClick={() => setSelectedSection('report')}>
            <FiPieChart /> {isSidebarOpen && 'Report'}
          </button>
          <button className={`nav-item${selectedSection === 'tap' ? ' active' : ''}`} onClick={() => setSelectedSection('tap')}>
            <FiCreditCard /> {isSidebarOpen && 'Tap & Balance'}
          </button>
          <button className={`nav-item${selectedSection === 'settings' ? ' active' : ''}`} onClick={() => setSelectedSection('settings')}>
            <FiSettings /> {isSidebarOpen && 'Settings'}
          </button>
        </nav>
        <div className="sidebar-footer">
          <button 
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <FiSun /> : <FiMoon />}
            {isSidebarOpen && (darkMode ? 'Light Mode' : 'Dark Mode')}
          </button>
        </div>
      </div>
      <div className="main-content">
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
            <h3>Restaurant Dashboard</h3>
          </div>
          <div className="nav-right">
            <button className="notification-btn">
              <FiBell size={20} />
            </button>
            <div 
              className="profile-section" 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            >
              <div className="profile-default">
                {userLoading ? (
                  <FiRefreshCw className="spinner" />
                ) : currentUser ? (
                  <div className="user-info">
                    <span className="user-name">{currentUser.name}</span>
                    <span className="user-role">Restaurant</span>
                  </div>
                ) : (
                  <FiUsers />
                )}
              </div>
              {isProfileMenuOpen && (
                <div className="profile-dropdown">
                  {currentUser && (
                    <div className="user-details">
                      <div className="user-name">{currentUser.name}</div>
                      <div className="user-role">Restaurant Manager</div>
                      <div className="user-email">{currentUser.email}</div>
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
                    <h4>Total Clients</h4>
                    {loadingReports ? (
                      <p><FiRefreshCw className="spinner" /> Loading...</p>
                    ) : (
                      <>
                        <p>{reports.totalClients}</p>
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
                    <h4>Active Clients</h4>
                    {loadingReports ? (
                      <p><FiRefreshCw className="spinner" /> Loading...</p>
                    ) : (
                      <>
                        <p>{reports.activeClients}</p>
                        <span className="stats-trend positive">
                          <FiArrowUp /> {reports.totalClients > 0 ? Math.round((reports.activeClients / reports.totalClients) * 100) : 0}%
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
                        <p>{reports.monthlyRevenue}</p>
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
                  <h3>Daily Revenue</h3>
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
                  <h3>Client Activity</h3>
                  <div className="chart-container">
                    <Pie 
                      data={clientActivityData} 
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
            </>
          )}
          {selectedSection === 'analytics' && (
            <RestaurantAnalytics restaurantId={restaurantId} />
          )}
          {selectedSection === 'clients' && (
            <div style={deepseekCardStyle}>
              <h2 style={deepseekFormTitle}>Clients</h2>
              <form onSubmit={handleAddClient} className="form-card">
                <h3>Add New Client</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      placeholder="Enter client name"
                      value={newClient.name}
                      onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="text"
                      placeholder="Enter phone number"
                      value={newClient.phone}
                      onChange={e => setNewClient({ ...newClient, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>ID Number</label>
                    <input
                      type="text"
                      placeholder="Enter ID number"
                      value={newClient.idNumber}
                      onChange={e => setNewClient({ ...newClient, idNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Card Number</label>
                    <input
                      type="text"
                      placeholder="Enter card number"
                      value={newClient.cardNumber}
                      onChange={e => setNewClient({ ...newClient, cardNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Year of Study</label>
                    <select
                      value={newClient.yearOfStudy}
                      onChange={e => setNewClient({ ...newClient, yearOfStudy: e.target.value })}
                      required
                    >
                      <option value="">Select Year</option>
                      <option value="Y1">Y1 (First Year)</option>
                      <option value="Y2">Y2 (Second Year)</option>
                      <option value="Y3">Y3 (Third Year)</option>
                      <option value="Y4">Y4 (Fourth Year)</option>
                      <option value="Y5+">Y5+ (Fifth Year+)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Field of Study</label>
                    <input
                      type="text"
                      placeholder="e.g., IT, Engineering, Medicine, Business"
                      value={newClient.fieldOfStudy}
                      onChange={e => setNewClient({ ...newClient, fieldOfStudy: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <button type="submit" disabled={loadingClients}>Add Client</button>
                {clientFormError && <div className="error-message" style={{ marginTop: '1rem' }}>{clientFormError}</div>}
                {clientFormSuccess && <div className="success-message" style={{ marginTop: '1rem' }}>{clientFormSuccess}</div>}
              </form>
              {loadingClients ? (
                <p>Loading clients...</p>
              ) : clientsError ? (
                <div className="error-message">{clientsError}</div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>ID Number</th>
                        <th>Card Number</th>
                        <th>Year</th>
                        <th>Field</th>
                        <th>Amount</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((c) => (
                        <tr key={c._id}>
                          <td>{c.name}</td>
                          <td>{c.phone}</td>
                          <td>{c.idNumber}</td>
                          <td>{c.cardNumber}</td>
                          <td>{c.yearOfStudy || '-'}</td>
                          <td>{c.fieldOfStudy || '-'}</td>
                          <td>Frw {calculateClientAmount(c).toLocaleString()}</td>
                          <td style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="action-btn card-btn" title="Update Card" onClick={() => handleUpdateCard(c.cardNumber)}><FiCreditCard /></button>
                            <button className="action-btn edit-btn" title="Edit Details" onClick={() => handleEditDetails(c)}><FiEdit /></button>
                            <button className="action-btn topup-btn" title="Top Up" onClick={() => handleTopUp(c)}><FiArrowUpCircle /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {clientActionError && <div className="error-message">{clientActionError}</div>}
              {clientActionSuccess && <div className="success-message">{clientActionSuccess}</div>}
            </div>
          )}
          {selectedSection === 'logs' && (
            <div style={deepseekCardStyle}>
              <h2 style={deepseekFormTitle}>Meal Logs</h2>
              {loadingLogs ? (
                <p>Loading meal logs...</p>
              ) : logsError ? (
                <div className="error-message">{logsError}</div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Client</th>
                        <th>Action</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mealLogs.map((log) => (
                        <tr key={log._id}>
                          <td>{log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</td>
                          <td>{log.clientName || (log.client && typeof log.client === 'object' ? log.client.name : log.client) || ''}</td>
                          <td>
                            <span className={`action-badge ${log.actionType}`}>
                              {log.actionType === 'purchase' ? '🍽️ Meal Purchase' : '💰 Top-up'}
                            </span>
                          </td>
                          <td>
                            {log.amount ? `Frw ${log.amount}` : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {/* Devices section removed */}
          {selectedSection === 'tap' && (
            <div style={deepseekCardStyle}>
              <h2 style={deepseekFormTitle}>Tap & Balance</h2>
              <div className="tap-balance-section" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <form onSubmit={handleTap} className="form-card">
                  <h4>Process Client Tap</h4>
                  <div className="form-group">
                    <label>Device ID</label>
                    <input type="text" className="form-control" value={tapDeviceId} onChange={e => setTapDeviceId(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Card Number</label>
                    <input type="text" className="form-control" value={tapCardNumber} onChange={e => setTapCardNumber(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={tapLoading}>{tapLoading ? 'Processing...' : 'Tap'}</button>
                  {tapError && <div className="error-message">{tapError}</div>}
                  {tapResult && (
                    <div className="success-message" style={{ marginTop: 8 }}>
                      <div>Meal recorded!</div>
                      <div>Client: <b>{tapResult.clientName || tapResult.name}</b></div>
                      <div>Remaining Balance: <b>{tapResult.remainingBalance || tapResult.balance}</b></div>
                    </div>
                  )}
                </form>
                <form onSubmit={handleLookup} className="form-card">
                  <h4>Client Balance Lookup</h4>
                  <div className="form-group">
                    <label>Card Number</label>
                    <input type="text" className="form-control" value={lookupCardNumber} onChange={e => setLookupCardNumber(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={lookupLoading}>{lookupLoading ? 'Looking up...' : 'Lookup'}</button>
                  {lookupError && <div className="error-message">{lookupError}</div>}
                  {lookupResult && (
                    <div className="success-message" style={{ marginTop: 8 }}>
                      <div>Client: <b>{lookupResult.name}</b></div>
                      <div>Card: <b>{lookupResult.cardNumber}</b></div>
                      <div>Subscriptions:</div>
                      <ul>
                        {lookupResult.subscriptions && lookupResult.subscriptions.map((sub, i) => (
                          <li key={i}>{sub.restaurantName || sub.restaurantId}: {sub.balance}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}
          {selectedSection === 'report' && (
  <RestaurantReport restaurantId={restaurantId} />
)}
{selectedSection === 'settings' && (
            <div style={deepseekCardStyle}>
              <h2 style={deepseekFormTitle}>Settings</h2>
              <form onSubmit={handleSettingsSubmit} className="form-card" style={{ marginTop: 24 }}>
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={settingsForm.name}
                      onChange={handleSettingsChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={settingsForm.email}
                      onChange={handleSettingsChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Meal Price</label>
                    <input
                      type="number"
                      className="form-control"
                      name="mealPrice"
                      value={settingsForm.mealPrice}
                      onChange={handleSettingsChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Password <span style={{ color: '#aaa', fontWeight: 400 }}>(leave blank to keep unchanged)</span></label>
                    <input
                      type="password"
                      className="form-control"
                      name="password"
                      value={settingsForm.password}
                      onChange={handleSettingsChange}
                      autoComplete="new-password"
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={settingsLoading}>
                    {settingsLoading ? 'Saving...' : 'Save Settings'}
                  </button>
                  {settingsError && <div className="error-message">{settingsError}</div>}
                  {settingsSuccess && <div className="success-message">{settingsSuccess}</div>}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Export Handlers ---
const handleDownloadUsersCSV = () => {
  if (!clients.length) return;
  const headers = ['Name', 'Phone', 'ID Number', 'Card Number'];
  const rows = clients.map(c => [c.name, c.phone, c.idNumber, c.cardNumber]);
  let csvContent = '';
  csvContent += headers.join(',') + '\n';
  rows.forEach(row => {
    csvContent += row.map(field => '"' + String(field).replace(/"/g, '""') + '"').join(',') + '\n';
  });
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `users_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  setDownloadMessage('Users CSV download started!');
  setTimeout(() => setDownloadMessage(''), 2500);
};

const handleDownloadUsersPDF = () => {
  if (!clients.length) return;
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text('Users Report', 10, 10);
  const headers = ['Name', 'Phone', 'ID Number', 'Card Number'];
  let y = 20;
  doc.setFontSize(10);
  doc.text(headers.join(' | '), 10, y);
  y += 6;
  clients.slice(0, 40).forEach(c => {
    const row = [c.name, c.phone, c.idNumber, c.cardNumber];
    doc.text(row.join(' | '), 10, y);
    y += 6;
    if (y > 270) {
      doc.addPage();
      y = 10;
    }
  });
  doc.save(`users_${Date.now()}.pdf`);
  setDownloadMessage('Users PDF download started!');
  setTimeout(() => setDownloadMessage(''), 2500);
};

const handleDownloadLogsCSV = () => {
  if (!mealLogs.length) return;
  const headers = ['Date', 'Client', 'Meal', 'Amount'];
  const rows = mealLogs.map(log => [
    log.timestamp ? new Date(log.timestamp).toLocaleString() : '',
    log.clientName || (log.client && typeof log.client === 'object' ? log.client.name : log.client) || '',
    log.mealName || log.meal || 'Meal',
    log.initialBalance && log.remainingBalance ? `Frw ${log.initialBalance - log.remainingBalance}` : ''
  ]);
  let csvContent = '';
  csvContent += headers.join(',') + '\n';
  rows.forEach(row => {
    csvContent += row.map(field => '"' + String(field).replace(/"/g, '""') + '"').join(',') + '\n';
  });
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `meal_logs_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  setDownloadMessage('Meal logs CSV download started!');
  setTimeout(() => setDownloadMessage(''), 2500);
};

const handleDownloadLogsPDF = () => {
  if (!mealLogs.length) return;
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text('Meal Logs Report', 10, 10);
  const headers = ['Date', 'Client', 'Meal', 'Amount'];
  let y = 20;
  doc.setFontSize(10);
  doc.text(headers.join(' | '), 10, y);
  y += 6;
  mealLogs.slice(0, 40).forEach(log => {
    const row = [
      log.timestamp ? new Date(log.timestamp).toLocaleString() : '',
      log.clientName || (log.client && typeof log.client === 'object' ? log.client.name : log.client) || '',
      log.mealName || log.meal || 'Meal',
      log.initialBalance && log.remainingBalance ? `Frw ${log.initialBalance - log.remainingBalance}` : ''
    ];
    doc.text(row.join(' | '), 10, y);
    y += 6;
    if (y > 270) {
      doc.addPage();
      y = 10;
    }
  });
  doc.save(`meal_logs_${Date.now()}.pdf`);
  setDownloadMessage('Meal logs PDF download started!');
  setTimeout(() => setDownloadMessage(''), 2500);
};

export default RestaurantDashboard; 