import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, CheckCircle, Clock, AlertCircle, XCircle, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     icon: Clock,       color: 'text-yellow-400 bg-yellow-500/10' },
  in_progress: { label: 'In Progress', icon: AlertCircle, color: 'text-blue-400 bg-blue-500/10' },
  completed:   { label: 'Completed',   icon: CheckCircle, color: 'text-green-400 bg-green-500/10' },
  cancelled:   { label: 'Cancelled',   icon: XCircle,     color: 'text-muted-foreground bg-secondary' },
};

const PRIORITY_COLOR = { low: 'text-muted-foreground', medium: 'text-yellow-400', high: 'text-red-400' };
const EMPTY_FORM = { title: '', description: '', deadline: '', status: 'pending', priority: 'medium', notes: '' };

export default function PerformerTasks({ performer }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const t = await base44.entities.Task.filter({ performerStageName: performer.stageName });
    setTasks(t);
    setLoading(false);
  };

  useEffect(() => { load(); }, [performer.stageName]);

  const handleSave = async () => {
    if (!form.title) { toast.error('Title is required'); return; }
    setSaving(true);
    await base44.entities.Task.create({
      ...form,
      performerStageName: performer.stageName,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
    });
    toast.success('Task added!');
    setSaving(false);
    setOpen(false);
    setForm(EMPTY_FORM);
    load();
  };

  const handleStatusChange = async (task, status) => {
    await base44.entities.Task.update(task.id, { status });
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status } : t));
  };

  const handleDelete = async (id) => {
    await base44.entities.Task.delete(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Tasks ({tasks.length})</h3>
        <Button size="sm" variant="outline" onClick={() => { setForm(EMPTY_FORM); setOpen(true); }} className="h-7 text-xs border-border">
          <Plus className="h-3 w-3 mr-1" /> Add Task
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tasks assigned.</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {tasks.map(task => {
            const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
            const Icon = cfg.icon;
            const isOverdue = task.deadline && task.status !== 'completed' && task.status !== 'cancelled' && new Date(task.deadline) < new Date();
            return (
              <div key={task.id} className="bg-secondary/50 rounded-lg p-3 flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{task.title}</span>
                    {task.priority && <span className={`text-xs font-semibold uppercase ${PRIORITY_COLOR[task.priority]}`}>{task.priority}</span>}
                    {isOverdue && <span className="text-xs text-red-400">Overdue</span>}
                  </div>
                  {task.deadline && <p className="text-xs text-muted-foreground mt-0.5">Due {new Date(task.deadline).toLocaleDateString()}</p>}
                  {task.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Select value={task.status} onValueChange={val => handleStatusChange(task, val)}>
                    <SelectTrigger className={`h-6 text-xs px-2 border-0 rounded-full ${cfg.color}`}>
                      <Icon className="h-3 w-3 mr-1" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {Object.entries(STATUS_CONFIG).map(([key, c]) => (
                        <SelectItem key={key} value={key} className="text-xs">{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(task.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Add Task for @{performer.stageName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs text-muted-foreground">Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-secondary border-border mt-1" placeholder="Task title" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary border-border mt-1" placeholder="Optional" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Deadline</Label>
                <Input type="datetime-local" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="bg-secondary border-border mt-1 h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger className="bg-secondary border-border mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setOpen(false)} className="border-border">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
                {saving ? 'Saving...' : 'Add Task'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}