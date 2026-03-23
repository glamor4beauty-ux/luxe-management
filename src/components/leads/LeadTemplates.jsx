import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Mail, MessageSquare } from 'lucide-react';
import { toast } from "sonner";

const getTemplate = (recruiterName) => `Hello, my name is ${recruiterName} from Luxe Model Collective. Opportunities available, Webcam Model: Available Now
Latest technology to work from home including interactive toys. Make your studio quality videos, sexting.
Realistic earnings per week + tips, contests and gifts. Pay advances. Nudity

My,Club.
AI fan club. Become a creator, Creating & earning more made simple with beautiful tech. Earn from subscriptions, posts, media purchases

Sell Your Videos
Sell videos on our affiliates sites and clip sites

Administrator
Work from home. Manage model accounts, recruitment, insights, reports, co-producer. Webcam Model: Latest technology to work from home including Lovense. Make your studio quality video to sell.

Apply at: https://luxemodelcollective.com/Registration-Studio.html`;

const getSmsTemplate = (recruiterName) => `Hi, I'm ${recruiterName} from Luxe Model Collective. Exciting opportunities available — webcam modeling, content creation, clip sales & more. Work from home with the latest tech. Apply: https://luxemodelcollective.com/Registration-Studio.html`;

export default function LeadTemplates({ open, onClose, recruiterName }) {
  const [copied, setCopied] = useState(null);
  const [tab, setTab] = useState('email');

  const emailText = getTemplate(recruiterName || 'Your Recruiter');
  const smsText = getSmsTemplate(recruiterName || 'Your Recruiter');

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(`${type === 'email' ? 'Email' : 'SMS'} template copied!`);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle>Lead Outreach Templates</DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 bg-secondary rounded-lg p-1 w-fit mb-4">
          <button
            onClick={() => setTab('email')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === 'email' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Mail className="h-3.5 w-3.5" /> Email
          </button>
          <button
            onClick={() => setTab('sms')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === 'sms' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <MessageSquare className="h-3.5 w-3.5" /> SMS
          </button>
        </div>

        {tab === 'email' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Full email message</p>
              <Button size="sm" variant="outline" className="border-border h-7 text-xs" onClick={() => handleCopy(emailText, 'email')}>
                {copied === 'email' ? <Check className="h-3.5 w-3.5 mr-1 text-green-400" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                {copied === 'email' ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <pre className="bg-secondary/60 border border-border rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto font-sans">
              {emailText}
            </pre>
          </div>
        )}

        {tab === 'sms' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Short SMS message</p>
              <Button size="sm" variant="outline" className="border-border h-7 text-xs" onClick={() => handleCopy(smsText, 'sms')}>
                {copied === 'sms' ? <Check className="h-3.5 w-3.5 mr-1 text-green-400" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                {copied === 'sms' ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <pre className="bg-secondary/60 border border-border rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed font-sans">
              {smsText}
            </pre>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}