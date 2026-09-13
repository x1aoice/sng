export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }

  try {
    const body = await req.json();

    const envUrl = process.env.FREELLMAPI_URL;
    const envKey = process.env.FREELLMAPI_KEY;
    const envModel = process.env.FREELLMAPI_MODEL;

    if (!envKey) {
      return new Response(
        JSON.stringify({ error: 'FREELLMAPI_KEY is not configured on server' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        }
      );
    }

    // The upstream URL and credential are server-controlled. Never accept a
    // client-provided URL here: doing so could send the server API key to an
    // attacker-controlled endpoint.
    const baseUrl = (envUrl || 'https://free.icomefrom.asia/v1').replace(/\/+$/, '');
    const parsedUrl = new URL(baseUrl);
    if (parsedUrl.protocol !== 'https:') {
      throw new Error('FREELLMAPI_URL must use HTTPS');
    }

    const model = envModel || body.model || 'auto';

    const targetUrl = `${baseUrl}/chat/completions`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const upstreamResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${envKey}`,
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
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  }
}
