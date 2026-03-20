import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { TrendingUp, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function PerformerStripchatView() {
  const [user, setUser] = useState(null);
  const [stripchatProfile, setStripchatProfile] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [period, setPeriod] = useState('today');
  const [loading, setLoading] = useState(true);
  const [fetchingEarnings, setFetchingEarnings] = useState(false);

  useEffect(() => {
    async function load() {
      const u = await base44.auth.me();
      setUser(u);
      const profiles = await base44.entities.Stripchat.filter({ stageName: u.full_name });
      if (profiles.length > 0) {
        setStripchatProfile(profiles[0]);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleFetchEarnings = async () => {
    if (!stripchatProfile) {
      toast.error('Stripchat profile not found');
      return;
    }

    setFetchingEarnings(true);
    try {
      const res = await base44.functions.invoke('stripchatEarnings', {
        modelUsername: stripchatProfile.stageName,
        periodStart: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0] + ' 00:00:00',
        periodEnd: new Date().toISOString().split('T')[0] + ' 23:59:59',
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
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!stripchatProfile) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No Stripchat profile set up yet.</p>
        <p className="text-xs mt-2">Contact support to link your account.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Stripchat Stats</h2>
        <p className="text-xs text-muted-foreground">@{stripchatProfile.stageName}</p>
      </div>

      {/* Profile Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Status</p>
          <p className={`text-sm font-semibold ${stripchatProfile.status === 'active' ? 'text-green-400' : 'text-muted-foreground'}`}>
            {stripchatProfile.status || 'offline'}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Followers</p>
          <p className="text-sm font-semibold text-primary">{stripchatProfile.followers || 0}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Earnings (tk)</p>
          <p className="text-sm font-semibold text-primary">{stripchatProfile.earnings || 0}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Last Online</p>
          <p className="text-xs text-muted-foreground">{stripchatProfile.lastOnline ? new Date(stripchatProfile.lastOnline).toLocaleDateString() : 'N/A'}</p>
        </div>
      </div>

      {/* Fetch Earnings */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Period Earnings</h3>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="bg-secondary border-border h-8 w-32 text-xs">
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
          className="w-full bg-primary text-primary-foreground h-8 text-xs"
        >
          {fetchingEarnings ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <TrendingUp className="h-3 w-3 mr-2" />}
          {fetchingEarnings ? 'Fetching...' : 'Refresh Earnings'}
        </Button>

        {earnings && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Total Earnings</p>
              <p className="text-2xl font-bold text-primary">{earnings.totalEarnings || 0} tk</p>
            </div>
          </div>
        )}
      </div>

      {stripchatProfile.notes && (
        <div className="bg-secondary/30 border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Notes</p>
          <p className="text-sm text-foreground">{stripchatProfile.notes}</p>
        </div>
      )}
    </div>
  );
}