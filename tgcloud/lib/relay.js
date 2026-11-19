import { fetch } from 'sdk';

export class BotApiError extends Error {
  constructor(message, { code, method, parameters } = {}) {
    super(message);
    this.name = 'BotApiError';
    this.code = code;
    this.method = method;
    this.parameters = parameters;
  }
}

function env(name, def) {
  if (typeof process !== 'undefined' && process.env && process.env[name] !== undefined) {
    return process.env[name];
  }
  return def;
}

export function apiBase() {
  const relay = env('RELAY_URL', '');
  return relay ? String(relay).replace(/\/+$/, '') : null;
}

export function relayPrefix() {
  return env('RELAY_PATH_PREFIX', '');
}

export function botApiUrl(token, method) {
  const base = apiBase();
  const prefix = relayPrefix();
  const seg = prefix ? `/${prefix}/bot${token}/${method}` : `/bot${token}/${method}`;
  return base ? base + seg : `https://api.telegram.org/bot${token}/${method}`;
}

async function jsonResponse(res) {
  let body;
  try { body = await res.json(); } catch { body = undefined; }
  return { status: res.status, body };
}

export async function tgCall(token, method, body) {
  const url = botApiUrl(token, method);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const { status, body: data } = await jsonResponse(res);
  if (!data || !data.ok) {
    throw new BotApiError(
      `Telegram Bot API ${method} failed (HTTP ${status})`,
      { code: data && data.error_code, method, parameters: data && data.parameters },
    );
  }
  return data.result;
}
