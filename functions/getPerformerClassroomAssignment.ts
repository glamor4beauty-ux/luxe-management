import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { stageName, firstName, lastName } = await req.json();

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_classroom');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    const coursesRes = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', { headers: authHeader });
    if (!coursesRes.ok) return Response.json({ assignment: null });

    const { courses = [] } = await coursesRes.json();
    if (courses.length === 0) return Response.json({ assignment: null });

    const searchTitle = `Onboarding: ${firstName} ${lastName}`.toLowerCase();

    for (const course of courses) {
      const cwRes = await fetch(`https://classroom.googleapis.com/v1/courses/${course.id}/courseWork`, { headers: authHeader });
      if (!cwRes.ok) continue;
      const { courseWork = [] } = await cwRes.json();

      const match = courseWork.find(cw => cw.title?.toLowerCase().includes(searchTitle) || cw.title?.toLowerCase().includes(stageName?.toLowerCase()));
      if (match) {
        return Response.json({
          assignment: {
            title: match.title,
            url: match.alternateLink,
            dueDate: match.dueDate,
            state: match.state,
            courseId: course.id,
            courseName: course.name,
          }
        });
      }
    }

    return Response.json({ assignment: null });
  } catch (error) {
    console.error('Error fetching classroom assignment:', error);
    return Response.json({ assignment: null });
  }
});