import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

export default function PerformerShifts() {
  const [user, setUser] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ date: '', startTime: '', endTime: '' });

  useEffect(() => {
    async function load() {
      const u = await base44.auth.me();
      setUser(u);
      
      const events = await base44.entities.Calendar.filter({ stageName: u.full_name });
      setShifts(events.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)));
      setLoading(false);
    }
    load();
  }, []);

  const handleAddShift = async () => {
    if (!form.date || !form.startTime || !form.endTime) {
      toast.error('Please fill in all fields');
      return;
    }

    const start = new Date(`${form.date}T${form.startTime}`);
    const end = new Date(`${form.date}T${form.endTime}`);

    if (end <= start) {
      toast.error('End time must be after start time');
      return;
    }

    const totalHours = (end - start) / (1000 * 60 * 60);

    setSaving(true);
    await base44.entities.Calendar.create({
      stageName: user.full_name,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      totalHours: Math.round(totalHours * 100) / 100,
    });

    toast.success('Shift added!');
    setSaving(false);
    setDialogOpen(false);
    setForm({ date: '', startTime: '', endTime: '' });

    const events = await base44.entities.Calendar.filter({ stageName: user.full_name });
    setShifts(events.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)));
  };

  const handleDelete = async (id) => {
    await base44.entities.Calendar.delete(id);
    setShifts(prev => prev.filter(s => s.id !== id));
    toast.success('Shift deleted!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Schedule Your Shifts</h1>
            <p className="text-sm text-muted-foreground mt-1">Add, view, and manage your work schedule</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="bg-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-2" /> Add Shift
          </Button>
        </div>

        {/* Shifts List */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {shifts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-4">No shifts scheduled yet.</p>
              <p className="text-sm">Click "Add Shift" to create your first schedule.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Start Time</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">End Time</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Duration</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {shifts.map(shift => {
                    const isUpcoming = new Date(shift.startTime) > new Date();
                    const dateStr = new Date(shift.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    const startStr = new Date(shift.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                    const endStr = new Date(shift.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                    return (
                      <tr key={shift.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3 text-foreground font-medium">{dateStr}</td>
                        <td className="px-4 py-3 text-foreground">{startStr}</td>
                        <td className="px-4 py-3 text-foreground">{endStr}</td>
                        <td className="px-4 py-3 text-muted-foreground">{shift.totalHours}h</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-0.5 rounded-full ${isUpcoming ? 'bg-green-500/10 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                            {isUpcoming ? 'Upcoming' : 'Past'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Shift</AlertDialogTitle>
                                <AlertDialogDescription>This shift will be removed from your schedule.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(shift.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Shift Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Add a New Shift</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Date</Label>
              <Input
                type="date"
                min={today}
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="bg-secondary border-border text-foreground h-9 mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Start Time</Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                  className="bg-secondary border-border text-foreground h-9 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">End Time</Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                  className="bg-secondary border-border text-foreground h-9 mt-1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-border">Cancel</Button>
              <Button onClick={handleAddShift} disabled={saving} className="bg-primary text-primary-foreground">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Add Shift
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}