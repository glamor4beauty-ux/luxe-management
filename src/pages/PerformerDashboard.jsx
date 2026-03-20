import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Calendar, BookOpen, Zap, MessageSquare, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function PerformerDashboard() {
  const { user } = useAuth();
  const [performer, setPerformer] = useState(null);
  const [upcomingShifts, setUpcomingShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

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
        <p className="text-muted-foreground">Your stage name: {performer?.stageName || 'Not set'}</p>
      </div>

      {performer && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Profile Photos</h2>
            <div className="space-y-3">
              {[{ key: 'profilePhoto', label: 'Profile Photo' }, { key: 'idFront', label: 'ID Front' }, { key: 'idBack', label: 'ID Back' }, { key: 'faceId', label: 'Face + ID' }].map(photo => (
                <div key={photo.key} className="flex items-center justify-between gap-3 bg-secondary/50 rounded-lg p-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{photo.label}</p>
                  </div>
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

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Personal Info</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">First Name</p>
                <p className="font-medium text-foreground">{performer.firstName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Name</p>
                <p className="font-medium text-foreground">{performer.lastName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Stage Name (Read-only)</p>
                <p className="font-medium text-foreground bg-secondary/50 rounded px-3 py-2">{performer.stageName}</p>
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
                <p className="text-xs text-muted-foreground">Date of Birth</p>
                <p className="font-medium text-foreground">{performer.dateOfBirth ? new Date(performer.dateOfBirth).toLocaleDateString() : '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Display Age</p>
                <p className="font-medium text-foreground">{performer.displayAge || '-'}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">About</h2>
            <p className="text-sm text-foreground leading-relaxed bg-secondary/50 rounded px-3 py-3">{performer.aboutMe || 'No bio added yet'}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Physical Attributes</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Height</p>
                <p className="font-medium text-foreground">{performer.height || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Weight</p>
                <p className="font-medium text-foreground">{performer.weight || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Build</p>
                <p className="font-medium text-foreground">{performer.build || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ethnicity</p>
                <p className="font-medium text-foreground">{performer.ethnicity || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Eye Color</p>
                <p className="font-medium text-foreground">{performer.eyeColor || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Hair Color</p>
                <p className="font-medium text-foreground">{performer.hairColor || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Hair Length</p>
                <p className="font-medium text-foreground">{performer.hairLength || '-'}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Preferences</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Orientation</p>
                <p className="font-medium text-foreground">{performer.orientation || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Interested In</p>
                <p className="font-medium text-foreground">{performer.interestedIn || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Turns On</p>
                <p className="font-medium text-foreground">{performer.turnsOn || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Turns Off</p>
                <p className="font-medium text-foreground">{performer.turnsOff || '-'}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Location</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Street Address</p>
                <p className="font-medium text-foreground">{performer.streetAddress || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">City</p>
                <p className="font-medium text-foreground">{performer.city || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">State</p>
                <p className="font-medium text-foreground">{performer.state || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Zip Code</p>
                <p className="font-medium text-foreground">{performer.zipCode || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Country</p>
                <p className="font-medium text-foreground">{performer.country || '-'}</p>
              </div>
            </div>
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