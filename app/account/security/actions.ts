"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

type UpdateSecuritySettingsInput = {
	confirmNewWithdrawalAddresses?: boolean;
	newDeviceAlerts?: boolean;
};

export async function enableTwoFactor(): Promise<ActionResult> {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return {
			ok: false,
			error: "Sign in to enable two-factor authentication.",
		};
	}

	const { error } = await supabase.rpc("user_enable_2fa", {
		p_method: "authenticator_app",
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/account/security");
	return { ok: true };
}

export async function disableTwoFactor(): Promise<ActionResult> {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to disable two-factor authentication." };
	}

	const { error } = await supabase.rpc("user_disable_2fa");

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/account/security");
	return { ok: true };
}

export async function regenerateBackupCodes(): Promise<ActionResult> {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to regenerate backup codes." };
	}

	const { error } = await supabase.rpc("user_regenerate_backup_codes");

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/account/security");
	return { ok: true };
}

export async function revokeDevice(deviceId: string): Promise<ActionResult> {
	if (!deviceId) {
		return { ok: false, error: "Missing device id." };
	}

	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to remove devices." };
	}

	const { error } = await supabase.rpc("user_revoke_device", {
		p_device_id: deviceId,
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/account/security");
	return { ok: true };
}

export async function updateSecuritySettings(
	input: UpdateSecuritySettingsInput,
): Promise<ActionResult> {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to update security settings." };
	}

	const { error } = await supabase.rpc("user_update_security_settings", {
		p_confirm_new_withdrawal_addresses:
			input.confirmNewWithdrawalAddresses ?? null,
		p_new_device_alerts: input.newDeviceAlerts ?? null,
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/account/security");
	return { ok: true };
}

export async function changePassword(
	currentPassword: string,
	newPassword: string,
): Promise<ActionResult> {
	if (!currentPassword || !newPassword) {
		return { ok: false, error: "Enter both current and new password." };
	}

	if (newPassword.length < 8) {
		return { ok: false, error: "New password must be at least 8 characters." };
	}

	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to change your password." };
	}

	if (!user.email) {
		return { ok: false, error: "Could not retrieve account email." };
	}

	const { error: signInError } = await supabase.auth.signInWithPassword({
		email: user.email,
		password: currentPassword,
	});

	if (signInError) {
		return { ok: false, error: "Current password is incorrect." };
	}

	const { error: updateError } = await supabase.auth.updateUser({
		password: newPassword,
	});

	if (updateError) {
		return { ok: false, error: updateError.message };
	}

	const { error: rpcError } = await supabase.rpc("user_update_security_settings", {
		p_password_last_changed_at: new Date().toISOString(),
	});

	if (rpcError) {
		return { ok: false, error: rpcError.message };
	}

	revalidatePath("/account/security");
	return { ok: true };
}
