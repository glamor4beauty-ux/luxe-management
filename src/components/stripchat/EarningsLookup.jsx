import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, DollarSign } from 'lucide-react';
import { toast } from "sonner";

const EARNINGS_KEYS = [
  ['totalEarnings', 'Total Earnings'],
  ['tips', 'Tips'],
  ['publicChatTips', 'Public Chat Tips'],
  ['privateChatTips', 'Private Chat Tips'],
  ['privateShows', 'Private Shows'],
  ['exclusivePrivates', 'Exclusive Privates'],
  ['groupShows', 'Group Shows'],
  ['ticketShow', 'Ticket Show'],
  ['albumSales', 'Album Sales'],
  ['videoSales', 'Video Sales'],
  ['fanClubSoldiers', 'Fan Club (Soldiers)'],
  ['fanClubLords', 'Fan Club (Lords)'],
  ['fanClubPrinces', 'Fan Club (Princes)'],
  ['offlineTips', 'Offline Tips'],
  ['spyOnPrivates', 'Spy on Privates'],
  ['massMessages', 'Mass Messages'],
  ['refunds', 'Refunds'],
  ['otherIncome', 'Other Income'],
];

export default function EarningsLookup({ profiles }) {
  const [modelUsername, setModelUsername] = useState('');
  const [periodType, setPeriodType] = useState('currentPayment');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFetch = async () => {
    if (!modelUsername) { toast.error('Please select a model'); return; }
    setLoading(true);
    setResult(null);
    try {
      const payload = { modelUsername, periodType };
      if (periodStart) payload.periodStart = periodStart.replace('T', ' ') + ':00';
      if (periodEnd) payload.periodEnd = periodEnd.replace('T', ' ') + ':00';

      const res = await base44.functions.invoke('stripchatEarnings', payload);
      if (res.data?.error) {
        toast.error(res.data.error);
      } else {
        setResult(res.data);
      }
    } catch (e) {
      toast.error(e.message);
    }
    setLoading(false);
  };

  const stageNames = profiles.map(p => p.stageName).filter(Boolean);

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Earnings Lookup (Stripchat API)</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Model</Label>
          <Select value={modelUsername} onValueChange={setModelUsername}>
            <SelectTrigger className="bg-secondary border-border text-foreground h-9 text-sm">
              <SelectValue placeholder="Select model..." />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {stageNames.map(name => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Period</Label>
          <Select value={periodType} onValueChange={setPeriodType}>
            <SelectTrigger className="bg-secondary border-border text-foreground h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="currentPayment">Current Payment</SelectItem>
              <SelectItem value="lastPayment">Last Payment</SelectItem>
              <SelectItem value="currentSession">Current Session</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Period Start (optional)</Label>
          <Input
            type="datetime-local"
            value={periodStart}
            onChange={e => setPeriodStart(e.target.value)}
            className="bg-secondary border-border text-foreground h-9 text-sm"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Period End (optional)</Label>
          <Input
            type="datetime-local"
            value={periodEnd}
            onChange={e => setPeriodEnd(e.target.value)}
            className="bg-secondary border-border text-foreground h-9 text-sm"
          />
        </div>
      </div>

      <Button onClick={handleFetch} disabled={loading} className="bg-primary text-primary-foreground">
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <DollarSign className="h-4 w-4 mr-2" />}
        {loading ? 'Fetching...' : 'Get Earnings'}
      </Button>

      {result && (
        <div className="mt-5 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground">Results for <span className="text-primary">@{modelUsername}</span></p>
            <div className="text-xs text-muted-foreground">
              {result.periodStart && result.periodEnd && (
                <span>{new Date(result.periodStart * 1000).toLocaleDateString()} – {new Date(result.periodEnd * 1000).toLocaleDateString()}</span>
              )}
            </div>
          </div>

          {/* Total highlighted */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Total Earnings</span>
            <span className="text-2xl font-bold text-primary">{(result.totalEarnings || 0).toLocaleString()} tk</span>
          </div>

          {/* Breakdown grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {EARNINGS_KEYS.filter(([key]) => key !== 'totalEarnings' && result[key] !== undefined && result[key] !== 0).map(([key, label]) => (
              <div key={key} className={`bg-secondary/50 rounded-lg p-3 ${key === 'refunds' ? 'border border-red-500/20' : ''}`}>
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className={`text-sm font-semibold ${key === 'refunds' ? 'text-red-400' : 'text-foreground'}`}>
                  {(result[key] || 0).toLocaleString()} tk
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}