import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, Mail, Phone, MessageSquare } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SupportContact() {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!subject || !message) {
      toast.error('Please fill in all fields');
      return;
    }

    setSending(true);

    try {
      const user = await base44.auth.me();
      await base44.integrations.Core.SendEmail({
        to: 'support@luxemanagement.com',
        subject: `[${category.toUpperCase()}] ${subject} - from ${user.full_name}`,
        body: `From: ${user.full_name} (${user.email})\nCategory: ${category}\n\n${message}`,
      });

      toast.success('Support request sent! We\'ll be in touch soon.');
      setSubject('');
      setCategory('general');
      setMessage('');
    } catch (e) {
      toast.error('Failed to send message. Please try again.');
    }

    setSending(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">Contact Support</h1>
        <p className="text-muted-foreground mb-8">Have a question or need help? Reach out to our support team.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <MessageSquare className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">Live Chat</p>
            <p className="text-xs text-muted-foreground mt-1">Available 9am-6pm EST</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Mail className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">Email</p>
            <p className="text-xs text-muted-foreground mt-1">support@luxemanagement.com</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Phone className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">Phone</p>
            <p className="text-xs text-muted-foreground mt-1">+1 (555) 123-4567</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6">Send us a Message</h2>
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-secondary border-border text-foreground h-9 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="general">General Inquiry</SelectItem>
                  <SelectItem value="technical">Technical Issue</SelectItem>
                  <SelectItem value="payment">Payment & Earnings</SelectItem>
                  <SelectItem value="scheduling">Scheduling</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Subject</Label>
              <Input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Brief subject of your message"
                className="bg-secondary border-border text-foreground h-9 mt-1"
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Message</Label>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Tell us how we can help..."
                className="bg-secondary border-border text-foreground min-h-[150px] mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSubject('');
                  setCategory('general');
                  setMessage('');
                }}
                className="border-border"
              >
                Clear
              </Button>
              <Button onClick={handleSubmit} disabled={sending} className="bg-primary text-primary-foreground">
                {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                {sending ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-secondary/30 border border-border rounded-xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Frequently Asked Questions</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• How do I update my profile information?</li>
            <li>• When will I receive my earnings?</li>
            <li>• How do I schedule my shifts?</li>
            <li>• What should I do if I can't work a scheduled shift?</li>
            <li>Visit our <a href="/knowledge-base" className="text-primary hover:underline">Knowledge Base</a> for more answers</li>
          </ul>
        </div>
      </div>
    </div>
  );
}