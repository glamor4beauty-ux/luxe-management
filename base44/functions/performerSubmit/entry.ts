import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const base44 = createClientFromRequest(req);

  const body = await req.json();

  // Clean and map the data
  const performerData = {
    recruiterName: body.recruiterName || '',
    applyingFor: body.applyingFor || '',
    firstName: body.firstName || '',
    lastName: body.lastName || '',
    email: body.email || '',
    phone: body.phone || '',
    stageName: body.stageName || '',
    alternateUsernames: body.alternateUsernames || '',
    password: body.password || '',
    streetAddress: body.streetAddress || '',
    city: body.city || '',
    state: body.state || '',
    zipCode: body.zipCode || '',
    country: body.country || '',
    primaryLanguage: body.primaryLanguage || '',
    otherLanguage: body.otherLanguage || '',
    height: body.height || '',
    weight: body.weight || '',
    build: body.build || '',
    ethnicity: body.ethnicity || '',
    eyeColor: body.eyeColor || '',
    hairColor: body.hairColor || '',
    hairLength: body.hairLength || '',
    breastSize: body.breastSize || '',
    buttSize: body.buttSize || '',
    pubicHair: body.pubicHair || '',
    dressSize: body.dressSize || '',
    orientation: body.orientation || '',
    sexualPreferences: body.sexualPreferences || '',
    interestedIn: body.interestedIn || '',
    aboutMe: body.aboutMe || '',
    turnsOn: body.turnsOn || '',
    turnsOff: body.turnsOff || '',
    profilePhoto: body.profilePhoto || '',
    idFront: body.idFront || '',
    idBack: body.idBack || '',
    faceId: body.faceId || '',
  };

  if (body.dateOfBirth) {
    performerData.dateOfBirth = new Date(body.dateOfBirth).toISOString();
  }
  if (body.displayAge) {
    const age = parseInt(body.displayAge);
    if (!isNaN(age)) performerData.displayAge = age;
  }

  // Remove empty strings to keep data clean
  Object.keys(performerData).forEach(k => {
    if (performerData[k] === '') delete performerData[k];
  });

  const performer = await base44.asServiceRole.entities.Performer.create(performerData);

  return new Response(JSON.stringify({ success: true, id: performer.id }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
});