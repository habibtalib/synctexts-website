import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { submissions } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { checkBasicAuth } from '../../../lib/auth';
import { syncToHubSpot } from '../../../lib/hubspot';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!checkBasicAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Basic realm="Admin"',
      },
    });
  }

  let body: { id?: number };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body.id || typeof body.id !== 'number') {
    return new Response(JSON.stringify({ error: 'Missing or invalid id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const sub = db
    .select()
    .from(submissions)
    .where(eq(submissions.id, body.id))
    .get();

  if (!sub) {
    return new Response(JSON.stringify({ error: 'Submission not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await syncToHubSpot({
      submissionId: sub.id,
      name: sub.name,
      email: sub.email,
      company: sub.company,
      message: sub.message,
      serviceType: sub.serviceType,
      budget: sub.budget,
      timeline: sub.timeline,
      leadScore: sub.leadScore,
    });

    // Re-query to get the updated hubspot_id after sync
    const updated = db
      .select()
      .from(submissions)
      .where(eq(submissions.id, body.id))
      .get();

    return new Response(
      JSON.stringify({ success: true, hubspotId: updated?.hubspotId }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Manual HubSpot sync failed:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'Sync failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
