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

    // Priority: Header from frontend > Server Environment Variable > Default fallback
    const customUrl = req.headers.get('x-freellmapi-url');
    const customAuth = req.headers.get('authorization');

    const envUrl = process.env.FREELLMAPI_URL;
    const envKey = process.env.FREELLMAPI_KEY;
    const envModel = process.env.FREELLMAPI_MODEL;

    const baseUrl = (customUrl || envUrl || 'https://free.icomefrom.asia/v1').replace(/\/+$/, '');
    const authHeader = customAuth || (envKey ? `Bearer ${envKey}` : 'Bearer YOUR_API_KEY_HERE');
    const model = body.model || envModel || 'auto';

    const targetUrl = `${baseUrl}/chat/completions`;

    const forwardHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      forwardHeaders['Authorization'] = authHeader;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const upstreamResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: forwardHeaders,
      signal: controller.signal,
      body: JSON.stringify({
        ...body,
        model,
      }),
    });

    clearTimeout(timeoutId);

    const data = await upstreamResponse.text();

    return new Response(data, {
      status: upstreamResponse.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: err.name === 'AbortError' ? 'Upstream FreeLLMAPI timeout (12s)' : `Proxy error: ${err.message || 'Unknown'}`,
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
