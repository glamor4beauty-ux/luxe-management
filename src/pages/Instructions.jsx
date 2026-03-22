import { useAuth } from '@/lib/AuthContext';
import { ShieldCheck, User, Calendar, Monitor, Upload, MessageSquare, BookOpen, DollarSign, ClipboardList, Users, GraduationCap, Bell, LogIn } from 'lucide-react';

const Section = ({ icon: Icon, title, children }) => (
  <div className="bg-card border border-border rounded-xl p-6">
    <div className="flex items-center gap-3 mb-4">
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
    </div>
    <div className="space-y-2">{children}</div>
  </div>
);

const Step = ({ num, text }) => (
  <div className="flex gap-3 items-start">
    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">{num}</span>
    <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
  </div>
);

const Tip = ({ text }) => (
  <div className="flex gap-2 items-start mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
    <span className="text-yellow-400 text-xs font-bold mt-0.5">TIP</span>
    <p className="text-xs text-yellow-300">{text}</p>
  </div>
);

function AdminInstructions() {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
        <p className="text-sm text-muted-foreground">This guide covers all major features of the LUXE Talent Systems admin panel. Use the sidebar to navigate between sections.</p>
      </div>

      <Section icon={Users} title="Performers — Managing Your Roster">
        <Step num="1" text="Go to Performers in the sidebar to view all registered performers." />
        <Step num="2" text="Use the search bar to find anyone by name, email, or stage name." />
        <Step num="3" text="Click the eye icon to view a full performer profile, or the pencil icon to edit their details." />
        <Step num="4" text="New applications show as 'Pending'. Click 'Pending — Approve' in the Status column to approve them. This triggers a welcome email and Google Classroom onboarding assignment automatically." />
        <Step num="5" text="Use Import to bulk-upload performers via CSV. Use Export to download the full roster." />
        <Tip text="Click 'Add Performer' for manual entry, or 'Add Performer (Manual)' from the Users page to create both a Performer record and a User account at once." />
      </Section>

      <Section icon={Calendar} title="Calendar — Managing Shifts">
        <Step num="1" text="Go to Calendar to view all scheduled shifts across all performers." />
        <Step num="2" text="Click 'Add Shift' to schedule a new shift. Enter the performer's stage name, start time, end time, and total hours." />
        <Step num="3" text="Performers receive an automatic email reminder 2 hours before their shift starts." />
        <Step num="4" text="Delete a shift using the trash icon next to any entry." />
        <Tip text="Make sure the stage name in the shift matches exactly the performer's stage name, as it's used for lookups and reminders." />
      </Section>

      <Section icon={Monitor} title="Stripchat — Profile Tracking">
        <Step num="1" text="Go to Stripchat to manage performer Stripchat profiles." />
        <Step num="2" text="Add a profile with their stage name, profile URL, and status." />
        <Step num="3" text="Use the Earnings Lookup tool to fetch real-time earnings for any date range." />
        <Step num="4" text="Update notes, status, and follower counts from the edit dialog." />
      </Section>

      <Section icon={DollarSign} title="Payouts — Tracking Earnings">
        <Step num="1" text="Go to Payouts to record and manage performer payments." />
        <Step num="2" text="Set your global commission rate in the Commission Settings panel." />
        <Step num="3" text="Use 'Calculate Earnings' to pull Stripchat data for a date range and auto-compute commissions." />
        <Step num="4" text="Manually add a payout record using 'Add Payout'. Set the status to Paid once processed." />
        <Step num="5" text="Mark all unpaid entries as paid at once with the 'Mark All Paid' button." />
      </Section>

      <Section icon={ClipboardList} title="Tasks — Assigning Work">
        <Step num="1" text="Go to Tasks to create and manage internal tasks for any team member." />
        <Step num="2" text="Click 'New Task' and fill in the title, assignee, priority, deadline, and notes." />
        <Step num="3" text="Update task status (Pending → In Progress → Completed) from the task list." />
        <Step num="4" text="Use the search and filter bar to view tasks by status or assignee." />
      </Section>

      <Section icon={GraduationCap} title="Google Classroom — Onboarding">
        <Step num="1" text="When you approve a performer, the system automatically creates an onboarding assignment in Google Classroom." />
        <Step num="2" text="Go to Performers → Classroom Guide tab for detailed setup instructions." />
        <Step num="3" text="Ensure your Google account connected here is the same one that owns the Classroom course." />
        <Tip text="The course must be Active (not Archived) for assignments to be created successfully." />
      </Section>

      <Section icon={Users} title="Users — Managing Accounts">
        <Step num="1" text="Go to Users to view all app accounts." />
        <Step num="2" text="Edit a user's name, email, password, or role directly in the table. A save button appears when changes are detected." />
        <Step num="3" text="Use 'Invite User' to send login credentials via email, or create a user manually with a set password." />
        <Step num="4" text="Roles: Admin has full access. Recruiter sees only their performers. Performer sees only their own dashboard." />
      </Section>

      <Section icon={Bell} title="Notifications">
        <Step num="1" text="When a new performer submits an application, you'll see a notification pop-up in the bottom-right corner." />
        <Step num="2" text="Click 'Approve' directly from the notification to approve them instantly, or 'View' to open their profile." />
      </Section>
    </div>
  );
}

