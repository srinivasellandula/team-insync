import React from 'react';
import { LayoutDashboard, Users, PieChart, LogOut, Calendar } from 'lucide-react';
import { Button } from './ui/button';

const Sidebar = ({ activeTab, setActiveTab, logout, user }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'resources', label: 'Resources', icon: Users },
    { id: 'polls', label: 'Polls', icon: PieChart },
    { id: 'events', label: 'Events', icon: Calendar },
  ];

  return (
    <div className="h-screen w-64 bg-card border-r flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          TeamInSync
        </h1>
        <p className="text-xs text-muted-foreground mt-1">TeamInSync</p>
      </div>

      <div className="flex-1 py-6 px-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "secondary" : "ghost"}
              className="w-full justify-start gap-3"
              onClick={() => setActiveTab(item.id)}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Button>
          );
        })}
      </div>

      <div className="p-4 border-t bg-muted/20">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {user.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
          </div>
        </div>
        <Button variant="destructive" className="w-full gap-2" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
