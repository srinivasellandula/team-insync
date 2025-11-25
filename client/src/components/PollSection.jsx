import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Plus, Trash2, CheckCircle, Users } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

const PollSection = ({ user, compact = false, className = '' }) => {
  const [polls, setPolls] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pollToDelete, setPollToDelete] = useState(null);
  const [newPollTitle, setNewPollTitle] = useState('');
  const [newPollOptions, setNewPollOptions] = useState('');
  const isManager = user.role === 'manager';

  useEffect(() => {
    fetchPolls();
  }, []);

  useEffect(() => {
    if (isManager) {
      fetchUsers();
    }
  }, [isManager, polls]); // Re-fetch users when polls change (which happens after resource deletion)

  const fetchPolls = async () => {
    try {
      const data = await api.get('/api/polls');
      setPolls(data);
    } catch (err) {
      console.error('Failed to fetch polls');
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await api.get('/api/users');
      setAllUsers(data);
    } catch (err) {
      console.error('Failed to fetch users');
    }
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    
    if (!newPollTitle.trim()) {
      toast.error('Please enter a poll title');
      return;
    }
    
    const options = newPollOptions.split(',').map(o => o.trim()).filter(o => o);
    if (options.length < 2) {
      toast.error('Please provide at least 2 options');
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/polls`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': user.id
          },
          body: JSON.stringify({ title: newPollTitle, options }),
        }
      );
      if (res.ok) {
        fetchPolls();
        setIsDialogOpen(false);
        setNewPollTitle('');
        setNewPollOptions('');
        toast.success('Poll created successfully');
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to create poll');
      }
    } catch (err) {
      toast.error('Failed to create poll');
    }
  };

  const handleVote = async (pollId, optionLabel) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/polls/${pollId}/vote`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, optionLabel }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        fetchPolls();
        toast.success('Vote recorded');
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to vote');
    }
  };

  const handleDeleteClick = (pollId) => {
    setPollToDelete(pollId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!pollToDelete) return;
    
    try {
      await api.delete(`/api/polls/${pollToDelete}`);
      fetchPolls();
      toast.success('Poll deleted successfully');
    } catch (err) {
      toast.error('Failed to delete poll');
    } finally {
      setDeleteConfirmOpen(false);
      setPollToDelete(null);
    }
  };

  const getPendingVoters = (poll) => {
    if (!poll.votedUsers) return [];
    const eligibleVoters = allUsers.filter(u => u.role === 'user');
    return eligibleVoters.filter(u => !poll.votedUsers.includes(u.id));
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {!compact && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Polls</h3>
          </div>
          {isManager && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Poll
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Poll</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreatePoll} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Poll Title</Label>
                    <Input
                      id="title"
                      value={newPollTitle}
                      onChange={(e) => setNewPollTitle(e.target.value)}
                      placeholder="e.g., Lunch Preference"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="options">Options (comma-separated)</Label>
                    <Input
                      id="options"
                      value={newPollOptions}
                      onChange={(e) => setNewPollOptions(e.target.value)}
                      placeholder="e.g., Veg, Non Veg, Egg"
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit">Create Poll</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}

      {compact && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Active Polls
          </h3>
        </div>
      )}

      {polls.length === 0 ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-muted-foreground text-center">No active polls</p>
          </CardContent>
        </Card>
      ) : (
        <div className={`grid gap-4 ${
          compact ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-4'
        }`}>
          {(compact ? polls.slice(0, 4) : polls).map((poll) => {
            const hasVoted = poll.votedUsers.includes(user.id);
            const pendingVoters = isManager ? getPendingVoters(poll) : [];

            return (
              <Card key={poll.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span>{poll.title}</span>
                    {isManager && (
                      <Button variant="ghost" size="icon" className="text-destructive -mt-2 -mr-2" onClick={() => handleDeleteClick(poll.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {poll.votedUsers.length} votes total
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  {poll.options.map((option) => (
                    <div key={option.label} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{option.label}</span>
                        <span className="font-medium">{option.votes}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary">
                        <div 
                          className="h-full rounded-full bg-primary transition-all" 
                          style={{ width: `${poll.votedUsers.length ? (option.votes / poll.votedUsers.length) * 100 : 0}%` }}
                        />
                      </div>
                      {!isManager && !hasVoted && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-2" 
                          onClick={() => handleVote(poll.id, option.label)}
                        >
                          Vote {option.label}
                        </Button>
                      )}
                    </div>
                  ))}
                  {hasVoted && !isManager && (
                    <p className="text-center text-sm text-green-600 font-medium flex items-center justify-center gap-1">
                      <CheckCircle className="h-4 w-4" /> You have voted
                    </p>
                  )}
                </CardContent>
                {isManager && (
                  <CardFooter className="flex-col items-start border-t bg-muted/20 pt-4">
                    <div className="flex items-center gap-2 text-sm font-medium mb-2 w-full">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      Pending Voters ({pendingVoters.length})
                    </div>
                    {pendingVoters.length > 0 ? (
                      <div className="flex flex-wrap gap-1 w-full">
                        {pendingVoters.map(u => (
                          <span key={u.id} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                            {u.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">All users have voted!</p>
                    )}
                  </CardFooter>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Poll?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this poll and all its votes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Poll
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PollSection;
