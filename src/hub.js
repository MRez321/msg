// Mountable Node.js API & Admin UI hub.
// Self-contained, dependency-free (native http + fetch). Plugs into an existing
// website at a custom base path (e.g. /api/broadcaster or /msg-hub).
// Auto-detects protocol + host from x-forwarded-proto / x-forwarded-host / host.

export function createHub(options = {}) {
  const mountPath = (options.mountPath || process.env.MSG_HUB_MOUNT_PATH || '/msg-hub').replace(/\/+$/, '');
  const adminSecret = options.adminSecret || process.env.ADMIN_SECRET || '';
  const botToken = options.botToken || process.env.TELEGRAM_BOT_TOKEN || '';
  const channelId = options.channelId || process.env.TARGET_TELEGRAM_CHANNEL_ID || '';
  const relayUrl = options.relayUrl || process.env.RELAY_URL || '';
  const relayPrefix = options.relayPrefix || process.env.RELAY_PATH_PREFIX || '';
  const logs = [];
  const MAX_LOGS = 500;
  const startTime = Date.now();

  function addLog(entry) {
    logs.unshift({ id: String(Date.now()) + '-' + Math.random().toString(36).slice(2, 8), ts: new Date().toISOString(), ...entry });
    while (logs.length > MAX_LOGS) logs.pop();
  }

  function recentLogs(n = 50) {
    return logs.slice(0, n);
  }

  function originOf(req) {
    const proto = req.headers['x-forwarded-proto'] || (req.socket && req.socket.encrypted ? 'https' : 'http');
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
    return `${proto}://${host}`;
  }

  function pathMatches(reqPath) {
    return reqPath === mountPath || reqPath.startsWith(mountPath + '/') || reqPath.startsWith(mountPath + '?');
  }

  function innerPath(reqPath) {
    let inner = reqPath.slice(mountPath.length);
    if (!inner.startsWith('/') && inner !== '') inner = '/' + inner;
    return inner || '/';
  }

  function checkAuth(req) {
    if (!adminSecret) return true;
    const provided = req.headers['x-admin-secret'] || req.headers['admin-secret'] || '';
    try {
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const qs = url.searchParams.get('secret');
      return provided === adminSecret || qs === adminSecret;
    } catch {
      return provided === adminSecret;
    }
  }

  function botApiUrl(method) {
    const base = relayUrl ? String(relayUrl).replace(/\/+$/, '') : 'https://api.telegram.org';
    const seg = relayPrefix ? `/${relayPrefix}/bot${botToken}/${method}` : `/bot${botToken}/${method}`;
    return base + seg;
  }

  async function sendTg(method, body) {
    const res = await fetch(botApiUrl(method), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: data.ok === true, status: res.status, data };
  }

  function readBody(req) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      req.on('error', reject);
    });
  }

  function json(res, status, payload) {
    const body = JSON.stringify(payload);
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' });
    res.end(body);
  }

  async function serveDashboard(req, res) {
    const html = DASHBOARD_HTML
      .replace(/\{\{MOUNT_PATH\}\}/g, mountPath)
      .replace(/\{\{ORIGIN\}\}/g, originOf(req))
      .replace(/\{\{CONFIG\}\}/g, JSON.stringify({ mountPath, origin: originOf(req), hasSecret: !!adminSecret }));
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'access-control-allow-origin': '*' });
    res.end(html);
  }

  async function handleBroadcast(req, res) {
    let body;
    try {
      body = JSON.parse(await readBody(req) || '{}');
    } catch {
      res.writeHead(400, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ ok: false, error: 'invalid json' }));
    }
    const { chat_id: chatId, text, type = 'text', caption, from_chat_id: fromChatId, message_id: messageId } = body;
    const target = chatId || channelId;
    if (!target) {
      res.writeHead(400, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ ok: false, error: 'no target: set chat_id or TARGET_TELEGRAM_CHANNEL_ID' }));
    }
    if (!text && !fileIdish(body)) {
      res.writeHead(400, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ ok: false, error: 'text or file_id required' }));
    }
    try {
      let result;
      if (text || type === 'text') {
        result = await sendTg('sendMessage', { chat_id: target, text: text || '', parse_mode: 'HTML', disable_web_page_preview: true });
      } else {
        result = await sendTg('copyMessage', { chat_id: target, from_chat_id: fromChatId, message_id: messageId, caption });
      }
      addLog({ kind: 'web-broadcast', type: text ? 'text' : 'media', target, status: result.ok ? 'sent' : 'failed', messageId: result.data && result.data.result && result.data.result.message_id, error: result.ok ? null : (result.data && result.data.description) });
      res.writeHead(result.ok ? 200 : 502, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ ok: result.ok, result: result.data && result.data.result, error: result.ok ? null : (result.data && result.data.description) }));
    } catch (err) {
      addLog({ kind: 'web-broadcast', type: text ? 'text' : 'media', target, status: 'failed', error: err.message });
      res.writeHead(502, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ ok: false, error: err.message }));
    }
  }

  function fileIdish(body) {
    return !!(body.file_id || (body.from_chat_id && body.message_id));
  }

  async function handleTelegramWebhook(req, res) {
    let body;
    try {
      body = JSON.parse(await readBody(req) || '{}');
    } catch {
      body = {};
    }
    const secret = req.headers['x-telegram-bot-api-secret-token'];
    if (adminSecret && secret !== adminSecret) {
      res.writeHead(401, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ ok: false, error: 'invalid webhook secret' }));
    }
    addLog({ kind: 'telegram-webhook', updateId: body.update_id, status: 'received' });
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ ok: true }));
  }

  async function handler(req, res) {
    try {
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const reqPath = url.pathname;
      if (!pathMatches(reqPath)) return false;

      res.setHeader('access-control-allow-origin', '*');

      if (req.method === 'OPTIONS') {
        res.writeHead(204, { 'access-control-allow-headers': 'content-type,x-admin-secret', 'access-control-allow-methods': 'GET,POST,OPTIONS' });
        res.end();
        return true;
      }

      const inner = innerPath(reqPath);

      // Dashboard root
      if (req.method === 'GET' && (inner === '/' || inner === '')) {
        return serveDashboard(req, res);
      }

      if (!inner.startsWith('/api/')) {
        res.writeHead(404, { 'content-type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: 'not found' }));
      }

      const seg = inner.slice('/api'.length);

      if (req.method === 'GET' && seg === '/status') {
        return json(res, 200, {
          ok: true,
          mountPath,
          origin: originOf(req),
          botConfigured: !!botToken,
          channelId: channelId || '(unset)',
          allowedUserId: process.env.ALLOWED_TELEGRAM_USER_ID ? '(set)' : '(unset)',
          relayConfigured: !!relayUrl,
          logs: recentLogs(),
          uptime: Date.now() - startTime,
        });
      }

      if (!checkAuth(req)) {
        res.writeHead(401, { 'content-type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: 'admin secret required' }));
      }

      if (req.method === 'POST' && seg === '/broadcast') return handleBroadcast(req, res);
      if (req.method === 'POST' && seg === '/webhook/sync') {
        const webhookUrl = `${originOf(req)}${mountPath}/telegram`;
        return json(res, 200, {
          ok: true,
          webhookUrl,
          note: 'Run `npx tgcloud webhook sync` via GitHub Actions to realign the Telegram Serverless webhook. The hub exposes POST {mountPath}/telegram to receive updates if you self-host the webhook instead.',
        });
      }
      if (req.method === 'GET' && seg === '/logs') {
        return json(res, 200, { ok: true, logs: recentLogs() });
      }

      if (req.method === 'POST' && inner === '/telegram') return handleTelegramWebhook(req, res);

      res.writeHead(404, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ ok: false, error: 'not found' }));
    } catch (err) {
      res.writeHead(500, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ ok: false, error: err.message || String(err) }));
    }
  }

  return { handler, mountPath, origin: originOf, logs, addLog };
}

