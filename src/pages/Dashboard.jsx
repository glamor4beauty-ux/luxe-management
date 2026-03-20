import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Users, FileText, Calendar, Monitor, ArrowRight, DollarSign, CheckCircle, TrendingUp, Activity } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

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

const COLORS = ['hsl(42,80%,55%)', 'hsl(200,70%,50%)', 'hsl(160,60%,45%)', 'hsl(280,65%,60%)', 'hsl(340,75%,55%)'];

function getWeekLabel(date) {
  const d = new Date(date);
  const week = Math.floor((d - new Date(d.getFullYear(), 0, 1)) / 604800000);
  return `W${week + 1}`;
}

export default function Dashboard() {
  const [stats, setStats] = useState({ performers: 0, memos: 0, calendars: 0, stripchats: 0 });
  const [unpaidPayouts, setUnpaidPayouts] = useState([]);
  const [markingAll, setMarkingAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [signupData, setSignupData] = useState([]);
  const [platformData, setPlatformData] = useState([]);
  const [activePerformers, setActivePerformers] = useState(0);
  const [pendingTasks, setPendingTasks] = useState(0);

  const handleMarkAllPaid = async () => {
    setMarkingAll(true);
    await Promise.all(unpaidPayouts.map(p => base44.entities.Payout.update(p.id, { status: 'paid' })));
    setUnpaidPayouts([]);
    toast.success('All payouts marked as paid!');
    setMarkingAll(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const totalUnpaid = unpaidPayouts.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of your management system</p>
      </div>

      {/* Unpaid Payouts Banner */}
      {unpaidPayouts.length > 0 && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-red-400" />
            <div>
              <p className="text-sm font-semibold text-foreground">{unpaidPayouts.length} Unpaid Payout{unpaidPayouts.length !== 1 ? 's' : ''}</p>
              <p className="text-2xl font-bold text-red-400">${totalUnpaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} due</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/payouts">
              <Button variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10">View All</Button>
            </Link>
            <Button size="sm" onClick={handleMarkAllPaid} disabled={markingAll} className="bg-green-600 hover:bg-green-700 text-white">
              {markingAll ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</span> : <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Mark All Paid</span>}
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Performers" count={stats.performers} to="/performers" color="bg-primary/10 text-primary" />
        <StatCard icon={FileText} label="Memos" count={stats.memos} to="/memos" color="bg-chart-2/10 text-chart-2" />
        <StatCard icon={Calendar} label="Calendar Events" count={stats.calendars} to="/calendar" color="bg-chart-3/10 text-chart-3" />
        <StatCard icon={Monitor} label="Stripchat Profiles" count={stats.stripchats} to="/stripchat" color="bg-chart-4/10 text-chart-4" />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Activity className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Active Performers</p>
            <p className="text-3xl font-bold text-foreground">{activePerformers}</p>
            <p className="text-xs text-muted-foreground mt-0.5">With active Stripchat profile</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-yellow-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Open Tasks</p>
            <p className="text-3xl font-bold text-foreground">{pendingTasks}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Pending or in progress</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* Signups per week */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">New Performer Signups</h3>
          <p className="text-xs text-muted-foreground mb-4">Per week over the last 8 weeks</p>
          {signupData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={signupData} barSize={28}>
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'hsl(220 10% 55%)' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(220 10% 55%)' }} axisLine={false} tickLine={false} width={24} />
                <Tooltip
                  contentStyle={{ background: 'hsl(220 18% 10%)', border: '1px solid hsl(220 15% 18%)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'hsl(220 10% 92%)' }}
                  itemStyle={{ color: 'hsl(42 80% 55%)' }}
                />
                <Bar dataKey="signups" fill="hsl(42,80%,55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No signup data yet</div>
          )}
        </div>

        {/* Platform status breakdown */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">Stripchat Status</h3>
          <p className="text-xs text-muted-foreground mb-4">Profile breakdown by status</p>
          {platformData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={platformData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {platformData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'hsl(220 18% 10%)', border: '1px solid hsl(220 15% 18%)', borderRadius: 8, fontSize: 12 }}
                  itemStyle={{ color: 'hsl(220 10% 92%)' }}
                />
                <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 12, color: 'hsl(220 10% 55%)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No platform data yet</div>
          )}
        </div>
      </div>
    </div>
  );
}