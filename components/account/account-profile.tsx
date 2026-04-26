"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
	type Profile,
	type ProfilePreferences,
	type VerificationStatus,
	countryOptions,
	timezoneOptions,
} from "@/lib/profile";
import { updateProfile } from "@/app/account/profile/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CURRENCY_TO_DB: Record<
	ProfilePreferences["displayCurrency"],
	"eur" | "gbp" | "ngn" | "usd"
> = {
	EUR: "eur",
	GBP: "gbp",
	NGN: "ngn",
	USD: "usd",
};

type AccountProfileProps = {
	profile: Profile;
};

const verificationBadgeClasses: Record<VerificationStatus, string> = {
	pending: "bg-[#fff1e0] text-[#a66510]",
	unverified: "bg-[#fde8e8] text-[#b1423a]",
	verified: "bg-[#e6f3ec] text-[#2e8f5b]",
};

const verificationLabels: Record<VerificationStatus, string> = {
	pending: "Verification pending",
	unverified: "Not verified",
	verified: "Verified account",
};

const memberSinceFormatter = new Intl.DateTimeFormat("en-US", {
	day: "numeric",
	month: "long",
	year: "numeric",
});

function formatMemberSince(iso: string) {
	return memberSinceFormatter.format(new Date(iso));
}

function isProfileEqual(a: Profile, b: Profile) {
	return JSON.stringify(a) === JSON.stringify(b);
}

