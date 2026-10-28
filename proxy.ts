
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { canAccessRoute } from "@/lib/permissions";

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });
  return target;
}

function getSafeDestination(request: NextRequest, userRole: string): string {
  const requested = request.nextUrl.searchParams.get("redirect");
  const fallback = userRole === "driver" ? "/drive" : "/";

  if (
    requested &&
    requested.startsWith("/") &&
    !requested.startsWith("//") &&
    requested !== "/login" &&
    canAccessRoute(userRole, requested)
  ) {
    return requested;
  }

  return fallback;
}

export async function proxy(request: NextRequest) {
  const { response, userRole } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  console.log("PROXY:", pathname, "ROLE:", userRole);

  if (pathname.startsWith("/api/")) return response;

  if (pathname === "/login") {
    if (!userRole) return response;

    const destination = getSafeDestination(request, userRole);
    const destinationUrl = request.nextUrl.clone();
    destinationUrl.pathname = destination;
    destinationUrl.search = "";

    return copyCookies(response, NextResponse.redirect(destinationUrl));
  }

  if (!userRole) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("redirect", pathname);

    return copyCookies(response, NextResponse.redirect(loginUrl));
  }

  if (!canAccessRoute(userRole, pathname)) {
    const fallbackPath = userRole === "driver" ? "/drive" : "/";
    const fallbackUrl = request.nextUrl.clone();
    fallbackUrl.pathname = fallbackPath;
    fallbackUrl.search = "";

    return copyCookies(response, NextResponse.redirect(fallbackUrl));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
