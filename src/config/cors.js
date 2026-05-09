/**
 * Shared CORS settings for Express and Socket.IO.
 * Set ALLOWED_ORIGINS (comma-separated) or FRONTEND_URL on Render, e.g.:
 * ALLOWED_ORIGINS=https://your-app.onrender.com,https://www.your-domain.com
 */
function getAllowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function getCorsOrigin() {
  const origins = getAllowedOrigins();
  if (origins.length === 0) {
    return true;
  }
  if (origins.length === 1) {
    return origins[0];
  }
  return origins;
}

function getCorsOptions() {
  const origin = getCorsOrigin();
  return {
    origin,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  };
}

/** Socket.IO expects explicit origin(s); use * when ALLOWED_ORIGINS is unset (local dev). */
function getSocketIoCorsOrigin() {
  const origins = getAllowedOrigins();
  if (origins.length === 0) {
    return "*";
  }
  if (origins.length === 1) {
    return origins[0];
  }
  return origins;
}

module.exports = { getCorsOrigin, getCorsOptions, getSocketIoCorsOrigin };
