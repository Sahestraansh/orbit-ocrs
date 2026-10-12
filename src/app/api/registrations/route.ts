import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const requestSchema = z.object({ sectionId: z.string().uuid() });

async function getStudent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
  if (role?.role !== "student") return { error: NextResponse.json({ error: "Student access required." }, { status: 403 }) };
  return { supabase };
}

async function parseRequest(request: NextRequest) {
  const result = requestSchema.safeParse(await request.json().catch(() => null));
  return result.success ? result.data : null;
}

export async function POST(request: NextRequest) {
  const auth = await getStudent();
  if (auth.error) return auth.error;
  const body = await parseRequest(request);
  if (!body) return NextResponse.json({ error: "A valid section is required." }, { status: 400 });
  const { data, error } = await auth.supabase!.rpc("register_for_section", { p_section_id: body.sectionId });
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  return NextResponse.json({ registration: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await getStudent();
  if (auth.error) return auth.error;
  const body = await parseRequest(request);
  if (!body) return NextResponse.json({ error: "A valid section is required." }, { status: 400 });
  const { data, error } = await auth.supabase!.rpc("drop_registration", { p_section_id: body.sectionId });
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  return NextResponse.json({ registration: data });
}
