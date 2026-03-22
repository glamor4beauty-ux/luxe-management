import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const base44 = createClientFromRequest(req);

    // 1. Decode Pub/Sub notification
    const decoded = JSON.parse(atob(body.data.message.data));
    const currentHistoryId = String(decoded.historyId);

    // 2. Get Gmail access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // 3. Load previous historyId from SyncState
    const existing = await base44.asServiceRole.entities.SyncState.filter({ key: 'gmail' });
    const syncRecord = existing.length > 0 ? existing[0] : null;

    if (!syncRecord) {
      await base44.asServiceRole.entities.SyncState.create({ key: 'gmail', history_id: currentHistoryId });
      return Response.json({ status: 'initialized' });
    }

    // 4. Fetch changes since last historyId
    const prevHistoryId = syncRecord.history_id;
    const historyRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${prevHistoryId}&historyTypes=messageAdded`,
      { headers: authHeader }
    );

    if (!historyRes.ok) {
      await base44.asServiceRole.entities.SyncState.update(syncRecord.id, { history_id: currentHistoryId });
      return Response.json({ status: 'history_error' });
    }

    const historyData = await historyRes.json();
    const messagesAdded = (historyData.history || []).flatMap(h => h.messagesAdded || []);

    for (const { message } of messagesAdded) {
      // Fetch full message
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=full`,
        { headers: authHeader }
      );
      if (!msgRes.ok) continue;
      const msg = await msgRes.json();

      const headers = msg.payload?.headers || [];
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const from = headers.find(h => h.name === 'From')?.value || '';

      // Only process approval-related emails
      const isApprovalEmail = /approv|application|performer/i.test(subject);
      if (!isApprovalEmail) continue;

      // Extract email address from From header
      const emailMatch = from.match(/<(.+?)>/) || from.match(/(\S+@\S+)/);
      const senderEmail = emailMatch?.[1] || from;

      // Get plain text body
      let body = '';
      const parts = msg.payload?.parts || [];
      const textPart = parts.find(p => p.mimeType === 'text/plain');
      if (textPart?.body?.data) {
        body = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      }

      // Look up performer by email and auto-approve
      const performers = await base44.asServiceRole.entities.Performer.filter({ email: senderEmail });
      if (performers.length > 0 && performers[0].approved === false) {
        await base44.asServiceRole.entities.Performer.update(performers[0].id, { approved: true });

        // Update User record too
        const users = await base44.asServiceRole.entities.User.filter({ email: senderEmail });
        console.log(`Auto-approved performer: ${senderEmail} based on email subject: "${subject}"`);
      } else {
        // Log for manual review even if no performer found
        console.log(`Approval email received from ${senderEmail}, subject: "${subject}" — no pending performer found.`);
      }
    }

    // 6. Update stored historyId
    await base44.asServiceRole.entities.SyncState.update(syncRecord.id, { history_id: currentHistoryId });

    return Response.json({ status: 'ok', processed: messagesAdded.length });
  } catch (error) {
    console.error('Gmail webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});