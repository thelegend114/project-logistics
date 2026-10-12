import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    success: true,
  });

  const cookies = response.cookies;

  for (const cookie of cookies.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      response.cookies.set(cookie.name, "", {
        expires: new Date(0),
        path: "/",
      });
    }
  }

  return response;
}