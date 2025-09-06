'use client';

import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

interface AuthWrapperProps {
  onSuccess?: () => void;
}

export function AuthWrapper({ onSuccess }: AuthWrapperProps) {
  const [isLogin, setIsLogin] = useState(true);

  const handleSuccess = () => {
    onSuccess?.();
    // Don't reload the page, let the parent component handle the state update
  };

  return (
    <div className="w-full">
      {isLogin ? (
        <LoginForm
          onSuccess={handleSuccess}
          onSwitchToRegister={() => setIsLogin(false)}
        />
      ) : (
        <RegisterForm
          onSuccess={handleSuccess}
          onSwitchToLogin={() => setIsLogin(true)}
        />
      )}
    </div>
  );
}
