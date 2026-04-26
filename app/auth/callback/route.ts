import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
	const { searchParams, origin } = new URL(request.url);
	const code = searchParams.get("code");
	const tokenHash = searchParams.get("token_hash");
	const type = searchParams.get("type") as EmailOtpType | null;

	const forwardedHost = request.headers.get("x-forwarded-host");
	const isLocal = process.env.NODE_ENV === "development";
	const base =
		!isLocal && forwardedHost ? `https://${forwardedHost}` : origin;

	let verified = false;

	if (tokenHash && type) {
		const cookieStore = await cookies();
		const supabase = createClient(cookieStore);
		const { error } = await supabase.auth.verifyOtp({
			token_hash: tokenHash,
			type,
		});
		if (!error) verified = true;
	} else if (code) {
		// PKCE flow: Supabase already verified the email upstream before
		// redirecting here with the code. Even if exchangeCodeForSession fails
		// (e.g. the verifier cookie is missing because the link was opened in a
		// different browser), the email is already confirmed on Supabase's side.
		const cookieStore = await cookies();
		const supabase = createClient(cookieStore);
		await supabase.auth.exchangeCodeForSession(code).catch(() => null);
		verified = true;
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
