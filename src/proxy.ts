import { NextRequest, NextResponse } from 'next/server';

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);
const HSTS_HEADER = 'max-age=31536000; includeSubDomains';

const getForwardedProtocol = (request: NextRequest) => {
  const forwardedProtocol = request.headers.get('x-forwarded-proto');
  if (forwardedProtocol) {
    return forwardedProtocol.split(',')[0]?.trim().toLowerCase();
  }

  return request.nextUrl.protocol.replace(':', '').toLowerCase();
};

const getRequestHost = (request: NextRequest) => {
  const forwardedHost = request.headers.get('x-forwarded-host');
  if (forwardedHost) {
    return forwardedHost.split(',')[0]?.trim();
  }

  return request.headers.get('host') || request.nextUrl.host;
};

const getHostname = (host: string) => {
  if (host.startsWith('[')) {
    return host.slice(1, host.indexOf(']'));
  }

  return host.split(':')[0];
};

const getRedirectHost = (host: string) => {
  if (host.startsWith('[')) {
    return host.slice(0, host.indexOf(']') + 1);
  }

  return getHostname(host);
};

const isLocalRequest = (hostname: string) => {
  return LOCAL_HOSTNAMES.has(hostname) || hostname.endsWith('.localhost');
};

export function proxy(request: NextRequest) {
  const protocol = getForwardedProtocol(request);
  const requestHost = getRequestHost(request);
  const hostname = getHostname(requestHost);

  if (!isLocalRequest(hostname) && protocol === 'http') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.protocol = 'https:';
    redirectUrl.host = getRedirectHost(requestHost);
    redirectUrl.port = '';

    return NextResponse.redirect(redirectUrl, 301);
  }

  const response = NextResponse.next();

  if (!isLocalRequest(hostname)) {
    response.headers.set('Strict-Transport-Security', HSTS_HEADER);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
