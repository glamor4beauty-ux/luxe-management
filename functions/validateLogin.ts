import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ success: false, error: 'Email and password required' }, { status: 400 });
    }

    // Fetch user from User entity
    const users = await base44.asServiceRole.entities.User.filter({ email });
    
    if (users.length === 0) {
      return Response.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const user = users[0];

    // Simple password check (in production, use bcrypt or similar)
    if (user.password !== password) {
      return Response.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    return Response.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        stageName: user.stageName || null
      }
    });
  } catch (error) {
    console.error(error);
    return Response.json({ success: false, error: 'Login failed' }, { status: 500 });
  }
});