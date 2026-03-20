import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, FileText, Calendar, Monitor } from 'lucide-react';

const InfoRow = ({ label, value }) => value ? (
  <div className="flex flex-col">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-sm text-foreground">{value}</span>
  </div>
) : null;

const Section = ({ title, icon: Icon, children }) => (
  <div className="bg-card border border-border rounded-xl p-5">
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-4 w-4 text-primary" />
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
    {children}
  </div>
);

export default function PerformerView() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  const [performer, setPerformer] = useState(null);
  const [memos, setMemos] = useState([]);
  const [events, setEvents] = useState([]);
  const [stripchat, setStripchat] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await base44.entities.Performer.filter({ id });
      if (res.length === 0) { navigate('/performers'); return; }
      const p = res[0];
      setPerformer(p);

      const [m, e, s] = await Promise.all([
        base44.entities.Memo.filter({ email: p.email }),
        base44.entities.Calendar.filter({ stageName: p.stageName }),
        base44.entities.Stripchat.filter({ stageName: p.stageName }),
      ]);
      setMemos(m);
      setEvents(e);
      setStripchat(s);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!performer) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/performers')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-4">
            {performer.profilePhoto ? (
              <img src={performer.profilePhoto} alt="" className="h-12 w-12 rounded-full object-cover border-2 border-primary/20" />
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {(performer.firstName?.[0] || '') + (performer.lastName?.[0] || '')}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-foreground">{performer.firstName} {performer.lastName}</h1>
              <p className="text-sm text-primary">@{performer.stageName}</p>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(`/performers/${id}/edit`)} className="border-border">
          <Pencil className="h-4 w-4 mr-2" /> Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Basic Info */}
        <div className="bg-card border border-border rounded-xl p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground mb-4">Profile Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <InfoRow label="Email" value={performer.email} />
            <InfoRow label="Phone" value={performer.phone} />
            <InfoRow label="Recruiter" value={performer.recruiterName} />
            <InfoRow label="Applying For" value={performer.applyingFor} />
            <InfoRow label="City" value={performer.city} />
            <InfoRow label="State" value={performer.state} />
            <InfoRow label="Country" value={performer.country} />
            <InfoRow label="Display Age" value={performer.displayAge} />
            <InfoRow label="Height" value={performer.height} />
            <InfoRow label="Weight" value={performer.weight} />
            <InfoRow label="Build" value={performer.build} />
            <InfoRow label="Ethnicity" value={performer.ethnicity} />
            <InfoRow label="Eye Color" value={performer.eyeColor} />
            <InfoRow label="Hair Color" value={performer.hairColor} />
            <InfoRow label="Orientation" value={performer.orientation} />
            <InfoRow label="Primary Language" value={performer.primaryLanguage} />
          </div>
          {performer.aboutMe && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">About</p>
              <p className="text-sm text-foreground">{performer.aboutMe}</p>
            </div>
          )}
        </div>

        {/* Memos */}
        <Section title={`Memos (${memos.length})`} icon={FileText}>
          {memos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No memos found.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {memos.map(m => (
                <div key={m.id} className="bg-secondary/50 rounded-lg p-3 text-sm text-foreground">
                  {m.memo}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Calendar */}
        <Section title={`Calendar Events (${events.length})`} icon={Calendar}>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No scheduled events.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {events.map(e => (
                <div key={e.id} className="bg-secondary/50 rounded-lg p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-foreground">{new Date(e.startTime).toLocaleString()}</span>
                    <span className="text-primary font-medium">{e.totalHours}h</span>
                  </div>
                  <span className="text-xs text-muted-foreground">to {new Date(e.endTime).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Stripchat */}
        <Section title={`Stripchat (${stripchat.length})`} icon={Monitor}>
          {stripchat.length === 0 ? (
            <p className="text-sm text-muted-foreground">No Stripchat profiles.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {stripchat.map(s => (
                <div key={s.id} className="bg-secondary/50 rounded-lg p-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground">{s.profileUrl || 'No URL'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'active' ? 'bg-green-500/10 text-green-400' : s.status === 'inactive' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                      {s.status || 'pending'}
                    </span>
                  </div>
                  {s.notes && <p className="text-xs text-muted-foreground mt-1">{s.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}