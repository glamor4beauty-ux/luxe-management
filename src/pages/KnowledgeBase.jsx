import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Loader2, BookOpen } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const ARTICLES = [
  {
    id: 1,
    title: 'How to Schedule Your Shifts',
    category: 'Scheduling',
    content: 'To schedule your shifts, navigate to "Schedule Shifts" and click "Add Shift". Select your date, enter your start and end times, and save. You can add multiple shifts for different dates.',
  },
  {
    id: 2,
    title: 'Understanding Your Earnings',
    category: 'Payments',
    content: 'Your earnings are calculated based on your activity and sales. Earnings are processed weekly and transferred to your registered payment method. Check your earnings dashboard for detailed breakdowns.',
  },
  {
    id: 3,
    title: 'Updating Your Profile',
    category: 'Profile',
    content: 'Keep your profile up-to-date by visiting your profile settings. You can update your stage name, photos, bio, and other personal information. Regular updates help attract more viewers.',
  },
  {
    id: 4,
    title: 'Getting Started with Tips',
    category: 'Tips & Tricks',
    content: 'Tips are a great way to earn extra income. Encourage viewers to tip during your shows, and engage with your audience. The more interactive you are, the more tips you\'ll receive.',
  },
  {
    id: 5,
    title: 'Account Security Best Practices',
    category: 'Security',
    content: 'Always use a strong password with a mix of letters, numbers, and symbols. Enable two-factor authentication if available. Never share your password or account information with anyone.',
  },
  {
    id: 6,
    title: 'What to Do If You Can\'t Work',
    category: 'Scheduling',
    content: 'If you need to cancel a scheduled shift, notify management as soon as possible. Open the shift details and click "Cancel Shift". For emergencies, contact support directly.',
  },
  {
    id: 7,
    title: 'Camera & Equipment Requirements',
    category: 'Technical',
    content: 'A high-quality HD camera or webcam is essential. Ensure good lighting, stable internet connection (minimum 5 Mbps), and a quiet environment. Test your setup before going live.',
  },
  {
    id: 8,
    title: 'Building Your Audience',
    category: 'Tips & Tricks',
    content: 'Consistency is key—stream at the same times regularly so viewers know when to find you. Engage with your audience through chat, offer exclusive content, and maintain a professional appearance.',
  },
];

export default function KnowledgeBase() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(ARTICLES);
  const [loading, setLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);

  const handleSearch = async (searchTerm) => {
    setQuery(searchTerm);

    if (!searchTerm.trim()) {
      setResults(ARTICLES);
      return;
    }

    setLoading(true);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Search these knowledge base articles and return the most relevant ones for this query: "${searchTerm}". Return article IDs and relevance scores.`,
        response_json_schema: {
          type: 'object',
          properties: {
            matches: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  relevance: { type: 'number' },
                },
              },
            },
          },
        },
      });

      const matchedIds = response.data?.matches?.map(m => m.id) || [];
      const filtered = ARTICLES.filter(a => matchedIds.includes(a.id) || a.title.toLowerCase().includes(searchTerm.toLowerCase()) || a.content.toLowerCase().includes(searchTerm.toLowerCase()));
      setResults(filtered.length > 0 ? filtered : ARTICLES);
    } catch (e) {
      const filtered = ARTICLES.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()) || a.content.toLowerCase().includes(searchTerm.toLowerCase()) || a.category.toLowerCase().includes(searchTerm.toLowerCase()));
      setResults(filtered);
    }

    setLoading(false);
  };

  const categories = [...new Set(ARTICLES.map(a => a.category))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Knowledge Base</h1>
          <p className="text-muted-foreground">Find answers to common questions</p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={query}
              onChange={e => handleSearch(e.target.value)}
              className="pl-10 bg-card border-border text-foreground h-10"
            />
            {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Categories */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl p-4 sticky top-6">
              <h3 className="font-semibold text-foreground mb-3 text-sm">Categories</h3>
              <div className="space-y-2">
                <button
                  onClick={() => { setQuery(''); setResults(ARTICLES); }}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    !query ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  All Articles
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => handleSearch(cat)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                      query === cat ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedArticle ? (
              <div className="bg-card border border-border rounded-xl p-6">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="text-primary hover:underline text-sm mb-4"
                >
                  ← Back to Results
                </button>
                <h2 className="text-2xl font-bold text-foreground mb-2">{selectedArticle.title}</h2>
                <span className="inline-block text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full mb-4">{selectedArticle.category}</span>
                <div className="prose prose-invert max-w-none">
                  <p className="text-foreground leading-relaxed">{selectedArticle.content}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {results.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No articles found. Try a different search.</p>
                  </div>
                ) : (
                  results.map(article => (
                    <button
                      key={article.id}
                      onClick={() => setSelectedArticle(article)}
                      className="w-full text-left bg-card border border-border hover:border-primary/50 rounded-xl p-4 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{article.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{article.content}</p>
                        </div>
                        <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full whitespace-nowrap">{article.category}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}