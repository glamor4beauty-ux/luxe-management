import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, TrendingUp, Clock, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

export default function PerformanceAnalytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [performers, setPerformers] = useState([]);
  const [selectedPerformer, setSelectedPerformer] = useState(null);
  const [earningsData, setEarningsData] = useState([]);
  const [shiftData, setShiftData] = useState([]);
  const [stats, setStats] = useState({ totalEarnings: 0, totalHours: 0, shiftCount: 0, avgEfficiency: 0 });
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (performers.length > 0 && !selectedPerformer) {
      setSelectedPerformer(isAdmin ? performers[0].stageName : user?.stageName);
    }
  }, [performers, isAdmin, user]);

  useEffect(() => {
    if (selectedPerformer) {
      processData(selectedPerformer);
    }
  }, [selectedPerformer]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allPerformers, allCalendar, allStripchat] = await Promise.all([
        base44.entities.Performer.list('-created_date'),
        base44.entities.Calendar.list('-created_date', 500),
        base44.entities.Stripchat.list('-created_date', 500)
      ]);

      let performerList = allPerformers;
      if (!isAdmin) {
        performerList = allPerformers.filter(p => p.stageName === user?.stageName);
      }
      setPerformers(performerList);
    } catch (e) {
      console.error('Failed to load data:', e);
    }
    setLoading(false);
  };

  const processData = async (stageName) => {
    try {
      const [calendarEvents, stripchatProfiles] = await Promise.all([
        base44.entities.Calendar.filter({ stageName }),
        base44.entities.Stripchat.filter({ stageName })
      ]);

      // Process earnings data by date
      const earningsByDate = {};
      stripchatProfiles.forEach(profile => {
        const date = new Date(profile.created_date).toLocaleDateString();
        if (!earningsByDate[date]) {
          earningsByDate[date] = 0;
        }
        earningsByDate[date] += profile.earnings || 0;
      });

      const earningsChartData = Object.entries(earningsByDate)
        .sort((a, b) => new Date(a[0]) - new Date(b[0]))
        .map(([date, earnings]) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          earnings: Math.round(earnings * 100) / 100
        }));

      // Process shift data by date
      const shiftsByDate = {};
      let totalHours = 0;
      calendarEvents.forEach(event => {
        const date = new Date(event.startTime).toLocaleDateString();
        if (!shiftsByDate[date]) {
          shiftsByDate[date] = { count: 0, hours: 0 };
        }
        shiftsByDate[date].count += 1;
        shiftsByDate[date].hours += event.totalHours || 0;
        totalHours += event.totalHours || 0;
      });

      const shiftChartData = Object.entries(shiftsByDate)
        .sort((a, b) => new Date(a[0]) - new Date(b[0]))
        .map(([date, data]) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          shifts: data.count,
          hours: Math.round(data.hours * 100) / 100,
          efficiency: data.count > 0 ? Math.round((data.hours / data.count) * 100) / 100 : 0
        }));

      const avgEfficiency = shiftChartData.length > 0
        ? Math.round((shiftChartData.reduce((sum, d) => sum + d.efficiency, 0) / shiftChartData.length) * 100) / 100
        : 0;

      const totalEarnings = earningsChartData.reduce((sum, d) => sum + d.earnings, 0);

      setEarningsData(earningsChartData);
      setShiftData(shiftChartData);
      setStats({
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        totalHours: Math.round(totalHours * 100) / 100,
        shiftCount: calendarEvents.length,
        avgEfficiency
      });
    } catch (e) {
      console.error('Failed to process data:', e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Performance Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Earnings trends and shift efficiency</p>
        </div>
        {isAdmin && performers.length > 0 && (
          <Select value={selectedPerformer || ''} onValueChange={setSelectedPerformer}>
            <SelectTrigger className="w-48 bg-card border-border h-9">
              <SelectValue placeholder="Select performer" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {performers.map(p => (
                <SelectItem key={p.id} value={p.stageName}>
                  {p.stageName} ({p.firstName} {p.lastName})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Total Earnings</p>
          </div>
          <p className="text-2xl font-bold text-foreground">${stats.totalEarnings.toFixed(2)}</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Total Hours</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.totalHours}h</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Shifts</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.shiftCount}</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Avg Hours/Shift</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.avgEfficiency}h</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Trend */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-lg font-semibold text-foreground mb-4">Earnings Trend</h2>
          {earningsData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <p>No earnings data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={earningsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
                <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend />
                <Line type="monotone" dataKey="earnings" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Shift Efficiency */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-lg font-semibold text-foreground mb-4">Hours per Shift</h2>
          {shiftData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <p>No shift data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={shiftData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
                <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend />
                <Bar dataKey="efficiency" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Activity Summary */}
      {shiftData.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-lg font-semibold text-foreground mb-4">Activity Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Shifts</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Hours</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Avg Hours/Shift</th>
                </tr>
              </thead>
              <tbody>
                {shiftData.map((row, idx) => (
                  <tr key={idx} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="px-4 py-2 text-foreground">{row.date}</td>
                    <td className="px-4 py-2 text-foreground">{row.shifts}</td>
                    <td className="px-4 py-2 text-foreground">{row.hours}h</td>
                    <td className="px-4 py-2 text-primary font-medium">{row.efficiency}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}