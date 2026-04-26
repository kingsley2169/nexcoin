"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

function redirectWithMessage(type: "error" | "success", message: string): never {
	const params = new URLSearchParams({ [type]: message });
	redirect(`/auth/login?${params.toString()}`);
}

export async function signIn(formData: FormData) {
	const email = String(formData.get("email") ?? "").trim().toLowerCase();
	const password = String(formData.get("password") ?? "");

	if (!email || !password) {
		redirectWithMessage("error", "Enter your email and password to sign in.");
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

	redirect("/account");
}
