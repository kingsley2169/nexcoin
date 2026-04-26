import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refresh the auth token so server components and actions see a valid session.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = pathname.startsWith("/nexcoin-admin-priv");
  const isAdminLoginRoute = pathname === "/nexcoin-admin-priv/login";

  if (!isAdminRoute) {
    return supabaseResponse;
  }

  if (!user) {
    if (!isAdminLoginRoute) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/nexcoin-admin-priv/login";
      loginUrl.search = "error=Sign+in+to+access+the+admin+console.";
      return NextResponse.redirect(loginUrl);
    }

    return supabaseResponse;
  }

  const { data: isAdmin, error: isAdminError } = await supabase.rpc("is_admin");

  if (isAdminError) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/nexcoin-admin-priv/login";
    loginUrl.search = "error=Unable+to+verify+admin+access.";
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminLoginRoute && isAdmin) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/nexcoin-admin-priv";
    adminUrl.search = "";
    return NextResponse.redirect(adminUrl);
  }

  if (!isAdmin && !isAdminLoginRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/nexcoin-admin-priv/login";
    loginUrl.search = "error=This+account+is+not+approved+for+admin+access.";
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}
