import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Plus, Trash2, Search, Save, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

export default function CalendarPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ stageName: '', startTime: '', endTime: '', totalHours: 0 });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      let data = await base44.entities.Calendar.list('-created_date', 500);
      if (user?.role === 'recruiter') {
        const myPerformers = await base44.entities.Performer.filter({ recruiterName: user.full_name });
        const stageNames = new Set(myPerformers.map(p => p.stageName));
        data = data.filter(e => stageNames.has(e.stageName));
      }
      setEvents(data);
    } catch (e) {
      console.error('Failed to load calendar:', e);
      toast.error('Failed to load calendar events');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.stageName || !form.startTime || !form.endTime) {
      toast.error("Stage Name, Start Time, and End Time are required");
      return;
    }
    setSaving(true);
    const start = new Date(form.startTime);
    const end = new Date(form.endTime);
    const hours = Math.round(((end - start) / 3600000) * 100) / 100;
    await base44.entities.Calendar.create({
      stageName: form.stageName,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      totalHours: hours > 0 ? hours : 0,
    });
    toast.success("Event created!");
    setDialogOpen(false);
    setForm({ stageName: '', startTime: '', endTime: '', totalHours: 0 });
    setSaving(false);
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.Calendar.delete(id);
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const filtered = events.filter(e => {
    const q = search.toLowerCase();
    return !q || e.stageName?.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">{events.length} scheduled events</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" /> Add Event
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
        <div className="text-center py-16 text-muted-foreground">No events found.</div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stage Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Start</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">End</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hours</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 text-foreground font-medium">{e.stageName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(e.startTime).toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(e.endTime).toLocaleString()}</td>
                    <td className="px-4 py-3"><span className="text-primary font-semibold">{e.totalHours}h</span></td>
                    <td className="px-4 py-3 text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Event</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(e.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
            <DialogTitle>New Calendar Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Stage Name</Label>
              <Input value={form.stageName} onChange={e => setForm(p => ({ ...p, stageName: e.target.value }))} className="bg-secondary border-border text-foreground h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Start Time</Label>
              <Input type="datetime-local" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} className="bg-secondary border-border text-foreground h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">End Time</Label>
              <Input type="datetime-local" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} className="bg-secondary border-border text-foreground h-9 mt-1" />
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