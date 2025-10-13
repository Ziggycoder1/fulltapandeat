import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiUsers, FiPieChart, FiBarChart2, FiRefreshCw, FiLoader,
  FiTrendingUp, FiAward
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
import './UniversityAnalytics.css';

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

const UniversityAnalytics = () => {
  // Data states
  const [yearStats, setYearStats] = useState([]);
  const [fieldStats, setFieldStats] = useState([]);
  const [combinedStats, setCombinedStats] = useState([]);
  const [topEatingGroups, setTopEatingGroups] = useState([]);
  
  const [mealsByYear, setMealsByYear] = useState([]);
  const [mealsByField, setMealsByField] = useState([]);
  const [mealsCombined, setMealsCombined] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [error, setError] = useState('');
  const [errorMeals, setErrorMeals] = useState('');

  // Fetch client statistics
  const fetchClientStats = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const [yearData, fieldData, combinedData] = await Promise.all([
        apiRequest('/client/stats/year-of-study', { method: 'GET' }),
        apiRequest('/client/stats/field-of-study', { method: 'GET' }),
        apiRequest('/client/stats/combined', { method: 'GET' })
      ]);

      setYearStats(yearData);
      setFieldStats(fieldData);
      setCombinedStats(combinedData);
      
    } catch (err) {
      setError(err.message || 'Failed to fetch client statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch meal consumption analytics
  const fetchMealAnalytics = useCallback(async () => {
    try {
      setLoadingMeals(true);
      setErrorMeals('');
      
      const [yearMeals, fieldMeals, combinedMeals, topGroups] = await Promise.all([
        apiRequest('/client/analytics/meals-by-year', { method: 'GET' }),
        apiRequest('/client/analytics/meals-by-field', { method: 'GET' }),
        apiRequest('/client/analytics/meals-combined', { method: 'GET' }),
        apiRequest('/client/analytics/top-eating-groups', { method: 'GET' })
      ]);

      setMealsByYear(yearMeals);
      setMealsByField(fieldMeals);
      setMealsCombined(combinedMeals);
      setTopEatingGroups(topGroups);
      
    } catch (err) {
      setErrorMeals(err.message || 'Failed to fetch meal analytics');
    } finally {
      setLoadingMeals(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchClientStats();
    fetchMealAnalytics();
  }, [fetchClientStats, fetchMealAnalytics]);

  // Chart data configurations
  const yearOfStudyChartData = {
    labels: yearStats.map(stat => stat._id || 'Unknown'),
    datasets: [{
      label: 'Number of Students',
      data: yearStats.map(stat => stat.count),
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF',
        '#FF9F40'
      ],
      borderWidth: 1,
    }]
  };

  const fieldOfStudyChartData = {
    labels: fieldStats.map(stat => stat._id || 'Unknown'),
    datasets: [{
      label: 'Number of Students',
      data: fieldStats.map(stat => stat.count),
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'
      ],
      borderWidth: 1,
    }]
  };

  const mealsByYearChartData = {
    labels: mealsByYear.map(stat => stat.yearOfStudy || 'Unknown'),
    datasets: [{
      label: 'Total Meals Consumed',
      data: mealsByYear.map(stat => stat.totalMeals),
      backgroundColor: '#667eea',
      borderColor: '#4c51bf',
      borderWidth: 1,
    }, {
      label: 'Unique Students',
      data: mealsByYear.map(stat => stat.uniqueClientCount),
      backgroundColor: '#48bb78',
      borderColor: '#38a169',
      borderWidth: 1,
    }]
  };

  const mealsByFieldChartData = {
    labels: mealsByField.map(stat => stat.fieldOfStudy || 'Unknown'),
    datasets: [{
      label: 'Total Meals Consumed',
      data: mealsByField.map(stat => stat.totalMeals),
      backgroundColor: '#ed8936',
      borderColor: '#dd6b20',
      borderWidth: 1,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        font: {
          size: 16,
        }
      }
    },
  };

  const barChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  // Calculate summary statistics
  const totalStudents = yearStats.reduce((sum, stat) => sum + stat.count, 0);
  const totalMeals = mealsByYear.reduce((sum, stat) => sum + stat.totalMeals, 0);
  const avgMealsPerStudent = totalStudents > 0 ? (totalMeals / totalStudents).toFixed(1) : 0;

  return (
    <div className="university-analytics">
      <div className="analytics-header">
        <div className="header-content">
          <h1><FiPieChart /> University Analytics</h1>
          <p>Analyze student meal consumption patterns by year and field of study</p>
        </div>
        <div className="header-actions">
          <button 
            onClick={() => { fetchClientStats(); fetchMealAnalytics(); }}
            className="refresh-btn"
            disabled={loading || loadingMeals}
          >
            {loading || loadingMeals ? <FiLoader className="spinning" /> : <FiRefreshCw />}
            Refresh Data
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon">
            <FiUsers />
          </div>
          <div className="card-content">
            <h3>{totalStudents}</h3>
            <p>Total Students</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon">
            <FiTrendingUp />
          </div>
          <div className="card-content">
            <h3>{totalMeals}</h3>
            <p>Total Meals Consumed</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon">
            <FiAward />
          </div>
          <div className="card-content">
            <h3>{avgMealsPerStudent}</h3>
            <p>Avg Meals per Student</p>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      {errorMeals && (
        <div className="error-message">
          <p>{errorMeals}</p>
        </div>
      )}

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Student Distribution by Year */}
        <div className="chart-container">
          <h3>Student Distribution by Year of Study</h3>
          {loading ? (
            <div className="loading-spinner">
              <FiLoader className="spinning" />
              <p>Loading student data...</p>
            </div>
          ) : (
            <div className="chart-wrapper">
              <Pie data={yearOfStudyChartData} options={chartOptions} />
            </div>
          )}
        </div>

        {/* Student Distribution by Field */}
        <div className="chart-container">
          <h3>Student Distribution by Field of Study</h3>
          {loading ? (
            <div className="loading-spinner">
              <FiLoader className="spinning" />
              <p>Loading student data...</p>
            </div>
          ) : (
            <div className="chart-wrapper">
              <Pie data={fieldOfStudyChartData} options={chartOptions} />
            </div>
          )}
        </div>

        {/* Meal Consumption by Year */}
        <div className="chart-container">
          <h3>Meal Consumption by Year of Study</h3>
          {loadingMeals ? (
            <div className="loading-spinner">
              <FiLoader className="spinning" />
              <p>Loading meal analytics...</p>
            </div>
          ) : (
            <div className="chart-wrapper">
              <Bar data={mealsByYearChartData} options={barChartOptions} />
            </div>
          )}
        </div>

        {/* Meal Consumption by Field */}
        <div className="chart-container">
          <h3>Meal Consumption by Field of Study</h3>
          {loadingMeals ? (
            <div className="loading-spinner">
              <FiLoader className="spinning" />
              <p>Loading meal analytics...</p>
            </div>
          ) : (
            <div className="chart-wrapper">
              <Bar data={mealsByFieldChartData} options={barChartOptions} />
            </div>
          )}
        </div>
      </div>

      {/* Top Eating Groups */}
      <div className="top-groups-section">
        <h3><FiBarChart2 /> Top Eating Groups</h3>
        {loadingMeals ? (
          <div className="loading-spinner">
            <FiLoader className="spinning" />
            <p>Loading top eating groups...</p>
          </div>
        ) : (
          <div className="top-groups-table">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Group</th>
                  <th>Year</th>
                  <th>Field</th>
                  <th>Total Meals</th>
                  <th>Students</th>
                  <th>Avg per Student</th>
                </tr>
              </thead>
              <tbody>
                {topEatingGroups.map((group, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{group.group}</td>
                    <td>{group.yearOfStudy}</td>
                    <td>{group.fieldOfStudy}</td>
                    <td>{group.totalMeals}</td>
                    <td>{group.uniqueClientCount}</td>
                    <td>{group.avgMealsPerClient}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UniversityAnalytics;
