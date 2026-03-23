import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Plus, Trash2, Search, Save, Loader2, Upload } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const RESULTS = ['Open', 'Signed', 'Declined', 'No Response'];
const EMPTY_FORM = { recruiter: '', stageName: '', fullName: '', phone: '', email: '', instagramUrl: '', country: '', results: 'Open' };

const RESULTS_COLOR = {
  Open: 'bg-blue-500/10 text-blue-400',
  Signed: 'bg-green-500/10 text-green-400',
  Declined: 'bg-red-500/10 text-red-400',
  'No Response': 'bg-yellow-500/10 text-yellow-400',
};

export default function Leads() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isRecruiter = user?.role === 'recruiter';

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [resultsFilter, setResultsFilter] = useState('Open');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    let data = await base44.entities.Lead.list('-created_date', 1000);
    if (isRecruiter) {
      data = data.filter(l => l.recruiter === user.full_name);
    }
    setLeads(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const openNew = () => {
    setForm({ ...EMPTY_FORM, recruiter: isRecruiter ? user.full_name : '' });
    setEditId(null);
    setDialogOpen(true);
  };

  const openEdit = (lead) => {
    setForm({ ...EMPTY_FORM, ...lead });
    setEditId(lead.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.fullName || !form.recruiter) { toast.error('Recruiter and Full Name are required'); return; }
    setSaving(true);
    const { id, created_date, updated_date, created_by, ...saveData } = form;
    if (editId) {
      await base44.entities.Lead.update(editId, saveData);
      toast.success('Lead updated!');
    } else {
      await base44.entities.Lead.create(saveData);
      toast.success('Lead created!');
    }
    setSaving(false);
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.Lead.delete(id);
    setLeads(prev => prev.filter(l => l.id !== id));
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: 'object',
          properties: {
            leads: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  recruiter: { type: 'string' },
                  stageName: { type: 'string' },
                  fullName: { type: 'string' },
                  phone: { type: 'string' },
                  email: { type: 'string' },
                  instagramUrl: { type: 'string' },
                  country: { type: 'string' },
                  results: { type: 'string' }
                }
              }
            }
          }
        }
      });

      if (result.status === 'success') {
        const rows = Array.isArray(result.output) ? result.output : (result.output?.leads || []);
        let count = 0;
        for (const row of rows) {
          if (!row.fullName && !row.email) continue;
          await base44.entities.Lead.create({
            recruiter: row.recruiter || (isRecruiter ? user.full_name : ''),
            stageName: row.stageName || '',
            fullName: row.fullName || '',
            phone: row.phone || '',
            email: row.email || '',
            instagramUrl: row.instagramUrl || '',
            country: row.country || '',
            results: row.results || 'Open',
          });
          count++;
        }
        toast.success(`${count} lead(s) imported`);
        load();
      } else {
        toast.error('Failed to parse file');
      }
    } catch (e) {
      toast.error('Upload failed: ' + e.message);
    }
    setUploading(false);
    fileInputRef.current.value = '';
  };

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.fullName?.toLowerCase().includes(q) || l.stageName?.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q) || l.recruiter?.toLowerCase().includes(q);
    const matchResults = resultsFilter === 'all' || l.results === resultsFilter;
    return matchSearch && matchResults;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} leads</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="border-border">
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Import
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={e => handleFileUpload(e.target.files?.[0])} className="hidden" />
          <Button size="sm" onClick={openNew} className="bg-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-2" /> Add Lead
          </Button>
        </div>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-card border-border text-foreground h-9" />
        </div>
        <Select value={resultsFilter} onValueChange={setResultsFilter}>
          <SelectTrigger className="bg-card border-border h-9 w-40"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Results</SelectItem>
            {RESULTS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No leads found.</div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Full Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Stage Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden sm:table-cell">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Country</th>
                  {isAdmin && <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Recruiter</th>}
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Results</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(lead => (
                  <tr key={lead.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 text-foreground font-medium">{lead.fullName}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{lead.stageName || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{lead.email || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{lead.phone || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{lead.country || '—'}</td>
                    {isAdmin && <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{lead.recruiter || '—'}</td>}
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full ${RESULTS_COLOR[lead.results] || 'bg-secondary text-muted-foreground'}`}>
                        {lead.results || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground" onClick={() => openEdit(lead)}>
                          Edit
                        </Button>
                        {isAdmin && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(lead.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
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
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Lead' : 'New Lead'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Full Name *</Label>
                <Input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} className="bg-secondary border-border h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Stage Name</Label>
                <Input value={form.stageName} onChange={e => setForm(f => ({ ...f, stageName: e.target.value }))} className="bg-secondary border-border h-9 mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="bg-secondary border-border h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Phone</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="bg-secondary border-border h-9 mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Country</Label>
                <Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} className="bg-secondary border-border h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Instagram URL</Label>
                <Input value={form.instagramUrl} onChange={e => setForm(f => ({ ...f, instagramUrl: e.target.value }))} className="bg-secondary border-border h-9 mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Recruiter *</Label>
                <Input value={form.recruiter} onChange={e => setForm(f => ({ ...f, recruiter: e.target.value }))} className="bg-secondary border-border h-9 mt-1" disabled={isRecruiter} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Results</Label>
                <Select value={form.results} onValueChange={v => setForm(f => ({ ...f, results: v }))}>
                  <SelectTrigger className="bg-secondary border-border h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {RESULTS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-border">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {editId ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}