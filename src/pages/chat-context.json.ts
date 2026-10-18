import type { APIRoute } from 'astro';
import { buildChatContext } from '../lib/chat-context';

export const GET: APIRoute = () =>
  new Response(JSON.stringify(buildChatContext()), { headers: { 'Content-Type': 'application/json' } });
