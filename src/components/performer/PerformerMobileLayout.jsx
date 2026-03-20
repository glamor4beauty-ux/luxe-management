import { Outlet, useLocation, Link } from 'react-router-dom';
import { Calendar, BookOpen, Monitor, Upload, MessageSquare } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const navItems = [
  { path: '/performer-schedule', label: 'Schedule', icon: Calendar },
  { path: '/performer-knowledge', label: 'Learn', icon: BookOpen },
  { path: '/performer-stripchat-view', label: 'Stripchat', icon: Monitor },
  { path: '/performer-upload', label: 'Upload', icon: Upload },
  { path: '/performer-support', label: 'Support', icon: MessageSquare },
];

export default function PerformerMobileLayout() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 sticky top-0 z-10">
        <div>
          <h1 className="text-sm font-bold text-primary">LUXE</h1>
          <p className="text-xs text-muted-foreground">Model Management</p>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Welcome, {user?.full_name}</p>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="p-4">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex justify-around">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center w-full py-3 text-xs transition-colors ${
                  isActive
                    ? 'text-primary border-t-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}