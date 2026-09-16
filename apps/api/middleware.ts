import { next } from '@vercel/functions';

const ALLOWED_ORIGINS = [
  'http://localhost:4200',
  'https://rootaca-admin.web.app',
  'https://rootaca-admin.firebaseapp.com',
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : '';
  return {
    ...(allowOrigin ? { 'Access-Control-Allow-Origin': allowOrigin } : {}),
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization,Content-Type,Accept,Origin',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export const config = {
  runtime: 'nodejs',
};

export default function middleware(request: Request): Response | ReturnType<typeof next> {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(request.headers.get('origin')),
    });
  }

  return next();
}
