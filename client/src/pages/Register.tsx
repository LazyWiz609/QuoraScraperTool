import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Bot } from 'lucide-react';

const Register: React.FC = () => {
  const { register, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }

const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    await register({ username, password });
    toast({
      title: 'Success',
      description: 'Account created successfully!',
    });
  } catch (error) {
    toast({
      title: 'Error',
      description: 'Failed to register. Username may already exist.',
      variant: 'destructive',
    });
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Bot className="h-16 w-16 text-blue-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">Create an Account</CardTitle>
          <p className="text-sm text-gray-600">
            Register to start using the Quora AI Scraper
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </form>
          <div className="text-center mt-4">
            <Link href="/login">
              <span className="text-sm text-blue-600 hover:underline">
                Already have an account? Log in here
              </span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
