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

export type SecurityData = {
	activity: SecurityActivity[];
	devices: TrustedDevice[];
	password: PasswordSettings;
	protections: SecurityProtection[];
	recommendations: string[];
	score: SecurityStrength;
	twoFactor: TwoFactorSettings;
};

export const securityData: SecurityData = {
	twoFactor: {
		backupCodesGeneratedAt: "2026-04-12T10:00:00Z",
		enabled: true,
		method: "Authenticator app",
		recoveryEmail: "alex.morgan@example.com",
	},
	password: {
		lastChangedAt: "2026-04-03T14:30:00Z",
		strength: "Strong",
		withdrawalCooldownHours: 24,
	},
	score: "Strong",
	devices: [
		{
			browser: "Chrome 124",
			device: "MacBook Pro",
			id: "device-1",
			ipAddress: "102.89.44.18",
			lastActiveAt: "2026-04-21T21:52:00Z",
			location: "Famagusta, Cyprus",
			status: "Current",
		},
		{
			browser: "Safari",
			device: "iPhone 15",
			id: "device-2",
			ipAddress: "102.89.44.20",
			lastActiveAt: "2026-04-20T18:10:00Z",
			location: "Famagusta, Cyprus",
			status: "Trusted",
		},
		{
			browser: "Chrome",
			device: "Windows laptop",
			id: "device-3",
			ipAddress: "41.203.72.90",
			lastActiveAt: "2026-04-18T08:32:00Z",
			location: "Lagos, Nigeria",
			status: "Review",
		},
	],
	protections: [
		{
			channels: ["In-app", "Email"],
			description: "Require a second verification step before sending funds out.",
			enabled: true,
			id: "withdrawal-2fa",
			isLocked: true,
			label: "Require 2FA for withdrawals",
		},
		{
			channels: ["In-app", "Email"],
			description: "Confirm each newly saved withdrawal address before it can be used.",
			enabled: true,
			id: "address-confirmation",
			label: "Confirm new withdrawal addresses",
		},
		{
			channels: ["In-app"],
			description: "Pause withdrawals after password or 2FA changes.",
			enabled: true,
			id: "cooldown",
			isLocked: true,
			label: "24-hour security cooldown",
		},
		{
			channels: ["In-app", "Email", "SMS"],
			description: "Send an alert when a new device signs in.",
			enabled: true,
			id: "new-device-alerts",
			label: "New device alerts",
		},
	],
	activity: [
		{
			createdAt: "2026-04-21T21:52:00Z",
			device: "Chrome on macOS",
			id: "activity-1",
			location: "Famagusta, Cyprus",
			status: "Completed",
			title: "Current session verified",
		},
		{
			createdAt: "2026-04-19T21:48:00Z",
			device: "Chrome on macOS",
			id: "activity-2",
			location: "Famagusta, Cyprus",
			status: "Completed",
			title: "New account sign-in",
		},
		{
			createdAt: "2026-04-12T10:00:00Z",
			device: "Account settings",
			id: "activity-3",
			location: "Nexcoin",
			status: "Completed",
			title: "Backup codes generated",
		},
		{
			createdAt: "2026-04-03T14:30:00Z",
			device: "Account settings",
			id: "activity-4",
			location: "Nexcoin",
			status: "Completed",
			title: "Password changed",
		},
		{
			createdAt: "2026-03-28T09:17:00Z",
			device: "Windows laptop",
			id: "activity-5",
			location: "Lagos, Nigeria",
			status: "Review",
			title: "Older trusted device needs review",
		},
	],
	recommendations: [
		"Keep authenticator-app 2FA enabled for withdrawals and account changes.",
		"Review trusted devices regularly and remove anything you do not recognise.",
		"Use a unique password that is not shared with email, exchange, or wallet accounts.",
		"Nexcoin staff will never ask for passwords, private keys, seed phrases, or 2FA codes.",
	],
};
