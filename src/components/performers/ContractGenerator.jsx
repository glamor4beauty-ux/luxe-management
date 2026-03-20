import { useState } from 'react';
import { jsPDF } from 'jspdf';
import { FileText, Download, Mail, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from '@/api/base44Client';
import { toast } from "sonner";

function generateContractPDF(performer, payouts) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(20, 25, 40);
  doc.rect(0, 0, pageW, 35, 'F');
  doc.setTextColor(210, 165, 60);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('LUXE MANAGEMENT SYSTEMS', pageW / 2, 15, { align: 'center' });
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('PERFORMER CONTRACT & PAYMENT SUMMARY', pageW / 2, 25, { align: 'center' });

  doc.setTextColor(40, 40, 40);
  let y = 50;

  const section = (title) => {
    doc.setFillColor(240, 240, 245);
    doc.rect(14, y - 4, pageW - 28, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 120);
    doc.text(title.toUpperCase(), 16, y + 1);
    doc.setTextColor(40, 40, 40);
    y += 10;
  };

  const row = (label, value, indent = 16) => {
    if (!value && value !== 0) return;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(label + ':', indent, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), indent + 55, y);
    y += 7;
  };

  // Performer Info
  section('Performer Information');
  row('Full Name', `${performer.firstName || ''} ${performer.lastName || ''}`.trim());
  row('Stage Name', performer.stageName);
  row('Email', performer.email);
  row('Phone', performer.phone);
  row('Date of Birth', performer.dateOfBirth ? new Date(performer.dateOfBirth).toLocaleDateString() : null);
  row('Display Age', performer.displayAge);
  row('Primary Language', performer.primaryLanguage);
  y += 4;

  // Address
  if (performer.streetAddress || performer.city) {
    section('Address');
    row('Street', performer.streetAddress);
    row('City / State', [performer.city, performer.state].filter(Boolean).join(', '));
    row('Zip / Country', [performer.zipCode, performer.country].filter(Boolean).join(', '));
    y += 4;
  }

  // Management
  section('Management Details');
  row('Recruiter', performer.recruiterName);
  row('Applying For', performer.applyingFor);
  row('Permissions', performer.permissions);
  y += 4;

  // Physical
  section('Physical Profile');
  const physicals = [
    ['Height', performer.height], ['Weight', performer.weight],
    ['Build', performer.build], ['Ethnicity', performer.ethnicity],
    ['Eye Color', performer.eyeColor], ['Hair Color', performer.hairColor],
    ['Orientation', performer.orientation],
  ];
  physicals.forEach(([l, v]) => row(l, v));
  y += 4;

  // Payouts
  if (payouts.length > 0) {
    // New page if needed
    if (y > 220) { doc.addPage(); y = 20; }
    section('Payout Summary');

    const totalPaid = payouts.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0);
    const totalUnpaid = payouts.filter(p => p.status === 'unpaid').reduce((s, p) => s + (p.amount || 0), 0);

    row('Total Paid', `$${totalPaid.toFixed(2)}`);
    row('Total Unpaid', `$${totalUnpaid.toFixed(2)}`);
    row('Total Earnings', `$${(totalPaid + totalUnpaid).toFixed(2)}`);
    y += 4;

    // Table header
    doc.setFillColor(210, 165, 60);
    doc.rect(14, y, pageW - 28, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('Date', 16, y + 5);
    doc.text('Amount', 65, y + 5);
    doc.text('Status', 110, y + 5);
    doc.text('Reference', 145, y + 5);
    y += 10;
    doc.setTextColor(40, 40, 40);

    payouts.forEach((p, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      if (i % 2 === 0) {
        doc.setFillColor(248, 248, 248);
        doc.rect(14, y - 3, pageW - 28, 7, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(p.date ? new Date(p.date).toLocaleDateString() : '-', 16, y + 2);
      doc.text(`$${(p.amount || 0).toFixed(2)}`, 65, y + 2);
      doc.setTextColor(p.status === 'paid' ? 34 : 200, p.status === 'paid' ? 120 : 50, p.status === 'paid' ? 34 : 50);
      doc.text(p.status || '-', 110, y + 2);
      doc.setTextColor(40, 40, 40);
      doc.text(p.referenceId || '-', 145, y + 2);
      y += 7;
    });
  }

  // Signature block
  if (y > 230) { doc.addPage(); y = 20; }
  y += 10;
  doc.setDrawColor(180, 180, 180);
  doc.line(14, y, 90, y);
  doc.line(110, y, 186, y);
  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Performer Signature & Date', 14, y);
  doc.text('Management Signature & Date', 110, y);

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text(`Generated ${new Date().toLocaleString()} · Luxe Management Systems · Page ${i} of ${pageCount}`, pageW / 2, 290, { align: 'center' });
  }

  return doc;
}

export default function ContractGenerator({ performer, payouts = [] }) {
  const [open, setOpen] = useState(false);
  const [emailing, setEmailing] = useState(false);

  const handleDownload = () => {
    const doc = generateContractPDF(performer, payouts);
    doc.save(`contract_${performer.stageName || performer.lastName}_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success('Contract downloaded!');
  };

  const handleEmail = async () => {
    if (!performer.email) { toast.error('No email address on file for this performer.'); return; }
    setEmailing(true);
    toast.info('Preparing contract...');

    const doc = generateContractPDF(performer, payouts);
    const pdfBlob = doc.output('blob');
    const pdfFile = new File([pdfBlob], `contract_${performer.stageName}.pdf`, { type: 'application/pdf' });

    const { file_url } = await base44.integrations.Core.UploadFile({ file: pdfFile });

    await base44.integrations.Core.SendEmail({
      to: performer.email,
      subject: `Your Contract – Luxe Management Systems`,
      body: `Hi ${performer.firstName || performer.stageName},\n\nPlease find your contract and payment summary attached below.\n\nDownload your contract: ${file_url}\n\nIf you have any questions, please reach out to your manager.\n\nBest regards,\nLuxe Management Systems`,
    });

    toast.success(`Contract emailed to ${performer.email}`);
    setEmailing(false);
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="border-border"
      >
        <FileText className="h-4 w-4 mr-2" />
        Contract
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>Generate Contract</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Generate a PDF contract for <span className="text-foreground font-medium">{performer.firstName} {performer.lastName}</span> ({performer.stageName}) including their profile details and {payouts.length} payout record{payouts.length !== 1 ? 's' : ''}.
          </p>
          <div className="flex flex-col gap-2 mt-2">
            <Button onClick={handleDownload} className="bg-primary text-primary-foreground w-full">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              onClick={handleEmail}
              disabled={emailing || !performer.email}
              className="border-border w-full"
            >
              {emailing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
              {emailing ? 'Sending...' : `Email to ${performer.email || 'N/A'}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}