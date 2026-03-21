import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Mail, Loader2, Save, UserPlus } from 'lucide-react';
import ManualPerformerDialog from '../components/ManualPerformerDialog';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [inviting, setInviting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'performer' });
  const [addForm, setAddForm] = useState({ full_name: '', email: '', password: '', role: 'performer' });
  const [editingData, setEditingData] = useState({});
  const [manualDialogOpen, setManualDialogOpen] = useState(false);

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

  const handleEditChange = (userId, field, value) => {
    setEditingData(prev => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: value }
    }));
  };

  const handleSaveUser = async (userId) => {
    const data = editingData[userId];
    if (!data) return;
    try {
      await base44.asServiceRole.entities.User.update(userId, data);
      toast.success('User updated');
      setEditingData(prev => ({ ...prev, [userId]: undefined }));
      loadUsers();
    } catch (e) {
      toast.error('Failed to update user');
    }
  };

  const isUserEdited = (userId) => {
    const data = editingData[userId];
    if (!data) return false;
    const user = users.find(u => u.id === userId);
    return data.full_name !== user?.full_name || data.email !== user?.email || data.password !== user?.password || data.stageName !== user?.stageName || data.role !== user?.role;
  };

  const handleAddUser = async () => {
    if (!addForm.full_name || !addForm.email || !addForm.password) {
      toast.error('All fields required');
      return;
    }
    try {
      await base44.asServiceRole.entities.User.create({
        full_name: addForm.full_name,
        email: addForm.email,
        password: addForm.password,
        role: addForm.role
      });
      toast.success('User added');
      setAddDialogOpen(false);
      setAddForm({ full_name: '', email: '', password: '', role: 'performer' });
      loadUsers();
    } catch (e) {
      toast.error('Failed to add user');
    }
  };

  const handleSendInvite = async () => {
    if (!inviteForm.email) {
      toast.error('Email required');
      return;
    }
    try {
      const password = Math.random().toString(36).slice(-8);
      await base44.integrations.Core.SendEmail({
        to: inviteForm.email,
        subject: 'Welcome to LUXE Management Systems - Your Login Credentials',
        body: `Welcome to LUXE Management Systems!\n\nHere are your login details:\n\nEmail: ${inviteForm.email}\nPassword: ${password}\nRole: ${inviteForm.role}\n\nPlease log in at the app and change your password immediately.\n\nIf you have any questions, contact support.`
      });
      toast.success('Invite email sent with password');
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
          <p className="text-sm text-muted-foreground mt-1">Manage user accounts</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setManualDialogOpen(true)} variant="outline" className="border-border">
            <UserPlus className="h-4 w-4 mr-2" /> Add Performer
          </Button>
          <Button onClick={() => setAddDialogOpen(true)} className="bg-primary text-primary-foreground">
            Add User
          </Button>
          <Button onClick={() => setDialogOpen(true)} variant="outline" className="border-border">
            <Mail className="h-4 w-4 mr-2" /> Invite User
          </Button>
        </div>
      </div>

      <ManualPerformerDialog open={manualDialogOpen} onOpenChange={setManualDialogOpen} onSuccess={loadUsers} />

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Full Name</Label>
              <Input 
                value={addForm.full_name} 
                onChange={e => setAddForm(f => ({ ...f, full_name: e.target.value }))} 
                placeholder="John Doe" 
                className="bg-secondary border-border text-foreground h-9 mt-1" 
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input 
                value={addForm.email} 
                onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} 
                placeholder="user@example.com" 
                className="bg-secondary border-border text-foreground h-9 mt-1" 
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Password</Label>
              <Input 
                value={addForm.password} 
                onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} 
                placeholder="Set password" 
                type="password" 
                className="bg-secondary border-border text-foreground h-9 mt-1" 
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Role</Label>
              <Select value={addForm.role} onValueChange={v => setAddForm(f => ({ ...f, role: v }))}>
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
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)} className="border-border">Cancel</Button>
              <Button onClick={handleAddUser} className="bg-primary text-primary-foreground">Add User</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input 
                value={inviteForm.email} 
                onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} 
                placeholder="user@example.com" 
                className="bg-secondary border-border text-foreground h-9 mt-1" 
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Role</Label>
              <Select value={inviteForm.role} onValueChange={v => setInviteForm(f => ({ ...f, role: v }))}>
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
            <p className="text-xs text-muted-foreground bg-secondary/50 rounded p-2">An invite email with login instructions and a temporary password will be sent.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-border">Cancel</Button>
              <Button onClick={handleSendInvite} className="bg-primary text-primary-foreground">
                <Mail className="h-4 w-4 mr-2" />Send Invite
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
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
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
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
                      <td className="px-4 py-3">
                        <Input
                          value={editingData[u.id]?.full_name ?? u.full_name}
                          onChange={(e) => handleEditChange(u.id, 'full_name', e.target.value)}
                          className="h-8 text-xs bg-secondary border-border"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          value={editingData[u.id]?.stageName ?? u.stageName ?? ''}
                          onChange={(e) => handleEditChange(u.id, 'stageName', e.target.value)}
                          placeholder="Stage name"
                          className="h-8 text-xs bg-secondary border-border"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          value={editingData[u.id]?.email ?? u.email}
                          onChange={(e) => handleEditChange(u.id, 'email', e.target.value)}
                          className="h-8 text-xs bg-secondary border-border"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Input
                            type="text"
                            value={editingData[u.id]?.password ?? u.password ?? ''}
                            onChange={(e) => handleEditChange(u.id, 'password', e.target.value)}
                            placeholder="Set password"
                            className="h-8 text-xs bg-secondary border-border flex-1"
                          />
                          {isUserEdited(u.id) && (
                            <Button size="icon" className="h-8 w-8 bg-green-600 hover:bg-green-700" onClick={() => handleSaveUser(u.id)}>
                              <Save className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Select value={editingData[u.id]?.role ?? u.role} onValueChange={v => handleEditChange(u.id, 'role', v)}>
                          <SelectTrigger className="bg-secondary border-border text-foreground h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="recruiter">Recruiter</SelectItem>
                            <SelectItem value="performer">Performer</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
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