// ---- Dashboard UI (theme: #ceae80 on obsidian/charcoal) ----
const DASHBOARD_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Msg Hub — Broadcaster Admin</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#121110;color:#f5f2ed;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.5}
  a{color:#ceae80}
  .wrap{max-width:980px;margin:0 auto;padding:24px}
  header{display:flex;align-items:center;justify-content:space-between;padding:20px 0 8px}
  .brand{display:flex;align-items:center;gap:12px;font-weight:700;letter-spacing:-0.4px}
  .dot{width:10px;height:10px;border-radius:50%;background:#ceae80;box-shadow:0 0 14px #ceae80}
  .muted{color:#a89f91;font-size:0.9rem}
  .statuspill{display:inline-block;padding:4px 10px;border-radius:999px;background:#221f1c;color:#a89f91;font-size:0.78rem;border:1px solid #33302c;margin-left:8px}
  .statuspill.ok{color:#ceae80;border-color:#ceae80}
  .card{background:#221f1c;border:1px solid #33302c;border-radius:16px;padding:20px;margin:16px 0}
  h2{font-size:1rem;text-transform:uppercase;letter-spacing:.06em;color:#a89f91;margin-bottom:14px}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}
  .tile{background:#1a1816;border:1px solid #2b2825;border-radius:12px;padding:14px}
  .tile .k{color:#a89f91;font-size:.8rem;margin-bottom:6px}
  .tile .v{color:#f5f2ed;font-size:1.05rem;word-break:break-all}
  .tile .v .accent{color:#ceae80}
  .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
  input,select,textarea{background:#1a1816;border:1px solid #33302c;color:#f5f2ed;border-radius:8px;padding:10px 12px;font:inherit;width:100%}
  input:focus,select:focus,textarea:focus{border-color:#ceae80;outline:none}
  label{display:block;color:#a89f91;font-size:.85rem;margin-bottom:6px}
  button{background:#ceae80;color:#121110;border:none;border-radius:8px;padding:10px 18px;font:inherit;font-weight:700;cursor:pointer}
  button:hover{background:#d9d0a3}
  button:disabled{opacity:.6;cursor:not-allowed}
  button.secondary{background:#221f1c;color:#f5f2ed;border:1px solid #33302c}
  button.secondary:hover{border-color:#ceae80;color:#ceae80}
  table{width:100%;border-collapse:collapse;margin-top:10px;font-size:.88rem}
  th{text-align:left;color:#a89f91;padding:8px;border-bottom:1px solid #33302c}
  td{padding:8px;border-bottom:1px solid #23221f;color:#f5f2ed}
  tr:hover td{background:#1c1a18}
  .badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:.75rem}
  .badge.sent{background:#ceae80;color:#121110}
  .badge.failed{background:#5a2a2a;color:#f5f2ed}
  .badge.received{background:#33302c;color:#a89f91}
  .msg{margin-top:10px;padding:10px;border-radius:8px;color:#a89f91;font-size:.9rem}
  .msg.ok{color:#ceae80;border:1px solid #ceae80;background:#1b1a17}
  .msg.err{color:#d98a8a;border:1px solid #5a2a2a;background:#1b1616}
  .mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:#1a1816;border:1px solid #33302c;border-radius:6px;padding:8px;word-break:break-all}
  .hidden{display:none}
  .accent{color:#ceae80}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="brand"><div class="dot"></div> Msg Hub</div>
    <div class="muted" id="hubMount">mount: {{MOUNT_PATH}}</div>
  </header>

  <div class="card">
    <h2>Status</h2>
    <div class="grid" id="statusGrid">
      <div class="tile"><div class="k">Mount path</div><div class="v"><span class="accent" id="uiMount">{{MOUNT_PATH}}</span></div></div>
      <div class="tile"><div class="k">Origin (detected)</div><div class="v"><span class="accent" id="uiOrigin">{{ORIGIN}}</span></div></div>
      <div class="tile"><div class="k">Bot token</div><div class="v" id="uiBot">—</div></div>
      <div class="tile"><div class="k">Target channel</div><div class="v" id="uiChannel">—</div></div>
      <div class="tile"><div class="k">Relay</div><div class="v" id="uiRelay">—</div></div>
      <div class="tile"><div class="k">Admin auth</div><div class="v" id="uiAuth">—</div></div>
    </div>
    <div class="row" style="margin-top:12px">
      <button id="btnRefresh" class="secondary">Refresh status</button>
      <button id="btnWebhook">Sync webhook</button>
      <span id="webhookResult" class="muted" style="margin-left:10px"></span>
    </div>
    <div id="webhookUrlBox" class="hidden" style="margin-top:10px">
      <div class="muted">Webhook URL</div>
      <div class="mono" id="webhookUrl"></div>
      <div class="muted" style="font-size:.78rem;margin-top:4px">Run `npx tgcloud webhook sync` via GitHub Actions to realign Telegram Serverless.</div>
    </div>
  </div>

  <div class="card">
    <h2>Broadcast (web)</h2>
    <div class="row" style="margin-bottom:10px">
      <label>Target chat_id (leave blank for channel)</label>
      <input id="bChat" placeholder="@channelusername or numeric id">
    </div>
    <label>Message</label>
    <textarea id="bText" rows="4" placeholder="Hello channel…"></textarea>
    <div class="row" style="margin-top:10px">
      <button id="btnSend">Send broadcast</button>
      <span id="sendResult" class="muted" style="margin-left:10px"></span>
    </div>
  </div>

  <div class="card">
    <h2>Recent logs</h2>
    <table id="logsTable">
      <thead><tr><th>Time</th><th>Kind</th><th>Type</th><th>Target</th><th>Status</th><th>Message id</th><th>Error</th></tr></thead>
      <tbody id="logsBody"></tbody>
    </table>
    <div class="msg" id="logsEmpty" style="margin-top:8px">No logs yet.</div>
  </div>
</div>

<script>
window.__MH = {{CONFIG}};
const mount = window.__MH.mountPath;
function api(path){
  if(mount.startsWith('http')) return new URL(path, mount).toString();
  return mount.replace(/\/$/, '') + path;
}
let secret = null;

function el(id){return document.getElementById(id)}
function set(id,html){const e=el(id); if(e) e.textContent=html}
function show(id){el(id).classList.remove('hidden')}
function hide(id){el(id).classList.add('hidden')}

async function req(path, opts={}){
  const headers = Object.assign({'content-type':'application/json'}, opts.headers||{});
  if(secret) headers['x-admin-secret']=secret;
  const r = await fetch(api(path), Object.assign({},opts,{headers}));
  let data; try{ data=await r.json(); }catch{ data={error:`HTTP \${r.status}`}; }
  return {ok:r.ok, status:r.status, data};
}

async function loadStatus(){
  const r = await req('/api/status');
  if(r.ok){
    const d=r.data;
    set('uiMount', d.mountPath);
    set('uiOrigin', d.origin);
    set('uiBot', d.botConfigured ? 'set' : '(unset)');
    set('uiChannel', d.channelId);
    set('uiRelay', d.relayConfigured ? 'configured' : 'direct');
    set('uiAuth', d.allowedUserId);
    const pill = el('uiAuth') && el('uiAuth').parentElement;
    return d;
  }
  set('uiBot','error'); set('uiChannel','error');
}
el('btnRefresh').onclick = loadStatus;

el('btnWebhook').onclick = async ()=>{
  const r = await req('/api/webhook/sync', {method:'POST'});
  const box = el('webhookUrlBox');
  if(r.ok){
    el('webhookUrl').textContent = r.data.webhookUrl;
    el('webhookResult').textContent = 'synced (see URL above)';
    el('webhookResult').style.color='#ceae80';
    show('webhookUrlBox');
  } else {
    el('webhookResult').textContent = 'failed: '+(r.data.error||'');
    el('webhookResult').style.color='#d98a8a';
  }
};

function promptSecret(){
  if(secret) return secret;
  const s = window.prompt('Enter admin secret for this hub:');
  if(!s) return null;
  secret = s;
  return s;
}

el('btnSend').onclick = async ()=>{
  if(!promptSecret()){ el('sendResult').textContent='secret required'; el('sendResult').style.color='#d98a8a'; return; }
  const body = { chat_id: el('bChat').value||undefined, text: el('bText').value };
  const r = await req('/api/broadcast', {method:'POST', body:JSON.stringify(body)});
  if(r.ok){ el('sendResult').textContent='sent'; el('sendResult').style.color='#ceae80'; el('bText').value=''; loadLogs(); }
  else { el('sendResult').textContent='failed: '+(r.data.error||''); el('sendResult').style.color='#d98a8a'; }
};

function formatTime(iso){return new Date(iso).toLocaleString()}
function loadLogs(){
  const r = req('/api/logs');
  r.then(res=>{
    const body=el('logsBody'); const empty=el('logsEmpty');
    body.innerHTML='';
    if(!res.ok || !res.data.logs || res.data.logs.length===0){ body.innerHTML=''; show('logsEmpty'); return; }
    hide('logsEmpty');
    res.data.logs.forEach(l=>{
      const tr=document.createElement('tr');
      let cls='received', txt=l.status||'';
      if(l.status==='sent') cls='sent'; else if(l.status==='failed') cls='failed';
      tr.innerHTML='<td>'+formatTime(l.ts)+'</td><td>'+(l.kind||'-')+'</td><td>'+(l.type||'-')+'</td><td class="mono" style="font-size:.75px">'+(l.target||'-')+'</td><td><span class="badge '+cls+'">'+txt+'</span></td><td>'+(l.messageId||'-')+'</td><td class="muted">'+(l.error||'-')+'</td>';
      body.appendChild(tr);
    });
  }).catch(()=>{});
}

loadStatus();
loadLogs();
setInterval(loadStatus, 20000);
setInterval(loadLogs, 15000);
</script>
</body>
</html>`;
