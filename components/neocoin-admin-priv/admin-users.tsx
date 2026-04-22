"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
	type AdminUser,
	type AdminUserKycStatus,
	type AdminUserRisk,
	type AdminUsersData,
	type AdminUserStatus,
} from "@/lib/admin-users";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminUsersProps = {
	data: AdminUsersData;
};

type StatusFilter = AdminUserStatus | "all";
type KycFilter = AdminUserKycStatus | "all";
type RiskFilter = AdminUserRisk | "all";

const statusFilters: { label: string; value: StatusFilter }[] = [
	{ label: "All", value: "all" },
	{ label: "Active", value: "Active" },
	{ label: "Flagged", value: "Flagged" },
	{ label: "Suspended", value: "Suspended" },
];

const kycFilters: { label: string; value: KycFilter }[] = [
	{ label: "All KYC", value: "all" },
	{ label: "Approved", value: "Approved" },
	{ label: "Pending", value: "Pending" },
	{ label: "Unverified", value: "Unverified" },
	{ label: "Rejected", value: "Rejected" },
];

const riskFilters: { label: string; value: RiskFilter }[] = [
	{ label: "All risk", value: "all" },
	{ label: "High", value: "High" },
	{ label: "Medium", value: "Medium" },
	{ label: "Low", value: "Low" },
];

const statusClasses: Record<AdminUserStatus, string> = {
	Active: "bg-[#e6f3ec] text-[#2e8f5b]",
	Flagged: "bg-[#fff1e0] text-[#a66510]",
	Suspended: "bg-[#fde8e8] text-[#b1423a]",
};

const kycClasses: Record<AdminUserKycStatus, string> = {
	Approved: "bg-[#e6f3ec] text-[#2e8f5b]",
	Pending: "bg-[#fff1e0] text-[#a66510]",
	Rejected: "bg-[#fde8e8] text-[#b1423a]",
	Unverified: "bg-[#eef1f1] text-[#5d6163]",
};

const riskClasses: Record<AdminUserRisk, string> = {
	High: "bg-[#fde8e8] text-[#b1423a]",
	Low: "bg-[#e6f3ec] text-[#2e8f5b]",
	Medium: "bg-[#fff1e0] text-[#a66510]",
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
	currency: "USD",
	maximumFractionDigits: 2,
	style: "currency",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
	day: "numeric",
	hour: "numeric",
	minute: "2-digit",
	month: "short",
	year: "numeric",
});

function formatUsd(value: number) {
	return currencyFormatter.format(value);
}

function formatDateTime(iso: string) {
	return dateTimeFormatter.format(new Date(iso));
}

function SearchIcon({ className }: { className?: string }) {
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
			<path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16ZM21 21l-4.35-4.35" />
		</svg>
	);
}

