import React, { useEffect } from 'react';

const AuthPage = ({ isRegistering, handleAuth }) => {
  useEffect(() => {
    document.body.classList.add('auth-page');
    
    return () => {
      document.body.classList.remove('auth-page');
    };
  }, []);

  return (
    <div className="auth-container">
      {/* ... rest of your existing AuthPage code ... */}
    </div>
  );
};

export default AuthPage; 