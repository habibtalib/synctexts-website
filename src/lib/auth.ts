/**
 * Shared Basic Auth helper for admin API endpoints.
 * Reads credentials from ADMIN_USER and ADMIN_PASS environment variables.
 * Returns false (not throws) when credentials are missing or invalid.
 */
export function checkBasicAuth(request: Request): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) return false;

  const decoded = atob(authHeader.slice(6));
  const [user, pass] = decoded.split(':');

  const expectedUser = import.meta.env.ADMIN_USER;
  const expectedPass = import.meta.env.ADMIN_PASS;

  if (!expectedUser || !expectedPass) return false;

  return user === expectedUser && pass === expectedPass;
}
