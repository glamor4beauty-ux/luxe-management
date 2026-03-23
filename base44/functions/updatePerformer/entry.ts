import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { id, data } = await req.json();
    if (!id) return Response.json({ success: false, error: 'id required' }, { status: 400 });
    const updated = await base44.asServiceRole.entities.Performer.update(id, data);
    return Response.json({ success: true, performer: updated });
  } catch (error) {
    console.error('updatePerformer error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});