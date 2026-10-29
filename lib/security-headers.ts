// Security headers applied to every response (see next.config.ts).
//
// The CSP below still allows inline scripts/styles ('unsafe-inline'), because Next.js
// injects inline bootstrap scripts and a nonce-based policy needs per-request rendering
// (generated in proxy.ts). It therefore does NOT stop injected inline script - that is what
// the output escaping in lib/layer-text.ts is for. What it does give: no third-party
// scripts, no plugins, no <base> hijacking, no framing (clickjacking), restricted form
// targets and network connections.

export function buildSecurityHeaders({ isProd }: { isProd: boolean }) {
  const csp = [
    "default-src 'self'",
    // Dev needs eval for React refresh / source maps.
    `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    // Liveblocks: REST + WebSocket. ws: / localhost only for the dev server (HMR).
    `connect-src 'self' https://*.liveblocks.io wss://*.liveblocks.io${isProd ? "" : " ws://localhost:* http://localhost:*"}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isProd ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

  const headers = [
    { key: "Content-Security-Policy", value: csp },
    // Legacy equivalent of frame-ancestors for older browsers.
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    // Verification / reset tokens travel in the query string - never leak them via Referer.
    { key: "Referrer-Policy", value: "no-referrer" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ];

  if (isProd) {
    // Only meaningful over HTTPS, so not sent in development.
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains",
    });
  }

  return headers;
}
