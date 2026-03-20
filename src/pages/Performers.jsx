import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Plus, Search, Eye, Pencil, Trash2, Phone, MessageSquare, Mail } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ImportExportBar from "../components/performers/ImportExportBar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

export default function Performers() {
  const { user } = useAuth();
  const [performers, setPerformers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [contactMode, setContactMode] = useState('phone'); // 'phone' or 'sms'
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [inviting, setInviting] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Performer.list('-created_date');
    const filtered = user?.role === 'recruiter' 
      ? data.filter(p => p.recruiterName === user.full_name)
      : data;
    setPerformers(filtered);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    await base44.entities.Performer.delete(id);
    setPerformers(prev => prev.filter(p => p.id !== id));
  };

  const filtered = performers.filter(p => {
    const q = search.toLowerCase();
    return !q || 
      (p.firstName?.toLowerCase().includes(q)) ||
      (p.lastName?.toLowerCase().includes(q)) ||
      (p.email?.toLowerCase().includes(q)) ||
      (p.stageName?.toLowerCase().includes(q));
  });

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

  const toggleUserSelect = (performerId) => {
    setSelectedUserIds(prev =>
      prev.includes(performerId)
        ? prev.filter(id => id !== performerId)
        : [...prev, performerId]
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Performers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {user?.role === 'recruiter' ? 'My Performers' : 'All Performers'} ({performers.length})
          </p>
          </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* SMS / Phone toggle */}
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            <button
              onClick={() => setContactMode('phone')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                contactMode === 'phone' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Phone className="h-3 w-3" /> Call
            </button>
            <button
              onClick={() => setContactMode('sms')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                contactMode === 'sms' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageSquare className="h-3 w-3" /> SMS
            </button>
          </div>
          {user?.role === 'admin' && (
            <>
              <ImportExportBar onImportComplete={load} />
              {selectedUserIds.length > 0 && (
                <Button
                  onClick={handleInviteSelected}
                  disabled={inviting}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {inviting ? 'Sending...' : `Invite Selected (${selectedUserIds.length})`}
                </Button>
              )}
              <Link to="/performers/new">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" /> Add Performer
                </Button>
              </Link>
            </>
          )}
          </div>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or stage name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-card border-border text-foreground h-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No performers found.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  {user?.role === 'admin' && (
                    <th className="px-4 py-3 w-12">
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={selectedUserIds.length > 0 && selectedUserIds.length === filtered.length}
                        onChange={(e) =>
                          setSelectedUserIds(e.target.checked ? filtered.map(p => p.id) : [])
                        }
                      />
                    </th>
                  )}
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Stage Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Phone</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    {user?.role === 'admin' && (
                      <td className="px-4 py-3 w-12">
                        <input
                          type="checkbox"
                          className="accent-primary"
                          checked={selectedUserIds.includes(p.id)}
                          onChange={() => toggleUserSelect(p.id)}
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.profilePhoto ? (
                          <img src={p.profilePhoto} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                            {(p.firstName?.[0] || '') + (p.lastName?.[0] || '')}
                          </div>
                        )}
                        <span className="font-medium text-foreground">{p.firstName} {p.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.stageName}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {p.email ? (
                        <a href={`mailto:${p.email}`} className="hover:text-primary transition-colors" onClick={e => e.stopPropagation()}>{p.email}</a>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {p.phone ? (
                        <a
                          href={contactMode === 'sms' ? `sms:${p.phone}` : `tel:${p.phone}`}
                          className="hover:text-primary transition-colors"
                          onClick={e => e.stopPropagation()}
                        >{p.phone}</a>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/performers/${p.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link to={`/performers/${p.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-card border-border">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Performer</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently delete {p.firstName} {p.lastName}.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(p.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
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