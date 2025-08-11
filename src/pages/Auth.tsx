
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';
import SignUpForm from '@/components/auth/SignUpForm';
import { Loader2 } from 'lucide-react';

const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-continental-gray4 via-continental-white to-continental-silver flex items-center justify-center font-continental">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-continental-yellow mx-auto mb-4" />
          <p className="text-lg text-continental-gray1 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-continental-gray4 via-continental-white to-continental-silver flex items-center justify-center p-4 font-continental">
      <div className="w-full max-w-md">
        {/* Continental Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-4 bg-gradient-to-r from-continental-yellow to-continental-yellow/80 rounded-xl shadow-lg border-2 border-continental-black/10" aria-label="Aumovio Logo">
              <span className="inline-flex items-center justify-center h-10 w-10 text-continental-black font-bold text-2xl leading-none">A</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-continental-black mb-2">
            Aumovio Events
          </h1>
          <div className="w-20 h-1 bg-continental-yellow mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-continental-gray1 mb-2">
            Events Management
          </h2>
          <p className="text-continental-gray2 font-medium">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        {/* Auth Form */}
        {isSignUp ? (
          <SignUpForm onToggleMode={() => setIsSignUp(false)} />
        ) : (
          <LoginForm onToggleMode={() => setIsSignUp(true)} />
        )}
      </div>
    </div>
  );
};

export default Auth;