export function AccountProfile({ profile }: AccountProfileProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [saved, setSaved] = useState<Profile>(profile);
	const [draft, setDraft] = useState<Profile>(profile);
	const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
	const [savedNotice, setSavedNotice] = useState(false);
	const [errorNotice, setErrorNotice] = useState<string | null>(null);
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const isDirty = useMemo(() => !isProfileEqual(draft, saved), [draft, saved]);

	const firstNameLocked = saved.identity.firstName.trim().length > 0;
	const lastNameLocked = saved.identity.lastName.trim().length > 0;
	const dateOfBirthLocked = saved.identity.dateOfBirth.trim().length > 0;
	const identityCountryLocked = saved.identity.country.trim().length > 0;
	const usernameLocked = saved.identifiers.username.trim().length > 0;

	useEffect(() => {
		if (!savedNotice) {
			return;
		}

		const id = window.setTimeout(() => setSavedNotice(false), 3000);

		return () => window.clearTimeout(id);
	}, [savedNotice]);

	useEffect(() => {
		if (!copiedField) {
			return;
		}

		const id = window.setTimeout(() => setCopiedField(null), 2000);

		return () => window.clearTimeout(id);
	}, [copiedField]);

	function updateIdentity<K extends keyof Profile["identity"]>(
		key: K,
		value: Profile["identity"][K],
	) {
		setDraft((current) => ({
			...current,
			identity: { ...current.identity, [key]: value },
		}));
	}

	function updateAddress<K extends keyof Profile["address"]>(
		key: K,
		value: Profile["address"][K],
	) {
		setDraft((current) => ({
			...current,
			address: { ...current.address, [key]: value },
		}));
	}

	function updateIdentifiers<K extends keyof Profile["identifiers"]>(
		key: K,
		value: Profile["identifiers"][K],
	) {
		setDraft((current) => ({
			...current,
			identifiers: { ...current.identifiers, [key]: value },
		}));
	}

	function handleSave(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (isPending) return;

		setErrorNotice(null);

		startTransition(async () => {
			const result = await updateProfile({
				addressCity: draft.address.city,
				addressCountry: draft.address.country,
				addressPostalCode: draft.address.postalCode,
				addressState: draft.address.state,
				addressStreet: draft.address.street,
				country: draft.identity.country,
				dashboardDensity: draft.preferences.dashboardDensity,
				dateFormat: draft.preferences.dateFormat,
				dateOfBirth: draft.identity.dateOfBirth,
				displayCurrency: CURRENCY_TO_DB[draft.preferences.displayCurrency],
				firstName: draft.identity.firstName,
				language: draft.identity.language,
				lastName: draft.identity.lastName,
				phoneNumber: draft.identity.phone,
				timezone: draft.identity.timezone,
				username: draft.identifiers.username,
			});

			if (!result.ok) {
				setErrorNotice(result.error);
				return;
			}

			setSaved(draft);
			setSavedNotice(true);
			router.refresh();
		});
	}

	function handleDiscard() {
		setDraft(saved);
	}

	function handleAvatarPick(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];

		if (!file) {
			return;
		}

		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === "string") {
				setAvatarSrc(reader.result);
			}
		};
		reader.readAsDataURL(file);
	}

	async function handleCopy(value: string, field: string) {
		try {
			await navigator.clipboard.writeText(value);
			setCopiedField(field);
		} catch {
			setCopiedField(null);
		}
	}

	return (
		<form onSubmit={handleSave} className="space-y-8">
			<section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
				<div className="max-w-2xl">
					<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
						Profile
					</p>
					<h1 className="mt-3 text-3xl font-semibold text-[#576363] sm:text-4xl">
						Your personal information
					</h1>
					<p className="mt-3 text-sm leading-6 text-[#5d6163] sm:text-base">
						Keep your contact details, address, and display preferences up to
						date. Security, identity verification, and notifications live on
						their own pages.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					{errorNotice ? (
						<span
							aria-live="polite"
							className="rounded-md bg-[#fff7f6] px-3 py-2 text-xs font-semibold text-[#b1423a]"
						>
							{errorNotice}
						</span>
					) : savedNotice ? (
						<span
							aria-live="polite"
							className="rounded-md bg-[#e6f3ec] px-3 py-2 text-xs font-semibold text-[#2e8f5b]"
						>
							Changes saved
						</span>
					) : null}
					<Button
						type="button"
						variant="outline"
						onClick={handleDiscard}
						disabled={!isDirty || isPending}
					>
						Discard
					</Button>
					<Button type="submit" disabled={!isDirty || isPending}>
						{isPending ? "Saving…" : "Save changes"}
					</Button>
				</div>
			</section>

			<section className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				<div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex flex-col gap-5 sm:flex-row sm:items-center">
						<div className="relative">
							<div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#5F9EA0] text-xl font-semibold text-white">
								{avatarSrc ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img
										src={avatarSrc}
										alt="Avatar preview"
										className="h-full w-full object-cover"
									/>
								) : (
									<span>{profile.overview.avatarInitials}</span>
								)}
							</div>
							<button
								type="button"
								onClick={() => fileInputRef.current?.click()}
								aria-label="Change avatar"
								className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-[#d7e5e3] bg-white text-[#5F9EA0] shadow transition hover:text-[#3c7f80] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15"
							>
								<CameraIcon className="h-4 w-4" />
							</button>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								className="hidden"
								onChange={handleAvatarPick}
							/>
						</div>
						<div>
							<p className="text-lg font-semibold text-[#576363]">
								{draft.identity.firstName} {draft.identity.lastName}
							</p>
							<p className="text-sm text-[#5d6163]">{draft.identity.email}</p>
							<div className="mt-3 flex flex-wrap items-center gap-2">
								<span
									className={cn(
										"rounded-md px-2 py-0.5 text-xs font-semibold",
										verificationBadgeClasses[profile.overview.verification],
									)}
								>
									{verificationLabels[profile.overview.verification]}
								</span>
								<span className="rounded-md bg-[#eef6f5] px-2 py-0.5 text-xs font-semibold text-[#3c7f80]">
									{profile.overview.tier} tier
								</span>
								<span className="rounded-md bg-[#f7faf9] px-2 py-0.5 text-xs font-semibold text-[#576363]">
									Member since {formatMemberSince(profile.overview.memberSince)}
								</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				<SectionHeading
					description="Used on receipts, verification records, and account communications."
					title="Personal information"
				/>
				{(() => {
					const missing = [
						!firstNameLocked && "first name",
						!lastNameLocked && "last name",
						!dateOfBirthLocked && "date of birth",
						!identityCountryLocked && "country",
					].filter((value): value is string => Boolean(value));

					if (missing.length === 0) {
						return (
							<div className="mt-3 rounded-md bg-[#f7faf9] px-4 py-3 text-xs leading-5 text-[#5d6163]">
								Identity fields (name, date of birth, country of residence)
								are locked. Email is always locked — contact support to change
								it or to correct any locked identity field.
							</div>
						);
					}

					return (
						<div className="mt-3 rounded-md border border-[#f4d9aa] bg-[#fff8ec] px-4 py-3 text-xs leading-5 text-[#8a5b14]">
							<span className="font-semibold">Action needed:</span> please fill
							in your {missing.join(", ")} below. These identity fields lock
							once saved — make sure they match your KYC documents.
						</div>
					);
				})()}
				<div className="mt-5 grid gap-4 sm:grid-cols-2">
					<Field
						label="First name"
						htmlFor="identity-first-name"
						hint={
							firstNameLocked
								? "Set during onboarding. Contact support to correct."
								: undefined
						}
					>
						<TextInput
							disabled={firstNameLocked}
							id="identity-first-name"
							value={draft.identity.firstName}
							onChange={(value) => updateIdentity("firstName", value)}
						/>
					</Field>
					<Field
						label="Last name"
						htmlFor="identity-last-name"
						hint={
							lastNameLocked
								? "Set during onboarding. Contact support to correct."
								: undefined
						}
					>
						<TextInput
							disabled={lastNameLocked}
							id="identity-last-name"
							value={draft.identity.lastName}
							onChange={(value) => updateIdentity("lastName", value)}
						/>
					</Field>
					<Field
						label="Email"
						htmlFor="identity-email"
						hint="Email is locked. Contact support to change it."
					>
						<TextInput
							disabled
							id="identity-email"
							type="email"
							value={draft.identity.email}
							onChange={() => undefined}
						/>
					</Field>
					<Field label="Phone" htmlFor="identity-phone">
						<TextInput
							id="identity-phone"
							type="tel"
							value={draft.identity.phone}
							onChange={(value) => updateIdentity("phone", value)}
						/>
					</Field>
					<Field
						label="Date of birth"
						htmlFor="identity-dob"
						hint={
							dateOfBirthLocked
								? "Set during onboarding. Contact support to correct."
								: undefined
						}
					>
						<TextInput
							disabled={dateOfBirthLocked}
							id="identity-dob"
							type="date"
							value={draft.identity.dateOfBirth}
							onChange={(value) => updateIdentity("dateOfBirth", value)}
						/>
					</Field>
					<Field
						label="Country"
						htmlFor="identity-country"
						hint={
							identityCountryLocked
								? "Set during onboarding. Contact support to correct."
								: undefined
						}
					>
						<SearchableSelect
							disabled={identityCountryLocked}
							id="identity-country"
							value={draft.identity.country}
							onChange={(value) => updateIdentity("country", value)}
							options={countryOptions}
						/>
					</Field>
					<Field label="Timezone" htmlFor="identity-timezone">
						<SelectInput
							id="identity-timezone"
							value={draft.identity.timezone}
							onChange={(value) => updateIdentity("timezone", value)}
							options={timezoneOptions.map((option) => ({
								label: option,
								value: option,
							}))}
						/>
					</Field>
				</div>
			</section>

			<section className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				<SectionHeading
					description="Used for billing, tax records, and correspondence. Separate from documents submitted during KYC."
					title="Address"
				/>
				<div className="mt-5 grid gap-4 sm:grid-cols-2">
					<Field
						className="sm:col-span-2"
						label="Street address"
						htmlFor="address-street"
					>
						<TextInput
							id="address-street"
							value={draft.address.street}
							onChange={(value) => updateAddress("street", value)}
						/>
					</Field>
					<Field label="City" htmlFor="address-city">
						<TextInput
							id="address-city"
							value={draft.address.city}
							onChange={(value) => updateAddress("city", value)}
						/>
					</Field>
					<Field label="State / Region" htmlFor="address-state">
						<TextInput
							id="address-state"
							value={draft.address.state}
							onChange={(value) => updateAddress("state", value)}
						/>
					</Field>
					<Field label="Postal code" htmlFor="address-postal">
						<TextInput
							id="address-postal"
							value={draft.address.postalCode}
							onChange={(value) => updateAddress("postalCode", value)}
						/>
					</Field>
					<Field label="Country" htmlFor="address-country">
						<SearchableSelect
							id="address-country"
							value={draft.address.country}
							onChange={(value) => updateAddress("country", value)}
							options={countryOptions}
						/>
					</Field>
				</div>
			</section>

			<section className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				<SectionHeading
					description="Share your referral code to earn bonuses. Your username shows up on activity and support threads."
					title="Identifiers"
				/>
				<div className="mt-5 grid gap-4 sm:grid-cols-2">
					{usernameLocked ? (
						<CopyField
							copied={copiedField === "username"}
							label="Username"
							onCopy={() => handleCopy(draft.identifiers.username, "username")}
							value={`@${draft.identifiers.username}`}
						/>
					) : (
						<Field
							label="Username"
							htmlFor="identifiers-username"
							hint="3–30 lowercase characters. Letters, numbers, _ and - allowed. Set once and locked."
						>
							<TextInput
								id="identifiers-username"
								value={draft.identifiers.username}
								onChange={(value) =>
									updateIdentifiers("username", value.toLowerCase())
								}
							/>
						</Field>
					)}
					<CopyField
						copied={copiedField === "referralCode"}
						label="Referral code"
						onCopy={() =>
							handleCopy(draft.identifiers.referralCode, "referralCode")
						}
						value={draft.identifiers.referralCode}
					/>
				</div>
			</section>

			<section className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				<SectionHeading
					description="Password, identity verification, and alert preferences are managed from dedicated pages."
					title="Related settings"
				/>
				<div className="mt-5 grid gap-4 md:grid-cols-3">
					<CrossLink
						description="Change password, manage 2FA, review sessions."
						href="/account/security"
						title="Security"
					/>
					<CrossLink
						description="Submit or update identity documents to unlock limits."
						href="/account/verification"
						title="KYC verification"
					/>
					<CrossLink
						description="Choose which account and market alerts you receive."
						href="/account/notifications"
						title="Notifications"
					/>
				</div>
			</section>
		</form>
	);
}

