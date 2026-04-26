export type TwoFactorMethod = "Authenticator app" | "Email" | "SMS";

export type SecurityStrength = "Needs attention" | "Strong";

export type TrustedDeviceStatus = "Current" | "Trusted" | "Review";

export type SecurityActivityStatus = "Completed" | "Review";

export type ProtectionChannel = "Email" | "In-app" | "SMS";

export type TwoFactorSettings = {
	backupCodesGeneratedAt: string;
	enabled: boolean;
	method: TwoFactorMethod;
	recoveryEmail: string;
};

export type PasswordSettings = {
	lastChangedAt: string;
	strength: SecurityStrength;
	withdrawalCooldownHours: number;
};

export type TrustedDevice = {
	browser: string;
	device: string;
	id: string;
	ipAddress: string;
	lastActiveAt: string;
	location: string;
	status: TrustedDeviceStatus;
};

export type SecurityProtection = {
	channels: ProtectionChannel[];
	description: string;
	enabled: boolean;
	id: string;
	isLocked?: boolean;
	label: string;
};

export type SecurityActivity = {
	createdAt: string;
	device: string;
	id: string;
	location: string;
	status: SecurityActivityStatus;
	title: string;
};

import type { SupabaseClient } from "@supabase/supabase-js";

export type SecurityData = {
	activity: SecurityActivity[];
	devices: TrustedDevice[];
	password: PasswordSettings;
	protections: SecurityProtection[];
	recommendations: string[];
	score: SecurityStrength;
	twoFactor: TwoFactorSettings;
};

export async function getSecurityData(
	supabase: SupabaseClient,
): Promise<SecurityData> {
	const { data, error } = await supabase
		.from("user_security_overview_view")
		.select(
			"two_factor, password, score, devices, protections, activity, recommendations",
		)
		.single();

	if (error) {
		throw new Error(error.message);
	}

	const row = data as {
		two_factor: TwoFactorSettings;
		password: PasswordSettings;
		score: SecurityStrength;
		devices: TrustedDevice[];
		protections: SecurityProtection[];
		activity: SecurityActivity[];
		recommendations: string[];
	};

	return {
		twoFactor: row.two_factor,
		password: row.password,
		score: row.score,
		devices: row.devices ?? [],
		protections: row.protections ?? [],
		activity: row.activity ?? [],
		recommendations: row.recommendations ?? [],
	};
}
