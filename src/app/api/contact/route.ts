import { NextRequest, NextResponse } from "next/server";
import { submitContact } from "@/lib/contact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const data = await req.json().catch(() => null);
  const result = await submitContact(data);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
