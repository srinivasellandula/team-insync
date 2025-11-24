import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../App';
import ResourceList from '../components/ResourceList';
import PollSection from '../components/PollSection';
import EventsSection from '../components/EventsSection';
import Sidebar from '../components/Sidebar';
import StatsCard from '../components/StatsCard';
import { Users, Utensils, Menu, X } from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/ui/button';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ total: 0, veg: 0, nonVeg: 0 });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await api.get('/api/resources');
      const veg = data.filter(r => r.diet?.toLowerCase() === 'veg').length;
      const nonVeg = data.filter(r => r.diet?.toLowerCase().includes('non')).length;
      setStats({ total: data.length, veg, nonVeg });
    } catch (err) {
      console.error('Failed to fetch stats');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false); // Close mobile menu on navigation
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile, slides in when menu open */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={handleTabChange} 
          logout={logout} 
          user={user}
          onClose={() => setIsMobileMenuOpen(false)}
        />
      </div>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile Header with Hamburger */}
        <div className="lg:hidden sticky top-0 z-30 bg-background border-b px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            TeamInSync
          </h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {activeTab === 'dashboard' ? 'Dashboard' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Welcome back, {user.name}! Here's what's happening today.
                </p>
              </div>
            </div>

            {activeTab === 'dashboard' && (
              <div className="space-y-6 sm:space-y-8">
                {/* Stats Cards */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  <StatsCard 
                    title="Total Resources" 
                    value={stats.total} 
                    icon={Users} 
                    description="Active team members"
                  />
                  <StatsCard 
                    title="Vegetarian" 
                    value={stats.veg} 
                    icon={Utensils} 
                    description={`${Math.round((stats.veg / stats.total) * 100) || 0}% of team`}
                  />
                  <StatsCard 
                    title="Non-Vegetarian" 
                    value={stats.nonVeg} 
                    icon={Utensils} 
                    description={`${Math.round((stats.nonVeg / stats.total) * 100) || 0}% of team`}
                  />
                </div>

                {/* Resources Section */}
                <div>
                  <ResourceList user={user} />
                </div>

                {/* Polls Section */}
                <div className="pt-4">
                  <PollSection user={user} />
                </div>

                {/* Events Section */}
                <div className="pt-4">
                  <EventsSection />
                </div>
              </div>
            )}

            {activeTab === 'resources' && <ResourceList user={user} />}
            {activeTab === 'polls' && <PollSection user={user} />}
            {activeTab === 'events' && <EventsSection />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
