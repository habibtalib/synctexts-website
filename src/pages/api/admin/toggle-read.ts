import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { submissions } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

function checkBasicAuth(request: Request): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) return false;

  const decoded = atob(authHeader.slice(6));
  const [user, pass] = decoded.split(':');

  const expectedUser = import.meta.env.ADMIN_USER;
  const expectedPass = import.meta.env.ADMIN_PASS;

  if (!expectedUser || !expectedPass) return false;

  return user === expectedUser && pass === expectedPass;
}

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

  const current = db
    .select({ read: submissions.read })
    .from(submissions)
    .where(eq(submissions.id, body.id))
    .get();

  if (!current) {
    return new Response(JSON.stringify({ error: 'Submission not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const newRead = !current.read;

  db.update(submissions)
    .set({ read: newRead })
    .where(eq(submissions.id, body.id))
    .run();

  return new Response(JSON.stringify({ success: true, read: newRead }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
