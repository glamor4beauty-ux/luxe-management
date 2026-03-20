import { Outlet, Link, useLocation } from 'react-router-dom';
import { Users, FileText, Calendar, Monitor, LayoutDashboard, DollarSign, ClipboardList, Settings } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { cn } from "@/lib/utils";
import {
  Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem,
  SidebarMenuButton, SidebarProvider, SidebarTrigger, SidebarInset
} from "@/components/ui/sidebar";

const adminNavItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/performers', label: 'Performers', icon: Users },
  { path: '/memos', label: 'Memos', icon: FileText },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/stripchat', label: 'Stripchat', icon: Monitor },
  { path: '/payouts', label: 'Payouts', icon: DollarSign },
  { path: '/tasks', label: 'Tasks', icon: ClipboardList },
  { path: '/users', label: 'Users', icon: Settings },
];

const recruiterNavItems = [
  { path: '/recruiter', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/performers', label: 'My Performers', icon: Users },
];

export default function Layout() {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = user?.role === 'recruiter' ? recruiterNavItems : adminNavItems;

  // Hide admin pages from non-admin users
  const adminPages = ['/performers', '/memos', '/calendar', '/stripchat', '/payouts', '/tasks'];
  const isAdminPage = adminPages.includes(location.pathname) || adminPages.some(p => location.pathname.startsWith(p + '/'));
  const canAccessPage = user?.role === 'admin' || !isAdminPage;

  if (!canAccessPage) {
    return (
      <SidebarProvider>
        <SidebarInset>
          <div className="p-8 text-center h-screen flex items-center justify-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
              <p className="text-muted-foreground mb-4">You don't have permission to access this page.</p>
              <Link to="/" className="text-primary hover:underline">Go to Dashboard</Link>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-5 border-b border-sidebar-border">
          <h1 className="text-base font-bold tracking-tight leading-tight">
            <span className="text-primary">LUXE</span>
            <span className="text-sidebar-foreground font-light ml-1">Management Systems</span>
          </h1>
        </SidebarHeader>
        <SidebarContent className="p-3">
          <SidebarMenu>
            {navItems.map(item => {
              const active = location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={active} size="default">
                    <Link to={item.path} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border md:hidden">
          <SidebarTrigger />
          <h1 className="text-lg font-bold">
            <span className="text-primary">LUXE</span>
            <span className="text-foreground/70 font-light ml-1">Management Systems</span>
          </h1>
        </header>
        <div className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}