export function AdminUsers({ data }: AdminUsersProps) {
	const [users, setUsers] = useState(data.users);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [kycFilter, setKycFilter] = useState<KycFilter>("all");
	const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");

	const filteredUsers = useMemo(() => {
		const trimmed = query.trim().toLowerCase();

		return users.filter((user) => {
			if (statusFilter !== "all" && user.status !== statusFilter) {
				return false;
			}

			if (kycFilter !== "all" && user.kycStatus !== kycFilter) {
				return false;
			}

			if (riskFilter !== "all" && user.risk !== riskFilter) {
				return false;
			}

			if (trimmed) {
				const haystack = [
					user.name,
					user.email,
					user.country,
					user.id,
					user.status,
					user.kycStatus,
				]
					.join(" ")
					.toLowerCase();

				if (!haystack.includes(trimmed)) {
					return false;
				}
			}

			return true;
		});
	}, [kycFilter, query, riskFilter, statusFilter, users]);

	const totals = useMemo(() => {
		return users.reduce(
			(result, user) => {
				result.balance += user.availableBalanceUsd;
				result.deposits += user.depositsUsd;
				result.withdrawals += user.withdrawalsUsd;

				return result;
			},
			{ balance: 0, deposits: 0, withdrawals: 0 },
		);
	}, [users]);

	const updateStatus = (id: string, status: AdminUserStatus) => {
		setUsers((current) =>
			current.map((user) => (user.id === id ? { ...user, status } : user)),
		);
	};

	return (
		<div className="space-y-6">
			<header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
				<div>
					<h1 className="text-2xl font-semibold text-[#576363]">
						User Management
					</h1>
					<p className="mt-1 max-w-3xl text-sm leading-6 text-[#5d6163]">
						Search accounts, review KYC state, monitor balances, and manage
						user risk actions.
					</p>
				</div>
				<div className="flex flex-wrap gap-3">
					<Link
						href="/neocoin-admin-priv/kyc-review"
						className={buttonVariants({ size: "md" })}
					>
						KYC Queue
					</Link>
					<Link
						href="/neocoin-admin-priv/support-management"
						className={buttonVariants({ size: "md", variant: "outline" })}
					>
						Support Tickets
					</Link>
				</div>
			</header>

			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<SummaryCard
					hint={`${data.summary.activeUsers} active accounts`}
					label="Total users"
					value={String(data.summary.totalUsers)}
				/>
				<SummaryCard
					hint="Accounts awaiting review"
					label="Pending KYC"
					value={String(data.summary.pendingKyc)}
					tone="warning"
				/>
				<SummaryCard
					hint="Require staff attention"
					label="Flagged users"
					value={String(data.summary.flaggedUsers)}
					tone="danger"
				/>
				<SummaryCard
					hint={`${formatUsd(totals.deposits)} total deposits`}
					label="User balances"
					value={formatUsd(totals.balance)}
				/>
			</section>

			<section className="rounded-lg border border-[#d7e5e3] bg-white shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				<div className="border-b border-[#d7e5e3] p-5">
					<div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
						<div>
							<h2 className="text-lg font-semibold text-[#576363]">
								Accounts
							</h2>
							<p className="mt-1 text-sm leading-6 text-[#5d6163]">
								{filteredUsers.length} accounts match the current filters.
							</p>
						</div>
						<div className="flex h-10 min-w-72 items-center rounded-md border border-[#cfdcda] bg-white px-3 focus-within:border-[#5F9EA0] focus-within:ring-4 focus-within:ring-[#5F9EA0]/15">
							<SearchIcon className="h-4 w-4 text-[#5d6163]" />
							<label className="sr-only" htmlFor="admin-user-search">
								Search users
							</label>
							<input
								id="admin-user-search"
								type="search"
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								placeholder="Search users"
								className="ml-2 h-full min-w-0 flex-1 bg-transparent text-sm text-[#576363] outline-none placeholder:text-[#9aa5a4]"
							/>
						</div>
					</div>

					<div className="mt-5 flex flex-wrap gap-2">
						{statusFilters.map((filter) => (
							<FilterButton
								key={filter.value}
								active={statusFilter === filter.value}
								label={filter.label}
								onClick={() => setStatusFilter(filter.value)}
							/>
						))}
					</div>
					<div className="mt-3 flex flex-wrap gap-2">
						{kycFilters.map((filter) => (
							<FilterButton
								key={filter.value}
								active={kycFilter === filter.value}
								label={filter.label}
								onClick={() => setKycFilter(filter.value)}
							/>
						))}
					</div>
					<div className="mt-3 flex flex-wrap gap-2">
						{riskFilters.map((filter) => (
							<FilterButton
								key={filter.value}
								active={riskFilter === filter.value}
								label={filter.label}
								onClick={() => setRiskFilter(filter.value)}
							/>
						))}
					</div>
				</div>

				<div className="divide-y divide-[#eef1f1]">
					{filteredUsers.length === 0 ? (
						<div className="p-8 text-center">
							<p className="font-semibold text-[#576363]">No users found</p>
							<p className="mt-2 text-sm text-[#5d6163]">
								Adjust filters or search terms.
							</p>
						</div>
					) : (
						filteredUsers.map((user) => (
							<UserRow key={user.id} onUpdateStatus={updateStatus} user={user} />
						))
					)}
				</div>
			</section>

			<section className="grid gap-4 md:grid-cols-3">
				<SummaryCard
					hint="All listed users"
					label="Deposits tracked"
					value={formatUsd(totals.deposits)}
				/>
				<SummaryCard
					hint="All listed users"
					label="Withdrawals tracked"
					value={formatUsd(totals.withdrawals)}
				/>
				<SummaryCard
					hint="Deposits minus withdrawals"
					label="Net funding"
					value={formatUsd(totals.deposits - totals.withdrawals)}
					tone="positive"
				/>
			</section>
		</div>
	);
}

function SummaryCard({
	hint,
	label,
	tone = "neutral",
	value,
}: {
	hint: string;
	label: string;
	tone?: "danger" | "neutral" | "positive" | "warning";
	value: string;
}) {
	return (
		<div className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<p className="text-sm text-[#5d6163]">{label}</p>
			<p className="mt-2 text-2xl font-semibold text-[#576363]">{value}</p>
			<p
				className={cn(
					"mt-2 text-sm",
					tone === "danger" && "text-[#b1423a]",
					tone === "positive" && "text-[#2e8f5b]",
					tone === "warning" && "text-[#a66510]",
					tone === "neutral" && "text-[#5d6163]",
				)}
			>
				{hint}
			</p>
		</div>
	);
}

function FilterButton({
	active,
	label,
	onClick,
}: {
	active: boolean;
	label: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"rounded-full px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15",
				active
					? "bg-[#5F9EA0] text-white"
					: "bg-[#f7faf9] text-[#576363] hover:bg-[#eef6f5] hover:text-[#5F9EA0]",
			)}
		>
			{label}
		</button>
	);
}

