import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin check
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userIds } = await req.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return Response.json({ error: 'userIds array required' }, { status: 400 });
    }

    let successCount = 0;
    const errors = [];

    for (const userId of userIds) {
      const userData = await base44.asServiceRole.entities.User.get(userId);

      if (!userData || !userData.email) {
        errors.push({ userId, error: 'User not found or missing email' });
        continue;
      }

      const loginUrl = `${Deno.env.get('APP_URL') || 'https://app.example.com'}/login`;
      const emailBody = `
Hi ${userData.full_name},

Your account has been created. Here are your login details:

Email: ${userData.email}
Password: ${userData.password || '[Password set by admin]'}

Login: ${loginUrl}

Once logged in, you can update your password and manage your profile.

Best regards,
Luxe Management
      `;

      await base44.integrations.Core.SendEmail({
        to: userData.email,
        subject: 'Your Luxe Management Account is Ready',
        body: emailBody,
        from_name: 'Luxe Management',
      });

      successCount++;
    }

    return Response.json({
      success: true,
      successCount,
      errors: errors.length > 0 ? errors : null,
    });
  } catch (error) {
    console.error('Error sending invites:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});