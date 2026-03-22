import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { DollarSign, Clock, CheckCircle, ListTodo, TrendingUp } from 'lucide-react';

const statusColors = {
  completed: 'bg-green-500/10 text-green-400',
  in_progress: 'bg-blue-500/10 text-blue-400',
  pending: 'bg-yellow-500/10 text-yellow-400',
  cancelled: 'bg-muted/50 text-muted-foreground',
};

export default function MyPerformance() {
  const { user } = useAuth();
  const [payouts, setPayouts] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    const load = async () => {
      setLoading(true);
      const stageName = user.stageName;
      const [p, s, t] = await Promise.all([
        stageName ? base44.entities.Payout.filter({ stageName }) : Promise.resolve([]),
        stageName ? base44.entities.Calendar.filter({ stageName }) : Promise.resolve([]),
        base44.entities.Task.filter({ assignedTo: user.email }),
      ]);
      setPayouts(p);
      setShifts(s);
      setTasks(t);
      setLoading(false);
    };
    load();
  }, [user]);

  const totalEarnings = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);
  const paidEarnings = payouts.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalHours = shifts.reduce((sum, s) => sum + (s.totalHours || 0), 0);
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Performance</h1>
        {user?.stageName && (
          <p className="text-sm text-muted-foreground mt-1">@{user.stageName}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <DollarSign className="h-4 w-4 text-primary mb-2" />
          <p className="text-xl font-bold text-foreground">${paidEarnings.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Paid Earnings</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <TrendingUp className="h-4 w-4 text-yellow-400 mb-2" />
          <p className="text-xl font-bold text-foreground">${totalEarnings.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Total Earnings</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <Clock className="h-4 w-4 text-blue-400 mb-2" />
          <p className="text-xl font-bold text-foreground">{totalHours.toFixed(1)}h</p>
          <p className="text-xs text-muted-foreground">Hours Worked</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <CheckCircle className="h-4 w-4 text-green-400 mb-2" />
          <p className="text-xl font-bold text-foreground">{completedTasks}/{tasks.length}</p>
          <p className="text-xs text-muted-foreground">Tasks Done</p>
        </div>
      </div>

      {/* Recent Payouts */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">Recent Payouts</h2>
        {payouts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No payouts yet.</p>
        ) : (
          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            {payouts.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">${p.amount?.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(p.date).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.status === 'paid' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tasks */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">My Tasks</h2>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No tasks assigned.</p>
        ) : (
          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            {tasks.map(t => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{t.title}</p>
                  {t.deadline && (
                    <p className="text-xs text-muted-foreground">Due {new Date(t.deadline).toLocaleDateString()}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[t.status] || ''}`}>
                  {t.status?.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}