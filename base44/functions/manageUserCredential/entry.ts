import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { action, data, credId } = await req.json();

    if (action === 'list') {
      const creds = await base44.asServiceRole.entities.UserCredentials.list('-created_date', 200);
      return Response.json({ success: true, creds });
    }

    if (action === 'create') {
      // Check duplicate
      const existing = await base44.asServiceRole.entities.UserCredentials.filter({ email: data.email });
      if (existing.length > 0) {
        return Response.json({ success: false, error: 'A user with this email already exists' });
      }
      const created = await base44.asServiceRole.entities.UserCredentials.create(data);
      return Response.json({ success: true, cred: created });
    }

    if (action === 'update') {
      // Find by email if no credId
      let id = credId;
      if (!id) {
        const existing = await base44.asServiceRole.entities.UserCredentials.filter({ email: data.email });
        if (existing.length > 0) id = existing[0].id;
      }
      if (id) {
        await base44.asServiceRole.entities.UserCredentials.update(id, data);
      } else {
        await base44.asServiceRole.entities.UserCredentials.create(data);
      }
      return Response.json({ success: true });
    }

    return Response.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error(error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});