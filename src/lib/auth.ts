import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Constant-time string comparison. Hashing both sides first gives equal-length
 * buffers, so timingSafeEqual never throws and length is not leaked.
 */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

/**
 * Shared Basic Auth helper for the admin page and admin API endpoints.
 * Reads credentials from ADMIN_USER and ADMIN_PASS environment variables.
 * Returns false (not throws) when credentials are missing or invalid.
 */
export function checkBasicAuth(request: Request): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) return false;

  const expectedUser = import.meta.env.ADMIN_USER;
  const expectedPass = import.meta.env.ADMIN_PASS;

  // Fail closed when credentials are not configured
  if (!expectedUser || !expectedPass) return false;

  let decoded: string;
  try {
    decoded = atob(authHeader.slice(6));
  } catch {
    // Malformed base64
    return false;
  }

  // Split on the first ':' only — passwords may contain colons
  const sep = decoded.indexOf(':');
  if (sep === -1) return false;
  const user = decoded.slice(0, sep);
  const pass = decoded.slice(sep + 1);

  // Evaluate both comparisons so timing does not reveal which one failed
  const userOk = safeEqual(user, expectedUser);
  const passOk = safeEqual(pass, expectedPass);
  return userOk && passOk;
}
