import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Match common 2-letter country codes
const countryRegex = /^\/[a-zA-Z]{2}(\/|$)/;

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

  // Check if the pathname already starts with a country code (e.g. /lk, /uk, /us)
  if (countryRegex.test(pathname)) {
    return NextResponse.next();
  }

  const geoRequest = request as NextRequest & { geo?: { country?: string } };
  let countryCode = geoRequest.geo?.country?.toLowerCase();

  // If geo is not available (e.g., local development), fetch from IP API
  if (!countryCode) {
    try {
      // Using ipapi.co (free, no key required for low volume)
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        if (data && data.country_code) {
          countryCode = data.country_code.toLowerCase();
        }
      }
    } catch (e) {
      console.error("IP API fetch failed", e);
    }
  }

  // Default fallback if detection fails
  if (!countryCode) {
    countryCode = 'lk'; // default to Sri Lanka
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
