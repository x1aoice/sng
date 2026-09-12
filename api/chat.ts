export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-freellmapi-url',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();

    const customUrl = req.headers.get('x-freellmapi-url');
    const customAuth = req.headers.get('authorization');

    const envUrl = process.env.FREELLMAPI_URL;
    const envKey = process.env.FREELLMAPI_KEY;
    const envModel = process.env.FREELLMAPI_MODEL;

    const baseUrl = (customUrl || envUrl || 'https://free.icomefrom.asia/v1').replace(/\/+$/, '');
    const authHeader = customAuth || (envKey ? `Bearer ${envKey}` : '');
    const model = body.model || envModel || 'llama-3.1-8b-instruct';

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'FREELLMAPI_KEY is not configured on server' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const targetUrl = `${baseUrl}/chat/completions`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const upstreamResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      signal: controller.signal,
      body: JSON.stringify({
        ...body,
        model,
      }),
    });

    clearTimeout(timeoutId);

    const data = await upstreamResponse.json();
    return new Response(JSON.stringify(data), {
      status: upstreamResponse.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
