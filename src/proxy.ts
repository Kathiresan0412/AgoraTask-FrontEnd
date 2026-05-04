import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const supportedCountryRegex = /^\/(lk|ca)(\/|$)/i;
const defaultCountryCode = 'lk';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Exclude static files, api routes, Next.js internal routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check if the pathname already starts with a supported country code.
  if (supportedCountryRegex.test(pathname)) {
    return NextResponse.next();
  }

  const geoRequest = request as NextRequest & { geo?: { country?: string } };
  const geoCountryCode = geoRequest.geo?.country?.toLowerCase();
  let countryCode = geoCountryCode === 'ca' ? 'ca' : geoCountryCode === 'lk' ? 'lk' : undefined;

  // Local development does not provide geo data. Avoid blocking every first
  // uncategorized route on a third-party IP lookup.
  if (!countryCode && process.env.NODE_ENV === 'production') {
    try {
      // Using ipapi.co (free, no key required for low volume)
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        const detectedCountryCode = data?.country_code?.toLowerCase();
        if (detectedCountryCode === 'ca' || detectedCountryCode === 'lk') {
          countryCode = detectedCountryCode;
        }
      }
    } catch (e) {
      console.error("IP API fetch failed", e);
    }
  }

  // Default fallback if detection fails
  if (!countryCode) {
    countryCode = defaultCountryCode;
  }

  // Redirect to the URL prefixed with the detected country code
  const url = request.nextUrl.clone();
  url.pathname = `/${countryCode}${pathname}`;

  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Match all paths except static files and api routes
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.).*)',
  ],
};
