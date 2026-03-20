import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Search, Save, Loader2, Pencil } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

const emptyForm = { stageName: '', profileUrl: '', status: 'pending', earnings: 0, followers: 0, notes: '' };

export default function StripchatPage() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Stripchat.list('-created_date');
    setProfiles(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditId(null); setForm({ ...emptyForm }); setDialogOpen(true); };
  const openEdit = (p) => { setEditId(p.id); setForm({ stageName: p.stageName || '', profileUrl: p.profileUrl || '', status: p.status || 'pending', earnings: p.earnings || 0, followers: p.followers || 0, notes: p.notes || '' }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.stageName) { toast.error("Stage Name is required"); return; }
    setSaving(true);
    if (editId) {
      await base44.entities.Stripchat.update(editId, form);
      toast.success("Profile updated!");
    } else {
      await base44.entities.Stripchat.create(form);
      toast.success("Profile created!");
    }
    setDialogOpen(false);
    setForm({ ...emptyForm });
    setEditId(null);
    setSaving(false);
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.Stripchat.delete(id);
    setProfiles(prev => prev.filter(p => p.id !== id));
  };

  const filtered = profiles.filter(p => {
    const q = search.toLowerCase();
    return !q || p.stageName?.toLowerCase().includes(q);
  });

  const statusBadge = (status) => {
    const styles = {
      active: 'bg-green-500/10 text-green-400',
      inactive: 'bg-red-500/10 text-red-400',
      pending: 'bg-yellow-500/10 text-yellow-400',
    };
    return <span className={`text-xs px-2.5 py-0.5 rounded-full ${styles[status] || styles.pending}`}>{status || 'pending'}</span>;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stripchat</h1>
          <p className="text-sm text-muted-foreground mt-1">{profiles.length} profiles</p>
        </div>
        <Button size="sm" onClick={openNew} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" /> Add Profile
        </Button>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by stage name..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-card border-border text-foreground h-9" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No profiles found.</div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stage Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">URL</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Followers</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Earnings</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 text-foreground font-medium">{p.stageName}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell truncate max-w-[200px]">
                      {p.profileUrl ? <a href={p.profileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{p.profileUrl}</a> : '-'}
                    </td>
                    <td className="px-4 py-3">{statusBadge(p.status)}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{p.followers || 0}</td>
                    <td className="px-4 py-3 text-primary font-medium hidden sm:table-cell">${p.earnings || 0}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-card border-border">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Profile</AlertDialogTitle>
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
            <DialogTitle>{editId ? 'Edit' : 'New'} Stripchat Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Stage Name</Label>
              <Input value={form.stageName} onChange={e => setForm(p => ({ ...p, stageName: e.target.value }))} className="bg-secondary border-border text-foreground h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Profile URL</Label>
              <Input value={form.profileUrl} onChange={e => setForm(p => ({ ...p, profileUrl: e.target.value }))} className="bg-secondary border-border text-foreground h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger className="bg-secondary border-border text-foreground h-9 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Followers</Label>
                <Input type="number" value={form.followers} onChange={e => setForm(p => ({ ...p, followers: Number(e.target.value) }))} className="bg-secondary border-border text-foreground h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Earnings ($)</Label>
                <Input type="number" value={form.earnings} onChange={e => setForm(p => ({ ...p, earnings: Number(e.target.value) }))} className="bg-secondary border-border text-foreground h-9 mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="bg-secondary border-border text-foreground min-h-[80px] mt-1" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-border">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {editId ? 'Update' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}