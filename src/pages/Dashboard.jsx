import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Users, FileText, Calendar, Monitor, ArrowRight } from 'lucide-react';

const StatCard = ({ icon: Icon, label, count, to, color }) => (
  <Link to={to} className="group bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-all duration-300">
    <div className="flex items-center justify-between mb-4">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
    <p className="text-3xl font-bold text-foreground">{count}</p>
    <p className="text-sm text-muted-foreground mt-1">{label}</p>
  </Link>
);

export default function Dashboard() {
  const [stats, setStats] = useState({ performers: 0, memos: 0, calendars: 0, stripchats: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [performers, memos, calendars, stripchats] = await Promise.all([
        base44.entities.Performer.list(),
        base44.entities.Memo.list(),
        base44.entities.Calendar.list(),
        base44.entities.Stripchat.list(),
      ]);
      setStats({
        performers: performers.length,
        memos: memos.length,
        calendars: calendars.length,
        stripchats: stripchats.length,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of your management system</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Performers" count={stats.performers} to="/performers" color="bg-primary/10 text-primary" />
        <StatCard icon={FileText} label="Memos" count={stats.memos} to="/memos" color="bg-chart-2/10 text-chart-2" />
        <StatCard icon={Calendar} label="Calendar Events" count={stats.calendars} to="/calendar" color="bg-chart-3/10 text-chart-3" />
        <StatCard icon={Monitor} label="Stripchat Profiles" count={stats.stripchats} to="/stripchat" color="bg-chart-4/10 text-chart-4" />
      </div>
    </div>
  );
}