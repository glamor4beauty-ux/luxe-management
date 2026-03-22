import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function StripchatLookup({ stageName, onAccountFound }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (stageName) {
      handleLookup();
    }
  }, [stageName]);

  const handleLookup = async () => {
    if (!stageName) {
      toast.error('Stage name required');
      return;
    }

    setLoading(true);
    setSearched(true);
    
    try {
      const res = await base44.functions.invoke('stripchatLookup', { stageName });
      
      if (res.data.success) {
        setResult(res.data);
        if (onAccountFound) onAccountFound(res.data);
      } else {
        setResult({ error: true, message: res.data.message });
      }
    } catch (e) {
      setResult({ error: true, message: 'No Account Found' });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">

      {searched && result?.error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600">{result.message}</p>
        </div>
      )}

      {result && !result.error && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Username</p>
            <p className="text-sm font-medium text-foreground">{result.username}</p>
          </div>
          {result.earnings !== undefined && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Earnings</p>
              <p className="text-sm font-medium text-primary">${result.earnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          )}
          {result.followers > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Followers</p>
              <p className="text-sm font-medium text-foreground">{result.followers.toLocaleString()}</p>
            </div>
          )}
          {result.profileUrl && (
            <a href={result.profileUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="border-border w-full">
                <ExternalLink className="h-4 w-4 mr-2" /> View Profile
              </Button>
            </a>
          )}
        </div>
      )}
    </div>
  );
}