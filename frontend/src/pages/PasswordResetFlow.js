import React, { useState } from 'react';
import ForgotPassword from './Forgotpassword';
import ResetPassword from './Resetpassword';

const PasswordResetFlow = ({ onBackToLogin }) => {
  const [currentStep, setCurrentStep] = useState('forgot'); // 'forgot' or 'reset'
  const [userEmail, setUserEmail] = useState('');

  // Handle moving from forgot password to reset password step
  const handleMoveToReset = (email) => {
    console.log('Moving to reset step with email:', email);
    setUserEmail(email);
    setCurrentStep('reset');
  };

  // Handle going back to forgot password step
  const handleBackToForgot = () => {
    console.log('Going back to forgot password step');
    setCurrentStep('forgot');
  };

  // Handle successful password reset
  const handleResetSuccess = () => {
    console.log('Password reset successful, going back to login');
    onBackToLogin();
  };

  return (
    <div className="password-reset-flow">
      {currentStep === 'forgot' && (
        <ForgotPassword 
          onBackToLogin={onBackToLogin}
          onMoveToReset={handleMoveToReset}
        />
      )}
      
      {currentStep === 'reset' && (
        <ResetPassword 
          initialEmail={userEmail}
          onBackToForgot={handleBackToForgot}
          onBackToLogin={onBackToLogin}
          onResetSuccess={handleResetSuccess}
        />
      )}
    </div>
  );
};

export default PasswordResetFlow;