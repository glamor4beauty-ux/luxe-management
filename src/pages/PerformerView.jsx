import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, FileText, Calendar, Monitor, Upload, Loader2, Phone, MessageSquare } from 'lucide-react';
import ContractGenerator from '../components/performers/ContractGenerator';
import EmailTemplates from '../components/performers/EmailTemplates';
import PerformerTasks from '../components/performers/PerformerTasks';

const Section = ({ title, icon: Icon, children }) => (
  <div className="bg-card border border-border rounded-lg p-4">
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-4 w-4 text-primary" />
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
    {children}
  </div>
);

export default function PerformerView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [performer, setPerformer] = useState(null);
  const [memos, setMemos] = useState([]);
  const [events, setEvents] = useState([]);
  const [stripchat, setStripchat] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [contactMode, setContactMode] = useState('phone');

  useEffect(() => {
    async function load() {
      const res = await base44.entities.Performer.filter({ id });
      if (res.length === 0) { navigate('/performers'); return; }
      const p = res[0];
      setPerformer(p);

      const [m, e, s, pay] = await Promise.all([
        base44.entities.Memo.filter({ email: p.email }),
        base44.entities.Calendar.filter({ stageName: p.stageName }),
        base44.entities.Stripchat.filter({ stageName: p.stageName }),
        base44.entities.Payout.filter({ stageName: p.stageName }),
      ]);
      setMemos(m);
      setEvents(e);
      setStripchat(s);
      setPayouts(pay);
      setLoading(false);
    }
    load();
  }, [id]);

  const handlePhotoUpload = async (type) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploadingPhoto(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        await base44.entities.Performer.update(performer.id, { [type]: file_url });
        setPerformer(p => ({ ...p, [type]: file_url }));
      } catch (err) {
        console.error(err);
      }
      setUploadingPhoto(false);
    };
    input.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!performer) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/performers')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{performer.firstName} {performer.lastName}</h1>
            <p className="text-sm text-primary">@{performer.stageName || 'No stage name'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            <button
              onClick={() => setContactMode('phone')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                contactMode === 'phone' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Phone className="h-3 w-3" /> Call
            </button>
            <button
              onClick={() => setContactMode('sms')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                contactMode === 'sms' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageSquare className="h-3 w-3" /> SMS
            </button>
          </div>
          <ContractGenerator performer={performer} payouts={payouts} />
          <Button variant="outline" size="sm" onClick={() => navigate(`/performers/${performer.id}/edit`)} className="border-border">
            <Pencil className="h-4 w-4 mr-2" /> Edit
          </Button>
        </div>
      </div>

      {/* Quick Profile Info */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="grid grid-cols-[140px_1fr] gap-4 items-start">
          {/* Photo */}
          <div>
            {performer.profilePhoto ? (
              <img src={performer.profilePhoto} alt={performer.stageName} className="h-32 w-32 rounded-lg object-cover border border-border" />
            ) : (
              <div className="h-32 w-32 rounded-lg bg-secondary border border-border flex items-center justify-center text-xs text-muted-foreground">No photo</div>
            )}
          </div>
          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Recruiter</p>
              <p className="font-medium text-foreground">{performer.recruiterName || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
              {performer.phone ? (
                <a href={`tel:${performer.phone}`} className="font-medium text-primary hover:underline text-sm">{performer.phone}</a>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Age</p>
              <p className="font-medium text-foreground">{performer.displayAge || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">DOB</p>
              {performer.dateOfBirth ? (
                <p className="font-medium text-foreground">{new Date(performer.dateOfBirth).toLocaleDateString()}</p>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Height</p>
              <p className="font-medium text-foreground">{performer.height || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Weight</p>
              <p className="font-medium text-foreground">{performer.weight || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Eyes</p>
              <p className="font-medium text-foreground">{performer.eyeColor || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Hair</p>
              <p className="font-medium text-foreground">{performer.hairColor || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Build</p>
              <p className="font-medium text-foreground">{performer.build || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Hair Length</p>
              <p className="font-medium text-foreground">{performer.hairLength || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Ethnicity</p>
              <p className="font-medium text-foreground">{performer.ethnicity || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Orientation</p>
              <p className="font-medium text-foreground">{performer.orientation || '—'}</p>
            </div>
          </div>
        </div>

        {/* Accordion: Additional Details */}
        <details className="group border-t border-border pt-3">
          <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-foreground hover:text-primary transition-colors">
            Additional Details
            <span className="transition group-open:rotate-180">▼</span>
          </summary>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            {performer.height && <div><p className="text-xs text-muted-foreground mb-0.5">Height</p><p className="text-foreground">{performer.height}</p></div>}
            {performer.weight && <div><p className="text-xs text-muted-foreground mb-0.5">Weight</p><p className="text-foreground">{performer.weight}</p></div>}
            {performer.eyeColor && <div><p className="text-xs text-muted-foreground mb-0.5">Eyes</p><p className="text-foreground">{performer.eyeColor}</p></div>}
            {performer.hairColor && <div><p className="text-xs text-muted-foreground mb-0.5">Hair</p><p className="text-foreground">{performer.hairColor}</p></div>}
            {performer.ethnicity && <div><p className="text-xs text-muted-foreground mb-0.5">Ethnicity</p><p className="text-foreground">{performer.ethnicity}</p></div>}
            {performer.orientation && <div><p className="text-xs text-muted-foreground mb-0.5">Orientation</p><p className="text-foreground">{performer.orientation}</p></div>}
          </div>
        </details>
      </div>

      {/* Profile Photos */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Profile Photos</h2>
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
              <Button size="sm" variant="outline" onClick={() => handlePhotoUpload(photo.key)} disabled={uploadingPhoto} className="border-border h-8 text-xs">
                {uploadingPhoto ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />}
                Upload
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Personal Info */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3 text-sm">
        <h2 className="text-lg font-semibold text-foreground">Personal Info</h2>
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
          <a href={`mailto:${performer.email}`} className="font-medium text-primary hover:underline break-all">{performer.email}</a>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Phone</p>
          <a href={contactMode === 'sms' ? `sms:${performer.phone}` : `tel:${performer.phone}`} className="font-medium text-primary hover:underline break-all">{performer.phone || '-'}</a>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Date of Birth</p>
          <p className="font-medium text-foreground">{performer.dateOfBirth ? new Date(performer.dateOfBirth).toLocaleDateString() : '-'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Display Age</p>
          <p className="font-medium text-foreground">{performer.displayAge || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Recruiter</p>
          <p className="font-medium text-foreground">{performer.recruiterName || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Applying For</p>
          <p className="font-medium text-foreground">{performer.applyingFor || '-'}</p>
        </div>
      </div>

      {/* Location */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3 text-sm">
        <h2 className="text-lg font-semibold text-foreground">Location</h2>
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
          <p className="text-xs text-muted-foreground">Country</p>
          <p className="font-medium text-foreground">{performer.country || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Zip Code</p>
          <p className="font-medium text-foreground">{performer.zipCode || '-'}</p>
        </div>
      </div>

      {/* Languages */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3 text-sm">
        <h2 className="text-lg font-semibold text-foreground">Languages</h2>
        <div>
          <p className="text-xs text-muted-foreground">Primary Language</p>
          <p className="font-medium text-foreground">{performer.primaryLanguage || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Other Language</p>
          <p className="font-medium text-foreground">{performer.otherLanguage || '-'}</p>
        </div>
      </div>

      {/* Physical Attributes */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3 text-sm">
        <h2 className="text-lg font-semibold text-foreground">Physical Attributes</h2>
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
        <div>
          <p className="text-xs text-muted-foreground">Breast Size</p>
          <p className="font-medium text-foreground">{performer.breastSize || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Butt Size</p>
          <p className="font-medium text-foreground">{performer.buttSize || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Dress Size</p>
          <p className="font-medium text-foreground">{performer.dressSize || '-'}</p>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3 text-sm">
        <h2 className="text-lg font-semibold text-foreground">Preferences</h2>
        <div>
          <p className="text-xs text-muted-foreground">Orientation</p>
          <p className="font-medium text-foreground">{performer.orientation || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Sexual Preferences</p>
          <p className="font-medium text-foreground">{performer.sexualPreferences || '-'}</p>
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

      {/* About */}
      {performer.aboutMe && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-3 text-sm">
          <h2 className="text-lg font-semibold text-foreground">About</h2>
          <p className="text-foreground leading-relaxed">{performer.aboutMe}</p>
        </div>
      )}

      {/* Commission */}
      {performer.commissionRate && (
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Commission Rate</p>
          <p className="text-lg font-semibold text-primary">{performer.commissionRate}%</p>
        </div>
      )}

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

      {/* Email Templates */}
      <EmailTemplates performer={performer} />

      {/* Tasks */}
      <PerformerTasks performer={performer} />
    </div>
  );
}