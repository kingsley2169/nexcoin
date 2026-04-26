"use server";

import { redirect } from "next/navigation";
import { isIP } from "node:net";
import { cookies, headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { countryOptions } from "@/lib/profile";

function redirectWithMessage(type: "error" | "success", message: string): never {
	const params = new URLSearchParams({ [type]: message });
	redirect(`/auth/register?${params.toString()}`);
}

function friendlySignupError(error: { code?: string; message: string }): string {
	switch (error.code) {
		case "user_already_exists":
		case "email_exists":
			return "An account with that email already exists. Try signing in or resetting your password.";
		case "weak_password":
			return "Choose a stronger password — at least 8 characters with a mix of letters and numbers.";
		case "over_email_send_rate_limit":
		case "over_request_rate_limit":
			return "Too many attempts right now. Please wait a minute and try again.";
		case "signup_disabled":
			return "New signups are temporarily paused. Please try again later.";
		case "email_address_invalid":
			return "That email address looks invalid. Please double-check and try again.";
		default:
			return "We couldn't create your account. Please check your details and try again.";
	}
}

// E.164: leading +, country code digit 1–9, then up to 14 more digits (15 digits total max).
const E164_REGEX = /^\+[1-9]\d{1,14}$/;

function normalizePhoneToE164(raw: string): string | null {
	const stripped = raw.replace(/[\s\-()./]/g, "");
	return E164_REGEX.test(stripped) ? stripped : null;
}

function getSignupIp(requestHeaders: Headers) {
	const forwardedFor = requestHeaders.get("x-forwarded-for");
	const candidate =
		forwardedFor?.split(",")[0]?.trim() ||
		requestHeaders.get("x-real-ip")?.trim() ||
		requestHeaders.get("cf-connecting-ip")?.trim() ||
		requestHeaders.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
		"";

	return isIP(candidate) ? candidate : null;
}

export async function signUp(formData: FormData) {
	const fullName = String(formData.get("full_name") ?? "").trim();
	const email = String(formData.get("email") ?? "").trim().toLowerCase();
	const phoneNumber = String(formData.get("phone_number") ?? "").trim();
	const country = String(formData.get("country") ?? "").trim();
	const password = String(formData.get("password") ?? "");
	const confirmPassword = String(formData.get("confirm_password") ?? "");
	const acceptedTerms = formData.get("terms") === "on";

	if (!fullName || !email || !phoneNumber || !country || !password) {
		redirectWithMessage("error", "Complete every required field to create your account.");
	}

	if (!countryOptions.includes(country)) {
		redirectWithMessage("error", "Select a valid country from the list.");
	}

	const normalizedPhone = normalizePhoneToE164(phoneNumber);
	if (!normalizedPhone) {
		redirectWithMessage(
			"error",
			"Enter phone in international format, e.g. +15550100.",
		);
	}

	if (password.length < 8) {
		redirectWithMessage("error", "Password must be at least 8 characters.");
	}

	if (password !== confirmPassword) {
		redirectWithMessage("error", "Passwords do not match.");
	}

	if (!acceptedTerms) {
		redirectWithMessage("error", "Accept the account terms to continue.");
	}

	const cookieStore = await cookies();
	const requestHeaders = await headers();
	const supabase = createClient(cookieStore);
	const signupIp = getSignupIp(requestHeaders);
	const signupUserAgent = requestHeaders.get("user-agent")?.trim() || null;

	const host =
		requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
	const proto = requestHeaders.get("x-forwarded-proto") ?? "https";
	const emailRedirectTo = host
		? `${proto}://${host}/auth/callback`
		: undefined;

	const { data, error } = await supabase.auth.signUp({
		email,
		password,
		options: {
			emailRedirectTo,
			data: {
				full_name: fullName,
				phone_number: normalizedPhone,
				country,
				signup_ip: signupIp,
				signup_user_agent: signupUserAgent,
			},
		},
	});

	if (error) {
		redirectWithMessage("error", friendlySignupError(error));
	}

	// When email confirmation is ON, Supabase returns no session — send to login.
	// When it's OFF, the user is auto-signed-in; go straight to the dashboard.
	if (data.session) {
		redirect("/account");
	}

	redirect("/auth/login?success=Check your email to confirm your Nexcoin account.");
}
