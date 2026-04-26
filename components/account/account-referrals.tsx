"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
	type ReferralEarningStatus,
	type ReferralProgram,
	type ReferralStatus,
	type ReferralTier,
} from "@/lib/referrals";
import { claimReferralEarning } from "@/app/account/referrals/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AccountReferralsProps = {
	data: ReferralProgram;
};

type UserFilter = "active" | "all" | "inactive" | "pending";

const currencyFormatter = new Intl.NumberFormat("en-US", {
	currency: "USD",
	maximumFractionDigits: 2,
	style: "currency",
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
	currency: "USD",
	maximumFractionDigits: 0,
	style: "currency",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
	day: "numeric",
	month: "short",
	year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
	day: "numeric",
	hour: "numeric",
	minute: "2-digit",
	month: "short",
});

const statusBadgeClasses: Record<ReferralStatus, string> = {
	"Active investor": "bg-[#e6f3ec] text-[#2e8f5b]",
	Invited: "bg-[#eef1f1] text-[#5d6163]",
	"Signed up": "bg-[#fff1e0] text-[#a66510]",
	Verified: "bg-[#eef6f5] text-[#3c7f80]",
};

const earningStatusClasses: Record<ReferralEarningStatus, string> = {
	Credited: "bg-[#e6f3ec] text-[#2e8f5b]",
	Pending: "bg-[#fff1e0] text-[#a66510]",
};

const userFilters: { label: string; value: UserFilter }[] = [
	{ label: "All", value: "all" },
	{ label: "Active", value: "active" },
	{ label: "Pending verification", value: "pending" },
	{ label: "Inactive", value: "inactive" },
];

function formatUsd(value: number) {
	return currencyFormatter.format(value);
}

function formatCompactUsd(value: number) {
	return compactCurrencyFormatter.format(value);
}

function formatDate(iso: string) {
	return dateFormatter.format(new Date(iso));
}

function formatDateTime(iso: string) {
	return dateTimeFormatter.format(new Date(iso));
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
			<path d="M9 9h10v11H9zM5 15V4h11" />
		</svg>
	);
}

function CheckIcon({ className }: { className?: string }) {
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
			<path d="m5 13 4 4 10-10" />
		</svg>
	);
}

function TrophyIcon({ className }: { className?: string }) {
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
			<path d="M7 4h10v4a5 5 0 1 1-10 0V4ZM5 6H3a3 3 0 0 0 3 3M19 6h2a3 3 0 0 1-3 3M9 16h6M8 20h8M12 13v3" />
		</svg>
	);
}

function useCopy() {
	const [copiedId, setCopiedId] = useState<null | string>(null);

	const copy = async (value: string, id: string) => {
		try {
			await navigator.clipboard.writeText(value);
			setCopiedId(id);
			window.setTimeout(() => {
				setCopiedId((current) => (current === id ? null : current));
			}, 2000);
		} catch {
			setCopiedId(null);
		}
	};

	return { copiedId, copy };
}

