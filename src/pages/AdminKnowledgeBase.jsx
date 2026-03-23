import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { FileText, Trash2, Loader2, Upload, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

export default function AdminKnowledgeBase() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef(null);

  if (user?.role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('listKnowledgeBase', {});
      setEntries(res.data?.entries || []);
    } catch (e) {
      console.error('Load error:', e);
      setEntries([]);
    }
    setLoading(false);
  };

  const handleFileUpload = async (files) => {
    if (!files.length) return;
    
    setUploading(true);
    let successCount = 0;

    for (const file of files) {
      try {
        const validExts = ['.txt', '.pdf', '.docx'];
        const hasValidExt = validExts.some(ext => file.name.toLowerCase().endsWith(ext));
        if (!hasValidExt) {
          toast.error(`${file.name} not supported`);
          continue;
        }

        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        if (!file_url) {
          toast.error(`${file.name} upload failed`);
          continue;
        }

        const mimeTypes = {
          '.pdf': 'application/pdf',
          '.txt': 'text/plain',
          '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };
        const ext = Object.keys(mimeTypes).find(e => file.name.toLowerCase().endsWith(e));
        const fileType = ext ? mimeTypes[ext] : file.type;

        const response = await base44.functions.invoke('processKnowledgebaseFile', {
          fileUrl: file_url,
          fileName: file.name,
          fileType
        });

        if (response?.data?.success) {
          successCount++;
        }
      } catch (e) {
        console.error('Upload error:', e);
        toast.error(`Error uploading ${file.name}`);
      }
    }

    setUploading(false);
    if (successCount > 0) {
      toast.success(`${successCount} file(s) uploaded`);
      loadEntries();
    }
    fileInputRef.current.value = '';
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.KnowledgeBaseEntry.delete(id);
      setEntries(prev => prev.filter(e => e.id !== id));
      toast.success('Document deleted');
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  const filtered = entries.filter(e => 
    !search || e.fileName?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground mt-1">{entries.length} document(s)</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.pdf,.docx"
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
        />
        <Button 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
          Upload
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-card border-border text-foreground h-9 pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No documents found.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">File Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Uploaded By</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Date</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(entry => (
                <tr key={entry.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-foreground font-medium">{entry.fileName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">
                    {entry.fileName?.endsWith('.pdf') ? 'PDF' : 
                     entry.fileName?.endsWith('.txt') ? 'TXT' :
                     entry.fileName?.endsWith('.docx') ? 'DOCX' : 'File'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">{entry.uploadedBy || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">
                    {entry.created_date ? new Date(entry.created_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 h-8">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Document</AlertDialogTitle>
                          <AlertDialogDescription>Remove "{entry.fileName}" from knowledge base?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(entry.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}