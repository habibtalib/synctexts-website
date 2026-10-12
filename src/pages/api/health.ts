import type { APIRoute } from 'astro';
import { sqlite } from '../../db';

export const prerender = false;

export const GET: APIRoute = async () => {
  // Confirm the database is reachable, not just that the process is up
  try {
    sqlite.prepare('SELECT 1 FROM submissions LIMIT 1').get();
  } catch (error) {
    console.error('Health check DB query failed:', error);
    return new Response(
      JSON.stringify({ status: 'error', timestamp: new Date().toISOString() }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
