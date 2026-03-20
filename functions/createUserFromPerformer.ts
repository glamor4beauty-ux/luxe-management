import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (!data || !data.email || !data.firstName || !data.lastName) {
      return Response.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    // Create User record from Performer data
    const user = await base44.asServiceRole.entities.User.create({
      email: data.email,
      full_name: `${data.firstName} ${data.lastName}`,
      role: 'performer',
      stageName: data.stageName || '',
      password: data.password || '',
    });

    return Response.json({ success: true, userId: user.id });
  } catch (error) {
    console.error('Error creating user:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});