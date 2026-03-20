import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, FileText, Calendar, Monitor, Upload, Loader2 } from 'lucide-react';
import ContractGenerator from '../components/performers/ContractGenerator';
import PerformerTasks from '../components/performers/PerformerTasks';

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
  const { id } = useParams();
  const [performer, setPerformer] = useState(null);
  const [memos, setMemos] = useState([]);
  const [events, setEvents] = useState([]);
  const [stripchat, setStripchat] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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
            <div className="relative group">
              {performer.profilePhoto ? (
                <img src={performer.profilePhoto} alt="" className="h-16 w-16 rounded-full object-cover border-2 border-primary/20" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {(performer.firstName?.[0] || '') + (performer.lastName?.[0] || '')}
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                {uploadingPhoto ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Upload className="h-4 w-4 text-white" />}
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingPhoto(true);
                  const { file_url } = await base44.integrations.Core.UploadFile({ file });
                  await base44.entities.Performer.update(performer.id, { profilePhoto: file_url });
                  setPerformer(p => ({ ...p, profilePhoto: file_url }));
                  setUploadingPhoto(false);
                }} />
              </label>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{performer.firstName} {performer.lastName}</h1>
              <p className="text-sm text-primary">@{performer.stageName}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <ContractGenerator performer={performer} payouts={payouts} />
          <Button variant="outline" size="sm" onClick={() => navigate(`/performers/${performer.id}/edit`)} className="border-border">
            <Pencil className="h-4 w-4 mr-2" /> Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Basic Info */}
        <div className="bg-card border border-border rounded-xl overflow-hidden lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground px-5 pt-5 pb-3">Profile Details</h3>
          <table className="w-full text-sm border-collapse">
            <tbody>
              {/* Row 1: Photo + contact/key fields */}
              <tr className="border-t border-border">
                <td rowSpan={9} className="w-40 border-r border-border align-top p-4 bg-secondary/20">
                  {performer.profilePhoto ? (
                    <img src={performer.profilePhoto} alt="Profile" className="w-32 h-32 object-cover rounded-lg border border-border" />
                  ) : (
                    <div className="w-32 h-32 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl border border-border">
                      {(performer.firstName?.[0] || '') + (performer.lastName?.[0] || '')}
                    </div>
                  )}
                </td>
                <td className="border-r border-border p-3 bg-secondary/10 w-1/6">
                  <span className="text-xs text-muted-foreground block">Email</span>
                  <span className="text-foreground">{performer.email || '—'}</span>
                </td>
                <td className="border-r border-border p-3 w-1/6">
                  <span className="text-xs text-muted-foreground block">Phone</span>
                  <span className="text-foreground">{performer.phone || '—'}</span>
                </td>
                <td className="border-r border-border p-3 bg-secondary/10 w-1/6">
                  <span className="text-xs text-muted-foreground block">Stage Name</span>
                  <span className="text-foreground">{performer.stageName || '—'}</span>
                </td>
                <td className="border-r border-border p-3 w-1/6">
                  <span className="text-xs text-muted-foreground block">Recruiter</span>
                  <span className="text-foreground">{performer.recruiterName || '—'}</span>
                </td>
                <td className="border-r border-border p-3 bg-secondary/10 w-1/6">
                  <span className="text-xs text-muted-foreground block">Applying For</span>
                  <span className="text-foreground">{performer.applyingFor || '—'}</span>
                </td>
                <td className="p-3 w-1/6">
                  <span className="text-xs text-muted-foreground block">Date of Birth</span>
                  <span className="text-foreground">{performer.dateOfBirth ? new Date(performer.dateOfBirth).toLocaleDateString() : '—'}</span>
                </td>
              </tr>
              {/* Row 2: Address + language + orientation */}
              <tr className="border-t border-border">
                <td className="border-r border-border p-3 bg-secondary/10">
                  <span className="text-xs text-muted-foreground block">Street</span>
                  <span className="text-foreground">{performer.streetAddress || '—'}</span>
                </td>
                <td className="border-r border-border p-3">
                  <span className="text-xs text-muted-foreground block">City</span>
                  <span className="text-foreground">{performer.city || '—'}</span>
                </td>
                <td className="border-r border-border p-3 bg-secondary/10">
                  <span className="text-xs text-muted-foreground block">State</span>
                  <span className="text-foreground">{performer.state || '—'}</span>
                </td>
                <td className="border-r border-border p-3">
                  <span className="text-xs text-muted-foreground block">Country</span>
                  <span className="text-foreground">{performer.country || '—'}</span>
                </td>
                <td className="border-r border-border p-3 bg-secondary/10">
                  <span className="text-xs text-muted-foreground block">Zip Code</span>
                  <span className="text-foreground">{performer.zipCode || '—'}</span>
                </td>
                <td className="p-3">
                  <span className="text-xs text-muted-foreground block">Other Language</span>
                  <span className="text-foreground">{performer.otherLanguage || '—'}</span>
                </td>
              </tr>
              {/* Row 3: Orientation, Height */}
              <tr className="border-t border-border">
                <td className="border-r border-border p-3 bg-secondary/10">
                  <span className="text-xs text-muted-foreground block">Orientation</span>
                  <span className="text-foreground">{performer.orientation || '—'}</span>
                </td>
                <td className="border-r border-border p-3" colSpan={5}>
                  <span className="text-xs text-muted-foreground block">Height</span>
                  <span className="text-foreground">{performer.height || '—'}</span>
                </td>
              </tr>
              {/* Row 4: Weight, Build, Ethnicity */}
              <tr className="border-t border-border">
                <td className="border-r border-border p-3 bg-secondary/10">
                  <span className="text-xs text-muted-foreground block">Weight</span>
                  <span className="text-foreground">{performer.weight || '—'}</span>
                </td>
                <td className="border-r border-border p-3">
                  <span className="text-xs text-muted-foreground block">Build</span>
                  <span className="text-foreground">{performer.build || '—'}</span>
                </td>
                <td className="p-3 bg-secondary/10" colSpan={4}>
                  <span className="text-xs text-muted-foreground block">Ethnicity</span>
                  <span className="text-foreground">{performer.ethnicity || '—'}</span>
                </td>
              </tr>
              {/* Row 5: Eye Color, Hair Color, Hair Length */}
              <tr className="border-t border-border">
                <td className="border-r border-border p-3 bg-secondary/10">
                  <span className="text-xs text-muted-foreground block">Eye Color</span>
                  <span className="text-foreground">{performer.eyeColor || '—'}</span>
                </td>
                <td className="border-r border-border p-3">
                  <span className="text-xs text-muted-foreground block">Hair Color</span>
                  <span className="text-foreground">{performer.hairColor || '—'}</span>
                </td>
                <td className="p-3 bg-secondary/10" colSpan={4}>
                  <span className="text-xs text-muted-foreground block">Hair Length</span>
                  <span className="text-foreground">{performer.hairLength || '—'}</span>
                </td>
              </tr>
              {/* Row 6: Breast Size, Butt Size, Dress Size */}
              <tr className="border-t border-border">
                <td className="border-r border-border p-3 bg-secondary/10">
                  <span className="text-xs text-muted-foreground block">Breast Size</span>
                  <span className="text-foreground">{performer.breastSize || '—'}</span>
                </td>
                <td className="border-r border-border p-3">
                  <span className="text-xs text-muted-foreground block">Butt Size</span>
                  <span className="text-foreground">{performer.buttSize || '—'}</span>
                </td>
                <td className="p-3 bg-secondary/10" colSpan={4}>
                  <span className="text-xs text-muted-foreground block">Dress Size</span>
                  <span className="text-foreground">{performer.dressSize || '—'}</span>
                </td>
              </tr>
              {/* Row 7: About */}
              <tr className="border-t border-border">
                <td colSpan={6} className="p-3">
                  <span className="text-xs text-muted-foreground block">About</span>
                  <span className="text-foreground">{performer.aboutMe || '—'}</span>
                </td>
              </tr>
              {/* Row 8: Turns On */}
              <tr className="border-t border-border">
                <td colSpan={6} className="p-3 bg-secondary/10">
                  <span className="text-xs text-muted-foreground block">Turns On</span>
                  <span className="text-foreground">{performer.turnsOn || '—'}</span>
                </td>
              </tr>
              {/* Row 9: Turns Off */}
              <tr className="border-t border-border">
                <td colSpan={6} className="p-3">
                  <span className="text-xs text-muted-foreground block">Turns Off</span>
                  <span className="text-foreground">{performer.turnsOff || '—'}</span>
                </td>
              </tr>
            </tbody>
          </table>
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

        {/* Photos & ID */}
        {(performer.profilePhoto || performer.idFront || performer.idBack || performer.faceId) && (
          <div className="bg-card border border-border rounded-xl p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold text-foreground mb-4">Photos & ID</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {performer.profilePhoto && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Profile Photo</p>
                  <img src={performer.profilePhoto} alt="Profile" className="w-full aspect-square object-cover rounded-lg border border-border" />
                </div>
              )}
              {performer.idFront && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">ID Front</p>
                  <img src={performer.idFront} alt="ID Front" className="w-full aspect-square object-cover rounded-lg border border-border" />
                </div>
              )}
              {performer.idBack && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">ID Back</p>
                  <img src={performer.idBack} alt="ID Back" className="w-full aspect-square object-cover rounded-lg border border-border" />
                </div>
              )}
              {performer.faceId && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Face + ID</p>
                  <img src={performer.faceId} alt="Face + ID" className="w-full aspect-square object-cover rounded-lg border border-border" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tasks */}
        <div className="lg:col-span-2">
          <PerformerTasks performer={performer} />
        </div>
      </div>
    </div>
  );
}