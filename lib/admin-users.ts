import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminUserStatus = "Active" | "Flagged" | "Suspended";

export type AdminUserKycStatus =
	| "Approved"
	| "Pending"
	| "Rejected"
	| "Unverified";

export type AdminUserRisk = "High" | "Low" | "Medium";

export type AdminUser = {
	activePlans: number;
	availableBalanceUsd: number;
	country: string;
	createdAt: string;
	depositsUsd: number;
	email: string;
	id: string;
	kycStatus: AdminUserKycStatus;
	lastActiveAt: string;
	name: string;
	risk: AdminUserRisk;
	status: AdminUserStatus;
	withdrawalsUsd: number;
};

export type AdminUsersData = {
	summary: {
		activeUsers: number;
		flaggedUsers: number;
		pendingKyc: number;
		totalUsers: number;
	};
	users: AdminUser[];
};

type SummaryRow = {
	active_users: number | string;
	flagged_users: number | string;
	pending_kyc: number | string;
	total_users: number | string;
};

type UserRow = {
	active_plans: number | string;
	available_balance_usd: number | string;
	country: string | null;
	created_at: string;
	deposits_usd: number | string;
	email: string | null;
	id: string;
	kyc_status: string | null;
	last_active_at: string | null;
	name: string | null;
	risk: string | null;
	status: string;
	withdrawals_usd: number | string;
};

function toNumber(value: number | string | null | undefined) {
	if (typeof value === "number") return value;
	if (typeof value === "string" && value.length > 0) return Number(value);
	return 0;
}

function mapStatus(value: string): AdminUserStatus {
	switch (value) {
		case "flagged":
			return "Flagged";
		case "suspended":
			return "Suspended";
		default:
			return "Active";
	}
}

function mapKyc(value: string | null): AdminUserKycStatus {
	switch (value) {
		case "approved":
			return "Approved";
		case "pending":
		case "in_review":
		case "needs_resubmission":
			return "Pending";
		case "rejected":
			return "Rejected";
		default:
			return "Unverified";
	}
}

function mapRisk(value: string | null): AdminUserRisk {
	switch (value) {
		case "high":
			return "High";
		case "medium":
			return "Medium";
		default:
			return "Low";
	}
}

export async function getAdminUsersData(
	supabase: SupabaseClient,
): Promise<AdminUsersData> {
	const [summaryResult, usersResult] = await Promise.all([
		supabase
			.rpc("get_admin_user_management_summary")
			.single<SummaryRow>(),
		supabase
			.from("admin_user_management_view")
			.select(
				"id,name,email,country,status,created_at,last_active_at,kyc_status,risk,available_balance_usd,deposits_usd,withdrawals_usd,active_plans",
			)
			.order("created_at", { ascending: false })
			.returns<UserRow[]>(),
	]);

	if (summaryResult.error) throw new Error(summaryResult.error.message);
	if (usersResult.error) throw new Error(usersResult.error.message);

	const summary = summaryResult.data;

	const users: AdminUser[] = (usersResult.data ?? []).map((row) => ({
		activePlans: toNumber(row.active_plans),
		availableBalanceUsd: toNumber(row.available_balance_usd),
		country: row.country ?? "",
		createdAt: row.created_at,
		depositsUsd: toNumber(row.deposits_usd),
		email: row.email ?? "",
		id: row.id,
		kycStatus: mapKyc(row.kyc_status),
		lastActiveAt: row.last_active_at ?? row.created_at,
		name: row.name ?? "Unknown user",
		risk: mapRisk(row.risk),
		status: mapStatus(row.status),
		withdrawalsUsd: toNumber(row.withdrawals_usd),
	}));

	return {
		summary: {
			activeUsers: toNumber(summary?.active_users),
			flaggedUsers: toNumber(summary?.flagged_users),
			pendingKyc: toNumber(summary?.pending_kyc),
			totalUsers: toNumber(summary?.total_users),
		},
		users,
	};
}
