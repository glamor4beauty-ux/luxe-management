import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { stageName } = await req.json();

    if (!stageName) {
      return Response.json({ error: 'stageName required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('STRIPCHAT_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Query Stripchat API
    const response = await fetch(`https://stripchat.com/api/users/search?query=${encodeURIComponent(stageName)}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      return Response.json({ 
        success: false, 
        message: 'No Account Found' 
      });
    }

    const data = await response.json();

    if (!data || !data.users || data.users.length === 0) {
      return Response.json({ 
        success: false, 
        message: 'No Account Found' 
      });
    }

    // Return first match
    const user_data = data.users[0];

    return Response.json({
      success: true,
      username: user_data.username,
      profileUrl: user_data.profile_url || '',
      followers: user_data.followers || 0,
      earnings: user_data.earnings || 0,
      status: user_data.status || 'pending'
    });
  } catch (error) {
    console.error('Stripchat lookup error:', error);
    return Response.json({ 
      success: false, 
      message: 'No Account Found'
    });
  }
});