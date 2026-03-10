const ipTimestamps = new Map<string, number[]>();
let callCount = 0;

export function isRateLimited(ip: string, maxPerHour = 5): boolean {
  const now = Date.now();
  const windowMs = 3600000; // 1 hour

  // Get existing timestamps for this IP, filter to last hour
  const timestamps = (ipTimestamps.get(ip) || []).filter(
    (t) => now - t < windowMs
  );

  // Add current timestamp
  timestamps.push(now);
  ipTimestamps.set(ip, timestamps);

  // Periodic cleanup to prevent memory leak
  callCount++;
  if (callCount % 100 === 0) {
    for (const [key, times] of ipTimestamps.entries()) {
      const recent = times.filter((t) => now - t < windowMs);
      if (recent.length === 0) {
        ipTimestamps.delete(key);
      } else {
        ipTimestamps.set(key, recent);
      }
    }
  }

  return timestamps.length > maxPerHour;
}
