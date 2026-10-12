import type { APIRoute } from 'astro';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { db } from '../../db';
import { submissions } from '../../db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export const prerender = false;

type CalPayload = {
  uid?: string;
  startTime?: string;
  attendees?: Array<{ email?: string; name?: string }>;
  // Present on BOOKING_RESCHEDULED — the uid of the booking being replaced.
  // Cal.com has used both names across versions.
  rescheduleUid?: string;
  fromReschedule?: string;
};

export const POST: APIRoute = async ({ request }) => {
  const rawBody = await request.text();

  // 1. Verify HMAC-SHA256 signature
  const secret = import.meta.env.CAL_WEBHOOK_SECRET;
  if (!secret) {
    console.error('CAL_WEBHOOK_SECRET not configured');
    return new Response(null, { status: 500 });
  }

  const sigHeader = request.headers.get('x-cal-signature-256') ?? '';
  const computed = createHmac('sha256', secret).update(rawBody).digest('hex');

  try {
    if (!timingSafeEqual(Buffer.from(sigHeader), Buffer.from(computed))) {
      return new Response(null, { status: 401 });
    }
  } catch {
    // Buffer lengths differ — signature mismatch
    return new Response(null, { status: 401 });
  }

  // 2. Parse payload
  let event: { triggerEvent?: string; payload?: CalPayload };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response(null, { status: 400 });
  }

  if (!event || typeof event !== 'object' || !event.payload || typeof event.payload !== 'object') {
    return new Response(null, { status: 400 });
  }

  const payload = event.payload;

  switch (event.triggerEvent) {
    case 'BOOKING_CREATED':
      return handleCreated(payload);
    case 'BOOKING_RESCHEDULED':
      return handleRescheduled(payload);
    case 'BOOKING_CANCELLED':
      return handleCancelled(payload);
    default:
      return new Response(null, { status: 200 });
  }
};

// Emails are stored lowercased, but older rows may not be — compare case-insensitively
function findLatestByEmail(email: string) {
  return db
    .select({ id: submissions.id })
    .from(submissions)
    .where(sql`lower(${submissions.email}) = ${email.trim().toLowerCase()}`)
    .orderBy(desc(submissions.id))
    .limit(1)
    .get();
}

function handleCreated(p: CalPayload): Response {
  const attendeeEmail = p.attendees?.[0]?.email;
  if (!attendeeEmail) {
    console.warn('Cal.com webhook: no attendee email in payload');
    return new Response(null, { status: 200 });
  }

  // Find most recent lead by email
  const existing = findLatestByEmail(attendeeEmail);
  if (!existing) {
    console.warn(`Cal.com webhook: no lead found for email ${attendeeEmail}`);
    return new Response(null, { status: 200 });
  }

  // Update lead record with booking data
  db.update(submissions)
    .set({ calBookingUid: p.uid ?? null, calScheduledAt: p.startTime ?? null })
    .where(eq(submissions.id, existing.id))
    .run();

  return new Response(null, { status: 200 });
}

function handleRescheduled(p: CalPayload): Response {
  const previousUid = p.rescheduleUid || p.fromReschedule;

  // Prefer the lead linked to the old booking; fall back to attendee email
  let target = previousUid
    ? db
        .select({ id: submissions.id })
        .from(submissions)
        .where(eq(submissions.calBookingUid, previousUid))
        .orderBy(desc(submissions.id))
        .limit(1)
        .get()
    : undefined;

  if (!target) {
    const attendeeEmail = p.attendees?.[0]?.email;
    if (attendeeEmail) target = findLatestByEmail(attendeeEmail);
  }

  if (!target) {
    console.warn('Cal.com webhook: no lead found for rescheduled booking');
    return new Response(null, { status: 200 });
  }

  db.update(submissions)
    .set({ calBookingUid: p.uid ?? null, calScheduledAt: p.startTime ?? null })
    .where(eq(submissions.id, target.id))
    .run();

  return new Response(null, { status: 200 });
}

function handleCancelled(p: CalPayload): Response {
  if (!p.uid) {
    console.warn('Cal.com webhook: no booking uid in cancellation payload');
    return new Response(null, { status: 200 });
  }

  db.update(submissions)
    .set({ calBookingUid: null, calScheduledAt: null })
    .where(eq(submissions.calBookingUid, p.uid))
    .run();

  return new Response(null, { status: 200 });
}
