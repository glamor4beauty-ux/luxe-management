import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const ADMIN_EMAIL = 'glamor4beauty@gmail.com';
const APP_URL = 'https://app.base44.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { data } = await req.json();

    if (!data || !data.email || !data.firstName || !data.lastName) {
      return Response.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    // 1. Mark performer as pending approval
    if (data.id) {
      await base44.asServiceRole.entities.Performer.update(data.id, { approved: false });
    }

    // 2. Create User record
    const user = await base44.asServiceRole.entities.User.create({
      email: data.email,
      full_name: `${data.firstName} ${data.lastName}`,
      role: 'performer',
      stageName: data.stageName || '',
      password: data.password || '',
    });

    const loginUrl = `${APP_URL}/auth`;

    // 3. Send welcome email to performer
    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'LUXE Management Systems',
      to: data.email,
      subject: 'Welcome to LUXE Management Systems – Application Received',
      body: `Hi ${data.firstName},

Welcome to LUXE Management Systems! 🎉

Your application has been received and is currently under review. We are waiting for admin approval before your account is fully activated.

⚠️ TIME-SENSITIVE: Please check your email for ID verification instructions. Failure to complete ID verification promptly may delay or affect your application.

─────────────────────────
YOUR LOGIN CREDENTIALS
─────────────────────────
Name:     ${data.firstName} ${data.lastName}
Email:    ${data.email}
Password: ${data.password || '(set during registration)'}

Login URL: ${loginUrl}

Login Instructions:
1. Visit the login URL above
2. Enter your email and password
3. You will be directed to your performer dashboard once approved

─────────────────────────

Once your application is approved by our admin team, you will have full access to your performer portal including your schedule, earnings, and profile.

If you have any questions, reply to this email or contact support.

Warm regards,
LUXE Management Systems Team`
    });

    // 4. Send submission summary to admin
    const fields = [
      ['First Name', data.firstName],
      ['Last Name', data.lastName],
      ['Stage Name', data.stageName],
      ['Email', data.email],
      ['Phone', data.phone],
      ['Date of Birth', data.dateOfBirth],
      ['Display Age', data.displayAge],
      ['Street Address', data.streetAddress],
      ['City', data.city],
      ['State', data.state],
      ['Zip Code', data.zipCode],
      ['Country', data.country],
      ['Height', data.height],
      ['Weight', data.weight],
      ['Build', data.build],
      ['Ethnicity', data.ethnicity],
      ['Eye Color', data.eyeColor],
      ['Hair Color', data.hairColor],
      ['Hair Length', data.hairLength],
      ['Breast Size', data.breastSize],
      ['Butt Size', data.buttSize],
      ['Dress Size', data.dressSize],
      ['Pubic Hair', data.pubicHair],
      ['Orientation', data.orientation],
      ['Sexual Preferences', data.sexualPreferences],
      ['Interested In', data.interestedIn],
      ['Primary Language', data.primaryLanguage],
      ['Other Language', data.otherLanguage],
      ['Recruiter', data.recruiterName],
      ['Applying For', data.applyingFor],
      ['About Me', data.aboutMe],
      ['Turns On', data.turnsOn],
      ['Turns Off', data.turnsOff],
      ['Permissions', data.permissions],
    ];

    const fieldList = fields
      .filter(([_, val]) => val !== undefined && val !== null && val !== '')
      .map(([label, val]) => `• ${label}: ${val}`)
      .join('\n');

    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'LUXE Management Systems',
      to: ADMIN_EMAIL,
      subject: `New Performer Application: ${data.firstName} ${data.lastName} (@${data.stageName})`,
      body: `A new performer application has been submitted and is PENDING YOUR APPROVAL.

─────────────────────────
SUBMISSION DETAILS
─────────────────────────
${fieldList}

─────────────────────────

Profile Photo: ${data.profilePhoto || 'Not uploaded'}
ID Front: ${data.idFront || 'Not uploaded'}
ID Back: ${data.idBack || 'Not uploaded'}
Face + ID: ${data.faceId || 'Not uploaded'}

─────────────────────────
Submitted on: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}

ACTION REQUIRED: Log in to the admin panel and approve or reject this application from the Performers section.`
    });

    return Response.json({ success: true, userId: user.id });
  } catch (error) {
    console.error('Error creating user from performer:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});