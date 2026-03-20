import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Search, Save, Loader2, CheckCircle } from 'lucide-react';
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

export default function Payouts() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Payout.list('-date');
    setPayouts(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.stageName || !form.amount || !form.date) {
      toast.error("Stage Name, Amount, and Date are required");
      return;
    }
    setSaving(true);
    await base44.entities.Payout.create({
      ...form,
      amount: parseFloat(form.amount),
      date: new Date(form.date).toISOString(),
    });
    toast.success("Payout created!");
    setDialogOpen(false);
    setForm({ ...emptyForm });
    setSaving(false);
    load();
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

  const totalUnpaid = payouts.filter(p => p.status === 'unpaid').reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPaid = payouts.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payouts</h1>
          <p className="text-sm text-muted-foreground mt-1">{payouts.length} total payout records</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" /> Add Payout
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-red-500/20 rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Unpaid</p>
          <p className="text-3xl font-bold text-red-400">${totalUnpaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-muted-foreground mt-1">{payouts.filter(p => p.status === 'unpaid').length} pending payouts</p>
        </div>
        <div className="bg-card border border-green-500/20 rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Paid</p>
          <p className="text-3xl font-bold text-green-400">${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-muted-foreground mt-1">{payouts.filter(p => p.status === 'paid').length} completed payouts</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or reference ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-card border-border text-foreground h-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="bg-card border-border text-foreground h-9 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
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
                    <td className="px-4 py-3 text-foreground font-semibold">${(p.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full ${p.status === 'paid' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.referenceId || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {p.status === 'unpaid' && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-green-400" onClick={() => handleMarkPaid(p)} title="Mark as Paid">
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
                  <SelectTrigger className="bg-secondary border-border text-foreground h-9 mt-1">
                    <SelectValue />
                  </SelectTrigger>
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