import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Cake, PartyPopper, Calendar } from 'lucide-react';
import api from '../services/api';

const EventsSection = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const resources = await api.get('/api/resources');
      const upcomingEvents = calculateUpcomingEvents(resources);
      setEvents(upcomingEvents);
    } catch (err) {
      console.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const calculateUpcomingEvents = (resources) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const events = [];

    resources.forEach(resource => {
      // Calculate birthdays
      if (resource.birthday) {
        const birthday = new Date(resource.birthday);
        const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
        
        // If birthday already passed this year, check next year
        if (thisYearBirthday < today) {
          thisYearBirthday.setFullYear(today.getFullYear() + 1);
        }
        
        const daysUntil = Math.ceil((thisYearBirthday - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntil <= 30) {
          const age = today.getFullYear() - birthday.getFullYear();
          events.push({
            type: 'birthday',
            name: resource.name,
            date: thisYearBirthday,
            daysUntil,
            age,
            icon: Cake
          });
        }
      }

      // Calculate work anniversaries
      if (resource.joiningDate) {
        const joiningDate = new Date(resource.joiningDate);
        const thisYearAnniversary = new Date(today.getFullYear(), joiningDate.getMonth(), joiningDate.getDate());
        
        // If anniversary already passed this year, check next year
        if (thisYearAnniversary < today) {
          thisYearAnniversary.setFullYear(today.getFullYear() + 1);
        }
        
        const daysUntil = Math.ceil((thisYearAnniversary - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntil <= 30) {
          const years = today.getFullYear() - joiningDate.getFullYear();
          // Only show if it's at least 1 year anniversary
          if (years > 0) {
            events.push({
              type: 'anniversary',
              name: resource.name,
              date: thisYearAnniversary,
              daysUntil,
              years,
              icon: PartyPopper
            });
          }
        }
      }
    });

    // Sort by date (closest first)
    return events.sort((a, b) => a.daysUntil - b.daysUntil);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  const getCountdownText = (daysUntil) => {
    if (daysUntil === 0) return 'Today';
    if (daysUntil === 1) return 'Tomorrow';
    return `In ${daysUntil} days`;
  };

  const getEventTypeText = (event) => {
    if (event.type === 'birthday') {
      return `Birthday (${event.age} years)`;
    }
    return `${event.years} ${event.years === 1 ? 'Year' : 'Years'} Anniversary`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading events...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Events
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Birthdays and work anniversaries in the next 30 days
        </p>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No upcoming events in the next 30 days</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event, index) => {
              const Icon = event.icon;
              const isBirthday = event.type === 'birthday';
              
              return (
                <div
                  key={index}
                  className={`relative overflow-hidden rounded-xl border-2 p-5 transition-all hover:shadow-lg hover:scale-105 ${
                    isBirthday
                      ? 'bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 border-pink-300 dark:from-pink-950/30 dark:via-purple-950/30 dark:to-pink-950/30 dark:border-pink-700'
                      : 'bg-gradient-to-br from-blue-50 via-teal-50 to-blue-50 border-blue-300 dark:from-blue-950/30 dark:via-teal-950/30 dark:to-blue-950/30 dark:border-blue-700'
                  }`}
                >
                  {/* Decorative background pattern */}
                  <div className="absolute top-0 right-0 opacity-10">
                    <Icon className="h-24 w-24 -mr-6 -mt-6" />
                  </div>
                  
                  <div className="relative">
                    {/* Icon badge */}
                    <div
                      className={`inline-flex p-3 rounded-full mb-3 ${
                        isBirthday
                          ? 'bg-pink-200 text-pink-700 dark:bg-pink-800/50 dark:text-pink-300'
                          : 'bg-blue-200 text-blue-700 dark:bg-blue-800/50 dark:text-blue-300'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    
                    {/* Name - Large and prominent */}
                    <h3 className={`font-bold text-lg mb-1 ${
                      isBirthday 
                        ? 'text-pink-900 dark:text-pink-100' 
                        : 'text-blue-900 dark:text-blue-100'
                    }`}>
                      {event.name}
                    </h3>
                    
                    {/* Event type */}
                    <p className={`text-sm font-medium mb-3 ${
                      isBirthday
                        ? 'text-pink-700 dark:text-pink-300'
                        : 'text-blue-700 dark:text-blue-300'
                    }`}>
                      {getEventTypeText(event)}
                    </p>
                    
                    {/* Date and countdown */}
                    <div className="flex items-center justify-between pt-3 border-t border-current/10">
                      <div className="flex items-center gap-2">
                        <Calendar className={`h-4 w-4 ${
                          isBirthday 
                            ? 'text-pink-600 dark:text-pink-400' 
                            : 'text-blue-600 dark:text-blue-400'
                        }`} />
                        <p className={`text-sm font-medium ${
                          isBirthday
                            ? 'text-pink-800 dark:text-pink-200'
                            : 'text-blue-800 dark:text-blue-200'
                        }`}>
                          {formatDate(event.date)}
                        </p>
                      </div>
                      <p
                        className={`text-sm font-bold px-3 py-1 rounded-full ${
                          event.daysUntil === 0
                            ? isBirthday
                              ? 'bg-pink-200 text-pink-800 dark:bg-pink-800 dark:text-pink-200'
                              : 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {getCountdownText(event.daysUntil)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EventsSection;
