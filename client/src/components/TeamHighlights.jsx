import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Sparkles, Calendar, UserPlus, TrendingUp } from 'lucide-react';
import api from '../services/api';

const TeamHighlights = () => {
  const [highlights, setHighlights] = useState({
    recentHires: [],
    upcomingBirthdays: [],
    upcomingAnniversaries: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHighlights();
  }, []);

  const fetchHighlights = async () => {
    try {
      const resources = await api.get('/api/resources');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Recent hires (joined in last 30 days)
      const recentHires = resources
        .filter(r => {
          if (!r.joiningDate) return false;
          const joinDate = new Date(r.joiningDate);
          const daysSince = Math.ceil((today - joinDate) / (1000 * 60 * 60 * 24));
          return daysSince >= 0 && daysSince <= 30;
        })
        .slice(0, 3);

      // Upcoming birthdays (next 7 days)
      const upcomingBirthdays = [];
      const upcomingAnniversaries = [];

      resources.forEach(r => {
        if (r.birthday) {
          const birthday = new Date(r.birthday);
          const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
          if (thisYearBirthday < today) {
            thisYearBirthday.setFullYear(today.getFullYear() + 1);
          }
          const daysUntil = Math.ceil((thisYearBirthday - today) / (1000 * 60 * 60 * 24));
          if (daysUntil <= 7 && daysUntil >= 0) {
            upcomingBirthdays.push({ ...r, daysUntil, date: thisYearBirthday });
          }
        }

        if (r.joiningDate) {
          const joinDate = new Date(r.joiningDate);
          const thisYearAnniversary = new Date(today.getFullYear(), joinDate.getMonth(), joinDate.getDate());
          if (thisYearAnniversary < today) {
            thisYearAnniversary.setFullYear(today.getFullYear() + 1);
          }
          const daysUntil = Math.ceil((thisYearAnniversary - today) / (1000 * 60 * 60 * 24));
          const years = today.getFullYear() - joinDate.getFullYear();
          if (daysUntil <= 7 && daysUntil >= 0 && years > 0) {
            upcomingAnniversaries.push({ ...r, daysUntil, years, date: thisYearAnniversary });
          }
        }
      });

      setHighlights({
        recentHires,
        upcomingBirthdays: upcomingBirthdays.slice(0, 3),
        upcomingAnniversaries: upcomingAnniversaries.slice(0, 3)
      });
    } catch (err) {
      console.error('Failed to fetch highlights');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Team Highlights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  const hasHighlights = highlights.recentHires.length > 0 || 
                        highlights.upcomingBirthdays.length > 0 || 
                        highlights.upcomingAnniversaries.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5" />
          Team Highlights
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasHighlights ? (
          <p className="text-muted-foreground text-sm">No recent highlights</p>
        ) : (
          <div className="space-y-4">
            {/* Recent Hires */}
            {highlights.recentHires.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                  <UserPlus className="h-3 w-3" />
                  Recent Hires
                </h4>
                <div className="space-y-2">
                  {highlights.recentHires.map((person) => (
                    <div key={person.id} className="flex items-center gap-2 text-sm">
                      <div className="h-6 w-6 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 flex items-center justify-center text-xs font-bold">
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium truncate flex-1">{person.name}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(new Date(person.joiningDate))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Birthdays */}
            {highlights.upcomingBirthdays.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  This Week's Birthdays
                </h4>
                <div className="space-y-2">
                  {highlights.upcomingBirthdays.map((person) => (
                    <div key={person.id} className="flex items-center gap-2 text-sm">
                      <div className="h-6 w-6 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300 flex items-center justify-center text-xs font-bold">
                        🎂
                      </div>
                      <span className="font-medium truncate flex-1">{person.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {person.daysUntil === 0 ? 'Today' : person.daysUntil === 1 ? 'Tomorrow' : `In ${person.daysUntil}d`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Anniversaries */}
            {highlights.upcomingAnniversaries.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Work Anniversaries
                </h4>
                <div className="space-y-2">
                  {highlights.upcomingAnniversaries.map((person) => (
                    <div key={person.id} className="flex items-center gap-2 text-sm">
                      <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 flex items-center justify-center text-xs font-bold">
                        🎉
                      </div>
                      <span className="font-medium truncate flex-1">{person.name}</span>
                      <span className="text-xs text-muted-foreground">{person.years}y</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamHighlights;
