import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Save, Upload } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function PerformerProfile() {
  const [user, setUser] = useState(null);
  const [performer, setPerformer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    async function load() {
      const u = await base44.auth.me();
      setUser(u);
      setForm(u || {});

      const performers = await base44.entities.Performer.filter({ email: u?.email });
      if (performers.length > 0) {
        setPerformer(performers[0]);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = {};
      for (const key in form) {
        if (key !== 'id' && key !== 'email' && key !== 'created_date' && form[key] !== user?.[key]) {
          updates[key] = form[key];
        }
      }
      await base44.auth.updateMe(updates);
      toast.success('Profile updated!');
    } catch (e) {
      toast.error('Failed to update profile');
    }
    setSaving(false);
  };

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
        toast.success('Photo updated!');
      } catch (err) {
        toast.error('Upload failed');
      }
      setUploadingPhoto(false);
    };
    input.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">My Profile</h1>
        <p className="text-muted-foreground">Manage your account and performer information</p>
      </div>

      {/* Profile Photos */}
      {performer && (
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
      )}

      {/* Account Info */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Account Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-muted-foreground">Full Name</Label>
            <Input
              value={form.full_name || ''}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              className="bg-secondary border-border text-foreground h-9 mt-1"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Email</Label>
            <Input
              value={form.email || ''}
              disabled
              className="bg-secondary border-border text-muted-foreground h-9 mt-1"
            />
          </div>
        </div>
        <div>
          <Label className="text-sm text-muted-foreground">Role</Label>
          <Input
            value={form.role || 'user'}
            disabled
            className="bg-secondary border-border text-muted-foreground h-9 mt-1"
          />
        </div>
      </div>

      {/* Personal Info */}
      {performer && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-1">First Name</p>
              <p className="font-medium text-foreground">{performer.firstName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Last Name</p>
              <p className="font-medium text-foreground">{performer.lastName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Stage Name (Read-only)</p>
              <p className="font-medium text-foreground bg-secondary/50 rounded px-3 py-2">{performer.stageName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Phone</p>
              <p className="font-medium text-foreground">{performer.phone || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Date of Birth</p>
              <p className="font-medium text-foreground">{performer.dateOfBirth ? new Date(performer.dateOfBirth).toLocaleDateString() : '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Display Age</p>
              <p className="font-medium text-foreground">{performer.displayAge || '-'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Location */}
      {performer && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Location</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Street Address</p>
              <p className="font-medium text-foreground">{performer.streetAddress || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">City</p>
              <p className="font-medium text-foreground">{performer.city || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">State</p>
              <p className="font-medium text-foreground">{performer.state || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Country</p>
              <p className="font-medium text-foreground">{performer.country || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Zip Code</p>
              <p className="font-medium text-foreground">{performer.zipCode || '-'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Physical Attributes */}
      {performer && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Physical Attributes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Height</p>
              <p className="font-medium text-foreground">{performer.height || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Weight</p>
              <p className="font-medium text-foreground">{performer.weight || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Build</p>
              <p className="font-medium text-foreground">{performer.build || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Ethnicity</p>
              <p className="font-medium text-foreground">{performer.ethnicity || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Eye Color</p>
              <p className="font-medium text-foreground">{performer.eyeColor || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Hair Color</p>
              <p className="font-medium text-foreground">{performer.hairColor || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Hair Length</p>
              <p className="font-medium text-foreground">{performer.hairLength || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Breast Size</p>
              <p className="font-medium text-foreground">{performer.breastSize || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Butt Size</p>
              <p className="font-medium text-foreground">{performer.buttSize || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Dress Size</p>
              <p className="font-medium text-foreground">{performer.dressSize || '-'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Preferences */}
      {performer && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Preferences</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Orientation</p>
              <p className="font-medium text-foreground">{performer.orientation || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Interested In</p>
              <p className="font-medium text-foreground">{performer.interestedIn || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Turns On</p>
              <p className="font-medium text-foreground">{performer.turnsOn || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Turns Off</p>
              <p className="font-medium text-foreground">{performer.turnsOff || '-'}</p>
            </div>
          </div>
        </div>
      )}

      {/* About */}
      {performer?.aboutMe && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-lg font-semibold text-foreground mb-2">About</h2>
          <p className="text-sm text-foreground leading-relaxed">{performer.aboutMe}</p>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" className="border-border" onClick={() => setForm(user)}>
          Reset
        </Button>
        <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}