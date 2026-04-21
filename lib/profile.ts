export type AccountTier = "Beginner" | "Amateur" | "Advanced" | "Pro";

export type VerificationStatus = "unverified" | "pending" | "verified";

export type ProfileIdentity = {
	country: string;
	dateOfBirth: string;
	email: string;
	firstName: string;
	language: string;
	lastName: string;
	phone: string;
	timezone: string;
};

export type ProfileAddress = {
	city: string;
	country: string;
	postalCode: string;
	state: string;
	street: string;
};

export type ProfilePreferences = {
	dashboardDensity: "comfortable" | "compact";
	dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
	displayCurrency: "USD" | "EUR" | "GBP" | "NGN";
};

export type ProfileIdentifiers = {
	referralCode: string;
	username: string;
};

export type ProfileOverview = {
	avatarInitials: string;
	memberSince: string;
	tier: AccountTier;
	verification: VerificationStatus;
};

export type Profile = {
	address: ProfileAddress;
	identifiers: ProfileIdentifiers;
	identity: ProfileIdentity;
	overview: ProfileOverview;
	preferences: ProfilePreferences;
};

export const countryOptions = [
	"Australia",
	"Canada",
	"France",
	"Germany",
	"Ghana",
	"Kenya",
	"Nigeria",
	"South Africa",
	"United Kingdom",
	"United States",
] as const;

export const timezoneOptions = [
	"Africa/Lagos",
	"Africa/Nairobi",
	"America/Chicago",
	"America/Los_Angeles",
	"America/New_York",
	"Asia/Dubai",
	"Asia/Singapore",
	"Australia/Sydney",
	"Europe/Berlin",
	"Europe/London",
] as const;

export const languageOptions = [
	"English",
	"French",
	"German",
	"Portuguese",
	"Spanish",
] as const;

export const currencyOptions: ProfilePreferences["displayCurrency"][] = [
	"USD",
	"EUR",
	"GBP",
	"NGN",
];

export const dateFormatOptions: ProfilePreferences["dateFormat"][] = [
	"MM/DD/YYYY",
	"DD/MM/YYYY",
	"YYYY-MM-DD",
];

export const densityOptions: ProfilePreferences["dashboardDensity"][] = [
	"comfortable",
	"compact",
];

export const mockProfile: Profile = {
	address: {
		city: "Lagos",
		country: "Nigeria",
		postalCode: "101233",
		state: "Lagos State",
		street: "12 Marina Road, Apt 4B",
	},
	identifiers: {
		referralCode: "NEX-ALEX42",
		username: "alex-morgan",
	},
	identity: {
		country: "Nigeria",
		dateOfBirth: "1994-05-18",
		email: "alex.morgan@example.com",
		firstName: "Alex",
		language: "English",
		lastName: "Morgan",
		phone: "+234 802 555 0142",
		timezone: "Africa/Lagos",
	},
	overview: {
		avatarInitials: "AM",
		memberSince: "2026-01-12",
		tier: "Advanced",
		verification: "verified",
	},
	preferences: {
		dashboardDensity: "comfortable",
		dateFormat: "DD/MM/YYYY",
		displayCurrency: "USD",
	},
};
