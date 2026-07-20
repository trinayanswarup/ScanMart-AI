import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — never require auth
  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/shop") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/order-confirmation") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api");

  if (isPublic) return NextResponse.next();

  // Admin routes — check our simple auth cookie
  const authCookie = request.cookies.get("auth_mode")?.value;

  // If they aren't logged in as admin or demo, redirect to auth
  if (authCookie !== "admin" && authCookie !== "demo") {
    const loginUrl = new URL("/auth", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // They are authenticated
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all routes except Next.js internals and static files.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