function SectionHeading({
	description,
	title,
}: {
	description: string;
	title: string;
}) {
	return (
		<div>
			<h2 className="text-xl font-semibold text-[#576363]">{title}</h2>
			<p className="mt-1 text-sm leading-6 text-[#5d6163]">{description}</p>
		</div>
	);
}

function Field({
	children,
	className,
	hint,
	htmlFor,
	label,
}: {
	children: React.ReactNode;
	className?: string;
	hint?: string;
	htmlFor: string;
	label: string;
}) {
	return (
		<div className={className}>
			<label
				htmlFor={htmlFor}
				className="block text-sm font-semibold text-[#576363]"
			>
				{label}
			</label>
			<div className="mt-2">{children}</div>
			{hint ? <p className="mt-2 text-xs text-[#5d6163]">{hint}</p> : null}
		</div>
	);
}

function TextInput({
	disabled,
	id,
	onChange,
	type = "text",
	value,
}: {
	disabled?: boolean;
	id: string;
	onChange: (value: string) => void;
	type?: string;
	value: string;
}) {
	return (
		<input
			id={id}
			type={type}
			value={value}
			disabled={disabled}
			onChange={(event) => onChange(event.target.value)}
			className={cn(
				"h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15",
				disabled &&
					"cursor-not-allowed bg-[#f7faf9] text-[#9aa5a4] focus:border-[#cfdcda] focus:ring-0",
			)}
		/>
	);
}

