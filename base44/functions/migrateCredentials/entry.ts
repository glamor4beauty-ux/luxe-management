import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// One-time migration: copies all User records into UserCredentials entity
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await base44.asServiceRole.entities.User.list();
    const existing = await base44.asServiceRole.entities.UserCredentials.list();
    const existingEmails = new Set(existing.map(c => c.email?.toLowerCase()));

    let created = 0;
    let skipped = 0;

    for (const u of users) {
      if (!u.email) continue;
      if (existingEmails.has(u.email.toLowerCase())) {
        // Update existing record with latest data
        const cred = existing.find(c => c.email?.toLowerCase() === u.email.toLowerCase());
        await base44.asServiceRole.entities.UserCredentials.update(cred.id, {
          userId: u.id,
          email: u.email,
          password: u.password || '',
          role: u.role || 'user',
          stageName: u.stageName || '',
          full_name: u.full_name || '',
        });
        skipped++;
      } else {
        await base44.asServiceRole.entities.UserCredentials.create({
          userId: u.id,
          email: u.email,
          password: u.password || '',
          role: u.role || 'user',
          stageName: u.stageName || '',
          full_name: u.full_name || '',
        });
        created++;
      }
    }

    return Response.json({ success: true, created, updated: skipped, total: users.length });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});