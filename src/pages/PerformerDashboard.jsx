import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Calendar, BookOpen, Zap, MessageSquare, Upload, Clock, GraduationCap, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function PerformerDashboard() {
  const { user } = useAuth();
  const [performer, setPerformer] = useState(null);
  const [upcomingShifts, setUpcomingShifts] = useState([]);
  const [weeklyHours, setWeeklyHours] = useState(0);
  const [classroomAssignment, setClassroomAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function load() {
      const performers = await base44.entities.Performer.filter({ stageName: user?.stageName || user?.full_name });
      const p = performers[0] || null;
      if (p) setPerformer(p);

      const cal = await base44.entities.Calendar.filter({ stageName: user?.stageName || user?.full_name });
      const now = new Date();

      const upcoming = cal
        .filter(c => new Date(c.startTime) > now)
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
        .slice(0, 5);
      setUpcomingShifts(upcoming);

      // Hours this week
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const hours = cal
        .filter(c => { const s = new Date(c.startTime); return s >= weekStart && s < weekEnd; })
        .reduce((sum, c) => sum + (c.totalHours || 0), 0);
      setWeeklyHours(hours);

      // Fetch classroom assignment
      if (p) {
        try {
          const res = await base44.functions.invoke('getPerformerClassroomAssignment', {
            stageName: p.stageName,
            firstName: p.firstName,
            lastName: p.lastName
          });
          setClassroomAssignment(res.data?.assignment || null);
        } catch (e) { /* silent */ }
      }

      setLoading(false);
    }
    load();
  }, [user]);

  const handleUploadPhoto = async (type) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        await base44.entities.Performer.update(performer.id, { [type]: file_url });
        setPerformer(p => ({ ...p, [type]: file_url }));
        toast.success('Photo updated!');
      } catch (e) {
        toast.error('Upload failed');
      }
      setUploading(false);
    };
    input.click();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">Welcome back, {user?.full_name}!</h1>
        <p className="text-muted-foreground">Stage name: <span className="text-primary font-medium">{performer?.stageName || 'Not set'}</span></p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Upcoming Shifts</p>
          </div>
          <p className="text-3xl font-bold text-foreground">{upcomingShifts.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Hours This Week</p>
          </div>
          <p className="text-3xl font-bold text-foreground">{weeklyHours}<span className="text-base font-normal text-muted-foreground ml-1">hrs</span></p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Onboarding</p>
          </div>
          {classroomAssignment ? (
            <a href={classroomAssignment.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              Open Assignment <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : (
            <p className="text-sm text-muted-foreground">No assignment yet</p>
          )}
        </div>
      </div>

      {/* Upcoming Shifts */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Upcoming Shifts</h2>
        {upcomingShifts.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-muted-foreground mb-3">No upcoming shifts scheduled</p>
            <Link to="/performer-schedule" className="text-sm text-primary hover:underline">+ Schedule a shift</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingShifts.map(shift => (
              <div key={shift.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
                    <span className="text-xs text-primary font-bold leading-tight">{new Date(shift.startTime).toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span className="text-sm text-primary font-bold leading-tight">{new Date(shift.startTime).getDate()}</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{new Date(shift.startTime).toLocaleDateString('en-US', { weekday: 'long' })}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(shift.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <span className="text-primary font-bold text-lg">{shift.totalHours || '—'}h</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Classroom Assignment Detail Card */}
      {classroomAssignment && (
        <div className="bg-card border border-primary/20 rounded-xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Google Classroom — {classroomAssignment.courseName}</p>
                <p className="font-semibold text-foreground">{classroomAssignment.title}</p>
                {classroomAssignment.dueDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Due: {classroomAssignment.dueDate.month}/{classroomAssignment.dueDate.day}/{classroomAssignment.dueDate.year}
                  </p>
                )}
              </div>
            </div>
            <a href={classroomAssignment.url} target="_blank" rel="noopener noreferrer">
              <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap">
                Open <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </a>
          </div>
        </div>
      )}

      {/* Quick Access */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/performer-schedule">
            <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors cursor-pointer">
              <Calendar className="h-7 w-7 text-primary mb-3" />
              <h3 className="font-semibold text-foreground text-sm mb-0.5">Schedule</h3>
              <p className="text-xs text-muted-foreground">Manage your shifts</p>
            </div>
          </Link>
          <Link to="/performer-support">
            <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors cursor-pointer">
              <MessageSquare className="h-7 w-7 text-primary mb-3" />
              <h3 className="font-semibold text-foreground text-sm mb-0.5">Support</h3>
              <p className="text-xs text-muted-foreground">Get help</p>
            </div>
          </Link>
          <Link to="/performer-knowledge">
            <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors cursor-pointer">
              <BookOpen className="h-7 w-7 text-primary mb-3" />
              <h3 className="font-semibold text-foreground text-sm mb-0.5">Knowledge Base</h3>
              <p className="text-xs text-muted-foreground">Learn more</p>
            </div>
          </Link>
          <Link to="/performer-upload">
            <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors cursor-pointer">
              <Upload className="h-7 w-7 text-primary mb-3" />
              <h3 className="font-semibold text-foreground text-sm mb-0.5">Upload Photos</h3>
              <p className="text-xs text-muted-foreground">Update your profile</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Profile Photos */}
      {performer && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-base font-semibold text-foreground mb-4">Profile Photos</h2>
          <div className="space-y-3">
            {[{ key: 'profilePhoto', label: 'Profile Photo' }, { key: 'idFront', label: 'ID Front' }, { key: 'idBack', label: 'ID Back' }, { key: 'faceId', label: 'Face + ID' }].map(photo => (
              <div key={photo.key} className="flex items-center justify-between gap-3 bg-secondary/50 rounded-lg p-3">
                <p className="text-sm font-medium text-foreground">{photo.label}</p>
                <div className="flex items-center gap-2">
                  {performer[photo.key] ? (
                    <img src={performer[photo.key]} alt={photo.label} className="h-12 w-12 rounded object-cover border border-border" />
                  ) : (
                    <div className="h-12 w-12 rounded bg-secondary border border-border flex items-center justify-center text-xs text-muted-foreground">None</div>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleUploadPhoto(photo.key)} disabled={uploading} className="border-border h-8 text-xs">
                    <Upload className="h-3 w-3 mr-1" /> Upload
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}