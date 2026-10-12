const ipTimestamps = new Map<string, number[]>();
let callCount = 0;

const WINDOW_MS = 3600000; // 1 hour
const MAX_TRACKED_IPS = 10000;
const MAX_TIMESTAMPS_PER_IP = 50; // above the 429 hard cap, so counts stay accurate where they matter

/**
 * Resolve the real client IP. Traefik is the single proxy hop in front of the
 * app and appends the peer address to X-Forwarded-For, so the right-most entry
 * is the one we can trust — anything to its left is client-controlled.
 */
export function getClientIp(request: Request, clientAddress?: string): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const parts = xff.split(',');
    const last = parts[parts.length - 1].trim();
    if (last) return last;
  }
  return clientAddress || '127.0.0.1';
}

/**
 * Record a request from this IP and return how many requests it has made in
 * the last hour (including this one). Sliding window, in-memory, per-process.
 */
export function recordRequest(ip: string): number {
  const now = Date.now();

  // Get existing timestamps for this IP, filter to last hour
  const timestamps = (ipTimestamps.get(ip) || []).filter(
    (t) => now - t < WINDOW_MS
  );

  // Add current timestamp; delete first so re-insertion moves the IP to the
  // end of the Map's insertion order (oldest-first eviction below)
  timestamps.push(now);
  if (timestamps.length > MAX_TIMESTAMPS_PER_IP) timestamps.splice(0, timestamps.length - MAX_TIMESTAMPS_PER_IP);
  ipTimestamps.delete(ip);
  ipTimestamps.set(ip, timestamps);

  // Periodic cleanup to prevent memory leak
  callCount++;
  if (callCount % 100 === 0) {
    for (const [key, times] of ipTimestamps.entries()) {
      const recent = times.filter((t) => now - t < WINDOW_MS);
      if (recent.length === 0) {
        ipTimestamps.delete(key);
      } else {
        ipTimestamps.set(key, recent);
      }
    }
  }

  // Hard cap on tracked IPs — evict the least recently seen
  while (ipTimestamps.size > MAX_TRACKED_IPS) {
    const oldest = ipTimestamps.keys().next().value;
    if (oldest === undefined) break;
    ipTimestamps.delete(oldest);
  }

  return timestamps.length;
}

export function isRateLimited(ip: string, maxPerHour = 5): boolean {
  return recordRequest(ip) > maxPerHour;
}
