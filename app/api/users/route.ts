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

export async function POST(request: NextRequest) {
  try {
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
        {
          error: "You must be logged in.",
        },
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
      error: profileError,
    } = await adminClient
      .from("users")
      .select(
        "id, company_id, role, active"
      )
      .eq("id", currentUser.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        {
          error:
            "Unable to load your Project Logistics profile.",
          details: profileError.message,
        },
        { status: 500 }
      );
    }

    if (!currentProfile) {
      return NextResponse.json(
        {
          error:
            "Your Project Logistics user profile was not found.",
        },
        { status: 403 }
      );
    }

    if (currentProfile.active === false) {
      return NextResponse.json(
        {
          error:
            "Your account is inactive.",
        },
        { status: 403 }
      );
    }

    const currentRole =
      String(currentProfile.role || "").toLowerCase();

    if (
      currentRole !== "owner" &&
      currentRole !== "admin"
    ) {
      return NextResponse.json(
        {
          error:
            "Only Owners and Admins can create users.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

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

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (!fullName) {
      return NextResponse.json(
        {
          error: "Full name is required.",
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          error: "Email is required.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error:
            "Temporary password must be at least 8 characters.",
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

    if (
      role === "owner" &&
      currentRole !== "owner"
    ) {
      return NextResponse.json(
        {
          error:
            "Only an Owner can create another Owner.",
        },
        { status: 403 }
      );
    }

    const {
      data: existingUsers,
      error: existingUsersError,
    } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (existingUsersError) {
      return NextResponse.json(
        {
          error:
            "Unable to check existing authentication users.",
          details:
            existingUsersError.message,
        },
        { status: 500 }
      );
    }

    const emailExists =
      existingUsers.users.some(
        (authUser) =>
          authUser.email?.toLowerCase() === email
      );

    if (emailExists) {
      return NextResponse.json(
        {
          error:
            "A user with this email already exists.",
        },
        { status: 409 }
      );
    }

    const {
      data: createdAuth,
      error: createAuthError,
    } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
      });

    if (
      createAuthError ||
      !createdAuth.user
    ) {
      return NextResponse.json(
        {
          error:
            createAuthError?.message ||
            "Unable to create the authentication user.",
        },
        { status: 500 }
      );
    }

    const authUserId =
      createdAuth.user.id;

    const {
      data: createdProfile,
      error: profileInsertError,
    } = await adminClient
      .from("users")
      .insert({
        id: authUserId,
        company_id:
          currentProfile.company_id,
        full_name: fullName,
        email,
        role,
        phone: phone || null,
        active: true,
      })
      .select(
        "id, company_id, full_name, email, role, phone, active, created_at"
      )
      .single();

    if (profileInsertError) {
      await adminClient.auth.admin.deleteUser(
        authUserId
      );

      return NextResponse.json(
        {
          error:
            "Authentication user was created, but the Project Logistics profile could not be created.",
          details:
            profileInsertError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "User created successfully.",
        user: createdProfile,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "CREATE USER ERROR:",
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