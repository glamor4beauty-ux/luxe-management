import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { TrendingUp, Loader2, Lock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function PerformerStripchatView() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [period, setPeriod] = useState('today');
  const [earnings, setEarnings] = useState(null);
  const [fetchingEarnings, setFetchingEarnings] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const u = await base44.auth.me();
      setUser(u);
      const profiles = await base44.entities.Stripchat.filter({ stageName: u.full_name });
      if (profiles.length > 0) {
        setProfile(profiles[0]);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleFetchEarnings = async () => {
    if (!profile) {
      toast.error('Stripchat profile not found');
      return;
    }

    setFetchingEarnings(true);
    const now = new Date();
    let startDate, endDate;

    if (period === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
    } else if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    try {
      const res = await base44.functions.invoke('stripchatEarnings', {
        modelUsername: profile.stageName,
        periodStart: startDate.toISOString().split('T')[0] + ' 00:00:00',
        periodEnd: endDate.toISOString().split('T')[0] + ' 23:59:59',
      });
      if (res.data?.error) {
        toast.error(res.data.error);
      } else {
        setEarnings(res.data);
      }
    } catch (e) {
      toast.error('Failed to fetch earnings');
    }
    setFetchingEarnings(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm font-medium">Stripchat account not linked</p>
        <p className="text-xs mt-1">Contact support to connect your account</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground">Stripchat</h2>
        <p className="text-xs text-muted-foreground">Your performance stats</p>
      </div>

      {/* Username (Locked) */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-muted-foreground">Username</label>
          <Lock className="h-3 w-3 text-muted-foreground" />
        </div>
        <p className="text-lg font-bold text-foreground">@{profile.stageName}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Status</p>
          <p className={`text-sm font-semibold ${profile.status === 'active' ? 'text-green-400' : profile.status === 'inactive' ? 'text-red-400' : 'text-yellow-400'}`}>
            {profile.status || 'pending'}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Followers</p>
          <p className="text-sm font-semibold text-primary">{profile.followers?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Earned (tk)</p>
          <p className="text-sm font-semibold text-primary">{profile.earnings?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Last Online</p>
          <p className="text-xs text-muted-foreground">{profile.lastOnline ? new Date(profile.lastOnline).toLocaleDateString() : 'N/A'}</p>
        </div>
      </div>

      {/* Period Earnings */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">Select Period</label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="bg-secondary border-border h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleFetchEarnings}
            disabled={fetchingEarnings}
            className="w-full bg-primary text-primary-foreground h-9 text-sm"
          >
            {fetchingEarnings ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TrendingUp className="h-4 w-4 mr-2" />}
            {fetchingEarnings ? 'Loading...' : 'Refresh Earnings'}
          </Button>

          {earnings && (
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Earnings</p>
              <p className="text-2xl font-bold text-primary">{(earnings.totalEarnings || 0).toLocaleString()} tk</p>
            </div>
          )}
        </div>
      </div>

      {profile.notes && (
        <div className="bg-secondary/30 rounded-lg p-4 text-xs">
          <p className="text-muted-foreground font-semibold mb-1">Notes</p>
          <p className="text-foreground">{profile.notes}</p>
        </div>
      )}
    </div>
  );
}