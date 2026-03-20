import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Loader2, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [form, setForm] = useState({ email: '', role: 'user' });

  const handleInvite = async () => {
    if (!form.email) {
      toast.error('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast.error('Please enter a valid email');
      return;
    }

    setInviting(true);
    try {
      await base44.users.inviteUser(form.email, form.role);
      toast.success(`Invitation sent to ${form.email} as ${form.role}`);
      setForm({ email: '', role: 'user' });
      setDialogOpen(false);
    } catch (e) {
      toast.error(e.message || 'Failed to send invitation');
    }
    setInviting(false);
  };

  const roleLabels = {
    'admin': 'Admin',
    'recruiter': 'Recruiter',
    'performer': 'Performer',
    'user': 'User'
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage team members and invite new users</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" /> Invite User
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-3">How to invite users:</p>
            <ul className="text-sm text-muted-foreground space-y-2 ml-4">
              <li>1. Click "Invite User" button</li>
              <li>2. Enter their email address</li>
              <li>3. Select their role (Admin, Recruiter, Performer, or User)</li>
              <li>4. They'll receive an email to complete registration</li>
            </ul>
          </div>
          <div className="pt-4 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Role Permissions:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="bg-secondary/30 rounded-lg p-3">
                <p className="font-semibold text-foreground mb-1">Admin</p>
                <p className="text-muted-foreground">Full access to all features and user management</p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3">
                <p className="font-semibold text-foreground mb-1">Recruiter</p>
                <p className="text-muted-foreground">View and manage assigned performers</p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3">
                <p className="font-semibold text-foreground mb-1">Performer</p>
                <p className="text-muted-foreground">Access performer dashboard and schedule</p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3">
                <p className="font-semibold text-foreground mb-1">User</p>
                <p className="text-muted-foreground">Limited access to basic features</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">Email Address</Label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="bg-secondary border-border text-foreground h-9 mt-1"
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Role</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger className="bg-secondary border-border text-foreground h-9 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="recruiter">Recruiter</SelectItem>
                  <SelectItem value="performer">Performer</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-border">
                Cancel
              </Button>
              <Button onClick={handleInvite} disabled={inviting} className="bg-primary text-primary-foreground">
                {inviting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Send Invite
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}