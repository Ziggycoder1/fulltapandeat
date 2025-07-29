import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { apiRequest } from '../api';

const Login = () => {
  const [mode, setMode] = useState('admin'); // 'admin' or 'restaurant'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      let data;
      if (mode === 'admin') {
        data = await apiRequest('/auth/admin/login', {
          method: 'POST',
          body: { username, password },
        });
        localStorage.setItem('token', data.token);
        navigate('/admin');
      } else {
        data = await apiRequest('/auth/restaurant/login', {
          method: 'POST',
          body: { email, password },
        });
        localStorage.setItem('token', data.token);
        navigate('/restaurant'); // Change to your restaurant dashboard route
      }
    } catch (err) {
      if (err.status === 401) {
        setError('Invalid credentials.');
      } else if (err.status === 404) {
        setError(mode === 'admin' ? 'Admin not found.' : 'Restaurant not found.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    }
  };

  return (
    <div className="login-page">
      <div className="auth-container">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <button
            type="button"
            className={mode === 'admin' ? 'active' : ''}
            style={{ marginRight: '1rem', padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: mode === 'admin' ? '#667eea' : '#e2e8f0', color: mode === 'admin' ? 'white' : '#2d3748', cursor: 'pointer' }}
            onClick={() => { setMode('admin'); setError(''); }}
          >
            Admin Login
          </button>
          <button
            type="button"
            className={mode === 'restaurant' ? 'active' : ''}
            style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: mode === 'restaurant' ? '#667eea' : '#e2e8f0', color: mode === 'restaurant' ? 'white' : '#2d3748', cursor: 'pointer' }}
            onClick={() => { setMode('restaurant'); setError(''); }}
          >
            Restaurant Login
          </button>
        </div>
        <h2>{mode === 'admin' ? 'Admin Login' : 'Restaurant Login'}</h2>
        <form onSubmit={handleSubmit}>
          {mode === 'admin' ? (
            <div className="input-group">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          ) : (
            <div className="input-group">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}
          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Sign In</button>
          {error && <div className="error-message">{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default Login;