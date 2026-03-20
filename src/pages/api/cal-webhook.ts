import type { APIRoute } from 'astro';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { db } from '../../db';
import { submissions } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';

export const prerender = false;

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
  const event = JSON.parse(rawBody) as {
    triggerEvent: string;
    payload: {
      uid: string;
      startTime: string;
      attendees: Array<{ email: string; name: string }>;
    };
  };

  if (event.triggerEvent !== 'BOOKING_CREATED') {
    return new Response(null, { status: 200 });
  }

  const bookingUid = event.payload.uid;
  const scheduledAt = event.payload.startTime;
  const attendeeEmail = event.payload.attendees?.[0]?.email;

  if (!attendeeEmail) {
    console.warn('Cal.com webhook: no attendee email in payload');
    return new Response(null, { status: 200 });
  }

  // 3. Find most recent lead by email
  const existing = db
    .select({ id: submissions.id })
    .from(submissions)
    .where(eq(submissions.email, attendeeEmail))
    .orderBy(desc(submissions.id))
    .limit(1)
    .get();

  if (!existing) {
    console.warn(`Cal.com webhook: no lead found for email ${attendeeEmail}`);
    return new Response(null, { status: 200 });
  }

  // 4. Update lead record with booking data
  db.update(submissions)
    .set({ calBookingUid: bookingUid, calScheduledAt: scheduledAt })
    .where(eq(submissions.id, existing.id))
    .run();

  return new Response(null, { status: 200 });
};
