import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);
const PRODUCTION_HOSTNAME = 'blog.wypark.me';
const PRODUCTION_ORIGIN = `https://${PRODUCTION_HOSTNAME}`;
const HSTS_HEADER = 'max-age=31536000; includeSubDomains; preload';

const getForwardedProtocol = (request: NextRequest) => {
  const forwardedProtocol = request.headers.get('x-forwarded-proto');
  if (forwardedProtocol) {
    return forwardedProtocol.split(',')[0]?.trim().toLowerCase() ?? '';
  }
  return request.nextUrl.protocol.replace(':', '').toLowerCase();
};

const isLocalRequest = (hostname: string) => {
  return LOCAL_HOSTNAMES.has(hostname) || hostname.endsWith('.localhost');
};

const getRequestHostname = (request: NextRequest) => {
  const host = request.headers.get('host')?.trim().toLowerCase() ?? '';
  if (host.startsWith('[')) {
    const closingBracket = host.indexOf(']');
    return closingBracket > 0 ? host.slice(1, closingBracket) : '';
  }
  return host.split(':')[0] ?? '';
};

const getConnectSources = () => {
  const sources = new Set(["'self'"]);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  try {
    const api = new URL(apiUrl);
    sources.add(api.origin);
    const socketProtocol = api.protocol === 'https:' ? 'wss:' : 'ws:';
    sources.add(`${socketProtocol}//${api.host}`);
  } catch {
    // A malformed build-time API URL is handled by the application configuration.
  }
  return [...sources].join(' ');
};

const buildContentSecurityPolicy = (nonce: string, isLocal: boolean) => {
  const developmentScriptPolicy = process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : '';
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${developmentScriptPolicy}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https:",
    "font-src 'self' data:",
    `connect-src ${getConnectSources()} https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com`,
    "media-src 'self' https:",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "manifest-src 'self'",
    ...(isLocal ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
};

const applySecurityHeaders = (
  response: NextResponse,
  contentSecurityPolicy: string,
  isLocal: boolean,
) => {
  response.headers.set('Content-Security-Policy', contentSecurityPolicy);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  response.headers.set('Origin-Agent-Cluster', '?1');
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  if (!isLocal) response.headers.set('Strict-Transport-Security', HSTS_HEADER);
  return response;
};

export function proxy(request: NextRequest) {
  const hostname = getRequestHostname(request);
  const isLocal = isLocalRequest(hostname);
  const protocol = getForwardedProtocol(request);
  const nonce = crypto.randomUUID().replaceAll('-', '');
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce, isLocal);

  if ((!isLocal && hostname !== PRODUCTION_HOSTNAME) || (!isLocal && protocol !== 'https')) {
    const redirectUrl = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, PRODUCTION_ORIGIN);
    return applySecurityHeaders(NextResponse.redirect(redirectUrl, 301), contentSecurityPolicy, false);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', contentSecurityPolicy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  return applySecurityHeaders(response, contentSecurityPolicy, isLocal);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
