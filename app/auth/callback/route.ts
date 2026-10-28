import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Where Google and the email link return to. Supabase sends a one-time
 * `code`; exchanging it here, with the code verifier the browser stored in
 * a cookie when sign-in started, sets the session cookie and sends the user
 * on to their wallet.
 *
 * The only server code that touches auth, and it lives in a route handler
 * because cookies can only be written from one. Must be listed in Supabase's
 * Redirect URLs for every host the app runs on.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  // Supabase reports a failed or expired link as query parameters rather
  // than a code. Pass the reason to the sign-in page so it can say so.
  if (!code) {
    const reason = searchParams.get("error_code") ?? searchParams.get("error") ?? "missing_code";
    return NextResponse.redirect(`${origin}/signin?error=${encodeURIComponent(reason)}`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    // Most often an email link opened in a different browser from the one
    // that asked for it, which has no code verifier to finish with.
    const reason = error.code ?? "exchange_failed";
    return NextResponse.redirect(`${origin}/signin?error=${encodeURIComponent(reason)}`);
  }

  return NextResponse.redirect(`${origin}/wallet`);
}
