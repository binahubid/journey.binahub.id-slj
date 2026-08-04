import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const protectedPrefixes = ["/admin", "/company", "/dashboard", "/onboarding", "/baseline", "/initial-process", "/journey", "/monitoring", "/journal", "/profile", "/settings", "/notifications"];
    if (protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix))) {
      return new NextResponse("Service configuration unavailable", { status: 503 });
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options?: Record<string, unknown>;
        }[]
      ) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options as any)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Protected routes list
  const protectedRoutes = [
    "/dashboard",
    "/onboarding",
    "/baseline",
    "/initial-process",
    "/journey",
    "/monitoring",
    "/journal",
    "/coach",
    "/admin",
    "/profile",
    "/settings",
    "/notifications",
    "/company",
  ];

  const isProtectedRoute = protectedRoutes.some((route) =>
    path.startsWith(route)
  );

  // 1. Unauthenticated users accessing protected routes -> Redirect to /login
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 2. Authenticated user checks
  if (user) {
    // Query user profile & journey to verify role and onboarding status
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, program_code")
      .eq("user_id", user.id)
      .maybeSingle();

    const role = profile?.role || (user?.app_metadata?.role as string) || "participant";

    // Admin route protection: Only admin
    if (path.startsWith("/admin") && role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = role === "coach" ? "/coach" : "/dashboard";
      return NextResponse.redirect(url);
    }

    // Coach route protection: Only coach or admin
    if (path.startsWith("/coach") && role !== "coach" && role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    // Participant Onboarding Gatekeeper Enforcement
    if (role === "participant") {
      const { data: journey } = await supabase
        .from("journeys")
        .select("status, area_transformasi")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Onboarding is incomplete if program_code is missing OR journey status is ONBOARDING / missing
      const isCompletedOnboarding = Boolean(
        profile?.program_code &&
          journey?.status &&
          journey.status !== "ONBOARDING"
      );

      let baselineCompleted = false;
      let initialProcessCompleted = false;
      let ptpCompleted = false;

      if (isCompletedOnboarding) {
        const [{ data: baseline }, { data: initialProcess }, { data: actionPlans }] = await Promise.all([
          supabase.from("baseline_assessments").select("completed").eq("user_id", user.id).maybeSingle(),
          supabase.from("sahabat_safar_profiles").select("is_completed").eq("user_id", user.id).maybeSingle(),
          supabase.from("action_plans").select("id").eq("user_id", user.id).limit(1),
        ]);
        baselineCompleted = baseline?.completed === true;
        initialProcessCompleted = initialProcess?.is_completed === true;
        ptpCompleted = Boolean(
          Array.isArray(journey?.area_transformasi) &&
          journey.area_transformasi.length === 3 &&
          actionPlans && actionPlans.length > 0
        );
      }

      // A) Incomplete onboarding -> Block dashboard, journey, journal, monitoring, etc. -> Redirect to /onboarding
      if (!isCompletedOnboarding && path !== "/onboarding") {
        const url = request.nextUrl.clone();
        url.pathname = "/onboarding";
        return NextResponse.redirect(url);
      }

      // B) Completed onboarding -> Block visiting /onboarding again -> Redirect to /dashboard
      if (isCompletedOnboarding && path === "/onboarding") {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }

      const ptpRequiredRoutes = ["/dashboard", "/monitoring"];
      if (
        isCompletedOnboarding &&
        baselineCompleted &&
        initialProcessCompleted &&
        !ptpCompleted &&
        ptpRequiredRoutes.some((route) => path.startsWith(route))
      ) {
        const url = request.nextUrl.clone();
        url.pathname = "/journey";
        return NextResponse.redirect(url);
      }
    }

    // Auto-redirect logged in users visiting /login or /register to their landing area
    if (path === "/login" || path === "/register") {
      const url = request.nextUrl.clone();
      if (role === "admin") {
        url.pathname = "/admin";
      } else if (role === "coach") {
        url.pathname = "/coach";
      } else {
        url.pathname = "/dashboard";
      }
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
