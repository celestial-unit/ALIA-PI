import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  const apiKey = process.env.TAVUS_API_KEY || '';

  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'TAVUS_API_KEY not configured on server' }),
    };
  }

  // ── CREATE conversation ──────────────────────────────────────────────────────
  if (event.httpMethod === 'POST') {
    try {
      const response = await fetch('https://tavusapi.com/v2/conversations', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          replica_id: 'r55e6793f10f',
          persona_id: 'pfdbee1b41de',
          conversation_name: 'ALIA Session',
          enable_transcription: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          statusCode: response.status,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: data.message || `Tavus API error ${response.status}` }),
        };
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      };
    } catch (err: any) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  // ── END conversation ─────────────────────────────────────────────────────────
  if (event.httpMethod === 'DELETE') {
    try {
      const { conversation_id } = JSON.parse(event.body || '{}');
      if (conversation_id) {
        await fetch(`https://tavusapi.com/v2/conversations/${conversation_id}`, {
          method: 'DELETE',
          headers: { 'x-api-key': apiKey },
        });
      }
      return { statusCode: 200, body: 'OK' };
    } catch (err: any) {
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};
