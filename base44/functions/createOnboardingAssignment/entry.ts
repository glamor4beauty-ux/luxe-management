import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const performer = body.data;
    if (!performer || !performer.firstName) {
      return Response.json({ error: 'No performer data' }, { status: 400 });
    }

    // Only trigger for approved performers
    if (performer.approved === false) {
      return Response.json({ status: 'skipped', reason: 'not approved' });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_classroom');
    const authHeader = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // Get first available course
    const coursesRes = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
      headers: authHeader
    });

    if (!coursesRes.ok) {
      const err = await coursesRes.text();
      console.error('Failed to fetch courses:', err);
      return Response.json({ error: 'Failed to fetch courses' }, { status: 500 });
    }

    const coursesData = await coursesRes.json();
    const courses = coursesData.courses || [];

    if (courses.length === 0) {
      return Response.json({ status: 'skipped', reason: 'No active courses found in Google Classroom' });
    }

    const course = courses[0];

    // Due date: 7 days from now
    const due = new Date();
    due.setDate(due.getDate() + 7);

    const assignment = {
      title: `Onboarding: ${performer.firstName} ${performer.lastName} (@${performer.stageName || 'N/A'})`,
      description: `New performer onboarding checklist for ${performer.firstName} ${performer.lastName}.\n\nStage Name: ${performer.stageName || 'N/A'}\nEmail: ${performer.email}\nPhone: ${performer.phone || 'N/A'}\nRecruiter: ${performer.recruiterName || 'N/A'}\n\nTasks:\n- Complete ID verification\n- Profile photo review\n- Platform walkthrough\n- Schedule first shift\n- Review platform guidelines`,
      state: 'PUBLISHED',
      dueDate: { year: due.getFullYear(), month: due.getMonth() + 1, day: due.getDate() },
      dueTime: { hours: 23, minutes: 59 },
      workType: 'ASSIGNMENT',
      maxPoints: 100
    };

    const createRes = await fetch(`https://classroom.googleapis.com/v1/courses/${course.id}/courseWork`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify(assignment)
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      console.error('Failed to create assignment:', err);
      return Response.json({ error: 'Failed to create assignment', details: err }, { status: 500 });
    }

    const created = await createRes.json();
    console.log(`Created onboarding assignment for ${performer.firstName} ${performer.lastName} in course "${course.name}"`);

    return Response.json({ success: true, assignmentId: created.id, courseId: course.id, courseName: course.name });
  } catch (error) {
    console.error('Error creating onboarding assignment:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});