import { Mail } from 'lucide-react';
import { Button } from "@/components/ui/button";

const TEMPLATES = (p) => [
  {
    label: 'Onboarding Welcome',
    subject: `Welcome to Luxe Management, ${p.stageName}!`,
    body: `Hi ${p.firstName},\n\nWelcome to Luxe Management Systems! We're thrilled to have you on board.\n\nHere's what to expect next:\n- Your profile has been set up under the stage name: ${p.stageName}\n- Our team will be reaching out shortly to walk you through the onboarding process\n- Please make sure your contact info and payment details are up to date\n\nIf you have any questions, don't hesitate to reach out.\n\nBest,\nLuxe Management Team`,
  },
  {
    label: 'Payment Reminder',
    subject: `Payment Reminder – ${p.stageName}`,
    body: `Hi ${p.firstName},\n\nThis is a friendly reminder that you have an outstanding payment on your account.\n\nPlease log in or contact your manager to review your payout details and ensure your payment information is current.\n\nIf you believe this is an error, please reach out to us as soon as possible.\n\nBest,\nLuxe Management Team`,
  },
  {
    label: 'Schedule Reminder',
    subject: `Upcoming Schedule – ${p.stageName}`,
    body: `Hi ${p.firstName},\n\nThis is a reminder about your upcoming scheduled sessions. Please check your calendar and confirm your availability.\n\nIf you need to make any changes to your schedule, please contact your manager at least 24 hours in advance.\n\nThank you,\nLuxe Management Team`,
  },
  {
    label: 'Document Request',
    subject: `Action Required: Documents Needed – ${p.stageName}`,
    body: `Hi ${p.firstName},\n\nWe are writing to let you know that we require updated documentation on file for your account.\n\nPlease submit the following at your earliest convenience:\n- Valid government-issued photo ID (front and back)\n- A photo of yourself holding your ID\n\nDocuments can be submitted directly through your profile or by replying to this email.\n\nThank you,\nLuxe Management Team`,
  },
  {
    label: 'Performance Check-In',
    subject: `Performance Check-In – ${p.stageName}`,
    body: `Hi ${p.firstName},\n\nWe wanted to check in and see how things are going. Your success is our priority and we're here to support you.\n\nFeel free to reach out if you have any questions, concerns, or need any assistance with your account.\n\nWe appreciate everything you do!\n\nWarm regards,\nLuxe Management Team`,
  },
];

export default function EmailTemplates({ performer }) {
  const templates = TEMPLATES(performer);

  const openEmail = (template) => {
    const mailto = `mailto:${performer.email}?subject=${encodeURIComponent(template.subject)}&body=${encodeURIComponent(template.body)}`;
    window.open(mailto, '_blank');
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Email Templates</h3>
      </div>
      {!performer.email && (
        <p className="text-sm text-muted-foreground">No email address on file for this performer.</p>
      )}
      {performer.email && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map((t) => (
            <button
              key={t.label}
              onClick={() => openEmail(t)}
              className="text-left bg-secondary/50 hover:bg-secondary border border-border hover:border-primary/30 rounded-lg p-4 transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{t.label}</span>
                <Mail className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{t.subject}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}