function UserRow({
	onUpdateStatus,
	user,
}: {
	onUpdateStatus: (id: string, status: AdminUserStatus) => void;
	user: AdminUser;
}) {
	return (
		<div className="grid gap-4 p-5 xl:grid-cols-[minmax(280px,1fr)_minmax(220px,0.8fr)_minmax(170px,0.6fr)_auto]">
			<div className="min-w-0">
				<div className="flex flex-wrap items-center gap-2">
					<p className="font-semibold text-[#576363]">{user.name}</p>
					<span
						className={cn(
							"rounded-full px-2.5 py-1 text-xs font-semibold",
							statusClasses[user.status],
						)}
					>
						{user.status}
					</span>
				</div>
				<p className="mt-1 truncate text-sm text-[#5d6163]">{user.email}</p>
				<p className="mt-1 text-xs text-[#5d6163]">
					{user.id} - {user.country} - Joined {formatDateTime(user.createdAt)}
				</p>
			</div>

			<div>
				<div className="flex flex-wrap gap-2">
					<span
						className={cn(
							"rounded-full px-2.5 py-1 text-xs font-semibold",
							kycClasses[user.kycStatus],
						)}
					>
						KYC {user.kycStatus}
					</span>
					<span
						className={cn(
							"rounded-full px-2.5 py-1 text-xs font-semibold",
							riskClasses[user.risk],
						)}
					>
						{user.risk} risk
					</span>
				</div>
				<p className="mt-2 text-sm text-[#5d6163]">
					Last active {formatDateTime(user.lastActiveAt)}
				</p>
				<p className="mt-1 text-sm text-[#5d6163]">
					{user.activePlans} active plans
				</p>
			</div>

			<div>
				<p className="font-semibold text-[#576363]">
					{formatUsd(user.availableBalanceUsd)}
				</p>
				<p className="mt-1 text-sm text-[#5d6163]">
					Deposits {formatUsd(user.depositsUsd)}
				</p>
				<p className="mt-1 text-sm text-[#5d6163]">
					Withdrawals {formatUsd(user.withdrawalsUsd)}
				</p>
			</div>

			<div className="flex flex-wrap items-start gap-2 xl:justify-end">
				<Button
					type="button"
					size="sm"
					variant="outline"
					onClick={() =>
						onUpdateStatus(
							user.id,
							user.status === "Suspended" ? "Active" : "Suspended",
						)
					}
				>
					{user.status === "Suspended" ? "Activate" : "Suspend"}
				</Button>
				<Button
					type="button"
					size="sm"
					variant="secondary"
					onClick={() =>
						onUpdateStatus(user.id, user.status === "Flagged" ? "Active" : "Flagged")
					}
				>
					{user.status === "Flagged" ? "Clear Flag" : "Flag"}
				</Button>
			</div>
		</div>
	);
}
