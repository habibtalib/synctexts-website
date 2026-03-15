/**
 * HubSpot CRM sync module — upsert-by-email pattern using HubSpot v3 Contacts API.
 *
 * Required HubSpot custom contact properties (create in portal before testing):
 *   HubSpot -> Settings -> Data Management -> Properties -> Contact properties -> Create property
 *
 *   Internal name              | Label                  | Type
 *   ---------------------------|------------------------|------------
 *   lead_score                 | Lead Score             | Number
 *   synctexts_service_type     | Service Type           | Single-line text
 *   synctexts_budget           | Budget                 | Single-line text
 *   synctexts_timeline         | Timeline               | Single-line text
 *   synctexts_source_page      | Source Page            | Single-line text
 *   synctexts_message          | Message                | Multi-line text
 *
 * Environment variables required:
 *   HUBSPOT_TOKEN       — Private app access token (HubSpot -> Settings -> Integrations -> Private Apps)
 *   HUBSPOT_PORTAL_ID   — Hub ID for building contact links (HubSpot -> Settings -> Account Management)
 */

import { db } from '../db';
import { submissions } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface SyncPayload {
  submissionId: number;
  name: string;
  email: string;
  company: string | null;
  message: string;
  serviceType: string | null;
  budget: string | null;
  timeline: string | null;
  leadScore: number | null;
  sourcePage?: string;
}

export async function syncToHubSpot(payload: SyncPayload): Promise<void> {
  const token = import.meta.env.HUBSPOT_TOKEN;
  if (!token) return; // graceful skip — env var not configured

  const BASE = 'https://api.hubapi.com';
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Split full name into firstname / lastname (best-effort on first space)
  const [firstname, ...rest] = payload.name.split(' ');
  const lastname = rest.join(' ') || '';

  // Build properties object — only include defined values to avoid HubSpot API rejections
  const properties: Record<string, string> = {
    email: payload.email,
    firstname,
    lastname,
  };
  if (payload.company) properties.company = payload.company;
  if (payload.leadScore !== null) properties.lead_score = String(payload.leadScore);
  if (payload.serviceType) properties.synctexts_service_type = payload.serviceType;
  if (payload.budget) properties.synctexts_budget = payload.budget;
  if (payload.timeline) properties.synctexts_timeline = payload.timeline;
  if (payload.sourcePage) properties.synctexts_source_page = payload.sourcePage;
  properties.synctexts_message = payload.message.slice(0, 500);

  // Step 1: Attempt to create the contact
  const createRes = await fetch(`${BASE}/crm/v3/objects/contacts`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ properties }),
  });

  let hubspotId: string;

  if (createRes.status === 409) {
    // Contact already exists — patch by email (upsert-by-email pattern)
    const patchRes = await fetch(
      `${BASE}/crm/v3/objects/contacts/${encodeURIComponent(payload.email)}?idProperty=email`,
      { method: 'PATCH', headers, body: JSON.stringify({ properties }) }
    );
    if (!patchRes.ok) {
      const err = await patchRes.json().catch(() => ({}));
      throw new Error(`HubSpot PATCH failed: ${patchRes.status} ${JSON.stringify(err)}`);
    }
    const patchData = await patchRes.json();
    hubspotId = patchData.id;
  } else if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(`HubSpot POST failed: ${createRes.status} ${JSON.stringify(err)}`);
  } else {
    const createData = await createRes.json();
    hubspotId = createData.id;
  }

  // Write hubspot_id back to SQLite so we can display sync status in admin
  db.update(submissions)
    .set({
      hubspotId,
      hubspotSyncedAt: new Date().toISOString(),
    })
    .where(eq(submissions.id, payload.submissionId))
    .run();
}
