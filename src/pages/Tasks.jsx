import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Trash2, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     icon: Clock,        color: 'text-yellow-400 bg-yellow-500/10' },
  in_progress: { label: 'In Progress', icon: AlertCircle,  color: 'text-blue-400 bg-blue-500/10' },
  completed:   { label: 'Completed',   icon: CheckCircle,  color: 'text-green-400 bg-green-500/10' },
  cancelled:   { label: 'Cancelled',   icon: XCircle,      color: 'text-muted-foreground bg-secondary' },
};

const PRIORITY_COLOR = {
  low:    'text-muted-foreground',
  medium: 'text-yellow-400',
  high:   'text-red-400',
};

const EMPTY_FORM = { title: '', description: '', performerStageName: '', assignedTo: '', deadline: '', status: 'pending', priority: 'medium', notes: '' };

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [performers, setPerformers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [t, p] = await Promise.all([
      base44.entities.Task.list('-created_date'),
      base44.entities.Performer.list(),
    ]);
    setTasks(t);
    setPerformers(p);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY_FORM); setEditId(null); setOpen(true); };
  const openEdit = (task) => {
    setForm({
      ...task,
      deadline: task.deadline ? task.deadline.slice(0, 16) : '',
    });
    setEditId(task.id);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.title) { toast.error('Title is required'); return; }
    setSaving(true);
    const payload = { ...form, deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined };
    const { id, created_date, updated_date, created_by, ...saveData } = payload;
    if (editId) {
      await base44.entities.Task.update(editId, saveData);
      toast.success('Task updated!');
    } else {
      await base44.entities.Task.create(saveData);
      toast.success('Task created!');
    }
    setSaving(false);
    setOpen(false);
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.Task.delete(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleStatusChange = async (task, status) => {
    await base44.entities.Task.update(task.id, { status });
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status } : t));
  };

  const filtered = tasks.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.title?.toLowerCase().includes(q) || t.performerStageName?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = Object.keys(STATUS_CONFIG).reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s).length;
    return acc;
  }, {});

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">{tasks.length} total tasks</p>
        </div>
        <Button size="sm" onClick={openNew} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" /> New Task
        </Button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
              className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left ${statusFilter === key ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-border/80'}`}
            >
              <Icon className={`h-4 w-4 ${cfg.color.split(' ')[0]}`} />
              <div>
                <p className="text-xs text-muted-foreground">{cfg.label}</p>
                <p className="text-lg font-bold text-foreground">{counts[key] || 0}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search tasks or performers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-card border-border h-9" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No tasks found.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => {
            const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
            const Icon = cfg.icon;
            const isOverdue = task.deadline && task.status !== 'completed' && task.status !== 'cancelled' && new Date(task.deadline) < new Date();
            return (
              <div key={task.id} className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:border-border/70 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground text-sm">{task.title}</span>
                    {task.priority && (
                      <span className={`text-xs font-semibold uppercase ${PRIORITY_COLOR[task.priority]}`}>{task.priority}</span>
                    )}
                    {isOverdue && <span className="text-xs text-red-400 font-medium">Overdue</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {task.performerStageName && <span className="text-xs text-primary">@{task.performerStageName}</span>}
                    {task.deadline && <span className="text-xs text-muted-foreground">Due {new Date(task.deadline).toLocaleDateString()}</span>}
                    {task.description && <span className="text-xs text-muted-foreground truncate max-w-xs">{task.description}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={task.status} onValueChange={val => handleStatusChange(task, val)}>
                    <SelectTrigger className={`h-7 text-xs px-2 border-0 rounded-full ${cfg.color}`}>
                      <Icon className="h-3 w-3 mr-1" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {Object.entries(STATUS_CONFIG).map(([key, c]) => (
                        <SelectItem key={key} value={key} className="text-xs">{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEdit(task)}>
                    <span className="text-xs">✎</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Task</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete "{task.title}".</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(task.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Task' : 'New Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs text-muted-foreground">Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-secondary border-border mt-1" placeholder="Task title" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary border-border mt-1" placeholder="Optional description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Performer</Label>
                <Select value={form.performerStageName} onValueChange={v => setForm(f => ({ ...f, performerStageName: v }))}>
                  <SelectTrigger className="bg-secondary border-border mt-1 h-9 text-sm">
                    <SelectValue placeholder="Select performer" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value={null}>— None —</SelectItem>
                    {performers.map(p => (
                      <SelectItem key={p.id} value={p.stageName}>{p.stageName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Deadline</Label>
                <Input type="datetime-local" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="bg-secondary border-border mt-1 h-9 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="bg-secondary border-border mt-1 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {Object.entries(STATUS_CONFIG).map(([key, c]) => (
                      <SelectItem key={key} value={key}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger className="bg-secondary border-border mt-1 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Notes</Label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="bg-secondary border-border mt-1" placeholder="Additional notes" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)} className="border-border">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
                {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}