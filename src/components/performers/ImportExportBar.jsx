import { useState, useRef } from 'react';
import { Upload, Download, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { toast } from "sonner";

// Parse CSV text into array of objects using the header row
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const parseRow = (line) => {
    const cells = [];
    let cur = '', inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === ',' && !inQuote) {
        cells.push(cur); cur = '';
      } else {
        cur += ch;
      }
    }
    cells.push(cur);
    return cells;
  };

  const headers = parseRow(lines[0]);
  return lines.slice(1).map(line => {
    const vals = parseRow(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = vals[i]?.trim() || ''; });
    return obj;
  });
}

// Map CSV column names to Performer entity fields
const COL_MAP = {
  firstName: ['firstName', 'first_name', 'First Name'],
  lastName: ['lastName', 'last_name', 'Last Name'],
  email: ['email', 'Email'],
  phone: ['phone', 'Phone'],
  stageName: ['stageName', 'stage_name', 'stripchatUsername', 'Stage Name'],
  password: ['password', 'Password'],
  permissions: ['permissions', 'Permissions'],
  recruiterName: ['recruiterName', 'recruiter_name', 'recruiterId'],
  applyingFor: ['applyingFor', 'applying_for'],
  streetAddress: ['streetAddress', 'street_address'],
  city: ['city', 'City'],
  state: ['state', 'State'],
  zipCode: ['zipCode', 'zip_code', 'zip'],
  country: ['country', 'Country'],
  dateOfBirth: ['dateOfBirth', 'date_of_birth', 'dob'],
  displayAge: ['displayAge', 'display_age'],
  primaryLanguage: ['primaryLanguage', 'primary_language'],
  otherLanguage: ['otherLanguage', 'other_language'],
  height: ['height', 'Height'],
  weight: ['weight', 'Weight'],
  build: ['build', 'Build'],
  ethnicity: ['ethnicity', 'Ethnicity'],
  eyeColor: ['eyeColor', 'eye_color'],
  hairColor: ['hairColor', 'hair_color'],
  hairLength: ['hairLength', 'hair_length'],
  breastSize: ['breastSize', 'breast_size'],
  buttSize: ['buttSize', 'butt_size'],
  pubicHair: ['pubicHair', 'pubic_hair'],
  dressSize: ['dressSize', 'dress_size'],
  orientation: ['orientation', 'Orientation'],
  sexualPreferences: ['sexualPreferences', 'sexual_preferences', 'interestedIn'],
  aboutMe: ['aboutMe', 'about_me'],
  turnsOn: ['turnsOn', 'turns_on'],
  turnsOff: ['turnsOff', 'turns_off'],
  memo: ['memo', 'Memo'],
};

function mapRow(row) {
  const result = {};
  for (const [field, aliases] of Object.entries(COL_MAP)) {
    const match = aliases.find(a => row[a] !== undefined);
    if (match && row[match]) result[field] = row[match];
  }
  return result;
}

function readFileWithFallback(file) {
  return new Promise((resolve, reject) => {
    // Try UTF-8 first, fall back to latin1
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target.result;
      // Check for replacement char which indicates bad UTF-8 decode
      if (text.includes('\uFFFD')) {
        const reader2 = new FileReader();
        reader2.onload = e2 => resolve(e2.target.result);
        reader2.onerror = reject;
        reader2.readAsText(file, 'ISO-8859-1');
      } else {
        resolve(text);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file, 'UTF-8');
  });
}

export default function ImportExportBar({ onImportComplete }) {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef(null);

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    toast.info('Reading file...');

    const text = await readFileWithFallback(file);
    const rows = parseCSV(text);
    const records = rows.map(mapRow).filter(r => r.firstName || r.email || r.stageName);

    if (records.length > 0) {
      await base44.entities.Performer.bulkCreate(records);
      toast.success(`Import complete! ${records.length} performer(s) imported.`);
      onImportComplete?.();
    } else {
      toast.error('No valid records found. Make sure the file has firstName, email, or stageName columns.');
    }

    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExport = async () => {
    setExporting(true);
    toast.info("Export started...");

    const performers = await base44.entities.Performer.list();
    
    // Build CSV
    const fields = [
      'firstName', 'lastName', 'email', 'phone', 'stageName', 'permissions', 'recruiterName',
      'applyingFor', 'password', 'streetAddress', 'city', 'state', 'zipCode', 'country',
      'dateOfBirth', 'displayAge', 'primaryLanguage', 'otherLanguage', 'height', 'weight',
      'build', 'ethnicity', 'eyeColor', 'hairColor', 'hairLength', 'breastSize', 'buttSize',
      'pubicHair', 'dressSize', 'orientation', 'sexualPreferences', 'aboutMe', 'turnsOn',
      'turnsOff', 'memo'
    ];
    
    const escape = (val) => {
      if (val == null) return '';
      const str = String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n') 
        ? `"${str.replace(/"/g, '""')}"` : str;
    };

    let csv = fields.join(',') + '\n';
    performers.forEach(p => {
      csv += fields.map(f => escape(p[f])).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'performers_export.csv';
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Export complete!");
    setExporting(false);
  };

  return (
    <div className="flex gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleImport}
        className="hidden"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={importing}
        className="border-border text-foreground hover:bg-secondary"
      >
        {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
        Import
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={exporting}
        className="border-border text-foreground hover:bg-secondary"
      >
        {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
        Export
      </Button>
    </div>
  );
}