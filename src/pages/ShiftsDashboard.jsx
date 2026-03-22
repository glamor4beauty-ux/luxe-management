import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Calendar, Clock, CheckCircle, AlertCircle, Timer } from 'lucide-react';

const getShiftStatus = (startTime, endTime) => {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (now < start) return 'upcoming';
  if (now >= start && now <= end) return 'active';
  return 'completed';
};

const statusConfig = {
  upcoming: { label: 'Upcoming', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Clock },
  active:   { label: 'Active Now', color: 'bg-green-500/10 text-green-400 border-green-500/20', icon: AlertCircle },
  completed:{ label: 'Completed', color: 'bg-muted/50 text-muted-foreground border-border', icon: CheckCircle },
};

const fmt = (iso) => new Date(iso).toLocaleString('en-US', {
  weekday: 'short', month: 'short', day: 'numeric',
  hour: 'numeric', minute: '2-digit', hour12: true
});

export default function ShiftsDashboard() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');

  useEffect(() => {
    if (!user?.stageName) { setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      const all = await base44.entities.Calendar.filter({ stageName: user.stageName });
      const sorted = all.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
      setShifts(sorted);
      setLoading(false);
    };
    load();
  }, [user]);

  const filtered = shifts.filter(s => {
    const status = getShiftStatus(s.startTime, s.endTime);
    if (filter === 'all') return true;
    return status === filter;
  });

  const upcomingCount = shifts.filter(s => getShiftStatus(s.startTime, s.endTime) === 'upcoming').length;
  const activeCount   = shifts.filter(s => getShiftStatus(s.startTime, s.endTime) === 'active').length;
  const totalHours    = shifts.reduce((acc, s) => acc + (s.totalHours || 0), 0);

  if (!user?.stageName) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No stage name associated with your account. Contact your manager.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Shifts</h1>
        <p className="text-sm text-muted-foreground mt-1">Showing shifts for <span className="text-primary font-medium">@{user.stageName}</span></p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Upcoming', value: upcomingCount, icon: Clock, color: 'text-blue-400' },
          { label: 'Active Now', value: activeCount, icon: AlertCircle, color: 'text-green-400' },
          { label: 'Total Hours', value: `${totalHours.toFixed(1)}h`, icon: Timer, color: 'text-primary' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1">
            <Icon className={`h-4 w-4 ${color}`} />
            <p className="text-xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-secondary rounded-lg p-1 mb-5 w-fit">
        {['upcoming', 'active', 'completed', 'all'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
              filter === tab ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Shift List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No {filter !== 'all' ? filter : ''} shifts found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(shift => {
            const status = getShiftStatus(shift.startTime, shift.endTime);
            const cfg = statusConfig[status];
            const Icon = cfg.icon;
            return (
              <div
                key={shift.id}
                className={`bg-card border rounded-xl p-4 flex items-start justify-between gap-4 ${
                  status === 'active' ? 'border-green-500/30' : 'border-border'
                }`}
              >
                <div className="flex gap-3 items-start flex-1">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{fmt(shift.startTime)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Until {fmt(shift.endTime)} &nbsp;·&nbsp;
                      <span className="text-primary font-medium">{shift.totalHours}h</span>
                    </p>
                  </div>
                </div>
                <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${cfg.color}`}>
                  <Icon className="h-3 w-3" />
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}