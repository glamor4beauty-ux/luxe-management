import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Calendar, BookOpen, Zap, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from "@/components/ui/button";

export default function PerformerDashboard() {
  const { user } = useAuth();
  const [performer, setPerformer] = useState(null);
  const [upcomingShifts, setUpcomingShifts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const performers = await base44.entities.Performer.filter({ stageName: user?.stageName || user?.full_name });
      if (performers.length > 0) {
        setPerformer(performers[0]);
      }
      const cal = await base44.entities.Calendar.filter({ stageName: user?.stageName || user?.full_name });
      const upcoming = cal.filter(c => new Date(c.startTime) > new Date()).sort((a, b) => new Date(a.startTime) - new Date(b.startTime)).slice(0, 3);
      setUpcomingShifts(upcoming);
      setLoading(false);
    }
    load();
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">Welcome back, {user?.full_name}!</h1>
        <p className="text-muted-foreground">Your stage name: {performer?.stageName || 'Not set'}</p>
      </div>

      {performer && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Your Profile</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="font-medium text-foreground">{performer.firstName} {performer.lastName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium text-foreground">{performer.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="font-medium text-foreground">{performer.phone || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Age</p>
              <p className="font-medium text-foreground">{performer.displayAge || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="font-medium text-foreground">{performer.city}, {performer.state}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Orientation</p>
              <p className="font-medium text-foreground">{performer.orientation || '-'}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">About</p>
            <p className="text-sm text-foreground">{performer.aboutMe || 'No bio added yet'}</p>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/performer-schedule">
            <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors cursor-pointer">
              <Calendar className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-1">Schedule</h3>
              <p className="text-sm text-muted-foreground">Manage your shifts</p>
            </div>
          </Link>
          <Link to="/performer-support">
            <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors cursor-pointer">
              <MessageSquare className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-1">Support</h3>
              <p className="text-sm text-muted-foreground">Get help</p>
            </div>
          </Link>
          <Link to="/performer-knowledge">
            <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors cursor-pointer">
              <BookOpen className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-1">Knowledge Base</h3>
              <p className="text-sm text-muted-foreground">Learn more</p>
            </div>
          </Link>
          <Link to="/performer-upload">
            <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors cursor-pointer">
              <Zap className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-1">Upload Photos</h3>
              <p className="text-sm text-muted-foreground">Update your profile</p>
            </div>
          </Link>
        </div>
      </div>

      {upcomingShifts.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">Upcoming Shifts</h2>
          <div className="space-y-3">
            {upcomingShifts.map(shift => (
              <div key={shift.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{new Date(shift.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}</p>
                    <p className="text-sm text-muted-foreground">{new Date(shift.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(shift.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                  <span className="text-primary font-bold">{shift.totalHours}h</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {upcomingShifts.length === 0 && (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <p className="text-muted-foreground mb-4">No upcoming shifts</p>
          <Link to="/performer-schedule">
            <Button className="bg-primary text-primary-foreground">Schedule a Shift</Button>
          </Link>
        </div>
      )}
    </div>
  );
}