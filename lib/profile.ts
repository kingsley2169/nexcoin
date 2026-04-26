import type { SupabaseClient } from "@supabase/supabase-js";

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

export const countryOptions: readonly string[] = [
	"Afghanistan",
	"Albania",
	"Algeria",
	"Andorra",
	"Angola",
	"Antigua and Barbuda",
	"Argentina",
	"Armenia",
	"Australia",
	"Austria",
	"Azerbaijan",
	"Bahamas",
	"Bahrain",
	"Bangladesh",
	"Barbados",
	"Belarus",
	"Belgium",
	"Belize",
	"Benin",
	"Bhutan",
	"Bolivia",
	"Bosnia and Herzegovina",
	"Botswana",
	"Brazil",
	"Brunei",
	"Bulgaria",
	"Burkina Faso",
	"Burundi",
	"Cabo Verde",
	"Cambodia",
	"Cameroon",
	"Canada",
	"Central African Republic",
	"Chad",
	"Chile",
	"China",
	"Colombia",
	"Comoros",
	"Congo",
	"Congo (Democratic Republic)",
	"Costa Rica",
	"Côte d'Ivoire",
	"Croatia",
	"Cuba",
	"Cyprus",
	"Czechia",
	"Denmark",
	"Djibouti",
	"Dominica",
	"Dominican Republic",
	"Ecuador",
	"Egypt",
	"El Salvador",
	"Equatorial Guinea",
	"Eritrea",
	"Estonia",
	"Eswatini",
	"Ethiopia",
	"Fiji",
	"Finland",
	"France",
	"Gabon",
	"Gambia",
	"Georgia",
	"Germany",
	"Ghana",
	"Greece",
	"Grenada",
	"Guatemala",
	"Guinea",
	"Guinea-Bissau",
	"Guyana",
	"Haiti",
	"Honduras",
	"Hungary",
	"Iceland",
	"India",
	"Indonesia",
	"Iran",
	"Iraq",
	"Ireland",
	"Israel",
	"Italy",
	"Jamaica",
	"Japan",
	"Jordan",
	"Kazakhstan",
	"Kenya",
	"Kiribati",
	"Kuwait",
	"Kyrgyzstan",
	"Laos",
	"Latvia",
	"Lebanon",
	"Lesotho",
	"Liberia",
	"Libya",
	"Liechtenstein",
	"Lithuania",
	"Luxembourg",
	"Madagascar",
	"Malawi",
	"Malaysia",
	"Maldives",
	"Mali",
	"Malta",
	"Marshall Islands",
	"Mauritania",
	"Mauritius",
	"Mexico",
	"Micronesia",
	"Moldova",
	"Monaco",
	"Mongolia",
	"Montenegro",
	"Morocco",
	"Mozambique",
	"Myanmar",
	"Namibia",
	"Nauru",
	"Nepal",
	"Netherlands",
	"New Zealand",
	"Nicaragua",
	"Niger",
	"Nigeria",
	"North Korea",
	"North Macedonia",
	"Norway",
	"Oman",
	"Pakistan",
	"Palau",
	"Palestine",
	"Panama",
	"Papua New Guinea",
	"Paraguay",
	"Peru",
	"Philippines",
	"Poland",
	"Portugal",
	"Qatar",
	"Romania",
	"Russia",
	"Rwanda",
	"Saint Kitts and Nevis",
	"Saint Lucia",
	"Saint Vincent and the Grenadines",
	"Samoa",
	"San Marino",
	"Sao Tome and Principe",
	"Saudi Arabia",
	"Senegal",
	"Serbia",
	"Seychelles",
	"Sierra Leone",
	"Singapore",
	"Slovakia",
	"Slovenia",
	"Solomon Islands",
	"Somalia",
	"South Africa",
	"South Korea",
	"South Sudan",
	"Spain",
	"Sri Lanka",
	"Sudan",
	"Suriname",
	"Sweden",
	"Switzerland",
	"Syria",
	"Taiwan",
	"Tajikistan",
	"Tanzania",
	"Thailand",
	"Timor-Leste",
	"Togo",
	"Tonga",
	"Trinidad and Tobago",
	"Tunisia",
	"Turkey",
	"Turkmenistan",
	"Tuvalu",
	"Uganda",
	"Ukraine",
	"United Arab Emirates",
	"United Kingdom",
	"United States",
	"Uruguay",
	"Uzbekistan",
	"Vanuatu",
	"Vatican City",
	"Venezuela",
	"Vietnam",
	"Yemen",
	"Zambia",
	"Zimbabwe",
];

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

