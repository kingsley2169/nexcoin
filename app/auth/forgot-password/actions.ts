"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

function redirectWithMessage(type: "error" | "success", message: string): never {
	const params = new URLSearchParams({ [type]: message });
	redirect(`/auth/forgot-password?${params.toString()}`);
}

const GENERIC_SUCCESS =
	"If that email is registered, we've sent a reset link. Check your inbox (and spam folder).";

export async function requestPasswordReset(formData: FormData) {
	const email = String(formData.get("email") ?? "").trim().toLowerCase();

	if (!email) {
		redirectWithMessage("error", "Enter the email connected to your account.");
	}

	const cookieStore = await cookies();
	const requestHeaders = await headers();
	const supabase = createClient(cookieStore);

	const host =
		requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
	const proto = requestHeaders.get("x-forwarded-proto") ?? "https";
	const redirectTo = host
		? `${proto}://${host}/auth/reset-password`
		: undefined;

	const { error } = await supabase.auth.resetPasswordForEmail(email, {
		redirectTo,
	});

	if (error) {
		// Rate-limit and a couple of similar errors should surface clearly so the
		// user doesn't keep retrying. Everything else falls through to the generic
		// success message — we don't want to leak whether an email is registered.
		if (
			error.code === "over_email_send_rate_limit" ||
			error.code === "over_request_rate_limit"
		) {
			redirectWithMessage(
				"error",
				"Too many reset requests right now. Please wait a minute and try again.",
			);
		}
	}

	redirectWithMessage("success", GENERIC_SUCCESS);
}
