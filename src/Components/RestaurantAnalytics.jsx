import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiUsers, FiPieChart, FiBarChart2, FiRefreshCw, FiLoader,
  FiTrendingUp, FiDollarSign, FiShoppingBag, FiClock
} from 'react-icons/fi';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { 
  Chart, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend,
  PointElement,
  LineElement
} from 'chart.js';
import { apiRequest } from '../api';
import './RestaurantAnalytics.css';

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
);

const RestaurantAnalytics = ({ restaurantId }) => {
  // Data states
  const [dailyStats, setDailyStats] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [topClients, setTopClients] = useState([]);
  const [revenueStats, setRevenueStats] = useState([]);
  
  const [purchaseStats, setPurchaseStats] = useState([]);
  const [topupStats, setTopupStats] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [error, setError] = useState('');
  const [errorRevenue, setErrorRevenue] = useState('');

  // Fetch restaurant statistics
  const fetchRestaurantStats = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!restaurantId || restaurantId === 'mock-restaurant-id') {
        setLoading(false);
        return;
      }

      const [dailyData, monthlyData, topClientsData] = await Promise.all([
        apiRequest(`/restaurants/analytics/daily-stats?restaurantId=${restaurantId}`, { method: 'GET' }),
        apiRequest(`/restaurants/analytics/monthly-stats?restaurantId=${restaurantId}`, { method: 'GET' }),
        apiRequest(`/restaurants/analytics/top-clients?restaurantId=${restaurantId}`, { method: 'GET' })
      ]);

      setDailyStats(dailyData);
      setMonthlyStats(monthlyData);
      setTopClients(topClientsData);
      
    } catch (err) {
      setError(err.message || 'Failed to fetch restaurant statistics');
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  // Fetch revenue analytics
  const fetchRevenueAnalytics = useCallback(async () => {
    try {
      setLoadingRevenue(true);
      setErrorRevenue('');
      
      if (!restaurantId || restaurantId === 'mock-restaurant-id') {
        setLoadingRevenue(false);
        return;
      }

      const [revenueData, purchaseData, topupData] = await Promise.all([
        apiRequest(`/restaurants/analytics/revenue?restaurantId=${restaurantId}`, { method: 'GET' }),
        apiRequest(`/restaurants/analytics/purchases-vs-topups?restaurantId=${restaurantId}`, { method: 'GET' })
      ]);

      setRevenueStats(revenueData);
      setPurchaseStats(purchaseData?.purchases || []);
      setTopupStats(purchaseData?.topups || []);
      
    } catch (err) {
      setErrorRevenue(err.message || 'Failed to fetch revenue analytics');
    } finally {
      setLoadingRevenue(false);
    }
  }, [restaurantId]);

  // Initial data fetch
  useEffect(() => {
    fetchRestaurantStats();
    fetchRevenueAnalytics();
  }, [fetchRestaurantStats, fetchRevenueAnalytics]);

  // Chart data configurations
  const dailyStatsChartData = {
    labels: dailyStats.map(stat => stat.date || 'Unknown'),
    datasets: [{
      label: 'Daily Transactions',
      data: dailyStats.map(stat => stat.transactionCount),
      backgroundColor: '#667eea',
      borderColor: '#4c51bf',
      borderWidth: 1,
    }, {
      label: 'Daily Revenue',
      data: dailyStats.map(stat => stat.revenue),
      backgroundColor: '#48bb78',
      borderColor: '#38a169',
      borderWidth: 1,
    }]
  };

  const monthlyStatsChartData = {
    labels: monthlyStats.map(stat => stat.month || 'Unknown'),
    datasets: [{
      label: 'Monthly Transactions',
      data: monthlyStats.map(stat => stat.transactionCount),
      backgroundColor: '#ed8936',
      borderColor: '#dd6b20',
      borderWidth: 1,
    }, {
      label: 'Monthly Revenue',
      data: monthlyStats.map(stat => stat.revenue),
      backgroundColor: '#9f7aea',
      borderColor: '#805ad5',
      borderWidth: 1,
    }]
  };

  const topClientsChartData = {
    labels: topClients.map(client => client.clientName || 'Unknown'),
    datasets: [{
      label: 'Total Transactions',
      data: topClients.map(client => client.transactionCount),
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'
      ],
      borderWidth: 1,
    }]
  };

  const purchasesVsTopupsChartData = {
    labels: ['Purchases', 'Top-ups'],
    datasets: [{
      label: 'Transaction Count',
      data: [
        purchaseStats.reduce((sum, stat) => sum + stat.count, 0),
        topupStats.reduce((sum, stat) => sum + stat.count, 0)
      ],
      backgroundColor: ['#FF6384', '#36A2EB'],
      borderWidth: 1,
    }]
  };

  const revenueTrendChartData = {
    labels: revenueStats.map(stat => stat.period || 'Unknown'),
    datasets: [{
      label: 'Revenue Trend',
      data: revenueStats.map(stat => stat.revenue),
      backgroundColor: '#48bb78',
      borderColor: '#38a169',
      borderWidth: 2,
      fill: false,
      tension: 0.1,
    }]
  };

  // Calculate summary statistics
  const totalTransactions = dailyStats.reduce((sum, stat) => sum + (stat.transactionCount || 0), 0);
  const totalRevenue = dailyStats.reduce((sum, stat) => sum + (stat.revenue || 0), 0);
  const avgDailyRevenue = totalTransactions > 0 ? (totalRevenue / dailyStats.length).toFixed(2) : 0;
  const totalClients = topClients.length;

  return (
    <div className="restaurant-analytics">
      <div className="analytics-header">
        <h2>Restaurant Analytics</h2>
        <div className="refresh-controls">
          <button 
            onClick={fetchRestaurantStats} 
            disabled={loading}
            className="refresh-btn"
          >
            <FiRefreshCw className={loading ? 'spinning' : ''} />
            Refresh Stats
          </button>
          <button 
            onClick={fetchRevenueAnalytics} 
            disabled={loadingRevenue}
            className="refresh-btn"
          >
            <FiDollarSign className={loadingRevenue ? 'spinning' : ''} />
            Refresh Revenue
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon">
            <FiShoppingBag />
          </div>
          <div className="card-content">
            <h3>Total Transactions</h3>
            <p className="card-value">{totalTransactions}</p>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">
            <FiDollarSign />
          </div>
          <div className="card-content">
            <h3>Total Revenue</h3>
            <p className="card-value">Frw {totalRevenue.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">
            <FiTrendingUp />
          </div>
          <div className="card-content">
            <h3>Avg Daily Revenue</h3>
            <p className="card-value">Frw {avgDailyRevenue}</p>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">
            <FiUsers />
          </div>
          <div className="card-content">
            <h3>Active Clients</h3>
            <p className="card-value">{totalClients}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {errorRevenue && (
        <div className="error-message">
          {errorRevenue}
        </div>
      )}

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Daily Stats Chart */}
        <div className="chart-container">
          <h3>Daily Statistics</h3>
          {loading ? (
            <div className="loading-container">
              <FiLoader className="loading-spinner" />
              <p>Loading daily statistics...</p>
            </div>
          ) : (
            <Bar 
              data={dailyStatsChartData} 
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Daily Transactions & Revenue'
                  }
                }
              }}
            />
          )}
        </div>

        {/* Monthly Stats Chart */}
        <div className="chart-container">
          <h3>Monthly Statistics</h3>
          {loading ? (
            <div className="loading-container">
              <FiLoader className="loading-spinner" />
              <p>Loading monthly statistics...</p>
            </div>
          ) : (
            <Bar 
              data={monthlyStatsChartData} 
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Monthly Transactions & Revenue'
                  }
                }
              }}
            />
          )}
        </div>

        {/* Top Clients Chart */}
        <div className="chart-container">
          <h3>Top Clients</h3>
          {loading ? (
            <div className="loading-container">
              <FiLoader className="loading-spinner" />
              <p>Loading top clients...</p>
            </div>
          ) : (
            <Pie 
              data={topClientsChartData} 
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'right',
                  },
                  title: {
                    display: true,
                    text: 'Most Active Clients'
                  }
                }
              }}
            />
          )}
        </div>

        {/* Purchases vs Topups Chart */}
        <div className="chart-container">
          <h3>Purchases vs Top-ups</h3>
          {loadingRevenue ? (
            <div className="loading-container">
              <FiLoader className="loading-spinner" />
              <p>Loading transaction types...</p>
            </div>
          ) : (
            <Pie 
              data={purchasesVsTopupsChartData} 
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'right',
                  },
                  title: {
                    display: true,
                    text: 'Transaction Types Distribution'
                  }
                }
              }}
            />
          )}
        </div>

        {/* Revenue Trend Chart */}
        <div className="chart-container wide">
          <h3>Revenue Trend</h3>
          {loadingRevenue ? (
            <div className="loading-container">
              <FiLoader className="loading-spinner" />
              <p>Loading revenue trend...</p>
            </div>
          ) : (
            <Line 
              data={revenueTrendChartData} 
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Revenue Trend Over Time'
                  }
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantAnalytics;
