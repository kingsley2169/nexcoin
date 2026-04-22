export type AdminUserStatus = "Active" | "Flagged" | "Suspended";

export type AdminUserKycStatus = "Approved" | "Pending" | "Rejected" | "Unverified";

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

export const adminUsersData: AdminUsersData = {
	summary: {
		activeUsers: 2394,
		flaggedUsers: 18,
		pendingKyc: 146,
		totalUsers: 2846,
	},
	users: [
		{
			activePlans: 2,
			availableBalanceUsd: 6850,
			country: "Cyprus",
			createdAt: "2026-01-14T10:20:00Z",
			depositsUsd: 27820,
			email: "alex.morgan@example.com",
			id: "usr-1001",
			kycStatus: "Pending",
			lastActiveAt: "2026-04-22T09:52:00Z",
			name: "Alex Morgan",
			risk: "Medium",
			status: "Flagged",
			withdrawalsUsd: 2486.77,
		},
		{
			activePlans: 1,
			availableBalanceUsd: 1420,
			country: "United States",
			createdAt: "2026-02-03T15:44:00Z",
			depositsUsd: 9200,
			email: "maya.chen@example.com",
			id: "usr-1002",
			kycStatus: "Approved",
			lastActiveAt: "2026-04-22T08:41:00Z",
			name: "Maya Chen",
			risk: "Low",
			status: "Active",
			withdrawalsUsd: 1250,
		},
		{
			activePlans: 4,
			availableBalanceUsd: 18500,
			country: "Nigeria",
			createdAt: "2025-11-20T12:11:00Z",
			depositsUsd: 84200,
			email: "daniel.brooks@example.com",
			id: "usr-1003",
			kycStatus: "Approved",
			lastActiveAt: "2026-04-21T23:12:00Z",
			name: "Daniel Brooks",
			risk: "Low",
			status: "Active",
			withdrawalsUsd: 12600,
		},
		{
			activePlans: 0,
			availableBalanceUsd: 0,
			country: "United Kingdom",
			createdAt: "2026-04-10T09:18:00Z",
			depositsUsd: 300,
			email: "victor.stone@example.com",
			id: "usr-1004",
			kycStatus: "Unverified",
			lastActiveAt: "2026-04-22T08:10:00Z",
			name: "Victor Stone",
			risk: "High",
			status: "Flagged",
			withdrawalsUsd: 0,
		},
		{
			activePlans: 1,
			availableBalanceUsd: 890,
			country: "Canada",
			createdAt: "2026-03-18T16:26:00Z",
			depositsUsd: 5250,
			email: "lynn.foster@example.com",
			id: "usr-1005",
			kycStatus: "Pending",
			lastActiveAt: "2026-04-22T09:48:00Z",
			name: "Lynn Foster",
			risk: "Medium",
			status: "Active",
			withdrawalsUsd: 500,
		},
		{
			activePlans: 0,
			availableBalanceUsd: 120,
			country: "Germany",
			createdAt: "2026-02-27T14:03:00Z",
			depositsUsd: 1600,
			email: "grace.lee@example.com",
			id: "usr-1006",
			kycStatus: "Rejected",
			lastActiveAt: "2026-04-19T19:32:00Z",
			name: "Grace Lee",
			risk: "High",
			status: "Suspended",
			withdrawalsUsd: 1480,
		},
	],
};
