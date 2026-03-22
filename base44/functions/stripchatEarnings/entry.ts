import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { modelUsername, periodType, periodStart, periodEnd } = await req.json();

    if (!modelUsername) return Response.json({ error: 'modelUsername is required' }, { status: 400 });

    const studioUsername = 'Luxe Model Collective';
    const apiKey = Deno.env.get('STRIPCHAT_API_KEY');

    const params = new URLSearchParams();
    if (periodType) params.set('periodType', periodType);
    if (periodStart) params.set('periodStart', periodStart);
    if (periodEnd) params.set('periodEnd', periodEnd);

    const url = `https://stripchat.com/api/stats/v2/studios/username/${encodeURIComponent(studioUsername)}/models/username/${encodeURIComponent(modelUsername)}?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        'API-Key': apiKey,
        'Accept': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ error: data.error || 'API error', details: data }, { status: response.status });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});