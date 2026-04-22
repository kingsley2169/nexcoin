"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
	type AdminWithdrawal,
	type AdminWithdrawalCheckStatus,
	type AdminWithdrawalKycStatus,
	type AdminWithdrawalRisk,
	type AdminWithdrawalsManagementData,
	type AdminWithdrawalStatus,
} from "@/lib/admin-withdrawals-management";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminWithdrawalsManagementProps = {
	data: AdminWithdrawalsManagementData;
};

type StatusFilter = AdminWithdrawalStatus | "all";
type KycFilter = AdminWithdrawalKycStatus | "all";
type RiskFilter = AdminWithdrawalRisk | "all";

const statusFilters: { label: string; value: StatusFilter }[] = [
	{ label: "All", value: "all" },
	{ label: "Pending", value: "Pending" },
	{ label: "AML Review", value: "AML Review" },
	{ label: "Approved", value: "Approved" },
	{ label: "Processing", value: "Processing" },
	{ label: "Completed", value: "Completed" },
	{ label: "Rejected", value: "Rejected" },
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

const statusClasses: Record<AdminWithdrawalStatus, string> = {
	"AML Review": "bg-[#fde8e8] text-[#b1423a]",
	Approved: "bg-[#eef6f5] text-[#3c7f80]",
	Completed: "bg-[#e6f3ec] text-[#2e8f5b]",
	Pending: "bg-[#fff1e0] text-[#a66510]",
	Processing: "bg-[#eef6f5] text-[#3c7f80]",
	Rejected: "bg-[#eef1f1] text-[#5d6163]",
};

const riskClasses: Record<AdminWithdrawalRisk, string> = {
	High: "bg-[#fde8e8] text-[#b1423a]",
	Low: "bg-[#e6f3ec] text-[#2e8f5b]",
	Medium: "bg-[#fff1e0] text-[#a66510]",
};

const kycClasses: Record<AdminWithdrawalKycStatus, string> = {
	Approved: "bg-[#e6f3ec] text-[#2e8f5b]",
	Pending: "bg-[#fff1e0] text-[#a66510]",
	Rejected: "bg-[#fde8e8] text-[#b1423a]",
	Unverified: "bg-[#eef1f1] text-[#5d6163]",
};

const checkClasses: Record<AdminWithdrawalCheckStatus, string> = {
	Failed: "bg-[#fde8e8] text-[#b1423a]",
	Passed: "bg-[#e6f3ec] text-[#2e8f5b]",
	Warning: "bg-[#fff1e0] text-[#a66510]",
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

function formatAssetAmount(value: number) {
	const trimmed = Number.parseFloat(value.toFixed(8));

	return Number.isFinite(trimmed) ? trimmed.toString() : "0";
}

function maskAddress(address: string) {
	if (address.length <= 18) {
		return address;
	}

	return `${address.slice(0, 8)}...${address.slice(-6)}`;
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

export function AdminWithdrawalsManagement({
	data,
}: AdminWithdrawalsManagementProps) {
	const [withdrawals, setWithdrawals] = useState(data.withdrawals);
	const [selectedId, setSelectedId] = useState(data.withdrawals[0]?.id ?? "");
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [kycFilter, setKycFilter] = useState<KycFilter>("all");
	const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
	const [note, setNote] = useState("");
	const [noteSaved, setNoteSaved] = useState(false);

	const selectedWithdrawal =
		withdrawals.find((withdrawal) => withdrawal.id === selectedId) ??
		withdrawals[0];

	const filteredWithdrawals = useMemo(() => {
		const trimmed = query.trim().toLowerCase();

		return withdrawals.filter((withdrawal) => {
			if (statusFilter !== "all" && withdrawal.status !== statusFilter) {
				return false;
			}

			if (kycFilter !== "all" && withdrawal.kycStatus !== kycFilter) {
				return false;
			}

			if (riskFilter !== "all" && withdrawal.risk !== riskFilter) {
				return false;
			}

			if (trimmed) {
				const haystack = [
					withdrawal.reference,
					withdrawal.userName,
					withdrawal.userEmail,
					withdrawal.assetSymbol,
					withdrawal.network,
					withdrawal.destinationAddress,
					withdrawal.txHash ?? "",
				]
					.join(" ")
					.toLowerCase();

				if (!haystack.includes(trimmed)) {
					return false;
				}
			}

			return true;
		});
	}, [kycFilter, query, riskFilter, statusFilter, withdrawals]);

	const visibleTotal = useMemo(
		() =>
			filteredWithdrawals.reduce(
				(sum, withdrawal) => sum + withdrawal.amountUsd,
				0,
			),
		[filteredWithdrawals],
	);

	const updateStatus = (id: string, status: AdminWithdrawalStatus) => {
		setWithdrawals((current) =>
			current.map((withdrawal) =>
				withdrawal.id === id
					? {
							...withdrawal,
							status,
							timeline: [
								{
									createdAt: new Date("2026-04-22T11:15:00Z").toISOString(),
									id: `${withdrawal.id}-${status}`,
									label: `Status changed to ${status}`,
								},
								...withdrawal.timeline,
							],
						}
					: withdrawal,
			),
		);
	};

	const saveNote = () => {
		const trimmed = note.trim();

		if (!selectedWithdrawal || !trimmed) {
			return;
		}

		setWithdrawals((current) =>
			current.map((withdrawal) =>
				withdrawal.id === selectedWithdrawal.id
					? {
							...withdrawal,
							internalNotes: [trimmed, ...withdrawal.internalNotes],
						}
					: withdrawal,
			),
		);
		setNote("");
		setNoteSaved(true);
		window.setTimeout(() => setNoteSaved(false), 2500);
	};

	return (
		<div className="space-y-6">
			<header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
				<div>
					<h1 className="text-2xl font-semibold text-[#576363]">
						Withdrawals Management
					</h1>
					<p className="mt-1 max-w-3xl text-sm leading-6 text-[#5d6163]">
						Review withdrawal requests, AML checks, payout status, and
						destination wallet risk.
					</p>
				</div>
				<div className="flex flex-wrap gap-3">
					<Button type="button" onClick={() => setStatusFilter("Pending")}>
						Pending Queue
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={() => setStatusFilter("AML Review")}
					>
						AML Review
					</Button>
					<Link
						href="/nexcoin-admin-priv/support-management"
						className={buttonVariants({ size: "md", variant: "outline" })}
					>
						Open Support
					</Link>
				</div>
			</header>

			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
				<SummaryCard
					hint={`${data.summary.pendingCount} requests`}
					label="Pending withdrawals"
					value={formatUsd(data.summary.pendingUsd)}
					tone="warning"
				/>
				<SummaryCard
					hint={`${data.summary.amlReviewCount} held requests`}
					label="AML review"
					value={formatUsd(data.summary.amlReviewUsd)}
					tone="danger"
				/>
				<SummaryCard
					hint={`${data.summary.processingCount} payouts`}
					label="Processing"
					value={formatUsd(data.summary.processingUsd)}
				/>
				<SummaryCard
					hint="Completed today"
					label="Paid out"
					value={formatUsd(data.summary.completedTodayUsd)}
					tone="positive"
				/>
				<SummaryCard
					hint="Rejected today"
					label="Rejected"
					value={formatUsd(data.summary.rejectedTodayUsd)}
				/>
				<SummaryCard
					hint="Average processing time"
					label="SLA"
					value={data.summary.averageProcessingTime}
				/>
			</section>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
				<section className="rounded-lg border border-[#d7e5e3] bg-white shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
					<div className="border-b border-[#d7e5e3] p-5">
						<div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
							<div>
								<h2 className="text-lg font-semibold text-[#576363]">
									Withdrawal queue
								</h2>
								<p className="mt-1 text-sm leading-6 text-[#5d6163]">
									{filteredWithdrawals.length} withdrawals match current filters
									- {formatUsd(visibleTotal)} total.
								</p>
							</div>
							<div className="flex h-10 min-w-72 items-center rounded-md border border-[#cfdcda] bg-white px-3 focus-within:border-[#5F9EA0] focus-within:ring-4 focus-within:ring-[#5F9EA0]/15">
								<SearchIcon className="h-4 w-4 text-[#5d6163]" />
								<label className="sr-only" htmlFor="admin-withdrawal-search">
									Search withdrawals
								</label>
								<input
									id="admin-withdrawal-search"
									type="search"
									value={query}
									onChange={(event) => setQuery(event.target.value)}
									placeholder="Search reference, user, wallet"
									className="ml-2 h-full min-w-0 flex-1 bg-transparent text-sm text-[#576363] outline-none placeholder:text-[#9aa5a4]"
								/>
							</div>
						</div>

						<FilterGroup
							filters={statusFilters}
							onChange={setStatusFilter}
							value={statusFilter}
						/>
						<FilterGroup
							filters={kycFilters}
							onChange={setKycFilter}
							value={kycFilter}
						/>
						<FilterGroup
							filters={riskFilters}
							onChange={setRiskFilter}
							value={riskFilter}
						/>
					</div>

					<div className="divide-y divide-[#eef1f1]">
						{filteredWithdrawals.length === 0 ? (
							<div className="p-8 text-center">
								<p className="font-semibold text-[#576363]">
									No withdrawals found
								</p>
								<p className="mt-2 text-sm text-[#5d6163]">
									Adjust filters or search terms.
								</p>
							</div>
						) : (
							filteredWithdrawals.map((withdrawal) => (
								<WithdrawalRow
									key={withdrawal.id}
									onSelect={setSelectedId}
									onStatusChange={updateStatus}
									selected={selectedWithdrawal?.id === withdrawal.id}
									withdrawal={withdrawal}
								/>
							))
						)}
					</div>
				</section>

				<div className="space-y-6">
					{selectedWithdrawal ? (
						<WithdrawalDetail
							note={note}
							noteSaved={noteSaved}
							onNoteChange={setNote}
							onSaveNote={saveNote}
							onStatusChange={updateStatus}
							withdrawal={selectedWithdrawal}
						/>
					) : null}
					<RulesCard rules={data.rules} />
				</div>
			</div>
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

function FilterGroup<T extends string>({
	filters,
	onChange,
	value,
}: {
	filters: { label: string; value: T }[];
	onChange: (value: T) => void;
	value: T;
}) {
	return (
		<div className="mt-3 flex flex-wrap gap-2">
			{filters.map((filter) => (
				<button
					key={filter.value}
					type="button"
					onClick={() => onChange(filter.value)}
					className={cn(
						"rounded-full px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15",
						value === filter.value
							? "bg-[#5F9EA0] text-white"
							: "bg-[#f7faf9] text-[#576363] hover:bg-[#eef6f5] hover:text-[#5F9EA0]",
					)}
				>
					{filter.label}
				</button>
			))}
		</div>
	);
}

function WithdrawalRow({
	onSelect,
	onStatusChange,
	selected,
	withdrawal,
}: {
	onSelect: (id: string) => void;
	onStatusChange: (id: string, status: AdminWithdrawalStatus) => void;
	selected: boolean;
	withdrawal: AdminWithdrawal;
}) {
	return (
		<div
			role="button"
			tabIndex={0}
			onClick={() => onSelect(withdrawal.id)}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					onSelect(withdrawal.id);
				}
			}}
			className={cn(
				"grid cursor-pointer gap-4 p-5 transition hover:bg-[#f7faf9] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15 xl:grid-cols-[minmax(260px,1fr)_minmax(190px,0.7fr)_minmax(180px,0.7fr)_auto]",
				selected && "bg-[#f7faf9]",
			)}
		>
			<div className="min-w-0">
				<div className="flex flex-wrap items-center gap-2">
					<p className="font-semibold text-[#576363]">{withdrawal.reference}</p>
					<span
						className={cn(
							"rounded-full px-2.5 py-1 text-xs font-semibold",
							statusClasses[withdrawal.status],
						)}
					>
						{withdrawal.status}
					</span>
				</div>
				<p className="mt-1 truncate text-sm text-[#5d6163]">
					{withdrawal.userName} - {withdrawal.userEmail}
				</p>
				<p className="mt-1 text-xs text-[#5d6163]">
					Created {formatDateTime(withdrawal.createdAt)}
				</p>
			</div>
			<div>
				<p className="font-semibold text-[#576363]">
					{formatAssetAmount(withdrawal.amount)} {withdrawal.assetSymbol}
				</p>
				<p className="mt-1 text-sm text-[#5d6163]">
					{formatUsd(withdrawal.amountUsd)}
				</p>
				<p className="mt-1 text-xs text-[#5d6163]">{withdrawal.network}</p>
			</div>
			<div>
				<div className="flex flex-wrap gap-2">
					<span
						className={cn(
							"rounded-full px-2.5 py-1 text-xs font-semibold",
							kycClasses[withdrawal.kycStatus],
						)}
					>
						KYC {withdrawal.kycStatus}
					</span>
					<span
						className={cn(
							"rounded-full px-2.5 py-1 text-xs font-semibold",
							riskClasses[withdrawal.risk],
						)}
					>
						{withdrawal.risk} risk
					</span>
				</div>
				<p className="mt-2 text-sm text-[#5d6163]">
					{withdrawal.destinationLabel}
				</p>
				<p className="mt-1 font-mono text-xs text-[#5d6163]">
					{maskAddress(withdrawal.destinationAddress)}
				</p>
			</div>
			<div className="flex flex-wrap items-start gap-2 xl:justify-end">
				<Button
					type="button"
					size="sm"
					onClick={(event) => {
						event.stopPropagation();
						onStatusChange(withdrawal.id, "Approved");
					}}
					disabled={withdrawal.status === "Approved" || withdrawal.status === "Completed"}
				>
					Approve
				</Button>
				<Button
					type="button"
					size="sm"
					variant="outline"
					onClick={(event) => {
						event.stopPropagation();
						onStatusChange(withdrawal.id, "Rejected");
					}}
					disabled={withdrawal.status === "Rejected"}
				>
					Reject
				</Button>
			</div>
		</div>
	);
}

function WithdrawalDetail({
	note,
	noteSaved,
	onNoteChange,
	onSaveNote,
	onStatusChange,
	withdrawal,
}: {
	note: string;
	noteSaved: boolean;
	onNoteChange: (value: string) => void;
	onSaveNote: () => void;
	onStatusChange: (id: string, status: AdminWithdrawalStatus) => void;
	withdrawal: AdminWithdrawal;
}) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="border-b border-[#d7e5e3] p-5">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h2 className="text-lg font-semibold text-[#576363]">
							Withdrawal details
						</h2>
						<p className="mt-1 text-sm text-[#5d6163]">
							{withdrawal.reference}
						</p>
					</div>
					<span
						className={cn(
							"rounded-full px-2.5 py-1 text-xs font-semibold",
							statusClasses[withdrawal.status],
						)}
					>
						{withdrawal.status}
					</span>
				</div>
			</div>

			<div className="space-y-5 p-5">
				<div className="grid gap-3">
					<DetailRow
						label="User"
						value={`${withdrawal.userName} - ${withdrawal.userEmail}`}
					/>
					<DetailRow label="Account status" value={withdrawal.accountStatus} />
					<DetailRow label="KYC" value={withdrawal.kycStatus} />
					<DetailRow
						label="Amount"
						value={`${formatAssetAmount(withdrawal.amount)} ${withdrawal.assetSymbol} (${formatUsd(withdrawal.amountUsd)})`}
					/>
					<DetailRow label="Network" value={withdrawal.network} />
					<DetailRow label="Destination" value={withdrawal.destinationLabel} />
					<DetailRow label="Address" value={withdrawal.destinationAddress} />
					<DetailRow
						label="Fee / net"
						value={`${formatAssetAmount(withdrawal.fee)} fee - ${formatAssetAmount(withdrawal.netAmount)} net`}
					/>
					{withdrawal.txHash ? <DetailRow label="Tx hash" value={withdrawal.txHash} /> : null}
				</div>

				<div>
					<p className="font-semibold text-[#576363]">AML and security checks</p>
					<div className="mt-3 space-y-2">
						{withdrawal.checks.map((check) => (
							<div
								key={check.label}
								className="flex items-center justify-between gap-3 rounded-lg border border-[#eef1f1] p-3"
							>
								<p className="text-sm font-medium text-[#576363]">
									{check.label}
								</p>
								<span
									className={cn(
										"rounded-full px-2.5 py-1 text-xs font-semibold",
										checkClasses[check.status],
									)}
								>
									{check.status}
								</span>
							</div>
						))}
					</div>
				</div>

				<div>
					<p className="font-semibold text-[#576363]">Security notes</p>
					<ul className="mt-3 space-y-2">
						{withdrawal.securityNotes.map((securityNote) => (
							<li
								key={securityNote}
								className="rounded-lg bg-[#fff8ec] p-3 text-sm leading-6 text-[#8a5b14]"
							>
								{securityNote}
							</li>
						))}
					</ul>
				</div>

				<div>
					<p className="font-semibold text-[#576363]">Timeline</p>
					<div className="mt-3 space-y-3">
						{withdrawal.timeline.map((item) => (
							<div key={item.id} className="border-l-2 border-[#d7e5e3] pl-3">
								<p className="text-sm font-semibold text-[#576363]">
									{item.label}
								</p>
								<p className="mt-1 text-xs text-[#5d6163]">
									{formatDateTime(item.createdAt)}
								</p>
							</div>
						))}
					</div>
				</div>

				<div>
					<p className="font-semibold text-[#576363]">Internal notes</p>
					<ul className="mt-3 space-y-2">
						{withdrawal.internalNotes.map((internalNote) => (
							<li
								key={internalNote}
								className="rounded-lg border border-[#eef1f1] p-3 text-sm leading-6 text-[#5d6163]"
							>
								{internalNote}
							</li>
						))}
					</ul>
					<label
						className="mt-4 block text-sm font-semibold text-[#576363]"
						htmlFor="withdrawal-note"
					>
						Add note
					</label>
					<textarea
						id="withdrawal-note"
						value={note}
						onChange={(event) => onNoteChange(event.target.value)}
						rows={4}
						className="mt-2 w-full rounded-md border border-[#cfdcda] bg-white px-3 py-2 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
						placeholder="Add internal staff note..."
					/>
					<Button type="button" className="mt-3" onClick={onSaveNote}>
						Save Note
					</Button>
					{noteSaved ? (
						<p className="mt-2 text-sm font-medium text-[#3c7f80]">Note saved.</p>
					) : null}
				</div>

				<div className="grid gap-2 sm:grid-cols-2">
					<Button type="button" onClick={() => onStatusChange(withdrawal.id, "Approved")}>
						Approve
					</Button>
					<Button
						type="button"
						variant="secondary"
						onClick={() => onStatusChange(withdrawal.id, "Processing")}
					>
						Mark Processing
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={() => onStatusChange(withdrawal.id, "Completed")}
					>
						Mark Completed
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={() => onStatusChange(withdrawal.id, "Rejected")}
					>
						Reject
					</Button>
				</div>
			</div>
		</section>
	);
}

function RulesCard({ rules }: { rules: string[] }) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<h2 className="text-lg font-semibold text-[#576363]">
				Processing rules
			</h2>
			<ul className="mt-4 space-y-3">
				{rules.map((rule) => (
					<li key={rule} className="flex gap-3 text-sm leading-6 text-[#5d6163]">
						<span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5F9EA0]" />
						<span>{rule}</span>
					</li>
				))}
			</ul>
		</section>
	);
}

function DetailRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="border-b border-[#eef1f1] pb-3 last:border-b-0 last:pb-0">
			<p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5F9EA0]">
				{label}
			</p>
			<p className="mt-1 break-words text-sm font-semibold text-[#576363]">
				{value}
			</p>
		</div>
	);
}
