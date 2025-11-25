import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Briefcase, User } from 'lucide-react';
import api from '../services/api';

const ProjectStats = ({ className = '' }) => {
  const [projectGroups, setProjectGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectStats();
  }, []);

  const fetchProjectStats = async () => {
    try {
      const resources = await api.get('/api/resources');
      
      // Group by project
      const groups = resources.reduce((acc, curr) => {
        const project = curr.project || 'Unassigned';
        if (!acc[project]) {
          acc[project] = [];
        }
        acc[project].push(curr);
        return acc;
      }, {});

      // Convert to array and sort by count (descending)
      const groupsArray = Object.entries(groups)
        .map(([name, employees]) => ({ name, employees }))
        .sort((a, b) => b.employees.length - a.employees.length);

      setProjectGroups(groupsArray);
    } catch (err) {
      console.error('Failed to fetch project stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Project Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading stats...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Briefcase className="h-5 w-5" />
        Project Distribution
      </h3>
      
      {projectGroups.length === 0 ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-muted-foreground text-center">No project data available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 h-full content-start">
          {projectGroups.map((group, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="bg-muted/30 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold truncate" title={group.name}>
                    {group.name}
                  </CardTitle>
                  <span className="inline-flex items-center justify-center bg-primary/10 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {group.employees.length}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[200px] overflow-y-auto">
                  {group.employees.map((emp, i) => (
                    <div 
                      key={emp.id} 
                      className="flex items-center gap-3 p-3 border-b last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        i % 4 === 0 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                        i % 4 === 1 ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' :
                        i % 4 === 2 ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                        'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                      }`}>
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{emp.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{emp.role || 'Team Member'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectStats;
