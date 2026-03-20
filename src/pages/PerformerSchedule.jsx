import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function PerformerSchedule() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // month, week, day
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [form, setForm] = useState({ startTime: '', endTime: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const u = await base44.auth.me();
      setUser(u);
      const cal = await base44.entities.Calendar.filter({ stageName: u.full_name });
      setEvents(cal);
    }
    load();
  }, []);

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setForm({ startTime: '', endTime: '' });
    setOpen(true);
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
    setOpen(false);
    const cal = await base44.entities.Calendar.filter({ stageName: user.full_name });
    setEvents(cal);
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const renderCalendar = () => {
    const days = [];
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateStr = date.toISOString().split('T')[0];
      const hasEvent = events.some(e => e.startTime?.split('T')[0] === dateStr);

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(date)}
          className={`p-2 text-sm rounded-lg border transition-colors ${
            hasEvent
              ? 'bg-primary/20 border-primary text-primary font-semibold'
              : 'border-border hover:bg-secondary'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const upcomingEvents = events
    .filter(e => new Date(e.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Schedule</h2>
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {['month', 'week', 'day'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                view === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {view === 'month' && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-1">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h3 className="text-sm font-semibold">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-1">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>
        </div>
      )}

      {upcomingEvents.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Upcoming Shifts</h3>
          <div className="space-y-2">
            {upcomingEvents.map(e => (
              <div key={e.id} className="flex justify-between items-center bg-secondary/50 p-3 rounded-lg text-sm">
                <div>
                  <p className="font-medium text-foreground">{new Date(e.startTime).toLocaleDateString()}</p>
                  <p className="text-xs text-muted-foreground">{new Date(e.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(e.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
                <span className="text-primary font-semibold">{e.totalHours}h</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Schedule Shift</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Date</Label>
              <Input value={selectedDate?.toLocaleDateString()} disabled className="bg-secondary border-border mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Start Time</Label>
                <Input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} className="bg-secondary border-border mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">End Time</Label>
                <Input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} className="bg-secondary border-border mt-1" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} className="border-border flex-1">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground flex-1">
                {saving ? 'Saving...' : 'Add Shift'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}