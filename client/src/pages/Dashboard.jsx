import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../App';
import ResourceList from '../components/ResourceList';
import PollSection from '../components/PollSection';
import EventsSection from '../components/EventsSection';
import Sidebar from '../components/Sidebar';
import StatsCard from '../components/StatsCard';
import ProjectStats from '../components/ProjectStats';
import { Users, TrendingUp, PartyPopper, Menu } from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/ui/button';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ total: 0, polls: 0, events: 0 });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [resources, polls] = await Promise.all([
        api.get('/api/resources'),
        api.get('/api/polls')
      ]);

      // Count upcoming events
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let eventsCount = 0;

      resources.forEach(r => {
        if (r.birthday) {
          const birthday = new Date(r.birthday);
          const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
          if (thisYearBirthday < today) thisYearBirthday.setFullYear(today.getFullYear() + 1);
          const daysUntil = Math.ceil((thisYearBirthday - today) / (1000 * 60 * 60 * 24));
          if (daysUntil <= 30) eventsCount++;
        }
        if (r.joiningDate) {
          const joinDate = new Date(r.joiningDate);
          const thisYearAnniv = new Date(today.getFullYear(), joinDate.getMonth(), joinDate.getDate());
          if (thisYearAnniv < today) thisYearAnniv.setFullYear(today.getFullYear() + 1);
          const daysUntil = Math.ceil((thisYearAnniv - today) / (1000 * 60 * 60 * 24));
          const years = today.getFullYear() - joinDate.getFullYear();
          if (daysUntil <= 30 && years > 0) eventsCount++;
        }
      });

      setStats({ 
        total: resources.length, 
        polls: polls.length,
        events: eventsCount
      });
    } catch (err) {
      console.error('Failed to fetch stats');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
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

      {/* Sidebar */}
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
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-background border-b px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            TeamInSync
          </h1>
          <div className="w-10" />
        </div>

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {activeTab === 'dashboard' ? 'Dashboard' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Welcome back, {user.name}! Here's your team overview.
              </p>
            </div>

            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Top Stats Row */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                  <StatsCard 
                    title="Total Team Members" 
                    value={stats.total} 
                    icon={Users} 
                    description="Active employees"
                  />
                  <StatsCard 
                    title="Active Polls" 
                    value={stats.polls} 
                    icon={TrendingUp} 
                    description="Awaiting responses"
                  />
                  <StatsCard 
                    title="Upcoming Events" 
                    value={stats.events} 
                    icon={PartyPopper} 
                    description="Next 30 days"
                  />
                </div>

                {/* Dashboard Layout - 2 Columns */}
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-[300px_1fr] items-start h-full">
                  {/* Column 1: Projects */}
                  <div className="h-full">
                    <ProjectStats className="h-full min-h-[500px]" />
                  </div>

                  {/* Column 2: Events */}
                  <div className="h-full">
                    <EventsSection className="h-full min-h-[500px]" />
                  </div>
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
