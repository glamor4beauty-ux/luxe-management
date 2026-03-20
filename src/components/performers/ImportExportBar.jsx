import { useState, useRef } from 'react';
import { Upload, Download, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { toast } from "sonner";

export default function ImportExportBar({ onImportComplete }) {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef(null);

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    toast.info("Import started...");

    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    
    const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: "array",
        items: {
          type: "object",
          properties: {
            permissions: { type: "string" },
            recruiterName: { type: "string" },
            applyingFor: { type: "string" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            stageName: { type: "string" },
            password: { type: "string" },
            streetAddress: { type: "string" },
            city: { type: "string" },
            state: { type: "string" },
            zipCode: { type: "string" },
            country: { type: "string" },
            dateOfBirth: { type: "string" },
            displayAge: { type: "number" },
            primaryLanguage: { type: "string" },
            otherLanguage: { type: "string" },
            height: { type: "string" },
            weight: { type: "string" },
            build: { type: "string" },
            ethnicity: { type: "string" },
            eyeColor: { type: "string" },
            hairColor: { type: "string" },
            hairLength: { type: "string" },
            breastSize: { type: "string" },
            buttSize: { type: "string" },
            pubicHair: { type: "string" },
            dressSize: { type: "string" },
            orientation: { type: "string" },
            sexualPreferences: { type: "string" },
            aboutMe: { type: "string" },
            turnsOn: { type: "string" },
            turnsOff: { type: "string" },
            memo: { type: "string" }
          }
        }
      }
    });

    if (result.status === 'success' && result.output) {
      const records = Array.isArray(result.output) ? result.output : [result.output];
      if (records.length > 0) {
        await base44.entities.Performer.bulkCreate(records);
        toast.success(`Import complete! ${records.length} performer(s) imported.`);
        onImportComplete?.();
      } else {
        toast.error("No valid records found in file.");
      }
    } else {
      toast.error("Import failed: " + (result.details || "Unknown error"));
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