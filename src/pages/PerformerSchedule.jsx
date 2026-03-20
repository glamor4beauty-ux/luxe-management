import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, Plus, X, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function PerformerSchedule() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [form, setForm] = useState({ startTime: '', endTime: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const u = await base44.auth.me();
      setUser(u);
      const cal = await base44.entities.Calendar.filter({ stageName: u.full_name });
      setEvents(cal);
      setLoading(false);
    }
    load();
  }, []);

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setForm({ startTime: '', endTime: '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.startTime || !form.endTime) {
      toast.error('Both times required');
      return;
    }
    setSaving(true);
    const start = new Date(selectedDate);
    const [sh, sm] = form.startTime.split(':');
    start.setHours(parseInt(sh), parseInt(sm));

    const end = new Date(selectedDate);
    const [eh, em] = form.endTime.split(':');
    end.setHours(parseInt(eh), parseInt(em));

    const hours = (end - start) / (1000 * 60 * 60);
    if (hours <= 0) {
      toast.error('End time must be after start time');
      setSaving(false);
      return;
    }

    await base44.entities.Calendar.create({
      stageName: user.full_name,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      totalHours: hours,
    });
    toast.success('Shift added!');
    setSaving(false);
    setDialogOpen(false);
    setForm({ startTime: '', endTime: '' });
    const cal = await base44.entities.Calendar.filter({ stageName: user.full_name });
    setEvents(cal);
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const hasEventOnDate = (day) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
    return events.some(e => e.startTime?.split('T')[0] === dateStr);
  };

  const renderCalendar = () => {
    const days = [];
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const hasEvent = hasEventOnDate(day);

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(date)}
          className={`p-2 text-sm rounded-lg border transition-colors font-medium ${
            hasEvent
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border hover:bg-secondary'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Schedule</h2>
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {['month', 'week', 'day'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                view === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              {v === 'month' ? 'Month' : v === 'week' ? 'Week' : 'Day'}
            </button>
          ))}
        </div>
      </div>

      {view === 'month' && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-1 hover:bg-secondary rounded">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h3 className="text-sm font-semibold text-foreground">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-1 hover:bg-secondary rounded">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-3">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {renderCalendar()}
          </div>

          <Button onClick={() => handleDateClick(new Date())} className="w-full mt-4 bg-primary text-primary-foreground h-9 text-sm">
            <Plus className="h-4 w-4 mr-2" /> Add Shift
          </Button>
        </div>
      )}

      {events.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Scheduled Shifts</h3>
          <div className="space-y-2">
            {events.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)).map(e => (
              <div key={e.id} className="flex justify-between items-center bg-secondary/50 p-3 rounded-lg text-sm">
                <div>
                  <p className="font-medium text-foreground">{new Date(e.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  <p className="text-xs text-muted-foreground">{new Date(e.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(e.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
                <span className="text-primary font-semibold">{e.totalHours}h</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>Schedule a Shift</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Date</Label>
              <Input value={selectedDate?.toLocaleDateString() || ''} disabled className="bg-secondary border-border mt-1 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Start</Label>
                <Input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} className="bg-secondary border-border mt-1 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">End</Label>
                <Input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} className="bg-secondary border-border mt-1 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-border flex-1 h-9">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground flex-1 h-9">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                {saving ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}