function PerformerInstructions() {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
        <p className="text-sm text-muted-foreground">Welcome to LUXE Talent Systems! This guide will help you navigate your performer dashboard and get set up.</p>
      </div>

      <Section icon={LogIn} title="Getting Started — Logging In">
        <Step num="1" text="Open the app and enter the email and password provided to you by your manager." />
        <Step num="2" text="After logging in, you'll land on your personal dashboard showing your upcoming shifts, hours this week, and onboarding status." />
        <Tip text="If you forgot your password, contact your manager directly — there is no self-service reset." />
      </Section>

      <Section icon={User} title="Your Dashboard">
        <Step num="1" text="The dashboard shows your 3 stats at the top: upcoming shifts, hours worked this week, and your onboarding assignment link." />
        <Step num="2" text="Tap 'Open Assignment' to go directly to your Google Classroom onboarding task." />
        <Step num="3" text="Scroll down to see your upcoming shifts listed with date and time." />
        <Step num="4" text="Use the Quick Access tiles at the bottom to jump to any section of the app." />
      </Section>

      <Section icon={Calendar} title="Schedule — Your Shifts">
        <Step num="1" text="Tap 'Schedule' in the bottom navigation to see your full shift calendar." />
        <Step num="2" text="Your shifts are listed with start time, end time, and duration." />
        <Step num="3" text="To add a new shift, tap the + button, select your dates and times, then tap Save." />
        <Step num="4" text="You'll receive an automatic email reminder 2 hours before any scheduled shift." />
        <Tip text="Make sure your contact email is correct so you receive reminders. Contact your manager if you need to update it." />
      </Section>

      <Section icon={GraduationCap} title="Onboarding — Google Classroom">
        <Step num="1" text="After your application is approved, your manager will enroll you in Google Classroom." />
        <Step num="2" text="Check your email for an invitation from Google Classroom and click Accept." />
        <Step num="3" text="Visit classroom.google.com and open the LUXE Performer Onboarding course." />
        <Step num="4" text="Find your personalized assignment under the Classwork tab and complete each task." />
        <Step num="5" text="Once all tasks are done, click 'Turn In' to notify your manager." />
        <Tip text="Your onboarding assignment link is also shown directly on your dashboard — just tap 'Open Assignment'." />
      </Section>

      <Section icon={Monitor} title="Stripchat — Your Profile">
        <Step num="1" text="Tap 'Stripchat' in the bottom navigation to see your linked Stripchat account details." />
        <Step num="2" text="View your current status, follower count, and recent earnings." />
        <Step num="3" text="Use the Earnings Lookup to see your earnings for a specific time period." />
      </Section>

      <Section icon={Upload} title="Upload — Updating Your Photos">
        <Step num="1" text="Tap 'Upload' in the bottom navigation to manage your profile photos." />
        <Step num="2" text="You can upload or update: Profile Photo, ID Front, ID Back, and Face + ID." />
        <Step num="3" text="Tap 'Upload' next to any photo type and select an image from your device." />
        <Tip text="Make sure your ID photos are clear and unobstructed. Your account approval may depend on these." />
      </Section>

      <Section icon={BookOpen} title="Knowledge Base">
        <Step num="1" text="Tap 'Knowledge' in the bottom navigation to access the knowledge base." />
        <Step num="2" text="Upload documents or PDFs that you want to reference or search through." />
        <Step num="3" text="Use the search bar to ask questions — the AI will find answers from your uploaded documents." />
      </Section>

      <Section icon={MessageSquare} title="Support — Getting Help">
        <Step num="1" text="Tap 'Support' in the bottom navigation if you need assistance." />
        <Step num="2" text="You'll find contact details including email, phone, and SMS options." />
        <Step num="3" text="Reach out to your manager for account issues, scheduling changes, or any other concerns." />
      </Section>
    </div>
  );
}

export default function Instructions() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isRecruiter = user?.role === 'recruiter';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          {isAdmin || isRecruiter ? <ShieldCheck className="h-5 w-5 text-primary" /> : <User className="h-5 w-5 text-primary" />}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">How to Use This App</h1>
          <p className="text-sm text-muted-foreground">{isAdmin ? 'Admin Guide' : isRecruiter ? 'Recruiter Guide' : 'Performer Guide'}</p>
        </div>
      </div>

      {isAdmin || isRecruiter ? <AdminInstructions /> : <PerformerInstructions />}
    </div>
  );
}