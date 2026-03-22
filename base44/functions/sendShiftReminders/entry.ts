import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now = new Date();
    const windowStart = new Date(now.getTime() + (2 * 60 - 5) * 60 * 1000); // 1h55m from now
    const windowEnd = new Date(now.getTime() + (2 * 60 + 5) * 60 * 1000);   // 2h05m from now

    // Fetch all upcoming calendar events
    const events = await base44.asServiceRole.entities.Calendar.list();

    const upcoming = events.filter(e => {
      const start = new Date(e.startTime);
      return start >= windowStart && start <= windowEnd;
    });

    if (upcoming.length === 0) {
      console.log('No shifts starting in ~2 hours.');
      return Response.json({ status: 'ok', reminders: 0 });
    }

    // Fetch all performers to map stageName -> email
    const performers = await base44.asServiceRole.entities.Performer.list();
    const stageNameToPerformer = {};
    for (const p of performers) {
      if (p.stageName) stageNameToPerformer[p.stageName.toLowerCase()] = p;
    }

    let sent = 0;
    for (const event of upcoming) {
      const performer = stageNameToPerformer[event.stageName?.toLowerCase()];
      if (!performer?.email) {
        console.log(`No email found for stage name: ${event.stageName}`);
        continue;
      }

      const startTime = new Date(event.startTime);
      const endTime = new Date(event.endTime);

      const formatTime = (d) => d.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'LUXE Management Systems',
        to: performer.email,
        subject: `⏰ Reminder: Your shift starts in 2 hours`,
        body: `Hi ${performer.firstName || performer.stageName},

This is a friendly reminder that your shift is coming up in about 2 hours.

─────────────────────────
SHIFT DETAILS
─────────────────────────
Start: ${formatTime(startTime)}
End:   ${formatTime(endTime)}
${event.totalHours ? `Duration: ${event.totalHours} hours` : ''}

─────────────────────────

Please make sure you're prepared and on time. If you have any questions or need to make changes, contact your manager immediately.

See you soon!
LUXE Management Systems`
      });

      console.log(`Reminder sent to ${performer.email} for shift starting at ${event.startTime}`);
      sent++;
    }

    return Response.json({ status: 'ok', reminders: sent });
  } catch (error) {
    console.error('Error sending shift reminders:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});