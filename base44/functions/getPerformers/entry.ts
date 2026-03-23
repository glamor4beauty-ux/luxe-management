import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const performers = await base44.asServiceRole.entities.Performer.list('-created_date', 500);
    return Response.json({ success: true, performers });
  } catch (error) {
    console.error('getPerformers error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});