export function AccountReferrals({ data }: AccountReferralsProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [userFilter, setUserFilter] = useState<UserFilter>("all");
	const [userSearch, setUserSearch] = useState("");
	const [claimingId, setClaimingId] = useState<string | null>(null);
	const [notice, setNotice] = useState<
		{ tone: "error" | "success"; message: string } | null
	>(null);
	const { copiedId, copy } = useCopy();

	const claim = (earningId: string) => {
		if (isPending) return;
		setClaimingId(earningId);

		startTransition(async () => {
			const result = await claimReferralEarning(earningId);

			setClaimingId(null);

			if (!result.ok) {
				setNotice({ tone: "error", message: result.error });
				return;
			}

			setNotice({
				tone: "success",
				message: "Earning claimed and credited to your balance.",
			});
			router.refresh();
		});
	};

	const currentTier = useMemo(
		() =>
			data.tiers.find((tier) => tier.id === data.currentTierId) ??
			data.tiers[0],
		[data.currentTierId, data.tiers],
	);

	const nextTier = useMemo(() => {
		const currentIndex = data.tiers.findIndex(
			(tier) => tier.id === data.currentTierId,
		);

		return currentIndex >= 0 && currentIndex < data.tiers.length - 1
			? data.tiers[currentIndex + 1]
			: null;
	}, [data.currentTierId, data.tiers]);

	const filteredUsers = useMemo(() => {
		const term = userSearch.trim().toLowerCase();

		return data.referredUsers.filter((user) => {
			if (userFilter === "active" && user.status !== "Active investor") {
				return false;
			}

			if (
				userFilter === "pending" &&
				user.status !== "Signed up" &&
				user.status !== "Invited"
			) {
				return false;
			}

			if (
				userFilter === "inactive" &&
				user.status !== "Verified" &&
				user.status !== "Invited"
			) {
				return false;
			}

			if (term) {
				const haystack = `${user.maskedName} ${user.maskedEmail}`.toLowerCase();

				if (!haystack.includes(term)) {
					return false;
				}
			}

			return true;
		});
	}, [data.referredUsers, userFilter, userSearch]);

	const shareText = `I've been using Nexcoin for crypto investing — join with my link and we both earn a bonus: ${data.referralLink}`;
	const shareLinks = {
		email: `mailto:?subject=${encodeURIComponent("Try Nexcoin with my referral link")}&body=${encodeURIComponent(shareText)}`,
		telegram: `https://t.me/share/url?url=${encodeURIComponent(data.referralLink)}&text=${encodeURIComponent("Join me on Nexcoin — we both earn a bonus.")}`,
		twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
		whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
	};

	const progressPercent = Math.min(
		100,
		Math.round(
			(data.nextTierProgress.current / data.nextTierProgress.target) * 100,
		),
	);

	return (
		<div className="space-y-6">
			<header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="text-2xl font-semibold text-[#576363]">Referrals</h1>
					<p className="mt-1 max-w-2xl text-sm leading-6 text-[#5d6163]">
						Invite friends to Nexcoin and earn a commission when they fund an
						account and start investing. Track your referrals, tier progress,
						and commission history.
					</p>
				</div>
				<span className="inline-flex items-center gap-2 self-start rounded-full bg-[#e5f3f1] px-3 py-1.5 text-xs font-medium text-[#3c7f80]">
					<TrophyIcon className="h-4 w-4" />
					{currentTier.name} — {currentTier.commissionPercent}% commission
				</span>
			</header>

			{notice ? (
				<div
					role="status"
					aria-live="polite"
					className={cn(
						"rounded-md border px-4 py-3 text-sm font-semibold",
						notice.tone === "success"
							? "border-[#c7ebd2] bg-[#e6f3ec] text-[#2e8f5b]"
							: "border-[#f2c5c0] bg-[#fff7f6] text-[#b1423a]",
					)}
				>
					{notice.message}
				</div>
			) : null}

			<section className="rounded-lg border border-[#d7e5e3] bg-gradient-to-br from-[#f1f8f7] to-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				<div>
					<div className="space-y-4">
						<div>
							<p className="text-xs font-medium uppercase tracking-wide text-[#8a9a9a]">
								Your referral link
							</p>
							<div className="mt-2 flex flex-col gap-2 sm:flex-row">
								<span className="flex min-w-0 flex-1 items-center rounded-md border border-[#d7e5e3] bg-white px-3 py-2 text-sm text-[#576363]">
									<span className="truncate">{data.referralLink}</span>
								</span>
								<Button
									type="button"
									variant={copiedId === "link" ? "primary" : "outline"}
									className="gap-2"
									onClick={() => copy(data.referralLink, "link")}
								>
									{copiedId === "link" ? (
										<>
											<CheckIcon className="h-4 w-4" />
											Copied
										</>
									) : (
										<>
											<CopyIcon className="h-4 w-4" />
											Copy link
										</>
									)}
								</Button>
							</div>
						</div>
						<div>
							<p className="text-xs font-medium uppercase tracking-wide text-[#8a9a9a]">
								Referral code
							</p>
							<div className="mt-2 flex items-center gap-2">
								<span className="inline-flex items-center rounded-md border border-[#d7e5e3] bg-white px-3 py-2 font-mono text-sm tracking-wider text-[#1f5556]">
									{data.referralCode}
								</span>
								<button
									type="button"
									onClick={() => copy(data.referralCode, "code")}
									className="inline-flex items-center gap-1 text-xs font-medium text-[#3c7f80] hover:text-[#1f5556]"
								>
									{copiedId === "code" ? (
										<>
											<CheckIcon className="h-3.5 w-3.5" />
											Copied
										</>
									) : (
										<>
											<CopyIcon className="h-3.5 w-3.5" />
											Copy code
										</>
									)}
								</button>
							</div>
						</div>
						<div>
							<p className="text-xs font-medium uppercase tracking-wide text-[#8a9a9a]">
								Share
							</p>
							<div className="mt-2 flex flex-wrap gap-2">
								<ShareButton
									href={shareLinks.twitter}
									label="Twitter"
									icon={TwitterIcon}
								/>
								<ShareButton
									href={shareLinks.telegram}
									label="Telegram"
									icon={TelegramIcon}
								/>
								<ShareButton
									href={shareLinks.whatsapp}
									label="WhatsApp"
									icon={WhatsAppIcon}
								/>
								<ShareButton
									href={shareLinks.email}
									label="Email"
									icon={EmailIcon}
								/>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<SummaryCard
					label="Total referred"
					value={data.stats.totalReferred.toString()}
					hint="People invited"
				/>
				<SummaryCard
					label="Active investors"
					value={data.stats.activeInvestors.toString()}
					hint="Funded and investing"
				/>
				<SummaryCard
					label="Total earned"
					value={formatUsd(data.stats.totalEarnedUsd)}
					hint="Lifetime commissions"
					tone="positive"
				/>
				<SummaryCard
					label="Pending bonuses"
					value={formatUsd(data.stats.pendingUsd)}
					hint="Awaiting first investment"
					tone="warn"
				/>
			</section>

			<section className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				<div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<h2 className="text-base font-semibold text-[#576363]">
							Commission tiers
						</h2>
						<p className="mt-1 text-sm leading-6 text-[#5d6163]">
							Tiers unlock higher commissions as more of your referrals become
							active investors.
						</p>
					</div>
					{nextTier ? (
						<p className="text-xs text-[#5d6163]">
							<span className="font-medium text-[#3c7f80]">
								{Math.max(
									data.nextTierProgress.target -
										data.nextTierProgress.current,
									0,
								)}{" "}
								more active referrals
							</span>{" "}
							to unlock {nextTier.name}
						</p>
					) : null}
				</div>

				<div className="mt-5 grid gap-4 md:grid-cols-3">
					{data.tiers.map((tier) => (
						<TierCard
							key={tier.id}
							tier={tier}
							isCurrent={tier.id === data.currentTierId}
						/>
					))}
				</div>

				{nextTier ? (
					<div className="mt-5">
						<div className="flex items-center justify-between text-xs text-[#5d6163]">
							<span>
								{data.nextTierProgress.current} / {data.nextTierProgress.target}{" "}
								active referrals
							</span>
							<span className="font-medium text-[#3c7f80]">
								Next: {nextTier.name}
							</span>
						</div>
						<div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eef1f1]">
							<div
								className="h-full rounded-full bg-[#5F9EA0] transition-all"
								style={{ width: `${progressPercent}%` }}
							/>
						</div>
					</div>
				) : null}
			</section>

			<section className="rounded-lg border border-[#d7e5e3] bg-white shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				<div className="flex flex-col gap-3 border-b border-[#eef1f1] p-6 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h2 className="text-base font-semibold text-[#576363]">
							Referred users
						</h2>
						<p className="mt-1 text-sm leading-6 text-[#5d6163]">
							Track each invite from signup through to active investing.
						</p>
					</div>
					<input
						type="search"
						value={userSearch}
						onChange={(event) => setUserSearch(event.target.value)}
						placeholder="Search name or email"
						className="rounded-md border border-[#d7e5e3] bg-white px-3 py-2 text-sm text-[#576363] placeholder:text-[#8a9a9a] focus:border-[#5F9EA0] focus:outline-none focus:ring-2 focus:ring-[#5F9EA0]/20 sm:w-64"
					/>
				</div>

				<div className="flex flex-wrap gap-2 border-b border-[#eef1f1] px-6 py-4">
					{userFilters.map((filter) => {
						const isActive = userFilter === filter.value;

						return (
							<button
								key={filter.value}
								type="button"
								onClick={() => setUserFilter(filter.value)}
								className={cn(
									"inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition",
									isActive
										? "bg-[#5F9EA0] text-white"
										: "bg-[#eef1f1] text-[#576363] hover:bg-[#e5f3f1] hover:text-[#3c7f80]",
								)}
							>
								{filter.label}
							</button>
						);
					})}
				</div>

				{filteredUsers.length === 0 ? (
					<div className="px-6 py-12 text-center text-sm text-[#5d6163]">
						No referred users match these filters.
					</div>
				) : (
					<ul className="divide-y divide-[#eef1f1]">
						{filteredUsers.map((user) => (
							<li
								key={user.id}
								className="grid gap-2 px-6 py-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center sm:gap-6"
							>
								<div className="min-w-0">
									<p className="truncate text-sm font-semibold text-[#576363]">
										{user.maskedName}
									</p>
									<p className="truncate text-xs text-[#5d6163]">
										{user.maskedEmail}
									</p>
								</div>
								<span
									className={cn(
										"inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
										statusBadgeClasses[user.status],
									)}
								>
									{user.status}
								</span>
								<div className="text-xs text-[#5d6163] sm:text-right">
									<p className="font-medium text-[#576363]">
										{formatCompactUsd(user.amountInvestedUsd)}
									</p>
									<p>Joined {formatDate(user.joinedAt)}</p>
								</div>
								<p className="text-sm font-semibold text-[#2e8f5b] sm:text-right">
									+{formatUsd(user.earningsUsd)}
								</p>
							</li>
						))}
					</ul>
				)}
			</section>

			<section className="rounded-lg border border-[#d7e5e3] bg-white shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				<div className="border-b border-[#eef1f1] p-6">
					<h2 className="text-base font-semibold text-[#576363]">
						Earnings history
					</h2>
					<p className="mt-1 text-sm leading-6 text-[#5d6163]">
						Every commission credit from your referrals.
					</p>
				</div>
				{data.earnings.length === 0 ? (
					<div className="px-6 py-12 text-center text-sm text-[#5d6163]">
						No referral earnings yet.
					</div>
				) : (
					<ul className="divide-y divide-[#eef1f1]">
						{data.earnings.map((earning) => (
							<li
								key={earning.id}
								className="grid gap-2 px-6 py-4 sm:grid-cols-[1fr_auto_auto_auto_auto] sm:items-center sm:gap-6"
							>
								<div className="min-w-0">
									<p className="truncate text-sm font-semibold text-[#576363]">
										{earning.type}
									</p>
									<p className="truncate text-xs text-[#5d6163]">
										From {earning.sourceMaskedName} ·{" "}
										{formatDateTime(earning.createdAt)}
									</p>
								</div>
								<span
									className={cn(
										"inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
										earningStatusClasses[earning.status],
									)}
								>
									{earning.status}
								</span>
								<p className="text-sm font-semibold text-[#2e8f5b] sm:text-right">
									+{formatUsd(earning.amountUsd)}
								</p>
								{earning.status === "Pending" ? (
									<Button
										type="button"
										size="sm"
										onClick={() => claim(earning.id)}
										disabled={isPending}
										className="sm:justify-self-end"
									>
										{claimingId === earning.id ? "Claiming…" : "Claim"}
									</Button>
								) : (
									<span className="hidden sm:block" aria-hidden="true" />
								)}
								<Link
									href={`/account/transactions?ref=${earning.reference}`}
									className="text-xs font-medium text-[#3c7f80] hover:text-[#1f5556] sm:text-right"
								>
									{earning.reference} →
								</Link>
							</li>
						))}
					</ul>
				)}
			</section>

			<section className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				<div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<h2 className="text-base font-semibold text-[#576363]">
							Marketing assets
						</h2>
						<p className="mt-1 text-sm leading-6 text-[#5d6163]">
							Ready-to-send invite messages — we&apos;ll swap in your link and code.
						</p>
					</div>
					<Link
						href={data.programTermsUrl}
						className="text-xs font-medium text-[#3c7f80] hover:text-[#1f5556]"
					>
						Program terms →
					</Link>
				</div>

				<div className="mt-5 grid gap-4 md:grid-cols-3">
					{data.inviteTemplates.map((template) => {
						const body = template.body
							.replace(/{{link}}/g, data.referralLink)
							.replace(/{{code}}/g, data.referralCode);

						return (
							<div
								key={template.id}
								className="flex flex-col rounded-lg border border-[#d7e5e3] bg-[#f7faf9] p-4"
							>
								<p className="text-xs font-semibold uppercase tracking-wide text-[#3c7f80]">
									{template.label}
								</p>
								<p className="mt-2 flex-1 text-sm leading-6 text-[#576363]">
									{body}
								</p>
								<button
									type="button"
									onClick={() => copy(body, template.id)}
									className="mt-3 inline-flex items-center gap-1 self-start text-xs font-medium text-[#3c7f80] hover:text-[#1f5556]"
								>
									{copiedId === template.id ? (
										<>
											<CheckIcon className="h-3.5 w-3.5" />
											Copied
										</>
									) : (
										<>
											<CopyIcon className="h-3.5 w-3.5" />
											Copy message
										</>
									)}
								</button>
							</div>
						);
					})}
				</div>
			</section>
		</div>
	);
}

function SummaryCard({
	hint,
	label,
	tone,
	value,
}: {
	hint: string;
	label: string;
	tone?: "positive" | "warn";
	value: string;
}) {
	const toneClass =
		tone === "positive"
			? "text-[#2e8f5b]"
			: tone === "warn"
				? "text-[#a66510]"
				: "text-[#576363]";

	return (
		<div className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<p className="text-xs font-medium uppercase tracking-wide text-[#8a9a9a]">
				{label}
			</p>
			<p className={cn("mt-2 text-2xl font-semibold", toneClass)}>{value}</p>
			<p className="mt-1 text-xs text-[#5d6163]">{hint}</p>
		</div>
	);
}

function TierCard({
	isCurrent,
	tier,
}: {
	isCurrent: boolean;
	tier: ReferralTier;
}) {
	return (
		<article
			className={cn(
				"rounded-lg border p-5 transition",
				isCurrent
					? "border-[#5F9EA0] bg-[#f1f8f7] shadow-[0_10px_30px_rgba(95,158,160,0.18)]"
					: "border-[#d7e5e3] bg-white",
			)}
		>
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-semibold text-[#576363]">{tier.name}</h3>
				{isCurrent ? (
					<span className="inline-flex items-center rounded-full bg-[#5F9EA0] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
						Current
					</span>
				) : null}
			</div>
			<p className="mt-3 text-2xl font-semibold text-[#1f5556]">
				{tier.commissionPercent}%
			</p>
			<p className="text-xs text-[#5d6163]">commission</p>
			<p className="mt-3 text-xs text-[#5d6163]">
				Unlocks at{" "}
				<span className="font-medium text-[#576363]">
					{tier.minActiveReferrals} active referrals
				</span>
			</p>
			<ul className="mt-4 space-y-2">
				{tier.perks.map((perk) => (
					<li
						key={perk}
						className="flex items-start gap-2 text-xs leading-5 text-[#5d6163]"
					>
						<CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#3c7f80]" />
						<span>{perk}</span>
					</li>
				))}
			</ul>
		</article>
	);
}

function ShareButton({
	href,
	icon: Icon,
	label,
}: {
	href: string;
	icon: (props: { className?: string }) => React.JSX.Element;
	label: string;
}) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="inline-flex items-center gap-2 rounded-md border border-[#d7e5e3] bg-white px-3 py-2 text-xs font-medium text-[#576363] transition hover:border-[#5F9EA0] hover:text-[#3c7f80]"
		>
			<Icon className="h-4 w-4" />
			{label}
		</a>
	);
}

function TwitterIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			className={className}
			aria-hidden="true"
			fill="currentColor"
		>
			<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
		</svg>
	);
}

function TelegramIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			className={className}
			aria-hidden="true"
			fill="currentColor"
		>
			<path d="M9.78 18.65 10.06 14.42 17.74 7.5c.34-.31-.07-.46-.52-.19l-9.47 5.98-4.09-1.28c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.92-.74 1.14-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42" />
		</svg>
	);
}

function WhatsAppIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			className={className}
			aria-hidden="true"
			fill="currentColor"
		>
			<path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
		</svg>
	);
}

function EmailIcon({ className }: { className?: string }) {
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
			<path d="M3 6h18v12H3zM3 7l9 7 9-7" />
		</svg>
	);
}