type ProfileRow = {
	address_city: string | null;
	address_country: string | null;
	address_postal_code: string | null;
	address_state: string | null;
	address_street: string | null;
	avatar_initials: string | null;
	country: string | null;
	dashboard_density: string | null;
	date_format: string | null;
	date_of_birth: string | null;
	display_currency: string | null;
	email: string | null;
	first_name: string | null;
	language: string | null;
	last_name: string | null;
	member_since: string;
	phone_number: string | null;
	referral_code: string | null;
	tier: string | null;
	timezone: string | null;
	username: string | null;
	verification_status: string | null;
};

function mapTier(value: string | null): AccountTier {
	switch (value) {
		case "amateur":
			return "Amateur";
		case "advanced":
			return "Advanced";
		case "pro":
			return "Pro";
		default:
			return "Beginner";
	}
}

function mapDensity(value: string | null): ProfilePreferences["dashboardDensity"] {
	return value === "compact" ? "compact" : "comfortable";
}

function mapDateFormat(value: string | null): ProfilePreferences["dateFormat"] {
	switch (value) {
		case "DD/MM/YYYY":
			return "DD/MM/YYYY";
		case "YYYY-MM-DD":
			return "YYYY-MM-DD";
		default:
			return "MM/DD/YYYY";
	}
}

function mapCurrency(
	value: string | null,
): ProfilePreferences["displayCurrency"] {
	switch (value) {
		case "eur":
			return "EUR";
		case "gbp":
			return "GBP";
		case "ngn":
			return "NGN";
		default:
			return "USD";
	}
}

function mapVerification(value: string | null): VerificationStatus {
	switch (value) {
		case "verified":
			return "verified";
		case "pending":
			return "pending";
		default:
			return "unverified";
	}
} 

export async function getProfileData(
	supabase: SupabaseClient,
): Promise<Profile> {
	const { data, error } = await supabase
		.from("my_profile_view")
		.select(
			"first_name,last_name,email,phone_number,country,timezone,language,date_of_birth,address_street,address_city,address_state,address_postal_code,address_country,display_currency,date_format,dashboard_density,username,referral_code,tier,member_since,avatar_initials,verification_status",
		)
		.maybeSingle<ProfileRow>();

	if (error) throw new Error(error.message);
	if (!data) throw new Error("Profile not found");

	return {
		address: {
			city: data.address_city ?? "",
			country: data.address_country ?? "",
			postalCode: data.address_postal_code ?? "",
			state: data.address_state ?? "",
			street: data.address_street ?? "",
		},
		identifiers: {
			referralCode: data.referral_code ?? "",
			username: data.username ?? "",
		},
		identity: {
			country: data.country ?? "",
			dateOfBirth: (data.date_of_birth ?? "").slice(0, 10),
			email: data.email ?? "",
			firstName: data.first_name ?? "",
			language: data.language ?? "English",
			lastName: data.last_name ?? "",
			phone: data.phone_number ?? "",
			timezone: data.timezone ?? "Africa/Lagos",
		},
		overview: {
			avatarInitials: (data.avatar_initials ?? "").trim() || "—",
			memberSince: data.member_since,
			tier: mapTier(data.tier),
			verification: mapVerification(data.verification_status),
		},
		preferences: {
			dashboardDensity: mapDensity(data.dashboard_density),
			dateFormat: mapDateFormat(data.date_format),
			displayCurrency: mapCurrency(data.display_currency),
		},
	};
}
