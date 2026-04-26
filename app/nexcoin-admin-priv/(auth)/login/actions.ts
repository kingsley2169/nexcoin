"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin-auth";
import { createClient } from "@/utils/supabase/server";

function redirectWithMessage(type: "error" | "success", message: string): never {
	const params = new URLSearchParams({ [type]: message });
	redirect(`/nexcoin-admin-priv/login?${params.toString()}`);
}

export async function signIn(formData: FormData) {
	const email = String(formData.get("email") ?? "").trim().toLowerCase();
	const password = String(formData.get("password") ?? "");

	if (!email || !password) {
		redirectWithMessage("error", "Enter your admin email and password to continue.");
	}

	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);
	const { error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});

	if (error) {
		redirectWithMessage("error", error.message);
	}

	const { isAdmin } = await getAdminAccess(supabase);

	if (!isAdmin) {
		await supabase.auth.signOut();
		redirectWithMessage(
			"error",
			"This account is not approved for admin access.",
		);
	}

	redirect("/nexcoin-admin-priv");
}
