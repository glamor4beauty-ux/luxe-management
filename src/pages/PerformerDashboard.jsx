import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Calendar, MessageSquare, BookOpen, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function PerformerDashboard() {
  const [user, setUser] = useState(null);
  const [upcomingShifts, setUpcomingShifts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const u = await base44.auth.me();
      setUser(u);

      const events = await base44.entities.Calendar.filter({ stageName: u.full_name });
      const upcoming = events.filter(e => new Date(e.startTime) > new Date()).slice(0, 3);
      setUpcomingShifts(upcoming);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back, {user?.full_name || 'Performer'}!</h1>
          <p className="text-muted-foreground">Manage your schedule, get support, and learn more</p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link to="/performer-shifts">
            <button className="w-full bg-card border border-border hover:border-primary/50 rounded-xl p-6 transition-all group">
              <Calendar className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-semibold text-foreground">Schedule Shifts</p>
              <p className="text-xs text-muted-foreground mt-1">Manage your availability</p>
            </button>
          </Link>

          <Link to="/support">
            <button className="w-full bg-card border border-border hover:border-primary/50 rounded-xl p-6 transition-all group">
              <MessageSquare className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-semibold text-foreground">Contact Support</p>
              <p className="text-xs text-muted-foreground mt-1">Get help from our team</p>
            </button>
          </Link>

          <Link to="/knowledge-base">
            <button className="w-full bg-card border border-border hover:border-primary/50 rounded-xl p-6 transition-all group">
              <BookOpen className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-semibold text-foreground">Knowledge Base</p>
              <p className="text-xs text-muted-foreground mt-1">Find answers & tips</p>
            </button>
          </Link>

          <Link to="/performer-profile">
            <button className="w-full bg-card border border-border hover:border-primary/50 rounded-xl p-6 transition-all group">
              <Clock className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-semibold text-foreground">My Profile</p>
              <p className="text-xs text-muted-foreground mt-1">View your details</p>
            </button>
          </Link>
        </div>

        {/* Upcoming Shifts */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Your Upcoming Shifts</h2>
          {upcomingShifts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-4">No shifts scheduled yet.</p>
              <Link to="/performer-shifts">
                <Button className="bg-primary text-primary-foreground">Schedule Your First Shift</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingShifts.map(shift => (
                <div key={shift.id} className="flex items-start justify-between bg-secondary/50 rounded-lg p-4">
                  <div>
                    <p className="font-medium text-foreground">{new Date(shift.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(shift.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {new Date(shift.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">{shift.totalHours}h</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}