function SelectInput({
	disabled,
	id,
	onChange,
	options,
	value,
}: {
	disabled?: boolean;
	id: string;
	onChange: (value: string) => void;
	options: { label: string; value: string }[];
	value: string;
}) {
	return (
		<select
			id={id}
			value={value}
			disabled={disabled}
			onChange={(event) => onChange(event.target.value)}
			className={cn(
				"h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15",
				disabled &&
					"cursor-not-allowed bg-[#f7faf9] text-[#9aa5a4] focus:border-[#cfdcda] focus:ring-0",
			)}
		>
			{options.map((option) => (
				<option key={option.value} value={option.value}>
					{option.label}
				</option>
			))}
		</select>
	);
}

function SearchableSelect({
	disabled,
	id,
	onChange,
	options,
	value,
}: {
	disabled?: boolean;
	id: string;
	onChange: (value: string) => void;
	options: readonly string[];
	value: string;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [search, setSearch] = useState("");
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
				setSearch("");
			}
		};

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setIsOpen(false);
				setSearch("");
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleEscape);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleEscape);
		};
	}, [isOpen]);

	const filtered = useMemo(() => {
		const term = search.trim().toLowerCase();
		if (!term) return options;
		return options.filter((option) => option.toLowerCase().includes(term));
	}, [options, search]);

	const select = (next: string) => {
		onChange(next);
		setIsOpen(false);
		setSearch("");
	};

	return (
		<div ref={containerRef} className="relative">
			<button
				type="button"
				id={id}
				disabled={disabled}
				onClick={() => setIsOpen((current) => !current)}
				className={cn(
					"flex h-11 w-full items-center justify-between rounded-md border border-[#cfdcda] bg-white px-3 text-left text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15",
					disabled &&
						"cursor-not-allowed bg-[#f7faf9] text-[#9aa5a4] focus:border-[#cfdcda] focus:ring-0",
				)}
			>
				<span className={cn(!value && "text-[#9aa5a4]")}>
					{value || "Select…"}
				</span>
				<svg
					viewBox="0 0 24 24"
					aria-hidden="true"
					className={cn(
						"h-4 w-4 shrink-0 transition",
						isOpen && "rotate-180",
					)}
					fill="none"
					stroke="currentColor"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="2"
				>
					<path d="m6 9 6 6 6-6" />
				</svg>
			</button>

			{isOpen ? (
				<div className="absolute z-20 mt-2 w-full overflow-hidden rounded-md border border-[#d7e5e3] bg-white shadow-[0_18px_50px_rgba(87,99,99,0.18)]">
					<div className="border-b border-[#eef1f0] p-2">
						<input
							type="text"
							autoFocus
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Search…"
							className="h-9 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm text-[#576363] outline-none focus:border-[#5F9EA0]"
						/>
					</div>
					<ul className="max-h-60 overflow-y-auto">
						{filtered.length === 0 ? (
							<li className="px-3 py-2 text-sm text-[#5d6163]">No matches</li>
						) : (
							filtered.map((option) => (
								<li key={option}>
									<button
										type="button"
										onClick={() => select(option)}
										className={cn(
											"flex w-full items-center justify-between px-3 py-2 text-left text-sm text-[#576363] hover:bg-[#f7faf9]",
											option === value && "bg-[#eef6f5] font-semibold",
										)}
									>
										<span>{option}</span>
										{option === value ? (
											<span className="text-[#5F9EA0]">✓</span>
										) : null}
									</button>
								</li>
							))
						)}
					</ul>
				</div>
			) : null}
		</div>
	);
}

