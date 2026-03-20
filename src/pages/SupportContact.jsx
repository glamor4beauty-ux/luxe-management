import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Mail, Phone, MessageSquare } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function SupportContact() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function load() {
      const u = await base44.auth.me();
      setUser(u);
    }
    load();
  }, []);

  const supportEmail = 'support@luxemanagement.com';
  const supportPhone = '+1 (555) 123-4567';

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground">Support</h2>
        <p className="text-xs text-muted-foreground">Get help from our team</p>
      </div>

      {/* Contact Methods */}
      <div className="space-y-3">
        {/* Email */}
        <a href={`mailto:${supportEmail}?subject=Support Request from ${user?.full_name || 'Performer'}`} className="block">
          <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-3">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Email Support</p>
                <p className="text-xs text-muted-foreground break-all">{supportEmail}</p>
              </div>
              <span className="text-primary text-xs font-medium">Open</span>
            </div>
          </div>
        </a>

        {/* Phone */}
        <a href={`tel:${supportPhone}`} className="block">
          <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-3">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Call Support</p>
                <p className="text-xs text-muted-foreground">{supportPhone}</p>
              </div>
              <span className="text-primary text-xs font-medium">Call</span>
            </div>
          </div>
        </a>

        {/* SMS */}
        <a href={`sms:${supportPhone}`} className="block">
          <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-3">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Text Support</p>
                <p className="text-xs text-muted-foreground">{supportPhone}</p>
              </div>
              <span className="text-primary text-xs font-medium">Text</span>
            </div>
          </div>
        </a>
      </div>

      {/* FAQ Preview */}
      <div className="bg-secondary/30 border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">Common Questions</h3>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li>• How do I schedule shifts?</li>
          <li>• When do I get paid?</li>
          <li>• How do I upload photos?</li>
          <li>• How do I check my earnings?</li>
        </ul>
        <p className="text-xs text-muted-foreground mt-3">Email us for more help!</p>
      </div>
    </div>
  );
}