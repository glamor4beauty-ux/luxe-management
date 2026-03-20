import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Search, Save, Loader2, CheckCircle, DollarSign, TrendingUp, RefreshCw, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

const emptyForm = { stageName: '', amount: '', date: '', status: 'unpaid', referenceId: '', notes: '' };

const fmt = (n) => `$${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtTk = (n) => `${(n || 0).toLocaleString()} tk`;
const fmtTk = (n) => `${(n || 0).toLocaleString()} tk`;

export default function Payouts() {
  const [tab, setTab] = useState('summary');

  // Summary state
  const [stripchatProfiles, setStripchatProfiles] = useState([]);
  const [selectedPerformers, setSelectedPerformers] = useState([]);
  const [profileSearch, setProfileSearch] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [summaryRows, setSummaryRows] = useState([]);
  const [fetchingEarnings, setFetchingEarnings] = useState(false);
  const [markingPaid, setMarkingPaid] = useState({});
  const [commissionSettings, setCommissionSettings] = useState(null);
  const [performers, setPerformers] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [globalRate, setGlobalRate] = useState('30');
  const [savingSettings, setSavingSettings] = useState(false);

  // Records state
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.Stripchat.list().then(setStripchatProfiles);
    base44.entities.Performer.list().then(setPerformers);
    loadPayouts();
    loadCommissionSettings();
  }, []);

  const loadCommissionSettings = async () => {
    const settings = await base44.entities.CommissionSettings.list();
    if (settings.length > 0) {
      setCommissionSettings(settings[0]);
      setGlobalRate(String(settings[0].globalCommissionRate || 30));
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    if (commissionSettings?.id) {
      await base44.entities.CommissionSettings.update(commissionSettings.id, { globalCommissionRate: parseFloat(globalRate) });
    } else {
      await base44.entities.CommissionSettings.create({ globalCommissionRate: parseFloat(globalRate) });
    }
    toast.success('Settings saved!');
    setSavingSettings(false);
    setSettingsOpen(false);
    loadCommissionSettings();
  };

  // Fetch earnings from Stripchat API for selected performers in the date range
  const handleFetchEarnings = async () => {
    if (!periodStart || !periodEnd) { toast.error('Both Period Start and End are required'); return; }
    if (periodStart > periodEnd) { toast.error('Period Start must be before Period End'); return; }
    if (selectedPerformers.length === 0) { toast.error('Please select at least one performer'); return; }

    setFetchingEarnings(true);
    setSummaryRows([]);

    const allPayouts = await base44.entities.Payout.list();
    const periodPayouts = allPayouts.filter(p => {
      if (!p.date) return false;
      const d = p.date.slice(0, 10);
      return d >= periodStart && d <= periodEnd;
    });

    const activeProfiles = stripchatProfiles.filter(p => selectedPerformers.includes(p.stageName));
    const rows = [];
    for (const profile of activeProfiles) {
      try {
        const res = await base44.functions.invoke('stripchatEarnings', {
          modelUsername: profile.stageName,
          periodStart: periodStart + ' 00:00:00',
          periodEnd: periodEnd + ' 23:59:59',
        });
        const data = res.data;
        if (data?.error) {
          rows.push({ stageName: profile.stageName, error: data.error, totalTokens: 0, paidAmount: 0 });
        } else {
          const totalTokens = data?.totalEarnings || 0;
          const paidAmount = periodPayouts
            .filter(p => p.stageName === profile.stageName && p.status === 'paid')
            .reduce((s, p) => s + (p.amount || 0), 0);
          rows.push({ stageName: profile.stageName, totalTokens, paidAmount, rawData: data });
        }
      } catch (e) {
        rows.push({ stageName: profile.stageName, error: e.message, totalTokens: 0, paidAmount: 0 });
      }
    }

    setSummaryRows(rows);
    setFetchingEarnings(false);
    toast.success(`Fetched earnings for ${rows.length} performer(s)`);
  };

  const handleMarkCyclePaid = async (row) => {
    setMarkingPaid(m => ({ ...m, [row.stageName]: true }));
    const today = new Date().toISOString();
    const performer = performers.find(p => p.stageName === row.stageName);
    const rate = performer?.commissionRate || parseFloat(globalRate);
    const commission = row.totalTokens * (rate / 100);
    await base44.entities.Payout.create({
      stageName: row.stageName,
      amount: commission,
      date: today,
      status: 'paid',
      referenceId: `${periodStart}_${periodEnd}`,
      notes: `Auto-created from Stripchat earnings ${periodStart} – ${periodEnd}. Rate: ${rate}%`,
    });
    toast.success(`Marked ${row.stageName} as paid!`);
    setSummaryRows(prev => prev.map(r => r.stageName === row.stageName ? { ...r, paidAmount: r.totalTokens } : r));
    setMarkingPaid(m => ({ ...m, [row.stageName]: false }));
    loadPayouts();
  };

  const loadPayouts = async () => {
    setLoading(true);
    const data = await base44.entities.Payout.list('-date');
    setPayouts(data);
    setLoading(false);
  };

  // Fetch earnings from Stripchat API for selected performers in the date range
  const handleFetchEarnings = async () => {
    if (!periodStart || !periodEnd) { toast.error('Both Period Start and End are required'); return; }
    if (periodStart > periodEnd) { toast.error('Period Start must be before Period End'); return; }
    if (selectedPerformers.length === 0) { toast.error('Please select at least one performer'); return; }

    setFetchingEarnings(true);
    setSummaryRows([]);

    const allPayouts = await base44.entities.Payout.list();
    const periodPayouts = allPayouts.filter(p => {
      if (!p.date) return false;
      const d = p.date.slice(0, 10);
      return d >= periodStart && d <= periodEnd;
    });

    const activeProfiles = stripchatProfiles.filter(p => selectedPerformers.includes(p.stageName));
    const rows = [];
    for (const profile of activeProfiles) {
      try {
        const res = await base44.functions.invoke('stripchatEarnings', {
          modelUsername: profile.stageName,
          periodStart: periodStart + ' 00:00:00',
          periodEnd: periodEnd + ' 23:59:59',
        });
        const data = res.data;
        if (data?.error) {
          rows.push({ stageName: profile.stageName, error: data.error, totalTokens: 0, paidAmount: 0 });
        } else {
          const totalTokens = data?.totalEarnings || 0;
          const paidAmount = periodPayouts
            .filter(p => p.stageName === profile.stageName && p.status === 'paid')
            .reduce((s, p) => s + (p.amount || 0), 0);
          rows.push({ stageName: profile.stageName, totalTokens, paidAmount, rawData: data });
        }
      } catch (e) {
        rows.push({ stageName: profile.stageName, error: e.message, totalTokens: 0, paidAmount: 0 });
      }
    }

    setSummaryRows(rows);
    setFetchingEarnings(false);
    toast.success(`Fetched earnings for ${rows.length} performer(s)`);
  };

  const handleMarkCyclePaid = async (row) => {
    setMarkingPaid(m => ({ ...m, [row.stageName]: true }));
    const today = new Date().toISOString();
    await base44.entities.Payout.create({
      stageName: row.stageName,
      amount: row.totalTokens, // store tokens as the amount (user can convert)
      date: today,
      status: 'paid',
      referenceId: `${periodStart}_${periodEnd}`,
      notes: `Auto-created from Stripchat earnings ${periodStart} – ${periodEnd}`,
    });
    toast.success(`Marked ${row.stageName} as paid!`);
    setSummaryRows(prev => prev.map(r => r.stageName === row.stageName ? { ...r, paidAmount: r.totalTokens } : r));
    setMarkingPaid(m => ({ ...m, [row.stageName]: false }));
    loadPayouts();
  };

  // Records tab helpers
  const handleSave = async () => {
    if (!form.stageName || !form.amount || !form.date) { toast.error("Stage Name, Amount, and Date are required"); return; }
    setSaving(true);
    await base44.entities.Payout.create({ ...form, amount: parseFloat(form.amount), date: new Date(form.date).toISOString() });
    toast.success("Payout created!");
    setDialogOpen(false);
    setForm({ ...emptyForm });
    setSaving(false);
    loadPayouts();
  };

  const handleMarkPaid = async (payout) => {
    await base44.entities.Payout.update(payout.id, { status: 'paid' });
    setPayouts(prev => prev.map(p => p.id === payout.id ? { ...p, status: 'paid' } : p));
    toast.success("Marked as paid!");
  };

  const handleDelete = async (id) => {
    await base44.entities.Payout.delete(id);
    setPayouts(prev => prev.filter(p => p.id !== id));
  };

  const filtered = payouts.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.stageName?.toLowerCase().includes(q) || p.referenceId?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalUnpaid = payouts.filter(p => p.status === 'unpaid').reduce((s, p) => s + (p.amount || 0), 0);
  const totalPaid = payouts.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payouts</h1>
          <p className="text-sm text-muted-foreground mt-1">Earnings summary & payout records</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-lg p-1 mb-6 w-fit">
        <button onClick={() => setTab('summary')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === 'summary' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
          Earnings Summary
        </button>
        <button onClick={() => setTab('records')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === 'records' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
          Payout Records
        </button>
      </div>

      {/* ── EARNINGS SUMMARY TAB ── */}
      {tab === 'summary' && (
        <div>
          {/* Date range picker */}
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Fetch Earnings from Stripchat API</h3>
            </div>

            {/* Performer multi-select table */}
            <div className="mb-4">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Select Performers *</Label>
              <div className="border border-border rounded-lg overflow-hidden">
                {stripchatProfiles.filter(p => p.stageName).length === 0 ? (
                  <p className="text-xs text-muted-foreground px-3 py-3">No Stripchat profiles found.</p>
                ) : (
                  <div className="max-h-52 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-secondary border-b border-border">
                        <tr>
                          <th className="px-4 py-2 w-8">
                            <input
                              type="checkbox"
                              className="accent-primary"
                              checked={selectedPerformers.length === stripchatProfiles.filter(p => p.stageName).length}
                              onChange={e => {
                                const all = stripchatProfiles.filter(p => p.stageName).map(p => p.stageName);
                                setSelectedPerformers(e.target.checked ? all : []);
                              }}
                            />
                          </th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stage Name</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stripchatProfiles.filter(p => p.stageName).map(p => (
                          <tr
                            key={p.stageName}
                            className="border-b border-border/50 hover:bg-secondary/40 cursor-pointer transition-colors"
                            onClick={() => setSelectedPerformers(prev =>
                              prev.includes(p.stageName) ? prev.filter(n => n !== p.stageName) : [...prev, p.stageName]
                            )}
                          >
                            <td className="px-4 py-2.5 w-8">
                              <input
                                type="checkbox"
                                className="accent-primary"
                                checked={selectedPerformers.includes(p.stageName)}
                                onChange={() => {}}
                              />
                            </td>
                            <td className="px-4 py-2.5 font-medium text-foreground">{p.stageName}</td>
                            <td className="px-4 py-2.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                p.status === 'active' ? 'bg-green-500/10 text-green-400' :
                                p.status === 'inactive' ? 'bg-red-500/10 text-red-400' :
                                'bg-yellow-500/10 text-yellow-400'
                              }`}>{p.status || 'pending'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Period Start *</Label>
                <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="bg-secondary border-border text-foreground h-9 text-sm w-44" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Period End *</Label>
                <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="bg-secondary border-border text-foreground h-9 text-sm w-44" />
              </div>
              <Button onClick={handleFetchEarnings} disabled={fetchingEarnings} className="bg-primary text-primary-foreground h-9">
                {fetchingEarnings ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                {fetchingEarnings ? 'Fetching...' : 'Fetch Earnings'}
              </Button>
            </div>
            {fetchingEarnings && (
              <p className="text-xs text-muted-foreground mt-3">Fetching earnings for {selectedPerformers.length} performer(s) — this may take a moment…</p>
            )}
          </div>

          {/* Summary table */}
          {summaryRows.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Performer</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Earned (tk)</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paid ($)</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Balance (tk)</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryRows.map(row => {
                      const balance = row.totalTokens - row.paidAmount;
                      const isPaid = row.paidAmount >= row.totalTokens && row.totalTokens > 0;
                      return (
                        <tr key={row.stageName} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                          <td className="px-4 py-3 text-foreground font-medium">@{row.stageName}</td>
                          <td className="px-4 py-3">
                            {row.error
                              ? <span className="text-red-400 text-xs">{row.error}</span>
                              : <span className="text-primary font-semibold">{fmtTk(row.totalTokens)}</span>
                            }
                          </td>
                          <td className="px-4 py-3 text-green-400 font-medium">{fmt(row.paidAmount)}</td>
                          <td className="px-4 py-3">
                            <span className={`font-semibold ${balance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                              {balance > 0 ? fmtTk(balance) : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {!row.error && (
                              isPaid ? (
                                <span className="text-xs text-green-400 flex items-center justify-end gap-1">
                                  <CheckCircle className="h-3.5 w-3.5" /> Paid
                                </span>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => handleMarkCyclePaid(row)}
                                  disabled={markingPaid[row.stageName]}
                                  className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                                >
                                  {markingPaid[row.stageName] ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                                  Mark as Paid
                                </Button>
                              )
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border bg-secondary/30">
                      <td className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Totals</td>
                      <td className="px-4 py-3 text-primary font-bold">{fmtTk(summaryRows.reduce((s, r) => s + r.totalTokens, 0))}</td>
                      <td className="px-4 py-3 text-green-400 font-bold">{fmt(summaryRows.reduce((s, r) => s + r.paidAmount, 0))}</td>
                      <td className="px-4 py-3 text-red-400 font-bold">
                        {fmtTk(summaryRows.reduce((s, r) => s + Math.max(0, r.totalTokens - r.paidAmount), 0))}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {summaryRows.length === 0 && !fetchingEarnings && (
            <div className="text-center py-16 text-muted-foreground text-sm">
              Select a date range and click "Fetch All Earnings" to see the earnings summary.
            </div>
          )}
        </div>
      )}

      {/* ── PAYOUT RECORDS TAB ── */}
      {tab === 'records' && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-card border border-red-500/20 rounded-xl p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Unpaid</p>
              <p className="text-3xl font-bold text-red-400">{fmt(totalUnpaid)}</p>
              <p className="text-xs text-muted-foreground mt-1">{payouts.filter(p => p.status === 'unpaid').length} pending</p>
            </div>
            <div className="bg-card border border-green-500/20 rounded-xl p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Paid</p>
              <p className="text-3xl font-bold text-green-400">{fmt(totalPaid)}</p>
              <p className="text-xs text-muted-foreground mt-1">{payouts.filter(p => p.status === 'paid').length} completed</p>
            </div>
          </div>

          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or reference ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-card border-border text-foreground h-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-card border-border text-foreground h-9 w-36"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => setDialogOpen(true)} className="bg-primary text-primary-foreground h-9">
              <Plus className="h-4 w-4 mr-2" /> Add
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">No payouts found.</div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stage Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Reference ID</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3 text-foreground font-medium">{p.stageName}</td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(p.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-foreground font-semibold">{fmt(p.amount)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-0.5 rounded-full ${p.status === 'paid' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{p.status}</span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.referenceId || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {p.status === 'unpaid' && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-green-400" onClick={() => handleMarkPaid(p)}>
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-card border-border">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Payout</AlertDialogTitle>
                                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(p.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Payout Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>New Payout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Stage Name</Label>
              <Input value={form.stageName} onChange={e => setForm(p => ({ ...p, stageName: e.target.value }))} className="bg-secondary border-border text-foreground h-9 mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Amount ($)</Label>
                <Input type="number" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} className="bg-secondary border-border text-foreground h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="bg-secondary border-border text-foreground h-9 mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger className="bg-secondary border-border text-foreground h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Reference ID</Label>
                <Input value={form.referenceId} onChange={e => setForm(p => ({ ...p, referenceId: e.target.value }))} className="bg-secondary border-border text-foreground h-9 mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="bg-secondary border-border text-foreground min-h-[70px] mt-1" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-border">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}