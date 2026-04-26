import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
	const { searchParams, origin } = new URL(request.url);
	const code = searchParams.get("code");
	const tokenHash = searchParams.get("token_hash");
	const type = searchParams.get("type") as EmailOtpType | null;
	const nextParam = searchParams.get("next");

	const forwardedHost = request.headers.get("x-forwarded-host");
	const isLocal = process.env.NODE_ENV === "development";
	const base =
		!isLocal && forwardedHost ? `https://${forwardedHost}` : origin;

	// Only honour `next` if it's a same-origin path under /auth/, so a malicious
	// recovery link can't redirect to an external site.
	const safeNext =
		nextParam && nextParam.startsWith("/auth/") ? nextParam : null;

	let verified = false;
	let recoveryFlow = type === "recovery";

	if (tokenHash && type) {
		const cookieStore = await cookies();
		const supabase = createClient(cookieStore);
		const { error } = await supabase.auth.verifyOtp({
			token_hash: tokenHash,
			type,
		});
		if (!error) verified = true;
	} else if (code) {
		// PKCE flow: Supabase already verified upstream. exchangeCodeForSession
		// completes the handshake and writes the session cookies on this
		// response. If the verifier cookie is missing (link opened in a
		// different browser) the exchange fails — for password recovery this
		// means the user must request a fresh link, since updateUser later
		// requires a real session.
		const cookieStore = await cookies();
		const supabase = createClient(cookieStore);
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (error) {
			if (recoveryFlow || safeNext === "/auth/reset-password") {
				return NextResponse.redirect(
					`${base}/auth/forgot-password?error=Your reset link is invalid or expired. Please request a new one.`,
				);
			}
			// Email confirmation: even if the cookie exchange failed, the
			// email is already confirmed upstream — let the user sign in.
			verified = true;
		} else {
			verified = true;
			// Same-browser PKCE password recovery comes through here; treat
			// it as a recovery flow even if `type=` wasn't passed in the URL.
			if (safeNext === "/auth/reset-password") {
				recoveryFlow = true;
			}
		}
	}

	if (verified && recoveryFlow) {
		return NextResponse.redirect(
			`${base}${safeNext ?? "/auth/reset-password"}`,
		);
	}

	if (verified && safeNext) {
		return NextResponse.redirect(`${base}${safeNext}`);
	}

	if (verified) {
		return NextResponse.redirect(
			`${base}/auth/login?success=Your email is confirmed. Please sign in to continue.`,
		);
	}

	return NextResponse.redirect(
		`${base}/auth/login?error=We couldn't confirm your email. The link may be invalid or expired.`,
	);
}
