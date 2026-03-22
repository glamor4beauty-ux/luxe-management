import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Plus, Search, Eye, Pencil, Trash2, Phone, MessageSquare, Mail, GraduationCap, ShieldCheck, User } from 'lucide-react';
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
  const [contactMode, setContactMode] = useState('phone');
  const [activeTab, setActiveTab] = useState('roster');
  const isPerformer = user?.role === 'performer';

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Performer.list('-created_date');
    let filtered = data;
    if (user?.role === 'recruiter') {
      filtered = data.filter(p => p.recruiterName === user.full_name);
    } else if (isPerformer) {
      filtered = data.filter(p => p.stageName === user.stageName);
    }
    setPerformers(filtered);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    await base44.entities.Performer.delete(id);
    setPerformers(prev => prev.filter(p => p.id !== id));
  };

  const handleApprove = async (id) => {
    await base44.entities.Performer.update(id, { approved: true });
    setPerformers(prev => prev.map(p => p.id === id ? { ...p, approved: true } : p));
  };

  const filtered = performers.filter(p => {
    const q = search.toLowerCase();
    return !q || 
      (p.firstName?.toLowerCase().includes(q)) ||
      (p.lastName?.toLowerCase().includes(q)) ||
      (p.email?.toLowerCase().includes(q)) ||
      (p.stageName?.toLowerCase().includes(q));
  });



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
              <Link to="/performers/new">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" /> Add Performer
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-lg p-1 mb-6 w-fit">
        <button
          onClick={() => setActiveTab('roster')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'roster' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <User className="h-4 w-4" /> Roster
        </button>
        <button
          onClick={() => setActiveTab('classroom')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'classroom' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <GraduationCap className="h-4 w-4" /> Classroom Guide
        </button>
      </div>

      {activeTab === 'classroom' && <ClassroomGuide userRole={user?.role} />}

      {activeTab === 'roster' && (
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
      )}

      {activeTab === 'roster' && loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : activeTab === 'roster' && filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No performers found.</p>
        </div>
      ) : activeTab === 'roster' ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Stage Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
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
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {p.approved === false ? (
                        <button
                          onClick={() => handleApprove(p.id)}
                          className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 hover:bg-green-500/10 hover:text-green-400 transition-colors font-medium"
                        >Pending — Approve</button>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 font-medium">Approved</span>
                      )}
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
      ) : null}
    </div>
  );
}

function ClassroomGuide({ userRole }) {
  return (
    <div className="space-y-6">
      {/* Admin Section */}
      {userRole === 'admin' && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Admin — Google Classroom Setup</h2>
              <p className="text-xs text-muted-foreground">One-time setup required</p>
            </div>
          </div>
          <ol className="space-y-4">
            {[
              { step: '1', title: 'Go to Google Classroom', body: 'Visit classroom.google.com and sign in with the same Google account connected to this app.' },
              { step: '2', title: 'Create an Onboarding Course', body: 'Click the + button (top right) → "Create class". Name it something like LUXE Performer Onboarding. Leave other fields optional and click Create.' },
              { step: '3', title: 'Keep the Course Active', body: 'The course must remain Active (not Archived). The system automatically posts an onboarding assignment to this course every time a new performer is approved.' },
              { step: '4', title: 'Enroll Performers as Students (Optional)', body: 'To allow performers to see and complete assignments themselves: open the course → People tab → click the + icon under Students → enter the performer\'s email. Otherwise, assignments are visible only to you (the teacher) as an internal checklist.' },
              { step: '5', title: 'What Gets Created Automatically', body: 'When a performer is approved, the system creates a published assignment titled "Onboarding: [Name] (@StageName)" with their details and a 7-day due date. It includes tasks: ID verification, profile photo review, platform walkthrough, first shift scheduling, and guideline review.' },
            ].map(({ step, title, body }) => (
              <li key={step} className="flex gap-4">
                <span className="flex-shrink-0 h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{step}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-5 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-xs text-yellow-400"><strong>Note:</strong> The Google account used to authorize this app must be the one with the Classroom course — that's the account whose courses the system can access.</p>
          </div>
        </div>
      )}

      {/* Performer Section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Performer — How to Use Google Classroom</h2>
            <p className="text-xs text-muted-foreground">Share these instructions with new performers</p>
          </div>
        </div>
        <ol className="space-y-4">
          {[
            { step: '1', title: 'Wait for Admin Enrollment', body: 'After your application is approved, the admin will add you as a student to the LUXE Performer Onboarding Google Classroom course. You\'ll receive an email invitation from Google Classroom.' },
            { step: '2', title: 'Accept the Invitation', body: 'Open the email from Google Classroom and click "Join" or "Accept". You may be prompted to sign in or create a Google account if you don\'t have one.' },
            { step: '3', title: 'Go to Google Classroom', body: 'Visit classroom.google.com and sign in with the Google account you used to accept the invite. You\'ll see the LUXE Performer Onboarding course on your dashboard.' },
            { step: '4', title: 'Find Your Onboarding Assignment', body: 'Click on the course → go to the Classwork tab. You\'ll see an assignment with your name (e.g., "Onboarding: Jane Doe (@StageName)"). Click it to view the full checklist.' },
            { step: '5', title: 'Complete Each Onboarding Task', body: 'Your assignment includes: completing ID verification, uploading your profile photo, attending a platform walkthrough, scheduling your first shift, and reviewing platform guidelines. Mark tasks as done as you complete them.' },
            { step: '6', title: 'Turn In the Assignment', body: 'Once all tasks are complete, click "Turn In" on the assignment. This notifies the admin that your onboarding is finished.' },
          ].map(({ step, title, body }) => (
            <li key={step} className="flex gap-4">
              <span className="flex-shrink-0 h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{step}</span>
              <div>
                <p className="text-sm font-medium text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-5 p-3 bg-secondary/50 border border-border rounded-lg">
          <p className="text-xs text-muted-foreground"><strong className="text-foreground">Need help?</strong> Contact your manager or use the Support page in the app for assistance accessing Google Classroom.</p>
        </div>
      </div>
    </div>
  );
}