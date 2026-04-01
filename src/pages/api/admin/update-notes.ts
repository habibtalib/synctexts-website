import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { submissions } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { checkBasicAuth } from '../../../lib/auth';

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

  let body: { id?: number; notes?: string };
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

  // Allow empty string to clear notes; treat undefined as empty
  const notesValue = typeof body.notes === 'string' ? body.notes : '';

  db.update(submissions)
    .set({ notes: notesValue || null })
    .where(eq(submissions.id, body.id))
    .run();

  return new Response(JSON.stringify({ success: true, hasNote: !!notesValue }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
