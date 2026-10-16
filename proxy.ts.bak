import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { canAccessRoute } from "@/lib/permissions";

export async function proxy(request: NextRequest) {
  const { response, userRole } =
    await updateSession(request);

  const pathname = request.nextUrl.pathname;

  console.log(
    "PROXY:",
    pathname,
    "ROLE:",
    userRole
  );

  if (pathname === "/login") {
    return response;
  }

  // API routes handle their own authentication
  // and authorization inside the route handler.
  if (pathname.startsWith("/api/")) {
    return response;
  }

  if (!userRole) {
  const loginUrl = request.nextUrl.clone();

  loginUrl.pathname = "/login";
  loginUrl.search = "";
  loginUrl.searchParams.set("redirect", pathname);

  const redirectResponse = NextResponse.redirect(loginUrl);

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

  if (!canAccessRoute(userRole, pathname)) {
  const fallbackPath =
    userRole === "driver"
      ? "/drive"
      : "/";

  const fallbackUrl = request.nextUrl.clone();

  fallbackUrl.pathname = fallbackPath;
  fallbackUrl.search = "";

  const redirectResponse =
    NextResponse.redirect(fallbackUrl);

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};