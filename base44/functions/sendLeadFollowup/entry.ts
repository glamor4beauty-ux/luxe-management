import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const SIGNED_TEMPLATE = (recruiterName, leadName) =>
`Hi ${leadName},

Congratulations and welcome to Luxe Model Collective! 🎉

My name is ${recruiterName} and I'm thrilled to have you on board. We're excited to get you started and support you every step of the way.

Next steps:
- Complete your registration at: https://luxemodelcollective.com/Registration-Studio.html
- Our team will be in touch shortly with onboarding details.

Feel free to reach out if you have any questions. We're here to help you succeed!

Warm regards,
${recruiterName}
Luxe Model Collective`;

const DECLINED_TEMPLATE = (recruiterName, leadName) =>
`Hi ${leadName},

Thank you for your time and for considering Luxe Model Collective.

We completely understand that this may not be the right fit right now, and we respect your decision. If circumstances change in the future, we'd love to hear from you again.

In the meantime, feel free to learn more about us at: https://luxemodelcollective.com/Registration-Studio.html

Wishing you all the best,
${recruiterName}
Luxe Model Collective`;

function buildRawEmail({ from, to, subject, body }) {
  const email = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Content-Type: text/plain; charset=utf-8`,
    ``,
    body
  ].join('\r\n');
  return btoa(unescape(encodeURIComponent(email)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data, old_data, changed_fields } = payload;

    // Only act on updates where results changed
    if (event?.type !== 'update') return Response.json({ status: 'skipped', reason: 'not an update' });
    if (!changed_fields?.includes('results')) return Response.json({ status: 'skipped', reason: 'results not changed' });

    const newResults = data?.results;
    if (newResults !== 'Signed' && newResults !== 'Declined') {
      return Response.json({ status: 'skipped', reason: 'not Signed or Declined' });
    }

    const leadEmail = data?.email;
    const leadName = data?.fullName || 'there';
    const recruiterName = data?.recruiter || 'Your Recruiter';

    if (!leadEmail) return Response.json({ status: 'skipped', reason: 'no lead email' });

    // Look up recruiter user to get their email for "From"
    const users = await base44.asServiceRole.entities.User.list();
    const recruiterUser = users.find(u => u.full_name === recruiterName);

    // Get Gmail access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    // Get sender email from Gmail profile
    const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const profile = await profileRes.json();
    const senderEmail = profile.emailAddress;

    const subject = newResults === 'Signed'
      ? `Welcome to Luxe Model Collective, ${leadName}!`
      : `Thank you for your time, ${leadName}`;

    const body = newResults === 'Signed'
      ? SIGNED_TEMPLATE(recruiterName, leadName)
      : DECLINED_TEMPLATE(recruiterName, leadName);

    const raw = buildRawEmail({
      from: `${recruiterName} <${senderEmail}>`,
      to: leadEmail,
      subject,
      body
    });

    const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw })
    });

    if (!sendRes.ok) {
      const err = await sendRes.text();
      console.error('Gmail send error:', err);
      return Response.json({ status: 'error', error: err }, { status: 500 });
    }

    console.log(`Follow-up email sent to ${leadEmail} for status: ${newResults}`);
    return Response.json({ status: 'sent', to: leadEmail, results: newResults });

  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});