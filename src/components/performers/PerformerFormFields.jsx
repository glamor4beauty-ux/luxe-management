import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from '@/api/base44Client';
import { useState } from 'react';

const FormSection = ({ title, children }) => (
  <div className="space-y-4">
    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider border-b border-border pb-2">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {children}
    </div>
  </div>
);

const Field = ({ label, name, value, onChange, type = "text", span = 1 }) => (
  <div className={span === 2 ? "md:col-span-2" : span === 3 ? "md:col-span-2 lg:col-span-3" : ""}>
    <Label className="text-xs text-muted-foreground mb-1.5 block">{label}</Label>
    <Input
      type={type}
      value={value || ''}
      onChange={e => onChange(name, e.target.value)}
      className="bg-secondary border-border text-foreground h-9 text-sm"
    />
  </div>
);

const ImageField = ({ label, name, value, onChange }) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange(name, file_url);
    setUploading(false);
  };

  return (
    <div>
      <Label className="text-xs text-muted-foreground mb-1.5 block">{label}</Label>
      {value && (
        <img src={value} alt={label} className="h-20 w-20 object-cover rounded-lg mb-2 border border-border" />
      )}
      <Input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
        className="bg-secondary border-border text-foreground h-9 text-sm"
      />
      {uploading && <p className="text-xs text-primary mt-1">Uploading...</p>}
    </div>
  );
};

export default function PerformerFormFields({ data, onChange }) {
  const set = (name, value) => onChange({ ...data, [name]: value });

  return (
    <div className="space-y-8">
      <FormSection title="Basic Information">
        <Field label="First Name" name="firstName" value={data.firstName} onChange={set} />
        <Field label="Last Name" name="lastName" value={data.lastName} onChange={set} />
        <Field label="Email" name="email" value={data.email} onChange={set} />
        <Field label="Phone" name="phone" value={data.phone} onChange={set} />
        <Field label="Stage Name" name="stageName" value={data.stageName} onChange={set} />
        <Field label="Password" name="password" value={data.password} onChange={set} />
      </FormSection>

      <FormSection title="Management">
        <Field label="Permissions" name="permissions" value={data.permissions} onChange={set} />
        <Field label="Recruiter Name" name="recruiterName" value={data.recruiterName} onChange={set} />
        <Field label="Applying For" name="applyingFor" value={data.applyingFor} onChange={set} />
      </FormSection>

      <FormSection title="Address">
        <Field label="Street Address" name="streetAddress" value={data.streetAddress} onChange={set} span={2} />
        <Field label="City" name="city" value={data.city} onChange={set} />
        <Field label="State" name="state" value={data.state} onChange={set} />
        <Field label="Zip Code" name="zipCode" value={data.zipCode} onChange={set} />
        <Field label="Country" name="country" value={data.country} onChange={set} />
      </FormSection>

      <FormSection title="Personal Details">
        <Field label="Date of Birth" name="dateOfBirth" value={data.dateOfBirth ? data.dateOfBirth.split('T')[0] : ''} onChange={(n, v) => set(n, v + 'T00:00:00Z')} type="date" />
        <Field label="Display Age" name="displayAge" value={data.displayAge} onChange={set} type="number" />
        <Field label="Primary Language" name="primaryLanguage" value={data.primaryLanguage} onChange={set} />
        <Field label="Other Language" name="otherLanguage" value={data.otherLanguage} onChange={set} />
      </FormSection>

      <FormSection title="Physical Attributes">
        <Field label="Height" name="height" value={data.height} onChange={set} />
        <Field label="Weight" name="weight" value={data.weight} onChange={set} />
        <Field label="Build" name="build" value={data.build} onChange={set} />
        <Field label="Ethnicity" name="ethnicity" value={data.ethnicity} onChange={set} />
        <Field label="Eye Color" name="eyeColor" value={data.eyeColor} onChange={set} />
        <Field label="Hair Color" name="hairColor" value={data.hairColor} onChange={set} />
        <Field label="Hair Length" name="hairLength" value={data.hairLength} onChange={set} />
        <Field label="Breast Size" name="breastSize" value={data.breastSize} onChange={set} />
        <Field label="Butt Size" name="buttSize" value={data.buttSize} onChange={set} />
        <Field label="Pubic Hair" name="pubicHair" value={data.pubicHair} onChange={set} />
        <Field label="Dress Size" name="dressSize" value={data.dressSize} onChange={set} />
        <Field label="Orientation" name="orientation" value={data.orientation} onChange={set} />
      </FormSection>

      <FormSection title="Preferences & Bio">
        <div className="md:col-span-2 lg:col-span-3">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Sexual Preferences</Label>
          <Textarea value={data.sexualPreferences || ''} onChange={e => set('sexualPreferences', e.target.value)} className="bg-secondary border-border text-foreground text-sm min-h-[60px]" />
        </div>
        <div className="md:col-span-2 lg:col-span-3">
          <Label className="text-xs text-muted-foreground mb-1.5 block">About Me</Label>
          <Textarea value={data.aboutMe || ''} onChange={e => set('aboutMe', e.target.value)} className="bg-secondary border-border text-foreground text-sm min-h-[80px]" />
        </div>
        <div className="md:col-span-2 lg:col-span-3">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Turns On</Label>
          <Textarea value={data.turnsOn || ''} onChange={e => set('turnsOn', e.target.value)} className="bg-secondary border-border text-foreground text-sm min-h-[60px]" />
        </div>
        <div className="md:col-span-2 lg:col-span-3">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Turns Off</Label>
          <Textarea value={data.turnsOff || ''} onChange={e => set('turnsOff', e.target.value)} className="bg-secondary border-border text-foreground text-sm min-h-[60px]" />
        </div>
        <div className="md:col-span-2 lg:col-span-3">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Memo</Label>
          <Textarea value={data.memo || ''} onChange={e => set('memo', e.target.value)} className="bg-secondary border-border text-foreground text-sm min-h-[60px]" />
        </div>
      </FormSection>

      <FormSection title="Photos & ID">
        <ImageField label="Profile Photo" name="profilePhoto" value={data.profilePhoto} onChange={set} />
        <ImageField label="ID Front" name="idFront" value={data.idFront} onChange={set} />
        <ImageField label="ID Back" name="idBack" value={data.idBack} onChange={set} />
      </FormSection>
    </div>
  );
}