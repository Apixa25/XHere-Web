import api from '../services/api';

// ... rest of your imports

const Login = () => {
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.login({ email, password });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        // ... rest of your login logic
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };
  // ... rest of component
}; 