
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  onToggleMode: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (!error) {
      setEmail('');
      setPassword('');
    }

    setLoading(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-continental-white border-continental-silver shadow-xl font-continental">
      <CardHeader className="bg-gradient-to-r from-continental-black to-continental-gray1 text-continental-white rounded-t-lg">
        <CardTitle className="text-2xl text-center font-bold">Sign In</CardTitle>
        <CardDescription className="text-center text-continental-gray4">
          Enter your credentials to access the system
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-continental-black font-semibold">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={loading}
              className="border-continental-gray3 focus:border-continental-yellow focus:ring-continental-yellow/20"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-continental-black font-semibold">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
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

          <Button 
            type="submit" 
            className="w-full bg-continental-yellow hover:bg-continental-yellow/90 text-continental-black font-bold border-2 border-continental-black/10 transition-all duration-200 hover:shadow-lg" 
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-continental-gray2">
            Don't have an account?{' '}
            <button
              onClick={onToggleMode}
              className="text-continental-dark-blue hover:text-continental-light-blue font-semibold underline transition-colors"
              disabled={loading}
            >
              Sign up
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
