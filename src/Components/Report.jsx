import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { FiRefreshCw } from 'react-icons/fi';
import { apiRequest } from '../api';
import jsPDF from 'jspdf';

const Report = () => {
  const [mealLogs, setMealLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logsError, setLogsError] = useState('');
  const [reportStats, setReportStats] = useState({
    totalMeals: 0,
    mealsPerRestaurant: {},
    mealsPerDay: {},
  });
  const [downloadMessage, setDownloadMessage] = useState('');

  const fetchMealLogs = async () => {
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
  };

  useEffect(() => {
    fetchMealLogs();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!mealLogs || mealLogs.length === 0) return;

    // Total meals
    const totalMeals = mealLogs.length;

    // Meals per restaurant
    const mealsPerRestaurant = {};
    mealLogs.forEach(log => {
      const name = log.restaurant?.name || log.restaurantName || 'Unknown';
      mealsPerRestaurant[name] = (mealsPerRestaurant[name] || 0) + 1;
    });

    // Meals per day
    const mealsPerDay = {};
    mealLogs.forEach(log => {
      const date = log.timestamp ? new Date(log.timestamp).toLocaleDateString() : 'Unknown';
      mealsPerDay[date] = (mealsPerDay[date] || 0) + 1;
    });

    setReportStats({
      totalMeals,
      mealsPerRestaurant,
      mealsPerDay,
    });
  }, [mealLogs]);

  const handleDownloadCSV = () => {
    if (!mealLogs.length) return;
    const headers = ['Date', 'Client', 'Restaurant', 'Meal', 'Amount'];
    const rows = mealLogs.map(log => [
      log.timestamp ? new Date(log.timestamp).toLocaleString() : '',
      log.clientName || (log.client && typeof log.client === 'object' ? log.client.name : log.client) || '',
      log.restaurantName || (log.restaurant && typeof log.restaurant === 'object' ? log.restaurant.name : log.restaurant) || '',
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
    setDownloadMessage('CSV download started!');
    setTimeout(() => setDownloadMessage(''), 2500);
  };

  const handleDownloadPDF = () => {
    if (!mealLogs.length) return;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Meal Logs Report', 10, 10);
    const headers = ['Date', 'Client', 'Restaurant', 'Meal', 'Amount'];
    let y = 20;
    doc.setFontSize(10);
    doc.text(headers.join(' | '), 10, y);
    y += 6;
    mealLogs.slice(0, 40).forEach(log => {
      const row = [
        log.timestamp ? new Date(log.timestamp).toLocaleString() : '',
        log.clientName || (log.client && typeof log.client === 'object' ? log.client.name : log.client) || '',
        log.restaurantName || (log.restaurant && typeof log.restaurant === 'object' ? log.restaurant.name : log.restaurant) || '',
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
    setDownloadMessage('PDF download started!');
    setTimeout(() => setDownloadMessage(''), 2500);
  };

  return (
    <div className="section-container">
      <div className="section-header">
        <h2>Report</h2>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <button className="btn btn-outline" onClick={handleDownloadCSV}>Download CSV</button>
          <button className="btn btn-outline" onClick={handleDownloadPDF}>Download PDF</button>
        </div>
      </div>
      <div style={{ minHeight: 32 }}>
        {downloadMessage && (
          <div style={{ color: '#38a169', fontWeight: 500, marginBottom: 8 }}>
            {downloadMessage}
          </div>
        )}
      </div>
      {loadingLogs ? (
        <div className="loading-state">
          <FiRefreshCw className="spinner" /> Loading report...
        </div>
      ) : logsError ? (
        <div className="error-state">
          {logsError}
          <button className="btn btn-outline" onClick={fetchMealLogs}>
            <FiRefreshCw /> Retry
          </button>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            <div className="stats-card">
              <div className="stats-info">
                <h4>Total Meals Served</h4>
                <p>{reportStats.totalMeals}</p>
              </div>
            </div>
            <div className="stats-card">
              <div className="stats-info">
                <h4>Restaurants</h4>
                <p>{Object.keys(reportStats.mealsPerRestaurant).length}</p>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="charts-section" style={{ marginBottom: 24 }}>
            <div className="chart-card">
              <h3>Meals Per Restaurant</h3>
              <Bar
                data={{
                  labels: Object.keys(reportStats.mealsPerRestaurant),
                  datasets: [{
                    label: 'Meals',
                    data: Object.values(reportStats.mealsPerRestaurant),
                    backgroundColor: '#667eea',
                  }],
                }}
                options={{ responsive: true, plugins: { legend: { display: false } } }}
              />
            </div>
            <div className="chart-card">
              <h3>Meals Per Day</h3>
              <Bar
                data={{
                  labels: Object.keys(reportStats.mealsPerDay),
                  datasets: [{
                    label: 'Meals',
                    data: Object.values(reportStats.mealsPerDay),
                    backgroundColor: '#48bb78',
                  }],
                }}
                options={{ responsive: true, plugins: { legend: { display: false } } }}
              />
            </div>
          </div>

          {/* Recent Logs Table */}
          <div className="table-responsive">
            <h3>Recent Meal Logs</h3>
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
                {mealLogs.slice(0, 10).map((log) => (
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
        </>
      )}
    </div>
  );
};

export default Report;
