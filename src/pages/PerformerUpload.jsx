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
        await base44.entities.Performer.update(performer.id, { [type]: file_url });
        setPerformer(p => ({ ...p, [type]: file_url }));
        toast.success('Photo updated!');
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
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!performer) {
    return <div className="text-center py-12 text-muted-foreground text-sm">No profile found.</div>;
  }

  const photos = [
    { key: 'profilePhoto', label: 'Profile Photo', description: 'Main picture' },
    { key: 'idFront', label: 'ID Front', description: 'Front of your ID' },
    { key: 'idBack', label: 'ID Back', description: 'Back of your ID' },
    { key: 'faceId', label: 'Face + ID', description: 'You holding your ID' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground">Photos</h2>
        <p className="text-xs text-muted-foreground">Update your profile pictures</p>
      </div>

      <div className="space-y-3">
        {photos.map(photo => (
          <div key={photo.key} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{photo.label}</p>
                <p className="text-xs text-muted-foreground">{photo.description}</p>
              </div>
              {performer[photo.key] && (
                <img src={performer[photo.key]} alt={photo.label} className="h-14 w-14 rounded-lg object-cover border border-border" />
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleUploadPhoto(photo.key)}
                disabled={uploading}
                size="sm"
                className="flex-1 bg-primary text-primary-foreground h-9 text-xs"
              >
                {uploading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
                {performer[photo.key] ? 'Replace' : 'Upload'}
              </Button>
              {performer[photo.key] && (
                <Button
                  onClick={() => handleRemovePhoto(photo.key)}
                  variant="outline"
                  size="sm"
                  className="border-border h-9 text-xs"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-secondary/30 border border-border rounded-lg p-4 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground mb-2">Tips:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Use clear, well-lit photos</li>
          <li>Make sure your face is visible</li>
          <li>ID must be readable and current</li>
        </ul>
      </div>
    </div>
  );
}