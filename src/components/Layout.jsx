import { Outlet, Link, useLocation } from 'react-router-dom';
import { Users, FileText, Calendar, Monitor, LayoutDashboard, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from "@/lib/utils";

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/performers', label: 'Performers', icon: Users },
  { path: '/memos', label: 'Memos', icon: FileText },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/stripchat', label: 'Stripchat', icon: Monitor },
];

export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background font-inter">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-sidebar fixed h-full z-30">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-primary">LUXE</span>
            <span className="text-foreground/60 font-light ml-1.5">MGMT</span>
          </h1>
          <p className="text-[11px] text-muted-foreground mt-1 tracking-widest uppercase">Management Systems</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
            const active = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold">
          <span className="text-primary">LUXE</span>
          <span className="text-foreground/60 font-light ml-1">MGMT</span>
        </h1>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-foreground">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/60" onClick={() => setMobileOpen(false)}>
          <aside className="w-64 bg-sidebar h-full pt-16 p-4 space-y-1" onClick={e => e.stopPropagation()}>
            {navItems.map(item => {
              const active = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}