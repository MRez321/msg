function env(name, def) {
  if (typeof process !== 'undefined' && process.env && process.env[name] !== undefined) {
    return process.env[name];
  }
  return def;
}

function envBool(name, def) {
  return String(env(name, def)).toLowerCase() === 'true';
}

function envInt(name, def) {
  const v = parseInt(String(env(name, def)), 10);
  return Number.isNaN(v) ? def : v;
}

export function loadConfig() {
  return {
    botToken:      env('TELEGRAM_BOT_TOKEN', ''),
    channelId:     env('TARGET_TELEGRAM_CHANNEL_ID', ''),
    allowedUserId: env('ALLOWED_TELEGRAM_USER_ID', ''),
    relayUrl:      env('RELAY_URL', ''),
    relayPrefix:   env('RELAY_PATH_PREFIX', ''),
    adminSecret:   env('ADMIN_SECRET', ''),
    retryAttempts: envInt('RETRY_ATTEMPTS', 3),
    retryDelay:    envInt('RETRY_DELAY', 1000),
    timeout:       envInt('TIMEOUT', 5000),
    debug:         envBool('DEBUG_MODE', false),
  };
}

export function maskToken(token) {
  if (!token) return '(not set)';
  const parts = String(token).split(':');
  if (parts.length === 2) return `${parts[0]}:****`;
  return '****';
}
