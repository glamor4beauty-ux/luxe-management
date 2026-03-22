import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Calendar, BookOpen, Zap, MessageSquare, Upload, Clock, GraduationCap, ExternalLink, LogOut, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TrendingUp } from 'lucide-react';

function Accordion({ performer, title, fields }) {
  const [open, setOpen] = useState(false);
  const hasValues = fields.some(f => performer[f]);

  if (!hasValues) return null;

  return (
    <div className="bg-card border border-border rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary/30 transition-colors"
      >
        <span>{title}</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <div className="border-t border-border px-4 py-3 grid grid-cols-2 gap-3 text-xs bg-secondary/20">
          {fields.map(f => (
            performer[f] && (
              <div key={f}>
                <p className="text-muted-foreground mb-0.5">{f.replace(/([A-Z])/g, ' $1').toLowerCase()}</p>
                <p className="text-foreground font-medium">{performer[f]}</p>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}

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
      if (!user?.stageName) {
        setLoading(false);
        return; // Cannot load without stage name
      }
      const performers = await base44.entities.Performer.filter({ stageName: user.stageName });
      const p = performers[0] || null;
      setPerformer(p);

      const cal = await base44.entities.Calendar.filter({ stageName: user.stageName });
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

  if (!user) {
    return <div className="p-8 text-center"><p className="text-muted-foreground mb-4">Not authenticated.</p></div>;
  }

  if (!user.stageName) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground mb-4">Stage name is not set. Cannot display performer record.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">Welcome back, {user?.full_name}!</h1>
        <p className="text-muted-foreground mb-3">Stage name: <span className="text-primary font-medium">{performer?.stageName || user?.stageName}</span></p>
        {/* Nav Buttons Under Name */}
        <div className="flex items-center gap-2">
          <Link to="/performer-instructions" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium transition-colors">
            <BookOpen className="h-4 w-4" /> Guide
          </Link>
          <Link to="/performer-stripchat-view" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium transition-colors">
            <Zap className="h-4 w-4" /> Stripchat
          </Link>
          <Link to="/performer-performance" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium transition-colors">
            <TrendingUp className="h-4 w-4" /> Performance
          </Link>
        </div>
      </div>

      {/* Hero: Profile + Shifts/Hours/Onboarding */}
      <div className="grid grid-cols-[180px_1fr] gap-6 items-end">
        {/* Left: Profile Image */}
        <div>
          {performer?.profilePhoto ? (
            <img src={performer.profilePhoto} alt="Profile" className="h-48 w-48 rounded-xl object-cover border border-border" />
          ) : (
            <div className="h-48 w-48 rounded-xl bg-secondary border border-border flex items-center justify-center text-xs text-muted-foreground">No photo</div>
          )}
        </div>
        {/* Right: Shifts, Hours, Onboarding */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
            <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="text-xs">
              <p className="text-muted-foreground">Upcoming Shifts</p>
              <p className="font-bold text-foreground">{upcomingShifts.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
            <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Clock className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="text-xs">
              <p className="text-muted-foreground">Weekly Hours</p>
              <p className="font-bold text-foreground">{weeklyHours}h</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
            <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="text-xs">
              {classroomAssignment ? (
                <a href={classroomAssignment.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Open Onboarding</a>
              ) : (
                <p className="text-muted-foreground">No assignment</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Row: Recruiter, Email, Phone, DOB, Applying For */}
      {performer && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 bg-card border border-border rounded-lg p-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Recruiter</p>
            <p className="text-sm font-medium text-foreground">{performer.recruiterName || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Email</p>
            <a href={`mailto:${performer.email}`} className="text-sm font-medium text-primary hover:underline">{performer.email}</a>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Phone</p>
            <a href={`tel:${performer.phone}`} className="text-sm font-medium text-primary hover:underline">{performer.phone || '—'}</a>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Date of Birth</p>
            <p className="text-sm font-medium text-foreground">{performer.dateOfBirth ? new Date(performer.dateOfBirth).toLocaleDateString() : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Display Age</p>
            <p className="text-sm font-medium text-foreground">{performer.displayAge || '—'}</p>
          </div>
          {performer.applyingFor && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Applying For</p>
              <p className="text-sm font-medium text-foreground">{performer.applyingFor}</p>
            </div>
          )}
        </div>
      )}

      {/* Stats Row - Compact */}
      <div className="flex gap-3 items-center">
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
          <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Calendar className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="text-xs">
            <p className="text-muted-foreground">Shifts</p>
            <p className="font-bold text-foreground">{upcomingShifts.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
          <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Clock className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="text-xs">
            <p className="text-muted-foreground">Hours</p>
            <p className="font-bold text-foreground">{weeklyHours}h</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
          <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="text-xs">
            {classroomAssignment ? (
              <a href={classroomAssignment.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                Open
              </a>
            ) : (
              <p className="text-muted-foreground">No assignment</p>
            )}
          </div>
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
          <Link to="/performer-upload">
            <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors cursor-pointer">
              <Upload className="h-7 w-7 text-primary mb-3" />
              <h3 className="font-semibold text-foreground text-sm mb-0.5">Upload Photos</h3>
              <p className="text-xs text-muted-foreground">Update your profile</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Accordions: Performer Fields */}
      {performer && (
        <div className="space-y-3">
          {/* Physical Attributes */}
          <Accordion performer={performer} title="Physical Attributes" fields={['height', 'weight', 'build', 'ethnicity', 'eyeColor', 'hairColor', 'hairLength', 'breastSize', 'buttSize', 'dressSize']} />
          {/* Preferences */}
          <Accordion performer={performer} title="Preferences & Interests" fields={['orientation', 'sexualPreferences', 'interestedIn', 'turnsOn', 'turnsOff']} />
          {/* About & Bio */}
          <Accordion performer={performer} title="About Me" fields={['aboutMe']} />
          {/* Languages */}
          <Accordion performer={performer} title="Languages" fields={['primaryLanguage', 'otherLanguage']} />
          {/* Additional */}
          <Accordion performer={performer} title="Additional Info" fields={['alternateUsernames', 'commissionRate', 'memo']} />

          {/* Profile Photos */}
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
        </div>
      )}
    </div>
  );
}