import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Lock, Smartphone, Loader2, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { toast } from 'sonner';
import api from '../services/api';

const Login = () => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    // Custom validation
    if (!mobile.trim()) {
      toast.error('Please enter your mobile number');
      return;
    }
    if (!/^\d{10}$/.test(mobile)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!password.trim()) {
      toast.error('Please enter your password');
      return;
    }
    
    setIsLoading(true);

    try {
      const data = await api.post('/api/login', { mobile, password });

      if (data.success) {
        setShowWelcome(true);
        // Delay navigation to show welcome modal
        setTimeout(() => {
          login(data.user);
          navigate('/');
        }, 2000);
      } else {
        setError(data.message);
        setIsLoading(false);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg rounded-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">TeamInSync</CardTitle>
          <CardDescription className="text-center">
            Enter your mobile number and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="mobile" 
                  type="text" 
                  placeholder="Mobile Number" 
                  className="pl-9"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required={false}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  className="pl-9"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={false}
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && !showWelcome ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Welcome Loader Modal */}
      <Dialog open={showWelcome} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="flex flex-col items-center gap-4 text-2xl">
              <CheckCircle className="h-12 w-12 text-green-500 animate-bounce" />
              Login Successful!
            </DialogTitle>
            <DialogDescription className="text-lg pt-2">
              Welcome to TeamInSync App.
              <br />
              <span className="text-sm text-muted-foreground">Preparing your dashboard...</span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
