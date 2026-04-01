import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { submissions } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { checkBasicAuth } from '../../../lib/auth';

export const prerender = false;

const ALLOWED_STATUSES = ['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'] as const;

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

  let body: { id?: number; status?: string };
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

  if (!body.status || !(ALLOWED_STATUSES as readonly string[]).includes(body.status)) {
    return new Response(JSON.stringify({ error: 'Invalid status' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  db.update(submissions)
    .set({ leadStatus: body.status })
    .where(eq(submissions.id, body.id))
    .run();

  return new Response(JSON.stringify({ success: true, status: body.status }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
