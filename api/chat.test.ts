import { afterEach, describe, expect, it, vi } from 'vitest';
import handler from './chat';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.unstubAllGlobals();
});

describe('/api/chat', () => {
  it('uses only the server-configured upstream and credential', async () => {
    process.env.FREELLMAPI_URL = 'https://trusted.example/v1';
    process.env.FREELLMAPI_KEY = 'test';

    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ choices: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const request = new Request('https://game.example/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer attacker-key',
        'x-freellmapi-url': 'https://attacker.example/v1',
      },
      body: JSON.stringify({ model: 'auto', messages: [] }),
    });

    const response = await handler(request);

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://trusted.example/v1/chat/completions',
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test',
        },
      })
    );
  });

  it('rejects a non-HTTPS upstream before making a request', async () => {
    process.env.FREELLMAPI_URL = 'http://insecure.example/v1';
    process.env.FREELLMAPI_KEY = 'test';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await handler(new Request('https://game.example/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
    }));

    expect(response.status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
