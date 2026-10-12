import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl) {
      return NextResponse.json(
        {
          error: "Missing NEXT_PUBLIC_SUPABASE_URL",
        },
        { status: 500 }
      );
    }

    if (!supabaseSecretKey) {
      return NextResponse.json(
        {
          error: "Missing SUPABASE_SECRET_KEY",
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const {
      driver_id,
      load_id,
      latitude,
      longitude,
      speed,
      heading,
      recorded_at,
    } = body;

    if (!driver_id) {
      return NextResponse.json(
        {
          error: "driver_id is required",
        },
        { status: 400 }
      );
    }

    if (!load_id) {
      return NextResponse.json(
        {
          error: "load_id is required",
        },
        { status: 400 }
      );
    }

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number"
    ) {
      return NextResponse.json(
        {
          error: "latitude and longitude must be numbers",
        },
        { status: 400 }
      );
    }

    if (latitude < -90 || latitude > 90) {
      return NextResponse.json(
        {
          error: "Invalid latitude",
        },
        { status: 400 }
      );
    }

    if (longitude < -180 || longitude > 180) {
      return NextResponse.json(
        {
          error: "Invalid longitude",
        },
        { status: 400 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseSecretKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data, error } = await supabase
      .from("gps_events")
      .insert({
        driver_id,
        load_id,
        latitude,
        longitude,
        speed:
          typeof speed === "number"
            ? speed
            : null,
        heading:
          typeof heading === "number"
            ? heading
            : null,
        recorded_at:
          recorded_at ||
          new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error(
        "Supabase GPS insert error:",
        error
      );

      return NextResponse.json(
        {
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GPS API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected GPS API error",
      },
      { status: 500 }
    );
  }
}