import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from 'lucide-react';

const Field = ({ label, name, value, onChange, type = 'text', placeholder = '' }) => (
  <div>
    <Label className="text-xs text-muted-foreground">{label}</Label>
    <Input
      type={type}
      value={value}
      onChange={e => onChange(name, e.target.value)}
      placeholder={placeholder}
      className="bg-secondary border-border text-foreground h-9 mt-1"
    />
  </div>
);

const EMPTY = {
  firstName: '', lastName: '', stageName: '', email: '', password: '',
  phone: '', dateOfBirth: '', displayAge: '', recruiterName: '', applyingFor: '',
  streetAddress: '', city: '', state: '', zipCode: '', country: '',
  primaryLanguage: '', otherLanguage: '',
  height: '', weight: '', build: '', ethnicity: '',
  eyeColor: '', hairColor: '', hairLength: '',
  breastSize: '', buttSize: '', dressSize: '', pubicHair: '',
  orientation: '', sexualPreferences: '', interestedIn: '',
  aboutMe: '', turnsOn: '', turnsOff: '',
};

export default function ManualPerformerDialog({ open, onOpenChange, onSuccess }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (name, value) => setForm(f => ({ ...f, [name]: value }));

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.stageName || !form.password) {
      toast.error('First name, last name, stage name, email and password are required');
      return;
    }
    setSaving(true);
    try {
      await base44.functions.invoke('createManualPerformer', { performerData: form });
      toast.success('Performer created successfully');
      setForm(EMPTY);
      onOpenChange(false);
      onSuccess?.();
    } catch (e) {
      toast.error('Failed to create performer');
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Performer Manually</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Basic */}
          <section>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Basic Info</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name *" name="firstName" value={form.firstName} onChange={set} />
              <Field label="Last Name *" name="lastName" value={form.lastName} onChange={set} />
              <Field label="Stage Name *" name="stageName" value={form.stageName} onChange={set} />
              <Field label="Email *" name="email" value={form.email} onChange={set} type="email" />
              <Field label="Password *" name="password" value={form.password} onChange={set} type="password" />
              <Field label="Phone" name="phone" value={form.phone} onChange={set} />
              <Field label="Date of Birth" name="dateOfBirth" value={form.dateOfBirth} onChange={set} type="date" />
              <Field label="Display Age" name="displayAge" value={form.displayAge} onChange={set} />
              <Field label="Recruiter Name" name="recruiterName" value={form.recruiterName} onChange={set} />
              <Field label="Applying For" name="applyingFor" value={form.applyingFor} onChange={set} />
            </div>
          </section>

          {/* Location */}
          <section>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Location</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Field label="Street Address" name="streetAddress" value={form.streetAddress} onChange={set} />
              </div>
              <Field label="City" name="city" value={form.city} onChange={set} />
              <Field label="State" name="state" value={form.state} onChange={set} />
              <Field label="Zip Code" name="zipCode" value={form.zipCode} onChange={set} />
              <Field label="Country" name="country" value={form.country} onChange={set} />
            </div>
          </section>

          {/* Languages */}
          <section>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Languages</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Primary Language" name="primaryLanguage" value={form.primaryLanguage} onChange={set} />
              <Field label="Other Language" name="otherLanguage" value={form.otherLanguage} onChange={set} />
            </div>
          </section>

          {/* Physical */}
          <section>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Physical Attributes</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Height" name="height" value={form.height} onChange={set} />
              <Field label="Weight" name="weight" value={form.weight} onChange={set} />
              <Field label="Build" name="build" value={form.build} onChange={set} />
              <Field label="Ethnicity" name="ethnicity" value={form.ethnicity} onChange={set} />
              <Field label="Eye Color" name="eyeColor" value={form.eyeColor} onChange={set} />
              <Field label="Hair Color" name="hairColor" value={form.hairColor} onChange={set} />
              <Field label="Hair Length" name="hairLength" value={form.hairLength} onChange={set} />
              <Field label="Breast Size" name="breastSize" value={form.breastSize} onChange={set} />
              <Field label="Butt Size" name="buttSize" value={form.buttSize} onChange={set} />
              <Field label="Dress Size" name="dressSize" value={form.dressSize} onChange={set} />
              <Field label="Pubic Hair" name="pubicHair" value={form.pubicHair} onChange={set} />
            </div>
          </section>

          {/* Preferences */}
          <section>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Preferences</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Orientation" name="orientation" value={form.orientation} onChange={set} />
              <Field label="Sexual Preferences" name="sexualPreferences" value={form.sexualPreferences} onChange={set} />
              <Field label="Interested In" name="interestedIn" value={form.interestedIn} onChange={set} />
              <Field label="Turns On" name="turnsOn" value={form.turnsOn} onChange={set} />
              <Field label="Turns Off" name="turnsOff" value={form.turnsOff} onChange={set} />
            </div>
          </section>

          {/* About */}
          <section>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">About</p>
            <div>
              <Label className="text-xs text-muted-foreground">About Me</Label>
              <textarea
                value={form.aboutMe}
                onChange={e => set('aboutMe', e.target.value)}
                rows={3}
                className="w-full mt-1 rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </section>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border sticky bottom-0 bg-card pb-1">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-primary text-primary-foreground">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {saving ? 'Creating...' : 'Create Performer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}