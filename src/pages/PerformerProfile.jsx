import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Save } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function PerformerProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    async function load() {
      const u = await base44.auth.me();
      setUser(u);
      setForm(u || {});
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = { full_name: form.full_name };
      for (const key in form) {
        if (key !== 'id' && key !== 'email' && key !== 'created_date' && form[key] !== user?.[key]) {
          updates[key] = form[key];
        }
      }
      await base44.auth.updateMe(updates);
      toast.success('Profile updated!');
    } catch (e) {
      toast.error('Failed to update profile');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">My Profile</h1>
        <p className="text-muted-foreground mb-6">Manage your account information</p>

        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Full Name</Label>
              <Input
                value={form.full_name || ''}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                className="bg-secondary border-border text-foreground h-9 mt-1"
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Email</Label>
              <Input
                value={form.email || ''}
                disabled
                className="bg-secondary border-border text-muted-foreground h-9 mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">Role</Label>
            <Input
              value={form.role || 'user'}
              disabled
              className="bg-secondary border-border text-muted-foreground h-9 mt-1"
            />
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-2">
            <Button variant="outline" className="border-border" onClick={() => setForm(user)}>
              Reset
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </div>

        <div className="mt-8 bg-secondary/30 border border-border rounded-xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Account Information</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Member since: {user?.created_date ? new Date(user.created_date).toLocaleDateString() : 'N/A'}</p>
            <p>Account Status: <span className="text-green-400">Active</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}