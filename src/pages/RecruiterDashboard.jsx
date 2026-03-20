import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Users, TrendingUp, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function RecruiterDashboard() {
  const [user, setUser] = useState(null);
  const [performers, setPerformers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const u = await base44.auth.me();
      setUser(u);

      const allPerformers = await base44.entities.Performer.list();
      const filtered = allPerformers.filter(p => p.recruiterName === u.full_name);
      setPerformers(filtered);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Recruiter Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {user?.full_name}! Manage your recruited performers.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Performers</p>
                <p className="text-3xl font-bold text-foreground">{performers.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary opacity-20" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Active</p>
                <p className="text-3xl font-bold text-green-400">
                  {performers.filter(p => p.permissions === 'active').length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400 opacity-20" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Pending</p>
                <p className="text-3xl font-bold text-yellow-400">
                  {performers.filter(p => p.permissions !== 'active').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400 opacity-20" />
            </div>
          </div>
        </div>

        {/* Performers List */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">My Performers</h2>
          </div>

          {performers.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="mb-4">No performers assigned yet.</p>
              <p className="text-sm">Once performers are added with your name as recruiter, they'll appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stage Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {performers.map(perf => (
                    <tr key={perf.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 text-foreground font-medium">{perf.firstName} {perf.lastName}</td>
                      <td className="px-4 py-3 text-primary font-semibold">@{perf.stageName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{perf.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full ${
                          perf.permissions === 'active'
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-yellow-500/10 text-yellow-400'
                        }`}>
                          {perf.permissions === 'active' ? 'Active' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/performers/${perf.id}`}>
                          <Button size="sm" variant="outline" className="border-border">View</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}