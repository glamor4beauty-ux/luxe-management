import { useState, useEffect } from 'react';
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

  useEffect(() => {
    base44.entities.Performer.list().then(setPerformers);
  }, []);

  // Build merged list: stripchat profiles joined with performer real names
  const modelOptions = profiles
    .filter(p => p.stageName)
    .map(p => {
      const performer = performers.find(perf => perf.stageName === p.stageName);
      const realName = performer ? `${performer.firstName} ${performer.lastName}`.trim() : '';
      return { stageName: p.stageName, realName };
    });

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
        {/* Model checklist */}
        <div className="sm:col-span-3">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Model *</Label>
          <div className="border border-border rounded-lg bg-secondary overflow-hidden">
            {modelOptions.length === 0 ? (
              <p className="text-xs text-muted-foreground px-3 py-3">No Stripchat profiles found.</p>
            ) : (
              <div className="max-h-48 overflow-y-auto p-1">
                {modelOptions.map(m => (
                  <label key={m.stageName} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-card cursor-pointer">
                    <input
                      type="radio"
                      name="modelUsername"
                      value={m.stageName}
                      checked={modelUsername === m.stageName}
                      onChange={() => setModelUsername(m.stageName)}
                      className="accent-primary"
                    />
                    <span className="text-sm font-medium text-foreground">{m.stageName}</span>
                    {m.realName && <span className="text-xs text-muted-foreground">({m.realName})</span>}
                  </label>
                ))}
              </div>
            )}
          </div>
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