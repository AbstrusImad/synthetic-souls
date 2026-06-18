import { NextResponse } from "next/server";

// Static export friendly: prerendered at build time.
export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({ message: "Hello, world!" });
}