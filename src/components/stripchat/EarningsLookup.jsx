import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, TrendingUp, DollarSign, Search, ChevronDown } from 'lucide-react';
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
  const [performers, setPerformers] = useState([]);
  const [modelUsername, setModelUsername] = useState('');
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    base44.entities.Performer.list().then(setPerformers);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Build merged list: stripchat profiles joined with performer real names
  const modelOptions = profiles
    .filter(p => p.stageName)
    .map(p => {
      const performer = performers.find(perf => perf.stageName === p.stageName);
      const realName = performer ? `${performer.firstName} ${performer.lastName}`.trim() : '';
      return { stageName: p.stageName, realName };
    });

  const filtered = modelOptions.filter(m => {
    const q = search.toLowerCase();
    return !q || m.stageName.toLowerCase().includes(q) || m.realName.toLowerCase().includes(q);
  });

  const selectedModel = modelOptions.find(m => m.stageName === modelUsername);

  const handleSelect = (stageName) => {
    setModelUsername(stageName);
    setSearch('');
    setDropdownOpen(false);
  };

  const handleFetch = async () => {
    if (!modelUsername) { toast.error('Please select a model'); return; }
    if (!periodStart) { toast.error('Period Start date is required'); return; }
    if (!periodEnd) { toast.error('Period End date is required'); return; }
    if (periodStart > periodEnd) { toast.error('Period Start must be before Period End'); return; }

    setLoading(true);
    setResult(null);
    try {
      const payload = {
        modelUsername,
        periodStart: periodStart + ' 00:00:00',
        periodEnd: periodEnd + ' 23:59:59',
      };

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

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Earnings Lookup (Stripchat API)</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {/* Searchable model picker */}
        <div ref={dropdownRef} className="relative">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Model *</Label>
          <button
            type="button"
            onClick={() => setDropdownOpen(o => !o)}
            className="w-full flex items-center justify-between bg-secondary border border-border text-foreground h-9 px-3 rounded-md text-sm"
          >
            <span className={modelUsername ? 'text-foreground' : 'text-muted-foreground'}>
              {selectedModel
                ? selectedModel.realName
                  ? `${selectedModel.stageName} (${selectedModel.realName})`
                  : selectedModel.stageName
                : 'Select model...'}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>

          {dropdownOpen && (
            <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-md shadow-lg overflow-hidden">
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    autoFocus
                    placeholder="Search by name or stage name..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-7 h-8 text-xs bg-secondary border-border"
                  />
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-3 py-2">No models found</p>
                ) : (
                  filtered.map(m => (
                    <button
                      key={m.stageName}
                      onClick={() => handleSelect(m.stageName)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors ${modelUsername === m.stageName ? 'bg-primary/10 text-primary' : 'text-foreground'}`}
                    >
                      <span className="font-medium">{m.stageName}</span>
                      {m.realName && <span className="text-xs text-muted-foreground ml-2">({m.realName})</span>}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Period Start */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Period Start *</Label>
          <Input
            type="date"
            value={periodStart}
            onChange={e => setPeriodStart(e.target.value)}
            className="bg-secondary border-border text-foreground h-9 text-sm"
          />
        </div>

        {/* Period End */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Period End *</Label>
          <Input
            type="date"
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
              {periodStart && periodEnd && (
                <span>{new Date(periodStart).toLocaleDateString()} – {new Date(periodEnd).toLocaleDateString()}</span>
              )}
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Total Earnings</span>
            <span className="text-2xl font-bold text-primary">{(result.totalEarnings || 0).toLocaleString()} tk</span>
          </div>

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