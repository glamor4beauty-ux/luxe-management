import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from 'lucide-react';
import { toast } from "sonner";

export default function CustomAuthForm() {
  const navigate = useNavigate();
  const { setUser } = useAuth() || {};
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('Email and password required');
      return;
    }

    setLoading(true);
    try {
      const res = await base44.functions.invoke('validateLogin', { email, password });
      
      if (res.data.success && res.data.user) {
        const user = res.data.user;
        localStorage.setItem('auth_user', JSON.stringify(user));
        if (setUser) setUser(user);

        if (user.role === 'performer') {
          navigate('/');
        } else if (user.role === 'recruiter') {
          navigate('/recruiter');
        } else {
          navigate('/');
        }
      } else {
        toast.error('Invalid email or password');
      }
    } catch (e) {
      toast.error('Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            <span className="text-primary">LUXE</span>
            <span className="text-foreground/60 font-light ml-2">Talent Systems</span>
          </h1>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleLogin()}
              disabled={loading}
              className="bg-secondary border-border text-foreground h-9 mt-1"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleLogin()}
              disabled={loading}
              className="bg-secondary border-border text-foreground h-9 mt-1"
            />
          </div>

          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground h-9 mt-6"
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-6">
          Contact support for account access issues
        </p>
      </div>
    </div>
  );
}