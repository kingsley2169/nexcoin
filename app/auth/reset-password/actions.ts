"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

function redirectWithMessage(type: "error" | "success", message: string): never {
	const params = new URLSearchParams({ [type]: message });
	redirect(`/auth/reset-password?${params.toString()}`);
}

export async function updatePassword(formData: FormData) {
	const password = String(formData.get("password") ?? "");
	const confirmPassword = String(formData.get("confirm_password") ?? "");

	if (password.length < 8) {
		redirectWithMessage("error", "Password must be at least 8 characters.");
	}

	if (password !== confirmPassword) {
		redirectWithMessage("error", "Passwords do not match.");
	}

	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect(
			"/auth/forgot-password?error=Your reset link has expired. Please request a new one.",
		);
	}

	const { error } = await supabase.auth.updateUser({ password });

	if (error) {
		redirectWithMessage("error", error.message);
	}

	await supabase.auth.signOut();
	redirect(
		"/auth/login?success=Password updated. Sign in with your new password.",
	);
}
