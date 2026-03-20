import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, Loader2, Trash2, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function PerformerUpload() {
  const [user, setUser] = useState(null);
  const [performer, setPerformer] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const u = await base44.auth.me();
      setUser(u);
      const performers = await base44.entities.Performer.filter({ email: u.email });
      if (performers.length > 0) {
        setPerformer(performers[0]);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleUploadPhoto = async (type) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        const updates = {};
        updates[type] = file_url;
        await base44.entities.Performer.update(performer.id, updates);
        setPerformer(p => ({ ...p, [type]: file_url }));
        toast.success(`${type.replace(/([A-Z])/g, ' $1')} updated!`);
      } catch (e) {
        toast.error('Upload failed');
      }
      setUploading(false);
    };
    input.click();
  };

  const handleRemovePhoto = async (type) => {
    await base44.entities.Performer.update(performer.id, { [type]: null });
    setPerformer(p => ({ ...p, [type]: null }));
    toast.success('Photo removed');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!performer) {
    return <div className="text-center py-12 text-muted-foreground">No performer profile found.</div>;
  }

  const photoFields = [
    { key: 'profilePhoto', label: 'Profile Photo', description: 'Main profile picture' },
    { key: 'idFront', label: 'ID Front', description: 'Front of ID' },
    { key: 'idBack', label: 'ID Back', description: 'Back of ID' },
    { key: 'faceId', label: 'Face + ID', description: 'Your face with ID' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Upload Photos</h2>
        <p className="text-xs text-muted-foreground mt-1">Update your profile pictures and ID verification</p>
      </div>

      <div className="space-y-3">
        {photoFields.map(field => (
          <div key={field.key} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{field.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{field.description}</p>
              </div>
              {performer[field.key] ? (
                <div className="flex gap-2">
                  <img src={performer[field.key]} alt={field.label} className="h-12 w-12 rounded-lg object-cover border border-border" />
                </div>
              ) : (
                <div className="h-12 w-12 rounded-lg bg-secondary border border-border flex items-center justify-center">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-3">
              <Button
                onClick={() => handleUploadPhoto(field.key)}
                disabled={uploading}
                size="sm"
                className="flex-1 bg-primary text-primary-foreground h-8 text-xs"
              >
                {uploading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
                {performer[field.key] ? 'Replace' : 'Upload'}
              </Button>
              {performer[field.key] && (
                <Button
                  onClick={() => handleRemovePhoto(field.key)}
                  variant="outline"
                  size="sm"
                  className="border-border h-8 text-xs"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-secondary/30 border border-border rounded-lg p-4 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground mb-2">Requirements:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Photos must be clear and well-lit</li>
          <li>Profile photo should show your face clearly</li>
          <li>ID must be readable and current</li>
          <li>Face + ID must show you holding your ID</li>
        </ul>
      </div>
    </div>
  );
}