function CopyField({
	copied,
	label,
	onCopy,
	value,
}: {
	copied: boolean;
	label: string;
	onCopy: () => void;
	value: string;
}) {
	return (
		<div>
			<p className="text-sm font-semibold text-[#576363]">{label}</p>
			<div className="mt-2 flex h-11 items-center justify-between gap-3 rounded-md border border-[#cfdcda] bg-[#f7faf9] px-3 text-sm font-medium text-[#576363]">
				<span className="truncate">{value}</span>
				<button
					type="button"
					onClick={onCopy}
					className="inline-flex items-center gap-1 text-xs font-semibold text-[#5F9EA0] transition hover:text-[#3c7f80] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15"
				>
					<CopyIcon className="h-3.5 w-3.5" />
					{copied ? "Copied" : "Copy"}
				</button>
			</div>
		</div>
	);
}

function CrossLink({
	description,
	href,
	title,
}: {
	description: string;
	href: string;
	title: string;
}) {
	return (
		<Link
			href={href}
			className={cn(
				buttonVariants({ variant: "outline" }),
				"flex h-auto flex-col items-start gap-2 p-4 text-left",
			)}
		>
			<span className="text-sm font-semibold text-[#576363]">{title}</span>
			<span className="text-xs font-normal leading-5 text-[#5d6163]">
				{description}
			</span>
		</Link>
	);
}

function CameraIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			className={className}
			aria-hidden="true"
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2"
		>
			<path d="M4 8h3l2-3h6l2 3h3v11H4z" />
			<circle cx="12" cy="13" r="4" />
		</svg>
	);
}

function CopyIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			className={className}
			aria-hidden="true"
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2"
		>
			<rect x="9" y="9" width="11" height="11" rx="2" />
			<path d="M5 15V6a2 2 0 0 1 2-2h9" />
		</svg>
	);
}
