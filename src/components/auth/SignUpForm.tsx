import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SignUpFormProps {
  onToggleMode: () => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onToggleMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();

  const validateContinentalEmail = (email: string): boolean => {
    const allowedDomains = ['@continental-corporation.com', '@continental.com'];
    return allowedDomains.some(domain => email.toLowerCase().endsWith(domain));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateContinentalEmail(email)) {
      toast({
        title: "Invalid Email Domain",
        description: "Please use a Continental corporation email address (@continental-corporation.com or @continental.com)",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password, fullName);

    if (!error) {
      setSignUpSuccess(true);
      toast({
        title: "Account Created Successfully!",
        description: "Please check your email to confirm your account, then you can sign in.",
      });
    }

    setLoading(false);
  };

  const handleReturnToLogin = () => {
    setSignUpSuccess(false);
    onToggleMode();
  };

  if (signUpSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto bg-continental-white border-continental-silver shadow-xl font-continental">
        <CardHeader className="bg-gradient-to-r from-continental-black to-continental-gray1 text-continental-white rounded-t-lg">
          <CardTitle className="text-2xl text-center font-bold">Account Created!</CardTitle>
          <CardDescription className="text-center text-continental-gray4">
            Check your email to confirm your account
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <div className="mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-continental-black mb-2">
              Registration Successful!
            </h3>
            <p className="text-continental-gray2 mb-4">
              We've sent a confirmation email to <strong>{email}</strong>
            </p>
            <p className="text-sm text-continental-gray2">
              Please check your inbox (and spam folder) for the confirmation email. 
              Once confirmed, you can sign in to access the system.
            </p>
          </div>
          
          <Button 
            onClick={handleReturnToLogin}
            className="w-full bg-continental-yellow hover:bg-continental-yellow/90 text-continental-black font-bold border-2 border-continental-black/10 transition-all duration-200 hover:shadow-lg"
          >
            Return to Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-continental-white border-continental-silver shadow-xl font-continental">
      <CardHeader className="bg-gradient-to-r from-continental-black to-continental-gray1 text-continental-white rounded-t-lg">
        <CardTitle className="text-2xl text-center font-bold">Sign Up</CardTitle>
        <CardDescription className="text-center text-continental-gray4">
          Create an account to access the system
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-continental-black font-semibold">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              required
              disabled={loading}
              className="border-continental-gray3 focus:border-continental-yellow focus:ring-continental-yellow/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-continental-black font-semibold">Continental Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your Continental email"
              required
              disabled={loading}
              className="border-continental-gray3 focus:border-continental-yellow focus:ring-continental-yellow/20"
            />
            <p className="text-xs text-continental-gray2">
              Only @continental-corporation.com or @continental.com email addresses are allowed
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-continental-black font-semibold">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password (min 6 characters)"
                required
                minLength={6}
                disabled={loading}
                className="border-continental-gray3 focus:border-continental-yellow focus:ring-continental-yellow/20"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-continental-gray4"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-continental-gray1" />
                ) : (
                  <Eye className="h-4 w-4 text-continental-gray1" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-continental-black font-semibold">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                disabled={loading}
                className="border-continental-gray3 focus:border-continental-yellow focus:ring-continental-yellow/20"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-continental-gray4"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-continental-gray1" />
                ) : (
                  <Eye className="h-4 w-4 text-continental-gray1" />
                )}
              </Button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-continental-yellow hover:bg-continental-yellow/90 text-continental-black font-bold border-2 border-continental-black/10 transition-all duration-200 hover:shadow-lg" 
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign Up
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-continental-gray2">
            Already have an account?{' '}
            <button
              onClick={onToggleMode}
              className="text-continental-dark-blue hover:text-continental-light-blue font-semibold underline transition-colors"
              disabled={loading}
            >
              Sign in
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignUpForm;
