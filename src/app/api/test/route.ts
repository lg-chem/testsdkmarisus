import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Super simple test - no imports, no logic
export async function GET() {
  return NextResponse.json({ ok: true, time: Date.now() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({ ok: true, received: body });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
}
