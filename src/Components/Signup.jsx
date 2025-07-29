import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';
import './Login.css';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await apiRequest('/auth/admin/signup', {
        method: 'POST',
        body: { username, password },
      });
      setSuccess('Admin created successfully! You can now log in.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      if (err.status === 400) {
        setError('Admin already exists.');
      } else {
        setError(err.message || 'Signup failed.');
      }
    }
  };

  return (
    <div className="login-page">
      <div className="auth-container">
        <h2>Admin Signup</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Sign Up</button>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <p className="signup-link">
            Already have an account? <a href="/login">Log in</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup; 