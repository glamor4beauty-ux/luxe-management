import { Outlet, useLocation, Link } from 'react-router-dom';
import { Calendar, BookOpen, Monitor, Upload, MessageSquare, HelpCircle, TrendingUp, LogOut, Home } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';

const topNavItems = [
  { path: '/performer-instructions', label: 'Guide', icon: HelpCircle },
  { path: '/performer-stripchat-view', label: 'Stripchat', icon: Monitor },
  { path: '/performer-performance', label: 'Performance', icon: TrendingUp },
];

const bottomNavItems = [
  { path: '/performer-dashboard', label: 'Home', icon: Home },
  { path: '/performer-schedule', label: 'Schedule', icon: Calendar },
  { path: '/performer-knowledge', label: 'Knowledge', icon: BookOpen },
  { path: '/performer-upload', label: 'Upload', icon: Upload },
  { path: '/performer-support', label: 'Support', icon: MessageSquare },
];

export default function PerformerMobileLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">
              <span className="text-primary">LUXE</span>
              <span className="text-foreground/60 font-light ml-2">Talent Systems</span>
            </h1>
            <p className="text-xs text-muted-foreground">Hi {user?.full_name}</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors p-2">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="p-4">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        {/* Top row */}
        <div className="flex justify-around border-b border-border/50">
          {topNavItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-center w-full py-2 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
              </Link>
            );
          })}
        </div>
        {/* Bottom row */}
        <div className="flex justify-around">
          {bottomNavItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-center w-full py-2 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}