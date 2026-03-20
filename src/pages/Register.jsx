import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Upload, CheckCircle, Loader2 } from 'lucide-react';

const STEPS = ['Basic Info', 'Stage & Address', 'Physical', 'Preferences', 'Photos & ID'];

const Field = ({ label, name, value, onChange, type = 'text', required, placeholder }) => (
  <div>
    <Label className="text-xs text-muted-foreground mb-1.5 block">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</Label>
    <Input
      type={type}
      value={value || ''}
      onChange={e => onChange(name, e.target.value)}
      required={required}
      placeholder={placeholder}
      className="bg-secondary border-border text-foreground h-9 text-sm"
    />
  </div>
);

const SelectField = ({ label, name, value, onChange, options, placeholder }) => (
  <div>
    <Label className="text-xs text-muted-foreground mb-1.5 block">{label}</Label>
    <Select value={value || ''} onValueChange={v => onChange(name, v)}>
      <SelectTrigger className="bg-secondary border-border text-foreground h-9 text-sm">
        <SelectValue placeholder={placeholder || `Select ${label}`} />
      </SelectTrigger>
      <SelectContent className="bg-card border-border">
        {options.map(o => (
          <SelectItem key={o} value={o}>{o}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

const TextareaField = ({ label, name, value, onChange }) => (
  <div>
    <Label className="text-xs text-muted-foreground mb-1.5 block">{label}</Label>
    <Textarea
      value={value || ''}
      onChange={e => onChange(name, e.target.value)}
      className="bg-secondary border-border text-foreground text-sm min-h-[80px]"
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
      {value && <img src={value} alt={label} className="h-20 w-20 object-cover rounded-lg mb-2 border border-border" />}
      <label className={`flex items-center gap-2 cursor-pointer px-3 h-9 rounded-md border border-border bg-secondary text-sm text-foreground hover:bg-secondary/80 transition-colors w-fit ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
        <Upload className="h-4 w-4 text-muted-foreground" />
        {uploading ? 'Uploading...' : value ? 'Change Image' : 'Upload Image'}
        <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      </label>
    </div>
  );
};

const Alert = ({ children }) => (
  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-400 font-medium">
    {children}
  </div>
);

export default function Register() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const set = (name, value) => setData(prev => ({ ...prev, [name]: value }));

  const handleSubmit = async () => {
    if (!data.firstName || !data.email || !data.stageName) {
      setError('First Name, Email, and Stage Name are required.');
      return;
    }
    setError('');
    setSaving(true);
    const { id, created_date, updated_date, created_by, ...saveData } = data;
    await base44.entities.Performer.create(saveData);
    setSaving(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-2xl p-10 max-w-md w-full text-center">
          <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Application Submitted!</h2>
          <p className="text-muted-foreground text-sm">
            Thank you for applying. You will receive two ID verification emails — they are time sensitive. Please reply to those emails promptly.
          </p>
        </div>
      </div>
    );
  }

  const stepContent = [
    <div key="1" className="space-y-4">
      <Alert>You are registering for Stripchat Webcam Model and My.Club Creator. You will receive two ID verification emails that are time sensitive. Please reply to those emails. Registrations not completed within 48 hours will be deleted.</Alert>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField label="Recruiter Name" name="recruiterName" value={data.recruiterName} onChange={set}
          options={['Clarence']} placeholder="Select a Recruiter" />
        <SelectField label="Applying For" name="applyingFor" value={data.applyingFor} onChange={set}
          options={['Webcam Model + My.Club', 'Webcam Model', 'My.Club']} placeholder="Select Opportunity" />
        <Field label="First Name" name="firstName" value={data.firstName} onChange={set} required />
        <Field label="Last Name" name="lastName" value={data.lastName} onChange={set} />
        <Field label="Email" name="email" value={data.email} onChange={set} type="email" required />
        <Field label="Phone" name="phone" value={data.phone} onChange={set} type="tel" />
      </div>
    </div>,

    <div key="2" className="space-y-4">
      <Alert>If you have a Stripchat account, delete the old account or enter a new email.</Alert>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Stage Name (Public)" name="stageName" value={data.stageName} onChange={set} required />
        <Field label="Alternate Stage Name" name="alternateUsernames" value={data.alternateUsernames} onChange={set} placeholder="comma, separated, list" />
        <Field label="Create a Password (performer portal)" name="password" value={data.password} onChange={set} type="password" />
        <Field label="Street Address" name="streetAddress" value={data.streetAddress} onChange={set} />
        <Field label="City" name="city" value={data.city} onChange={set} />
        <Field label="State / Province" name="state" value={data.state} onChange={set} />
        <Field label="Zip / Postal Code" name="zipCode" value={data.zipCode} onChange={set} />
        <Field label="Country" name="country" value={data.country} onChange={set} />
      </div>
    </div>,

    <div key="3" className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Date of Birth" name="dateOfBirth" value={data.dateOfBirth ? data.dateOfBirth.split('T')[0] : ''} onChange={(n, v) => set(n, v + 'T00:00:00Z')} type="date" />
        <Field label="Display Age" name="displayAge" value={data.displayAge} onChange={(n, v) => set(n, v ? parseInt(v) : '')} type="number" />
        <Field label="Primary Language" name="primaryLanguage" value={data.primaryLanguage} onChange={set} />
        <Field label="Other Languages" name="otherLanguage" value={data.otherLanguage} onChange={set} />
        <Field label="Height" name="height" value={data.height} onChange={set} />
        <Field label="Weight" name="weight" value={data.weight} onChange={set} />
        <SelectField label="Build" name="build" value={data.build} onChange={set} options={['Skinny','Athletic','Medium','BBW']} />
        <SelectField label="Ethnicity" name="ethnicity" value={data.ethnicity} onChange={set} options={['Asian','Black','Hispanic','Indian','Latin American','Middle Eastern','Native American','White']} />
        <SelectField label="Eye Color" name="eyeColor" value={data.eyeColor} onChange={set} options={['Blue','Brown','Black','Green','Grey','Other']} />
        <SelectField label="Hair Color" name="hairColor" value={data.hairColor} onChange={set} options={['Blonde','Black','Brown','Fire Red','Auburn','Orange','Pink']} />
        <SelectField label="Hair Length" name="hairLength" value={data.hairLength} onChange={set} options={['Bald','Crew Cut','Short','Shoulder Length','Long']} />
        <SelectField label="Breast Size" name="breastSize" value={data.breastSize} onChange={set} options={['Tiny','Normal','Big','Huge','Male']} />
        <SelectField label="Butt Size" name="buttSize" value={data.buttSize} onChange={set} options={['Small','Normal','Big','Huge','Male']} />
        <SelectField label="Pubic Hair" name="pubicHair" value={data.pubicHair} onChange={set} options={['Hairy','Shaved','Trimmed']} />
        <SelectField label="Dress Size" name="dressSize" value={data.dressSize} onChange={set} options={['XS','Small','Medium','Large','XL','2XL','3XL']} />
      </div>
    </div>,

    <div key="4" className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField label="Orientation" name="orientation" value={data.orientation} onChange={set} options={['Male','Female','Trans']} />
        <SelectField label="Sexual Preferences" name="sexualPreferences" value={data.sexualPreferences} onChange={set} options={['Bisexual','Straight','Lesbian']} />
        <SelectField label="Interested In" name="interestedIn" value={data.interestedIn} onChange={set} options={['Males','Females','Both']} />
      </div>
      <TextareaField label="About Me" name="aboutMe" value={data.aboutMe} onChange={set} />
      <TextareaField label="What turns you on?" name="turnsOn" value={data.turnsOn} onChange={set} />
      <TextareaField label="What turns you off?" name="turnsOff" value={data.turnsOff} onChange={set} />
    </div>,

    <div key="5" className="space-y-4">
      <Alert>Bring camera as close to your face only as possible, staying within frame. Then take your ID and bring it close to your face without overlapping. Finally, bring ID as close to the camera. ID must be clear and readable.</Alert>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ImageField label="Profile Photo" name="profilePhoto" value={data.profilePhoto} onChange={set} />
        <ImageField label="ID Front" name="idFront" value={data.idFront} onChange={set} />
        <ImageField label="ID Back" name="idBack" value={data.idBack} onChange={set} />
        <ImageField label="Photo of Face next to ID" name="faceId" value={data.faceId} onChange={set} />
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">
            <span className="text-primary">LUXE</span>
            <span className="text-foreground font-light ml-1">Management Systems</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Performer Registration Application</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-1 mb-8 flex-wrap">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                i === step ? 'bg-primary text-primary-foreground' : i < step ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
              }`}>
                <span className={`h-4 w-4 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === step ? 'bg-primary-foreground text-primary' : i < step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>{i + 1}</span>
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`w-3 h-px ${i < step ? 'bg-primary/50' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
          <h2 className="text-base font-semibold text-foreground mb-5">
            Step {step + 1}: {STEPS[step]}
          </h2>

          {stepContent[step]}

          {error && <p className="text-red-400 text-xs mt-4">{error}</p>}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0} className="border-border">
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(s => s + 1)} className="bg-primary text-primary-foreground">
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={saving} className="bg-primary text-primary-foreground">
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : 'Submit Application'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}