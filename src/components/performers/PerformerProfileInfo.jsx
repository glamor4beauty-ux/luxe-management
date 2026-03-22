import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Phone, Cake, User, ChevronDown, ChevronUp } from 'lucide-react';

export default function PerformerProfileInfo({ stageName }) {
  const [performer, setPerformer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!stageName) return;
    const load = async () => {
      setLoading(true);
      const data = await base44.entities.Performer.filter({ stageName });
      setPerformer(data?.[0] || null);
      setLoading(false);
    };
    load();
  }, [stageName]);

  if (!performer && !loading) return null;
  if (loading) return <div className="text-xs text-muted-foreground">Loading...</div>;
  if (!performer) return null;

  return (
    <div className="space-y-3">
      {/* First Row: Photo (left) + Basic Info (right) */}
      <div className="grid grid-cols-[80px_1fr] gap-4 items-start">
        {/* Left: Profile Photo */}
        <div>
          {performer.profilePhoto ? (
            <img src={performer.profilePhoto} alt={stageName} className="h-20 w-20 rounded-lg object-cover border border-border" />
          ) : (
            <div className="h-20 w-20 rounded-lg bg-secondary border border-border flex items-center justify-center text-xs text-muted-foreground">
              No photo
            </div>
          )}
        </div>

        {/* Right: Recruiter, Phone, Age, DOB */}
        <div className="space-y-2 text-xs">
          <div>
            <p className="text-muted-foreground">Recruiter</p>
            <p className="text-foreground font-medium">{performer.recruiterName || '—'}</p>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            {performer.phone ? (
              <a href={`tel:${performer.phone}`} className="hover:text-primary">{performer.phone}</a>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{performer.displayAge || '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <Cake className="h-3.5 w-3.5 text-muted-foreground" />
            {performer.dateOfBirth ? (
              <span>{new Date(performer.dateOfBirth).toLocaleDateString()}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        </div>
      </div>

      {/* Accordion: Additional Details */}
      <div className="bg-secondary/50 rounded-lg border border-border">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
        >
          <span>Additional Details</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        {expanded && (
          <div className="border-t border-border px-3 py-2 space-y-2 text-xs">
            {performer.height && <div><span className="text-muted-foreground">Height:</span> {performer.height}</div>}
            {performer.weight && <div><span className="text-muted-foreground">Weight:</span> {performer.weight}</div>}
            {performer.eyeColor && <div><span className="text-muted-foreground">Eyes:</span> {performer.eyeColor}</div>}
            {performer.hairColor && <div><span className="text-muted-foreground">Hair:</span> {performer.hairColor}</div>}
            {performer.orientation && <div><span className="text-muted-foreground">Orientation:</span> {performer.orientation}</div>}
            {performer.about && <div><span className="text-muted-foreground">About:</span> {performer.about}</div>}
          </div>
        )}
      </div>
    </div>
  );
}