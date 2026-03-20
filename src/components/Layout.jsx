import { Outlet, Link, useLocation } from 'react-router-dom';
import { Users, FileText, Calendar, Monitor, LayoutDashboard, DollarSign, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from "@/lib/utils";
import {
  Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem,
  SidebarMenuButton, SidebarProvider, SidebarTrigger, SidebarInset
} from "@/components/ui/sidebar";

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/performers', label: 'Performers', icon: Users },
  { path: '/memos', label: 'Memos', icon: FileText },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/stripchat', label: 'Stripchat', icon: Monitor },
  { path: '/payouts', label: 'Payouts', icon: DollarSign },
];

export default function Layout() {
  const location = useLocation();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-5 border-b border-sidebar-border">
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-primary">LUXE</span>
            <span className="text-sidebar-foreground/50 font-light ml-1.5">MGMT</span>
          </h1>
          <p className="text-[10px] text-sidebar-foreground/40 mt-0.5 tracking-widest uppercase">Management Systems</p>
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
            <span className="text-foreground/50 font-light ml-1">MGMT</span>
          </h1>
        </header>
        <div className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}