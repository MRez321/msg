/**
 * Telegram Bot API relay — Cloudflare Worker (ES module)
 *
 * A transparent reverse proxy: it does NOT parse, modify or re-encode request or
 * response bodies. Whatever Telegram supports (JSON, urlencoded, query string,
 * multipart uploads, rich text, entities, files, webhooks...) is passed as raw
 * streamed bytes, so nothing is lost or limited by this code.
 *
 * Routes (all optional-prefixed by PATH_PREFIX):
 *   /bot<token>/<METHOD>[?query]         -> UPSTREAM/bot<token>/<METHOD>      (Bot API calls)
 *   /file/bot<token>/<file_path>         -> UPSTREAM/file/bot<token>/<path>   (file downloads)
 *   /_hook/<rest>   (POST, only if WEBHOOK_ORIGIN is set)
 *                                        -> WEBHOOK_ORIGIN/<rest>             (inbound webhooks)
 *
 * Environment variables (all optional; set in Cloudflare dashboard or wrangler):
 *   UPSTREAM         default "https://api.telegram.org". Point at your own
 *                    telegram-bot-api server if you run one.
 *   PATH_PREFIX      secret path segment, e.g. "k9f3x2". Requests must start with /k9f3x2/...
 *   ALLOWED_BOT_IDS  comma-separated numeric bot ids (the part of the token before ":").
 *                    If set, tokens of other bots are rejected with 403.
 *   WEBHOOK_ORIGIN   e.g. "https://my-server.example.com" — enables inbound webhook forwarding.
 *   WEBHOOK_PATH     inbound route segment, default "_hook".
 *   WEBHOOK_SECRET   if set, inbound requests must carry header
 *                    X-Telegram-Bot-Api-Secret-Token equal to this value (else 401).
 */

const DEFAULT_UPSTREAM = "https://api.telegram.org";

// Headers never forwarded (client identity / Cloudflare internals / hop-by-hop).
const STRIP_EXACT = new Set([
  "host", "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
  "te", "trailer", "transfer-encoding", "upgrade",
  "x-forwarded-for", "x-forwarded-proto", "x-forwarded-host", "x-real-ip",
  "forwarded", "true-client-ip", "cdn-loop",
]);

function cleanHeaders(headers) {
  for (const name of [...headers.keys()]) {
    const n = name.toLowerCase();
    if (STRIP_EXACT.has(n) || n.startsWith("cf-")) headers.delete(name);
  }
}

function jsonError(status, description, extraHeaders = {}) {
  // Same envelope shape Telegram documents for failures: ok=false, error_code, description.
  return new Response(
    JSON.stringify({ ok: false, error_code: status, description }),
    { status, headers: { "content-type": "application/json", ...extraHeaders } },
  );
}

function stripSlashes(s) {
  return String(s || "").replace(/^\/+|\/+$/g, "");
}

export default {
  async fetch(request, env) {
    try {
      return await handle(request, env || {});
    } catch (err) {
      return jsonError(502, "Relay error: " + (err && err.message ? err.message : String(err)));
    }
  },
};

async function handle(request, env) {
  const url = new URL(request.url);
  let path = url.pathname;

  // 1) Optional secret path prefix
  const prefix = stripSlashes(env.PATH_PREFIX);
  if (prefix) {
    const p = "/" + prefix + "/";
    if (!path.startsWith(p)) return jsonError(404, "Not Found");
    path = path.slice(p.length - 1); // keep the leading "/"
  }

  // 2) Method gate (Telegram's official page documents GET and POST)
  if (!["GET", "POST", "HEAD"].includes(request.method)) {
    return jsonError(405, "Method Not Allowed", { allow: "GET, POST, HEAD" });
  }

  // 3) Inbound webhook forwarding (Telegram -> this worker -> your server)
  const hookSeg = stripSlashes(env.WEBHOOK_PATH) || "_hook";
  if (env.WEBHOOK_ORIGIN && (path === "/" + hookSeg || path.startsWith("/" + hookSeg + "/"))) {
    return forwardWebhook(request, env, url, path, hookSeg);
  }

  // 4) Bot API call or file download
  const m = path.match(/^\/(?:file\/)?bot(\d+):[^/]+(?:\/.*)?$/);
  if (!m) return jsonError(404, "Not Found");

  const allowed = String(env.ALLOWED_BOT_IDS || "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  if (allowed.length && !allowed.includes(m[1])) {
    return jsonError(403, "Forbidden: bot id not allowed by this relay");
  }

  const upstreamBase = stripSlashes(env.UPSTREAM) ? String(env.UPSTREAM).replace(/\/+$/, "") : DEFAULT_UPSTREAM;
  const target = upstreamBase + path + url.search;

  // new Request(url, request) carries over method, headers and the (streamed) body untouched.
  const upstreamReq = new Request(target, request);
  cleanHeaders(upstreamReq.headers);

  const upstreamResp = await fetch(upstreamReq, { redirect: "manual" });

  // Re-wrap so headers are mutable; body is streamed through, not buffered.
  const resp = new Response(upstreamResp.body, upstreamResp);
  if (!path.startsWith("/file/")) resp.headers.set("cache-control", "no-store");
  return resp;
}

async function forwardWebhook(request, env, url, path, hookSeg) {
  if (request.method !== "POST") {
    return jsonError(405, "Method Not Allowed", { allow: "POST" });
  }
  if (env.WEBHOOK_SECRET) {
    const got = request.headers.get("x-telegram-bot-api-secret-token") || "";
    if (got !== env.WEBHOOK_SECRET) return jsonError(401, "Unauthorized");
  }
  const rest = path.slice(("/" + hookSeg).length); // "" or "/something"
  const origin = String(env.WEBHOOK_ORIGIN).replace(/\/+$/, "");
  const target = origin + rest + url.search;

  const req = new Request(target, request);
  cleanHeaders(req.headers); // keeps content-type and X-Telegram-Bot-Api-Secret-Token

  const r = await fetch(req, { redirect: "manual" });
  // Your server's response is returned unchanged to Telegram (this also preserves
  // "reply to webhook with a Bot API method call" behaviour).
  return new Response(r.body, r);
}
