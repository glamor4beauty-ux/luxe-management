import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ success: false, error: 'Email and password required' }, { status: 400 });
    }

    const creds = await base44.asServiceRole.entities.UserCredentials.filter({ email });

    if (creds.length === 0) {
      return Response.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const cred = creds[0];

    if (cred.password !== password) {
      return Response.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    // If performer, check approval status
    if (cred.role === 'performer') {
      const performers = await base44.asServiceRole.entities.Performer.filter({ email });
      if (performers.length > 0 && performers[0].approved === false) {
        return Response.json({
          success: false,
          error: 'Your application is pending admin approval. You will be notified once approved.'
        }, { status: 403 });
      }
    }

    return Response.json({
      success: true,
      user: {
        id: cred.userId || cred.id,
        email: cred.email,
        full_name: cred.full_name,
        role: cred.role,
        stageName: cred.stageName || null
      }
    });
  } catch (error) {
    console.error(error);
    return Response.json({ success: false, error: 'Login failed' }, { status: 500 });
  }
});