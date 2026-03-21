import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { performerData } = await req.json();

    if (!performerData?.email || !performerData?.firstName || !performerData?.lastName) {
      return Response.json({ error: 'firstName, lastName, and email are required' }, { status: 400 });
    }

    // Create Performer record — approved=true, manualEntry flag skips emails in automation
    const performer = await base44.asServiceRole.entities.Performer.create({
      ...performerData,
      approved: true,
      manualEntry: true,
    });

    // Create User record
    await base44.asServiceRole.entities.User.create({
      email: performerData.email,
      full_name: `${performerData.firstName} ${performerData.lastName}`,
      role: 'performer',
      stageName: performerData.stageName || '',
      password: performerData.password || '',
    });

    return Response.json({ success: true, performerId: performer.id });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});