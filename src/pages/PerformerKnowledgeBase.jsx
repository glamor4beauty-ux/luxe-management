import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Upload, FileText, Loader2, BookOpen } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function PerformerKnowledgeBase() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Welcome to the Knowledge Base! Upload documents and ask questions about them.' }
  ]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        setDocuments(prev => [...prev, { id: res.data.entryId, fileName: res.data.fileName }]);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `I've added "${res.data.fileName}" to the knowledge base. Feel free to ask me questions about it!`
        }]);
      } else {
        toast.error(res.data.error || 'Failed to upload document');
      }
    } catch (e) {
      toast.error('Upload failed: ' + e.message);
    }
    setUploading(false);
    fileInputRef.current.value = '';
  };

  const handleQuery = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMessage = query.trim();
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await base44.functions.invoke('queryKnowledgeBase', { query: userMessage });

      if (res.data.success) {
        let assistantMessage = res.data.answer;

        if (res.data.sources && res.data.sources.length > 0) {
          assistantMessage += '\n\n📚 Sources:\n' + 
            res.data.sources.map(s => `• ${s.fileName}`).join('\n');
        }

        setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error querying knowledge base: ' + e.message }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-background flex-col md:flex-row">
      {/* Header */}
      <div className="bg-card border-b md:border-b-0 md:border-r border-border p-4 sticky top-0 md:static z-10 md:w-64 md:flex md:flex-col">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Knowledge Base</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap md:flex-col md:w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="border-border h-8 text-xs md:w-full"
          >
            {uploading ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <Upload className="h-3 w-3 mr-1.5" />}
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.docx,.doc"
            onChange={e => handleUploadFile(e.target.files?.[0])}
            className="hidden"
          />
          {documents.length > 0 && (
            <span className="text-xs text-muted-foreground md:mt-3">{documents.length} document{documents.length !== 1 ? 's' : ''} loaded</span>
          )}
        </div>

        {/* Documents List - Desktop */}
        {documents.length > 0 && (
          <div className="hidden md:block mt-6 flex-1 overflow-y-auto">
            <p className="text-xs font-semibold text-muted-foreground mb-3">Documents</p>
            <div className="space-y-2">
              {documents.map(doc => (
                <div key={doc.id} className="bg-secondary/50 rounded-lg p-2.5 text-xs border border-border/50">
                  <p className="font-medium text-foreground truncate" title={doc.fileName}>{doc.fileName}</p>
                  <p className="text-muted-foreground mt-1">{doc.category || 'General'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex flex-col flex-1 md:border-l border-border">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs lg:max-w-md rounded-lg p-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-foreground'
              }`}
              style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-card border-t border-border p-4 sticky bottom-0 md:border-l-0">
        <form onSubmit={handleQuery} className="flex gap-2">
          <Input
            type="text"
            placeholder="Ask a question about the documents..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            disabled={loading || documents.length === 0}
            className="bg-secondary border-border text-foreground h-9 text-sm"
          />
          <Button
            type="submit"
            disabled={loading || !query.trim() || documents.length === 0}
            size="sm"
            className="bg-primary text-primary-foreground h-9 px-3"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
        {documents.length === 0 && (
          <p className="text-xs text-muted-foreground mt-2">Upload at least one document to start asking questions.</p>
        )}
      </div>
      </div>
    </div>
  );
}