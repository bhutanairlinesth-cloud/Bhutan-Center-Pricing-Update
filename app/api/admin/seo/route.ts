import { NextResponse } from "next/server";
import { loadSeoState, saveSeoState } from "@/lib/seo-store";
import type { SeoState } from "@/lib/seo-config";

export async function GET() {
  const state = await loadSeoState();
  return NextResponse.json({ state, persistent: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) });
}

export async function PUT(request: Request) {
  const requiredToken = process.env.BHUTAN_ADMIN_TOKEN;
  const suppliedToken = request.headers.get("x-admin-token") ?? "";
  if (!requiredToken) {
    return NextResponse.json({ error: "Persistent writes are disabled until BHUTAN_ADMIN_TOKEN is configured.", persistent: false }, { status: 503 });
  }
  if (suppliedToken !== requiredToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as { state?: SeoState };
  if (!body.state) return NextResponse.json({ error: "Missing SEO state" }, { status: 400 });
  const state = { ...body.state, updatedAt: new Date().toISOString() };
  const result = await saveSeoState(state);
  return NextResponse.json({ ok: true, ...result, state });
}
