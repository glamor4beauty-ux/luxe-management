import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Upload, Loader2, BookOpen, FileText, Trash2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function KnowledgeBase() {
  const [files, setFiles] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    // In a real app, you'd fetch from a KnowledgeBase entity
    // For now, we'll just initialize empty
    setFiles([]);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'application/msword', 'text/csv', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload CSV, Word, or PDF files only');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFiles(prev => [...prev, { id: Date.now(), name: file.name, url: file_url, type: file.type }]);
      toast.success(`${file.name} uploaded!`);
    } catch (e) {
      toast.error('Upload failed');
    }
    setUploading(false);
  };

  const handleSearch = async (searchTerm) => {
    setQuery(searchTerm);

    if (!searchTerm.trim()) {
      setSearchResults(null);
      return;
    }

    setLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a helpful assistant for performers. A performer is searching for: "${searchTerm}"\n\nYou have access to these documents: ${files.map(f => f.name).join(', ')}\n\nProvide a helpful response based on common knowledge about performer schedules, earnings, uploads, and support. Be concise and actionable.`,
        add_context_from_internet: false,
      });

      setSearchResults({
        query: searchTerm,
        answer: response.data,
        timestamp: new Date(),
      });
    } catch (e) {
      toast.error('Search failed');
    }
    setLoading(false);
  };

  const handleDeleteFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    toast.success('File removed');
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground mb-1">Knowledge Base</h2>
        <p className="text-xs text-muted-foreground">Find answers and resources</p>
      </div>

      {/* Search */}
      <div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={query}
            onChange={e => handleSearch(e.target.value)}
            className="pl-10 bg-card border-border text-foreground h-10"
          />
          {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />}
        </div>
      </div>

      {/* Upload Files */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Upload className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Upload Documents</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">CSV, Word, PDF</p>
        <label className="flex items-center justify-center border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors">
          <div className="text-center">
            <FileText className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs font-medium text-muted-foreground">Click to upload</p>
          </div>
          <input
            type="file"
            accept=".csv,.doc,.docx,.pdf"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Uploaded Files */}
      {files.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Documents ({files.length})</h3>
          <div className="space-y-2">
            {files.map(file => (
              <div key={file.id} className="flex items-center justify-between bg-secondary/50 p-3 rounded-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <p className="text-sm text-foreground truncate">{file.name}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteFile(file.id)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">Results for "{searchResults.query}"</h3>
          <div className="bg-secondary/30 rounded-lg p-3 text-sm text-foreground leading-relaxed">
            {searchResults.answer}
          </div>
        </div>
      )}

      {!searchResults && !query && files.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No documents yet</p>
          <p className="text-xs mt-1">Upload files to get started</p>
        </div>
      )}
    </div>
  );
}