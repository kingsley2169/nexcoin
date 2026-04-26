import type { SupabaseClient, User } from "@supabase/supabase-js";

export type AdminRole =
	| "owner"
	| "admin"
	| "finance"
	| "compliance"
	| "support"
	| "viewer";

type AdminAccess = {
	adminRole: AdminRole | null;
	isAdmin: boolean;
	user: User | null;
};

function normalizeAdminRole(value: unknown): AdminRole | null {
	switch (value) {
		case "owner":
		case "admin":
		case "finance":
		case "compliance":
		case "support":
		case "viewer":
			return value;
		default:
			return null;
	}
}

export async function getAdminAccess(
	supabase: SupabaseClient,
): Promise<AdminAccess> {
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();

	if (userError) {
		if (userError.message === "Auth session missing!") {
			return {
				adminRole: null,
				isAdmin: false,
				user: null,
			};
		}

		throw new Error(userError.message);
	}

	if (!user) {
		return {
			adminRole: null,
			isAdmin: false,
			user: null,
		};
	}

	const [{ data: isAdminResult, error: isAdminError }, { data: roleResult, error: roleError }] =
		await Promise.all([
			supabase.rpc("is_admin"),
			supabase.rpc("current_admin_role"),
		]);

	if (isAdminError) {
		throw new Error(isAdminError.message);
	}

	if (roleError) {
		throw new Error(roleError.message);
	}

	return {
		adminRole: normalizeAdminRole(roleResult),
		isAdmin: Boolean(isAdminResult),
		user,
	};
}
