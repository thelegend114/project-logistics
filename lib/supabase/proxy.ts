import { createServerClient } from "@supabase/ssr";
import {NextResponse, 
type NextRequest,} 
from "next/server";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL!;

const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export async function updateSession(
  request: NextRequest
) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value }) => {
              request.cookies.set(name, value);
            }
          );

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(
            ({ name, value, options }) => {
              response.cookies.set(
                name,
                value,
                options
              );
            }
          );
        },
      },
    }
  );

  const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();

console.log(
  "SUPABASE AUTH:",
  user ? `USER ${user.email}` : "NO USER",
  authError ? `ERROR: ${authError.message}` : "NO ERROR"
);

if (!user) {
  return {
    response,
    userRole: null,
  };
}

  const {
    data: profile,
    error,
  } = await supabase
    .from("users")
    .select("role, active")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error(
      "Unable to load user role:",
      error.message
    );

    return {
      response,
      userRole: null,
    };
  }

  if (!profile || profile.active === false) {
    return {
      response,
      userRole: null,
    };
  }

  return {
    response,
    userRole: profile.role,
  };
}