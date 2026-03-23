import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entries = await base44.entities.KnowledgeBaseEntry.list('-created_date', 1000);

    return Response.json({ success: true, entries });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});