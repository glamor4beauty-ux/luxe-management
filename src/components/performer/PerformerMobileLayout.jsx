import { Outlet, useLocation, Link } from 'react-router-dom';
import { Home, BookOpen, ClipboardList, MessageSquare, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';

const bottomNavItems = [
  { path: '/performer-dashboard', label: 'Dashboard', icon: Home },
  { path: '/performer-knowledge', label: 'Knowledge', icon: BookOpen },
  { path: '/performer-performance', label: 'Tasks', icon: ClipboardList },
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
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 flex items-center justify-around">
        {bottomNavItems.map(item => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}