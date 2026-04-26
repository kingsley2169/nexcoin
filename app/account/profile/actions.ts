"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

type DbCurrency = "eur" | "gbp" | "ngn" | "usd";
type DbDensity = "comfortable" | "compact";

type UpdateProfileInput = {
	addressCity?: string;
	addressCountry?: string;
	addressPostalCode?: string;
	addressState?: string;
	addressStreet?: string;
	country?: string;
	dashboardDensity?: DbDensity;
	dateFormat?: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
	dateOfBirth?: string;
	displayCurrency?: DbCurrency;
	firstName?: string;
	language?: string;
	lastName?: string;
	phoneNumber?: string;
	timezone?: string;
	username?: string;
};

export async function updateProfile(
	input: UpdateProfileInput,
): Promise<ActionResult> {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to update your profile." };
	}

	const { error } = await supabase.rpc("update_my_profile", {
		p_first_name: input.firstName ?? null,
		p_last_name: input.lastName ?? null,
		p_phone_number: input.phoneNumber ?? null,
		p_country: input.country ?? null,
		p_timezone: input.timezone ?? null,
		p_language: input.language ?? null,
		p_date_of_birth: input.dateOfBirth || null,
		p_address_street: input.addressStreet ?? null,
		p_address_city: input.addressCity ?? null,
		p_address_state: input.addressState ?? null,
		p_address_postal_code: input.addressPostalCode ?? null,
		p_address_country: input.addressCountry ?? null,
		p_username: input.username ?? null,
		p_display_currency: input.displayCurrency ?? null,
		p_date_format: input.dateFormat ?? null,
		p_dashboard_density: input.dashboardDensity ?? null,
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/account/profile");
	revalidatePath("/account");
	return { ok: true };
}
