import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Cake, PartyPopper, Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import api from '../services/api';

const EventsSection = ({ className = '' }) => {
  const [events, setEvents] = useState({ birthdays: [], anniversaries: [] });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchEvents();
  }, [selectedMonth, currentYear]);

  const fetchEvents = async () => {
    try {
      const resources = await api.get('/api/resources');
      const monthEvents = calculateMonthEvents(resources, selectedMonth, currentYear);
      setEvents(monthEvents);
    } catch (err) {
      console.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthEvents = (resources, month, year) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const birthdays = [];
    const anniversaries = [];

    resources.forEach(resource => {
      // Calculate birthdays
      if (resource.birthday) {
        const birthday = new Date(resource.birthday);
        
        // Check if birthday falls in selected month
        if (birthday.getMonth() === month) {
          const eventDate = new Date(year, month, birthday.getDate());
          const age = year - birthday.getFullYear();
          
          // Calculate days difference
          const diffTime = eventDate - today;
          const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          birthdays.push({
            name: resource.name,
            date: eventDate,
            daysDiff,
            age,
            icon: Cake
          });
        }
      }

      // Calculate work anniversaries
      if (resource.joiningDate) {
        const joiningDate = new Date(resource.joiningDate);
        
        // Check if anniversary falls in selected month
        if (joiningDate.getMonth() === month) {
          const eventDate = new Date(year, month, joiningDate.getDate());
          const years = year - joiningDate.getFullYear();
          
          // Calculate days difference
          const diffTime = eventDate - today;
          const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          // Only show if it's at least 1 year anniversary
          if (years > 0) {
            anniversaries.push({
              name: resource.name,
              date: eventDate,
              daysDiff,
              years,
              icon: PartyPopper
            });
          }
        }
      }
    });

    // Sort by date (1st to 31st)
    birthdays.sort((a, b) => a.date.getDate() - b.date.getDate());
    anniversaries.sort((a, b) => a.date.getDate() - b.date.getDate());

    return { birthdays, anniversaries };
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getCountdownText = (daysDiff) => {
    if (daysDiff === 0) return 'Today';
    if (daysDiff === 1) return 'Tomorrow';
    if (daysDiff === -1) return 'Yesterday';
    if (daysDiff > 0) return `${daysDiff}d`;
    return `${Math.abs(daysDiff)}d ago`;
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const monthName = months[selectedMonth];

  const EventCard = ({ event, isBirthday }) => {
    const Icon = event.icon;
    const isToday = event.daysDiff === 0;
    const isPast = event.daysDiff < 0;
    const isSoon = event.daysDiff <= 7 && event.daysDiff > 0;
    
    return (
      <div
        className={`relative overflow-hidden rounded-lg border-2 p-3 transition-all hover:shadow-md ${
          isPast ? 'opacity-60' : ''
        } ${
          isBirthday
            ? 'bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200 dark:from-pink-950/20 dark:to-purple-950/20 dark:border-pink-800'
            : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 dark:from-blue-950/20 dark:to-cyan-950/20 dark:border-blue-800'
        }`}
      >
        {/* Icon and Countdown */}
        <div className="flex items-start gap-3 mb-2">
          <div
            className={`p-2 rounded-lg ${
              isBirthday
                ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400'
                : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
            }`}
          >
            <Icon className="h-4 w-4" />
          </div>
          
          {/* Countdown badge */}
          <div className={`ml-auto text-xs font-bold px-2 py-1 rounded-full ${
            isToday
              ? 'bg-green-500 text-white animate-pulse'
              : isSoon
                ? isBirthday
                  ? 'bg-pink-200 text-pink-800 dark:bg-pink-900/50 dark:text-pink-200'
                  : 'bg-blue-200 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          }`}>
            {getCountdownText(event.daysDiff)}
          </div>
        </div>
        
        {/* Name */}
        <h3 className="font-bold text-sm mb-1 text-gray-900 dark:text-gray-100 truncate">
          {event.name}
        </h3>
        
        {/* Event type */}
        <p className={`text-xs font-medium mb-2 ${
          isBirthday
            ? 'text-pink-700 dark:text-pink-300'
            : 'text-blue-700 dark:text-blue-300'
        }`}>
          {isBirthday ? `🎂 ${event.age} years` : `🎉 ${event.years} year${event.years > 1 ? 's' : ''}`}
        </p>
        
        {/* Date */}
        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(event.date)}</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading events...</p>
        </CardContent>
      </Card>
    );
  }

  const totalEvents = events.birthdays.length + events.anniversaries.length;

  return (
    <Card className={className}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Events
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {totalEvents} event{totalEvents !== 1 ? 's' : ''} in {monthName}
          </p>
        </div>
        <Select
          value={selectedMonth.toString()}
          onValueChange={(value) => setSelectedMonth(parseInt(value))}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {months.map((month, index) => (
              <SelectItem key={index} value={index.toString()}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {totalEvents === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground text-sm">No events in {monthName}</p>
          </div>
        ) : (
          <>
            {/* Birthdays Section */}
            {events.birthdays.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-pink-700 dark:text-pink-400">
                  <Cake className="h-4 w-4" />
                  Birthdays ({events.birthdays.length})
                </h3>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {events.birthdays.map((event, index) => (
                    <EventCard key={`birthday-${index}`} event={event} isBirthday={true} />
                  ))}
                </div>
              </div>
            )}

            {/* Anniversaries Section */}
            {events.anniversaries.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <PartyPopper className="h-4 w-4" />
                  Work Anniversaries ({events.anniversaries.length})
                </h3>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {events.anniversaries.map((event, index) => (
                    <EventCard key={`anniversary-${index}`} event={event} isBirthday={false} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default EventsSection;
