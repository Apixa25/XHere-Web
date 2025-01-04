import React, { useEffect } from 'react';

const Auth = ({ isRegistering, handleAuth }) => {
  useEffect(() => {
    // Add class when component mounts
    document.body.classList.add('auth-page');
    
    // Remove class when component unmounts
    return () => {
      document.body.classList.remove('auth-page');
    };
  }, []);

  // ... rest of your component code ...
}

export default Auth; 