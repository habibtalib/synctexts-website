import { Resend } from 'resend';

interface ContactData {
  name: string;
  email: string;
  company?: string;
  message: string;
}

export async function sendContactNotification(data: ContactData): Promise<void> {
  const resend = new Resend(import.meta.env.RESEND_API_KEY);

  const to = import.meta.env.CONTACT_EMAIL;
  if (!to) {
    throw new Error('CONTACT_EMAIL environment variable is not set');
  }

  const from = import.meta.env.EMAIL_FROM || 'SyncTexts <onboarding@resend.dev>';
  const subject = data.company
    ? `New inquiry from ${data.name} (${data.company})`
    : `New inquiry from ${data.name}`;

  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: data.email,
    subject,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">New Contact Form Submission</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #555; width: 100px;">Name</td>
            <td style="padding: 8px 12px; color: #333;">${escapeHtml(data.name)}</td>
          </tr>
          <tr style="background-color: #f9f9f9;">
            <td style="padding: 8px 12px; font-weight: bold; color: #555;">Email</td>
            <td style="padding: 8px 12px; color: #333;"><a href="mailto:${escapeHtml(data.email)}" style="color: #6366f1;">${escapeHtml(data.email)}</a></td>
          </tr>
          ${data.company ? `
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #555;">Company</td>
            <td style="padding: 8px 12px; color: #333;">${escapeHtml(data.company)}</td>
          </tr>` : ''}
          <tr style="background-color: #f9f9f9;">
            <td style="padding: 8px 12px; font-weight: bold; color: #555; vertical-align: top;">Message</td>
            <td style="padding: 8px 12px; color: #333; white-space: pre-wrap;">${escapeHtml(data.message)}</td>
          </tr>
        </table>
        <p style="margin-top: 24px; font-size: 12px; color: #999;">This message was sent from the SyncTexts website contact form.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
