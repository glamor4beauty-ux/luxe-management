import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data, old_data, changed_fields } = payload;

    // Only act when assignedTo is set and changed (or newly created with assignedTo)
    const assignedTo = data?.assignedTo;
    if (!assignedTo) return Response.json({ status: 'skipped', reason: 'no assignee' });

    const isCreate = event?.type === 'create';
    const isUpdate = event?.type === 'update';

    if (isUpdate && !changed_fields?.includes('assignedTo')) {
      return Response.json({ status: 'skipped', reason: 'assignedTo not changed' });
    }

    // Look up recruiter user
    const users = await base44.asServiceRole.entities.User.list();
    const recruiter = users.find(u => u.email === assignedTo);
    if (!recruiter) return Response.json({ status: 'skipped', reason: 'assignee not found' });

    const taskTitle = data?.title || 'New Task';
    const taskPriority = data?.priority || 'medium';
    const taskDeadline = data?.deadline ? new Date(data.deadline).toLocaleDateString() : null;
    const taskNotes = data?.notes || '';

    // Store in-app notification
    await base44.asServiceRole.entities.Notification.create({
      recipientEmail: assignedTo,
      type: 'task_assigned',
      title: `New task assigned: ${taskTitle}`,
      message: `Priority: ${taskPriority}${taskDeadline ? ` · Due: ${taskDeadline}` : ''}${taskNotes ? `\nNotes: ${taskNotes}` : ''}`,
      entityId: data?.id || '',
      isRead: false
    });

    // Send email notification
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: assignedTo,
      subject: `📋 New Task Assigned: ${taskTitle}`,
      body: `Hi ${recruiter.full_name},

You have been assigned a new task in Luxe Talent Systems.

Task: ${taskTitle}
Priority: ${taskPriority.toUpperCase()}${taskDeadline ? `\nDeadline: ${taskDeadline}` : ''}${data?.description ? `\nDescription: ${data.description}` : ''}${taskNotes ? `\nNotes: ${taskNotes}` : ''}

Please log in to view and manage your tasks.

— Luxe Talent Systems`
    });

    console.log(`Task assignment notification sent to ${assignedTo}`);
    return Response.json({ status: 'sent', to: assignedTo });

  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});