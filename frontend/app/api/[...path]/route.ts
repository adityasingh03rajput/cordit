import { NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || 'http://localhost:3000';

const DISALLOWED_HEADERS = new Set([
  'host',
  'content-length',
  'expect',
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'origin',
  'referer',
]);

async function proxy(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  request: NextRequest,
  params: Promise<{ path: string[] }>,
) {
  try {
    const { path } = await params;
    const pathname = path.join('/');
    const searchParams = request.nextUrl.searchParams.toString();
    const url = `${BACKEND_URL}/${pathname}${searchParams ? `?${searchParams}` : ''}`;

    const headers = new Headers();
    request.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (DISALLOWED_HEADERS.has(lower)) return;
      headers.set(key, value);
    });

    const init: RequestInit = {
      method,
      headers,
    };

    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      const body = await request.arrayBuffer();
      if (body.byteLength > 0) {
        init.body = body;
      }
    }

    const response = await fetch(url, init);
    const data = await response.arrayBuffer();

    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'content-length') return;
      responseHeaders.set(key, value);
    });

    return new Response(data, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('API Proxy error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal Server Error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxy('GET', request, params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxy('POST', request, params);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxy('PUT', request, params);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxy('PATCH', request, params);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxy('DELETE', request, params);
}
