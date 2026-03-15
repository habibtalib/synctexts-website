import type { APIRoute } from 'astro';
import { validateContact } from '../../lib/validation';
import { isRateLimited } from '../../lib/rate-limiter';
import { db } from '../../db';
import { submissions } from '../../db/schema';
import { sendContactNotification } from '../../lib/email';
import { scoreLead } from '../../lib/scoring';
import { syncToHubSpot } from '../../lib/hubspot';

export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const body = await request.json();

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
    const ip = clientAddress || request.headers.get('x-forwarded-for') || '127.0.0.1';

    // Check rate limit
    const rateLimited = isRateLimited(ip);

    // Extract required fields
    const name = (body.name as string).trim();
    const email = (body.email as string).trim();
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
