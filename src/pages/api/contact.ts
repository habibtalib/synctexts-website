import type { APIRoute } from 'astro';
import { validateContact } from '../../lib/validation';
import { getClientIp, recordRequest } from '../../lib/rate-limiter';
import { db } from '../../db';
import { submissions } from '../../db/schema';
import { sendContactNotification } from '../../lib/email';
import { scoreLead } from '../../lib/scoring';
import { syncToHubSpot } from '../../lib/hubspot';

export const prerender = false;

const MAX_BODY_BYTES = 32768;
const SOFT_LIMIT_PER_HOUR = 5;  // above this: stored + flagged, no email/HubSpot
const HARD_LIMIT_PER_HOUR = 20; // above this: rejected outright, nothing stored

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    // Reject oversized payloads before parsing
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return json({ success: false, message: 'Request too large.' }, 413);
    }

    // Content-Length may be absent (chunked), so re-check the actual body size
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) {
      return json({ success: false, message: 'Request too large.' }, 413);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return json({ success: false, message: 'Invalid request body.' }, 400);
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return json({ success: false, message: 'Invalid request body.' }, 400);
    }
    const body = parsed as Record<string, unknown>;

    // Honeypot check: if "website" field is filled, silently reject
    if (body.website) {
      return new Response(
        JSON.stringify({ success: true, message: "Thank you! We'll get back to you soon." }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate input (includes optional enum field validation)
    const { valid, errors } = validateContact(body);
    if (!valid) {
      return new Response(
        JSON.stringify({ success: false, errors }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get client IP
    const ip = getClientIp(request, clientAddress);

    // Check rate limit — hard cap drops floods without touching the DB
    const hourlyCount = recordRequest(ip);
    if (hourlyCount > HARD_LIMIT_PER_HOUR) {
      return json({ success: false, message: 'Too many requests. Please try again later.' }, 429);
    }
    const rateLimited = hourlyCount > SOFT_LIMIT_PER_HOUR;

    // Extract required fields
    const name = (body.name as string).trim();
    const email = (body.email as string).trim().toLowerCase();
    const company = body.company ? (body.company as string).trim() : null;
    const message = (body.message as string).trim();

    // Extract optional new fields (NULL if missing)
    const serviceType = body.service_type != null ? String(body.service_type).trim() : null;
    const budget = body.budget != null ? String(body.budget).trim() : null;
    const timeline = body.timeline != null ? String(body.timeline).trim() : null;

    // Compute lead score from all available signals
    const { score: leadScore } = scoreLead({ budget, timeline, company, message, serviceType });

    // Save to database — capture insert result to get the new row ID for HubSpot sync
    const result = db.insert(submissions).values({
      name,
      email,
      company,
      message,
      ip,
      rateLimited,
      serviceType,
      budget,
      timeline,
      leadScore,
    }).run();
    const submissionId = Number(result.lastInsertRowid);

    // Send email notification (only if not rate-limited)
    if (!rateLimited) {
      try {
        await sendContactNotification({ name, email, company: company || undefined, message });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Email failure should not prevent success response
      }

      // Fire-and-forget HubSpot sync — do NOT await; must not block the response
      // Source page is the Referer header (the page that submitted the form)
      const sourcePage = request.headers.get('referer') || request.url;
      syncToHubSpot({ submissionId, name, email, company, message, serviceType, budget, timeline, leadScore, sourcePage })
        .catch((err) => console.error('HubSpot sync failed:', err));
    }

    return new Response(
      JSON.stringify({ success: true, message: "Thank you! We'll get back to you soon." }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Something went wrong. Please try again later.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
