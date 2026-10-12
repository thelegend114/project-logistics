import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const allowedRoles = [
  "owner",
  "admin",
  "dispatcher",
  "safety",
  "accounting",
  "maintenance",
  "driver",
  "customer",
  "broker",
];

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required." },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const publishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const secretKey =
      process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl) {
      return NextResponse.json(
        {
          error:
            "NEXT_PUBLIC_SUPABASE_URL is not configured.",
        },
        { status: 500 }
      );
    }

    if (!publishableKey) {
      return NextResponse.json(
        {
          error:
            "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not configured.",
        },
        { status: 500 }
      );
    }

    if (!secretKey) {
      return NextResponse.json(
        {
          error:
            "SUPABASE_SECRET_KEY is not configured.",
        },
        { status: 500 }
      );
    }

    /*
     * --------------------------------------------------
     * CURRENT SESSION
     * --------------------------------------------------
     */

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
                  cookieStore.set(
                    name,
                    value,
                    options
                  );
                }
              );
            } catch {
              // Cookie writes can fail in some server contexts.
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
        {
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    /*
     * --------------------------------------------------
     * ADMIN SUPABASE CLIENT
     * --------------------------------------------------
     */

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

    /*
     * --------------------------------------------------
     * CURRENT USER PROFILE
     * --------------------------------------------------
     */

    const {
      data: currentProfile,
      error: currentProfileError,
    } = await adminClient
      .from("users")
      .select(
        "id, company_id, role, active"
      )
      .eq("id", currentUser.id)
      .maybeSingle();

    if (currentProfileError) {
      console.error(
        "CURRENT PROFILE ERROR:",
        currentProfileError
      );

      return NextResponse.json(
        {
          error:
            "Unable to load your Project Logistics profile.",
          details:
            currentProfileError.message,
        },
        { status: 500 }
      );
    }

    if (!currentProfile) {
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
        {
          error: "Your account is inactive.",
        },
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
            "Only Owners and Admins can edit users.",
        },
        { status: 403 }
      );
    }

    /*
     * --------------------------------------------------
     * TARGET USER
     * --------------------------------------------------
     */

    const {
      data: targetUser,
      error: targetError,
    } = await adminClient
      .from("users")
      .select(
        "id, company_id, full_name, email, role, phone, active, created_at"
      )
      .eq("id", id)
      .maybeSingle();

    if (targetError) {
      console.error(
        "TARGET USER ERROR:",
        targetError
      );

      return NextResponse.json(
        {
          error:
            "Unable to load the user.",
          details:
            targetError.message,
        },
        { status: 500 }
      );
    }

    if (!targetUser) {
      return NextResponse.json(
        {
          error: "User not found.",
        },
        { status: 404 }
      );
    }

    /*
     * --------------------------------------------------
     * COMPANY SECURITY
     * --------------------------------------------------
     */

    if (
      targetUser.company_id !==
      currentProfile.company_id
    ) {
      return NextResponse.json(
        {
          error:
            "You cannot edit a user from another company.",
        },
        { status: 403 }
      );
    }

    /*
     * --------------------------------------------------
     * REQUEST BODY
     * --------------------------------------------------
     */

    let body: {
      full_name?: unknown;
      email?: unknown;
      phone?: unknown;
      role?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const fullName =
      typeof body.full_name === "string"
        ? body.full_name.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim()
        : "";

    const role =
      typeof body.role === "string"
        ? body.role.trim().toLowerCase()
        : "";

    /*
     * --------------------------------------------------
     * VALIDATION
     * --------------------------------------------------
     */

    if (!fullName) {
      return NextResponse.json(
        {
          error:
            "Full name is required.",
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          error:
            "Email is required.",
        },
        { status: 400 }
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        {
          error:
            "Invalid user role.",
        },
        { status: 400 }
      );
    }

    /*
     * --------------------------------------------------
     * ROLE SECURITY
     * --------------------------------------------------
     */

    if (
      role === "owner" &&
      currentRole !== "owner"
    ) {
      return NextResponse.json(
        {
          error:
            "Only an Owner can assign the Owner role.",
        },
        { status: 403 }
      );
    }

    if (
      String(targetUser.role || "").toLowerCase() ===
        "owner" &&
      currentRole !== "owner"
    ) {
      return NextResponse.json(
        {
          error:
            "Only an Owner can edit an Owner account.",
        },
        { status: 403 }
      );
    }

    /*
     * --------------------------------------------------
     * CHECK DUPLICATE EMAIL IN AUTH
     * --------------------------------------------------
     */

    const {
      data: authUsers,
      error: listUsersError,
    } =
      await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    if (listUsersError) {
      console.error(
        "LIST AUTH USERS ERROR:",
        listUsersError
      );

      return NextResponse.json(
        {
          error:
            "Unable to check existing authentication users.",
          details:
            listUsersError.message,
        },
        { status: 500 }
      );
    }

    const duplicate = authUsers.users.find(
      (authUser) =>
        authUser.id !== id &&
        authUser.email?.toLowerCase() ===
          email
    );

    if (duplicate) {
      return NextResponse.json(
        {
          error:
            "A user with this email already exists.",
        },
        { status: 409 }
      );
    }

    /*
     * --------------------------------------------------
     * UPDATE SUPABASE AUTH
     * --------------------------------------------------
     */

    const {
      data: updatedAuthUser,
      error: authUpdateError,
    } =
      await adminClient.auth.admin.updateUserById(
        id,
        {
          email,
          user_metadata: {
            full_name: fullName,
          },
        }
      );

    if (authUpdateError) {
      console.error(
        "AUTH UPDATE ERROR:",
        authUpdateError
      );

      return NextResponse.json(
        {
          error:
            "Unable to update the authentication user.",
          details:
            authUpdateError.message,
        },
        { status: 500 }
      );
    }

    if (!updatedAuthUser?.user) {
      return NextResponse.json(
        {
          error:
            "Authentication user was not returned after update.",
        },
        { status: 500 }
      );
    }

    /*
     * --------------------------------------------------
     * UPDATE PROJECT LOGISTICS PROFILE
     * --------------------------------------------------
     */

    const {
      data: updatedUser,
      error: profileUpdateError,
    } = await adminClient
      .from("users")
      .update({
        full_name: fullName,
        email,
        phone: phone || null,
        role,
      })
      .eq("id", id)
      .eq(
        "company_id",
        currentProfile.company_id
      )
      .select(
        "id, company_id, full_name, email, role, phone, active, created_at"
      )
      .single();

    if (profileUpdateError) {
      console.error(
        "PROFILE UPDATE ERROR:",
        profileUpdateError
      );

      return NextResponse.json(
        {
          error:
            "Authentication was updated, but the Project Logistics profile could not be updated.",
          details:
            profileUpdateError.message,
        },
        { status: 500 }
      );
    }

    if (!updatedUser) {
      return NextResponse.json(
        {
          error:
            "The user profile was not returned after the update.",
        },
        { status: 500 }
      );
    }

    /*
     * --------------------------------------------------
     * SUCCESS
     * --------------------------------------------------
     */

    return NextResponse.json(
      {
        success: true,
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "UPDATE USER UNEXPECTED ERROR:",
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