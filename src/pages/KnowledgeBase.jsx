import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, Send, Loader2, FileText, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const GREETING = {
  name: "Megan",
  greeting: "Hi! I'm Megan, your LUXE support assistant. I can help answer your questions about shifts, payments, onboarding, and more.",
  commonQuestions: [
    "How do I schedule a shift?",
    "When will I get paid?",
    "How do I upload my ID?",
    "What are the minimum shift requirements?",
    "How is my profile rating calculated?",
    "Can I edit my performance settings?"
  ]
};

export default function KnowledgeBase() {
  const [messages, setMessages] = useState([
    { type: 'assistant', content: GREETING.greeting, timestamp: new Date() }
  ]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [docCount, setDocCount] = useState(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadDocuments();
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadDocuments = async () => {
    try {
      const docs = await base44.entities.KnowledgeBaseEntry.list('-created_date', 100);
      setDocCount(docs.length);
    } catch (e) {
      console.error('Failed to load documents');
    }
  };



  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

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



  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-gradient-to-br from-background to-secondary/20">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-sm rounded-xl p-4 ${
              msg.type === 'user' 
                ? 'bg-primary text-primary-foreground rounded-br-none' 
                : 'bg-card border border-border text-foreground rounded-bl-none'
            }`}>
              {msg.type === 'assistant' && <p className="text-xs font-medium text-muted-foreground mb-2">Megan</p>}
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

      {/* Common Questions / Info Area */}
      {messages.length === 1 && (
        <div className="border-t border-border px-4 py-4 bg-card space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Common questions:</p>
          <div className="space-y-2">
            {GREETING.commonQuestions.map((q, i) => (
              <button 
                key={i} 
                onClick={() => setQuery(q)}
                className="w-full text-left text-xs p-3 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors border border-border/50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-border px-4 py-3 bg-card/80 backdrop-blur">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question..."
            disabled={loading}
            className="bg-secondary border-border text-foreground flex-1 h-9 text-sm"
          />
          <Button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-primary text-primary-foreground h-9 px-4"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}