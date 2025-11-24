import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../App';
import ResourceList from '../components/ResourceList';
import PollSection from '../components/PollSection';
import EventsSection from '../components/EventsSection';
import Sidebar from '../components/Sidebar';
import StatsCard from '../components/StatsCard';
import { Users, Utensils, FileText } from 'lucide-react';
import api from '../services/api';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ total: 0, veg: 0, nonVeg: 0 });

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

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} logout={logout} user={user} />
      
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                {activeTab === 'dashboard' ? 'Dashboard' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h2>
              <p className="text-muted-foreground">
                Welcome back, {user.name}! Here's what's happening today.
              </p>
            </div>
          </div>

          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-3">
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

              {/* Polls Section - Full Width */}
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
      </main>
    </div>
  );
};

export default Dashboard;
