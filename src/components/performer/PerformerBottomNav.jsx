import { useLocation, Link } from 'react-router-dom';
import { Home, BookOpen, ClipboardList, MessageSquare } from 'lucide-react';

const navItems = [
  { path: '/performer-dashboard', label: 'Dashboard', icon: Home },
  { path: '/performer-knowledge', label: 'Knowledge', icon: BookOpen },
  { path: '/performer-performance', label: 'Tasks', icon: ClipboardList },
  { path: '/performer-support', label: 'Support', icon: MessageSquare },
];

export default function PerformerBottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 flex items-center justify-around md:hidden">
      {navItems.map(item => {
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
  );
}