import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (!data || !data.stageName) {
      return Response.json({ error: 'Missing shift data' }, { status: 400 });
    }

    // Find performer by stage name
    const performers = await base44.asServiceRole.entities.Performer.filter({ stageName: data.stageName });
    if (performers.length === 0) {
      return Response.json({ error: 'Performer not found' }, { status: 404 });
    }

    const performer = performers[0];
    if (!performer.email) {
      return Response.json({ error: 'Performer email not found' }, { status: 400 });
    }

    const startTime = new Date(data.startTime);
    const subject = `Shift ${event?.type === 'update' ? 'Updated' : 'Scheduled'}: ${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    const body = `Hi ${performer.firstName || performer.stageName},\n\nYour shift has been ${event?.type === 'update' ? 'updated' : 'scheduled'}:\n\nDate: ${startTime.toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})}\nTime: ${startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(data.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\nDuration: ${data.totalHours} hours\n\nLog in to view your full schedule.`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: performer.email,
      subject,
      body,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});