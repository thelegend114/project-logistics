import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const cookieStore = await cookies();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const secretKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !publishableKey || !secretKey) {
      return NextResponse.json(
        {
          error: "Supabase server configuration is incomplete.",
        },
        { status: 500 }
      );
    }

    const sessionClient = createServerClient(
      supabaseUrl,
      publishableKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(
                ({ name, value, options }) => {
                  cookieStore.set(name, value, options);
                }
              );
            } catch {
              // Ignore cookie write errors.
            }
          },
        },
      }
    );

    const {
      data: { user: currentUser },
      error: authError,
    } = await sessionClient.auth.getUser();

    if (authError || !currentUser) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const adminClient = createClient(
      supabaseUrl,
      secretKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const {
      data: currentProfile,
      error: currentProfileError,
    } = await adminClient
      .from("users")
      .select("id, company_id, role, active")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (currentProfileError || !currentProfile) {
      return NextResponse.json(
        {
          error:
            "Your Project Logistics profile was not found.",
        },
        { status: 403 }
      );
    }

    if (currentProfile.active === false) {
      return NextResponse.json(
        { error: "Your account is inactive." },
        { status: 403 }
      );
    }

    const currentRole = String(
      currentProfile.role || ""
    ).toLowerCase();

    if (
      currentRole !== "owner" &&
      currentRole !== "admin"
    ) {
      return NextResponse.json(
        {
          error:
            "Only Owners and Admins can reset user passwords.",
        },
        { status: 403 }
      );
    }

    const {
      data: targetUser,
      error: targetError,
    } = await adminClient
      .from("users")
      .select(
        "id, company_id, role, active"
      )
      .eq("id", id)
      .maybeSingle();

    if (targetError || !targetUser) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    if (
      targetUser.company_id !==
      currentProfile.company_id
    ) {
      return NextResponse.json(
        {
          error:
            "You cannot reset a user from another company.",
        },
        { status: 403 }
      );
    }

    if (
      targetUser.role?.toLowerCase() ===
        "owner" &&
      currentRole !== "owner"
    ) {
      return NextResponse.json(
        {
          error:
            "Only an Owner can reset an Owner account password.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (password.length < 8) {
      return NextResponse.json(
        {
          error:
            "Temporary password must contain at least 8 characters.",
        },
        { status: 400 }
      );
    }

    const { error: passwordError } =
      await adminClient.auth.admin.updateUserById(
        id,
        {
          password,
        }
      );

    if (passwordError) {
      return NextResponse.json(
        {
          error:
            "Unable to update the user password.",
          details: passwordError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User password updated successfully.",
    });
  } catch (error) {
    console.error(
      "RESET USER PASSWORD ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error.",
      },
      { status: 500 }
    );
  }
}
