import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, Trash2, FileText, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

export default function AdminKnowledgeBase() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const entries = await base44.asServiceRole.entities.KnowledgeBaseEntry.list('-created_date', 1000);
      setDocuments(entries);
    } catch (e) {
      toast.error('Failed to load documents');
    }
    setLoading(false);
  };

  const handleUploadFile = async (file) => {
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const res = await base44.functions.invoke('uploadKnowledgeBaseDoc', {
        fileUrl: file_url,
        fileName: file.name,
        fileType: file.type,
        title: file.name.replace(/\.[^/.]+$/, ''),
        category: 'General'
      });

      if (res.data.success) {
        toast.success('Document uploaded successfully!');
        loadDocuments();
      } else {
        toast.error(res.data.error || 'Failed to upload document');
      }
    } catch (e) {
      toast.error('Upload failed: ' + e.message);
    }
    setUploading(false);
    fileInputRef.current.value = '';
  };

  const handleDelete = async (id) => {
    try {
      await base44.asServiceRole.entities.KnowledgeBaseEntry.delete(id);
      toast.success('Document deleted');
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (e) {
      toast.error('Failed to delete document');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground mt-1">{documents.length} document{documents.length !== 1 ? 's' : ''}</p>
        </div>
        <Button
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-primary text-primary-foreground"
        >
          {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
          Upload Document
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.docx,.doc"
          onChange={e => handleUploadFile(e.target.files?.[0])}
          className="hidden"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground mb-4">No documents uploaded yet</p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-primary text-primary-foreground"
          >
            <Upload className="h-4 w-4 mr-2" /> Upload First Document
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">File Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden sm:table-cell">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Uploaded By</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map(doc => (
                  <tr key={doc.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{doc.fileName}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{doc.title || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">{doc.fileType || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-xs">{doc.uploadedBy || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Document</AlertDialogTitle>
                            <AlertDialogDescription>Delete "{doc.fileName}"? This cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(doc.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}