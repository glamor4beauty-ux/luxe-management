import { Outlet, useLocation, Link } from 'react-router-dom';
import { Home, BookOpen, ClipboardList, MessageSquare, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

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
  const [taskCount, setTaskCount] = useState(0);
  const [hasNewTasks, setHasNewTasks] = useState(false);

  useEffect(() => {
    if (!user?.stageName) return;

    const loadTasks = async () => {
      const tasks = await base44.entities.Task.filter({ performerStageName: user.stageName });
      setTaskCount(tasks.length);
    };

    loadTasks();

    // Subscribe to task changes
    const unsubscribe = base44.entities.Task.subscribe((event) => {
      if (event.data?.performerStageName === user.stageName) {
        setHasNewTasks(true);
        setTimeout(() => setHasNewTasks(false), 3000); // Stop blinking after 3s
        loadTasks();
      }
    });

    return unsubscribe;
  }, [user]);

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
          const isTasksIcon = item.path === '/performer-performance';
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors relative ${
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${isTasksIcon && hasNewTasks ? 'animate-pulse text-green-400' : ''}`} />
                {isTasksIcon && taskCount > 0 && (
                  <span className={`absolute -top-2 -right-2 h-5 w-5 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center ${
                    hasNewTasks ? 'animate-pulse' : ''
                  }`}>
                    {taskCount > 9 ? '9+' : taskCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}