import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, Send, Loader2, FileText, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const GREETING = {
  name: "Megan",
  greeting: "Welcome to LUXE Talent Systems! My name is Megan. I can help with performer-related questions.",
  suggestions: [
    "How do I schedule my first shift?",
    "What documents do I need to upload?",
    "How are earnings calculated?",
    "What is the onboarding process?"
  ]
};

export default function KnowledgeBase() {
  const [messages, setMessages] = useState([
    { type: 'assistant', content: GREETING.greeting, timestamp: new Date() }
  ]);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docCount, setDocCount] = useState(0);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load existing documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadDocuments = async () => {
    try {
      const docs = await base44.entities.KnowledgeBaseEntry.list('-created_date', 100);
      setDocCount(docs.length);
      const docNames = docs.map(d => d.fileName);
      setUploadedDocs(docNames);
    } catch (e) {
      console.error('Failed to load documents');
    }
  };

  const handleFileUpload = async (files) => {
    if (!files.length) return;
    
    setUploading(true);
    let successCount = 0;

    for (const file of files) {
      try {
        if (!['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
          toast.error(`${file.name} not supported. Use .txt, .pdf, or .docx`);
          continue;
        }

        // Upload file
        const { file_url } = await base44.integrations.Core.UploadFile({ file });

        // Process file and extract content
        const response = await base44.functions.invoke('processKnowledgebaseFile', {
          fileUrl: file_url,
          fileName: file.name,
          fileType: file.type
        });

        if (response.data.success) {
          successCount++;
          setUploadedDocs(prev => [...prev, file.name]);
          setDocCount(prev => prev + 1);
        } else {
          toast.error(`Failed to process ${file.name}`);
        }
      } catch (e) {
        toast.error(`Error uploading ${file.name}: ${e.message}`);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} file(s) processed and stored`);
    }
    setUploading(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim() || docCount === 0) {
      if (docCount === 0) {
        toast.error('Please upload documents first');
      }
      return;
    }

    const userMessage = query;
    setQuery('');
    setMessages(prev => [...prev, { type: 'user', content: userMessage, timestamp: new Date() }]);
    setLoading(true);

    try {
      const response = await base44.functions.invoke('searchKnowledgeBase', {
        query: userMessage
      });

      if (response.data.success) {
        setMessages(prev => [...prev, { 
          type: 'assistant', 
          content: response.data.answer,
          docsSearched: response.data.docsSearched,
          timestamp: new Date() 
        }]);
      } else {
        toast.error(response.data.error || 'Failed to search');
        setMessages(prev => prev.slice(0, -1));
      }
    } catch (e) {
      toast.error('Search failed');
      setMessages(prev => prev.slice(0, -1));
    }
    setLoading(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileUpload(e.dataTransfer.files);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-background">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md xl:max-w-lg rounded-lg p-3 ${
              msg.type === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-card border border-border text-foreground'
            }`}>
              <p className="text-sm leading-relaxed">{msg.content}</p>
              {msg.docsSearched && (
                <p className="text-xs mt-2 opacity-70">Searched {msg.docsSearched} document(s)</p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Megan is searching documents...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Uploaded Documents Status */}
      {docCount > 0 && (
        <div className="border-t border-border px-4 py-3 bg-card">
          <p className="text-xs font-medium text-muted-foreground mb-2">Knowledge Base ({docCount} document{docCount !== 1 ? 's' : ''})</p>
          <div className="flex flex-wrap gap-2">
            {uploadedDocs.slice(0, 5).map((name, idx) => (
              <div key={idx} className="flex items-center gap-1 bg-secondary rounded-lg px-2.5 py-1.5">
                <FileText className="h-3 w-3 text-primary" />
                <span className="text-xs text-foreground truncate max-w-[120px]">{name}</span>
              </div>
            ))}
            {uploadedDocs.length > 5 && (
              <div className="flex items-center gap-1 bg-secondary rounded-lg px-2.5 py-1.5">
                <span className="text-xs text-muted-foreground">+{uploadedDocs.length - 5} more</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Area / Suggestions */}
      {docCount === 0 && (
        <div className="border-t border-border px-4 py-4 bg-card space-y-3">
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs font-medium text-foreground">Drop files or click to upload</p>
            <p className="text-xs text-muted-foreground mt-1">.txt, .pdf, .docx</p>
          </div>
          <p className="text-xs text-muted-foreground">Start by uploading documents, then ask questions.</p>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Sample questions:</p>
            {GREETING.suggestions.map((s, i) => (
              <button key={i} onClick={() => setQuery(s)} className="block text-xs text-primary hover:underline text-left w-full">
                • {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-border px-4 py-3 bg-card">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.pdf,.docx"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="border-border"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          </Button>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question..."
            disabled={loading || docCount === 0}
            className="bg-secondary border-border text-foreground flex-1 h-9 text-sm"
          />
          <Button
            type="submit"
            disabled={loading || !query.trim() || docCount === 0}
            className="bg-primary text-primary-foreground h-9 px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}