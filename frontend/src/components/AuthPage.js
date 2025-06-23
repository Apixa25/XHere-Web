import React, { useState, useEffect } from 'react';
import backgroundImage from '../images/background.jpg';
import { getEnvironmentConfig } from '../config/environments';

const AuthPage = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Get the current environment configuration
  const config = getEnvironmentConfig();

  useEffect(() => {
    document.body.classList.add('auth-page');
    document.documentElement.style.setProperty('--bg-image', `url(${backgroundImage})`);
    
    return () => {
      document.body.classList.remove('auth-page');
      document.documentElement.style.removeProperty('--bg-image');
    };
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const endpoint = isRegistering ? 'auth/register' : 'auth/login';
      
      const requestBody = isRegistering 
        ? { 
            email: formData.email,
            password: formData.password,
            name: formData.name 
          }
        : { 
            email: formData.email,
            password: formData.password 
          };

      console.log(`Attempting ${isRegistering ? 'registration' : 'login'} with:`, {
        ...requestBody,
        password: '[REDACTED]'
      });

      const response = await fetch(`${config.API_URL}/api/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Authentication failed');
      }

      const data = await response.json();
      console.log('Server response:', data);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      if (onLoginSuccess) {
        onLoginSuccess(data);
      }
      
      setFormData({
        email: '',
        password: '',
        name: ''
      });
      
    } catch (error) {
      console.error('Auth error:', error);
      setError(error.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>
        <p className="auth-subtitle">
          {isRegistering ? 'Join XHere to start sharing locations' : 'Sign in to your XHere account'}
        </p>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <form onSubmit={handleAuth} className="auth-form">
          {isRegistering && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required={isRegistering}
                placeholder="Enter your full name"
                className="auth-input"
              />
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              placeholder="Enter your email"
              className="auth-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
              placeholder="Enter your password"
              className="auth-input"
              minLength={6}
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={submitting}
          >
            {submitting ? 'Please wait...' : (isRegistering ? 'Create Account' : 'Sign In')}
          </button>
        </form>
        
        <div className="auth-switch">
          <p>
            {isRegistering ? 'Already have an account?' : "Don't have an account?"}
            <button 
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setFormData({ email: '', password: '', name: '' });
                setError(null);
              }}
              className="switch-button"
            >
              {isRegistering ? 'Sign In' : 'Create Account'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage; 