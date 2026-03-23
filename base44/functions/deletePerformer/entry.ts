import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { id } = await req.json();
    if (!id) return Response.json({ success: false, error: 'id required' }, { status: 400 });
    await base44.asServiceRole.entities.Performer.delete(id);
    return Response.json({ success: true });
  } catch (error) {
    console.error('deletePerformer error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});