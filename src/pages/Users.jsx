import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Mail, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [inviting, setInviting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'performer' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const data = await base44.entities.User.list();
    setUsers(data);
    setLoading(false);
  };

  const handleInviteSelected = async () => {
    if (selectedUserIds.length === 0) return;
    setInviting(true);
    try {
      await base44.functions.invoke('sendInvites', { userIds: selectedUserIds });
      toast.success(`Invites sent to ${selectedUserIds.length} user(s)`);
      setSelectedUserIds([]);
    } catch (e) {
      toast.error('Failed to send invites');
    }
    setInviting(false);
  };

  const toggleUserSelect = (userId) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSendInvite = async () => {
    if (!inviteForm.email) {
      toast.error('Email required');
      return;
    }
    try {
      await base44.users.inviteUser(inviteForm.email, inviteForm.role);
      toast.success('Invite sent');
      setDialogOpen(false);
      setInviteForm({ email: '', role: 'performer' });
    } catch (e) {
      toast.error('Failed to send invite');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage user accounts and send invites</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-primary text-primary-foreground">
          <Mail className="h-4 w-4 mr-2" /> Invite User
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} placeholder="user@example.com" className="bg-secondary border-border text-foreground h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Role</Label>
              <Select value={inviteForm.role} onValueChange={v => setInviteForm(f => ({ ...f, role: v }))}>
                <SelectTrigger className="bg-secondary border-border text-foreground h-9 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="recruiter">Recruiter</SelectItem>
                  <SelectItem value="performer">Performer</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-border">Cancel</Button>
              <Button onClick={handleSendInvite} className="bg-primary text-primary-foreground"><Mail className="h-4 w-4 mr-2" />Send Invite</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No users yet.</div>
      ) : (
        <div>
          {selectedUserIds.length > 0 && (
            <div className="mb-4">
              <Button onClick={handleInviteSelected} disabled={inviting} className="bg-green-600 hover:bg-green-700 text-white">
                <Mail className="h-4 w-4 mr-2" />
                {inviting ? 'Sending...' : `Send Invites (${selectedUserIds.length})`}
              </Button>
            </div>
          )}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="px-4 py-3 w-12">
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={selectedUserIds.length > 0 && selectedUserIds.length === users.length}
                        onChange={(e) => setSelectedUserIds(e.target.checked ? users.map(u => u.id) : [])}
                      />
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Real Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stage Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Password</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 w-12">
                        <input
                          type="checkbox"
                          className="accent-primary"
                          checked={selectedUserIds.includes(u.id)}
                          onChange={() => toggleUserSelect(u.id)}
                        />
                      </td>
                      <td className="px-4 py-3 text-foreground font-medium">{u.full_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{u.stageName || '-'}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{u.email}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{u.password ? '••••••••' : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}