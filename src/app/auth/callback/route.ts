import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, getRoleRedirectPath } from "@/lib/auth-role";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const user = data.user;

      // 1. Fetch user profile from database
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("user_id", user.id)
        .maybeSingle();

      // 2. Resolve role (app_metadata.role -> user_metadata.role -> profile.role)
      const role = getUserRole(user, profile?.role);

      if (!profile) {
        // First-time user registration
        const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Pengguna SLJ";

        await supabase.from("profiles").insert({
          user_id: user.id,
          full_name: fullName,
          avatar_url: user.user_metadata?.avatar_url || null,
          role: role,
          location: "Jakarta",
        });

        if (role === "participant") {
          await supabase.from("journeys").insert({
            user_id: user.id,
            status: "ONBOARDING",
          });
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }

      // 3. Existing user or non-participant role -> Auto classify and redirect
      if (role === "admin") {
        return NextResponse.redirect(`${origin}/admin`);
      }

      if (role === "coach") {
        return NextResponse.redirect(`${origin}/coach`);
      }

      // Participant -> Check journey onboarding status
      const { data: journey } = await supabase
        .from("journeys")
        .select("status")
        .eq("user_id", user.id)
        .single();

      if (journey?.status === "ONBOARDING") {
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // Auth error fallback
  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
