"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
	type AdminTransaction,
	type AdminTransactionDirection,
	type AdminTransactionsData,
	type AdminTransactionStatus,
	type AdminTransactionType,
	type AdminTransactionExceptionSeverity,
} from "@/lib/admin-transactions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminTransactionsProps = {
	data: AdminTransactionsData;
};

type TypeFilter = AdminTransactionType | "all";
type StatusFilter = AdminTransactionStatus | "all";
type DirectionFilter = AdminTransactionDirection | "all";
type DateFilter = "7d" | "30d" | "90d" | "all";

const typeFilters: { label: string; value: TypeFilter }[] = [
	{ label: "All", value: "all" },
	{ label: "Deposits", value: "Deposit" },
	{ label: "Withdrawals", value: "Withdrawal" },
	{ label: "Investments", value: "Investment" },
	{ label: "Profits", value: "Profit" },
	{ label: "Fees", value: "Fee" },
	{ label: "Referrals", value: "Referral" },
	{ label: "Adjustments", value: "Adjustment" },
];

const statusFilters: { label: string; value: StatusFilter }[] = [
	{ label: "All status", value: "all" },
	{ label: "Completed", value: "Completed" },
	{ label: "Credited", value: "Credited" },
	{ label: "Pending", value: "Pending" },
	{ label: "Processing", value: "Processing" },
	{ label: "Failed", value: "Failed" },
	{ label: "Rejected", value: "Rejected" },
	{ label: "Reviewed", value: "Reviewed" },
];

const directionFilters: { label: string; value: DirectionFilter }[] = [
	{ label: "All directions", value: "all" },
	{ label: "In", value: "In" },
	{ label: "Out", value: "Out" },
];

const dateFilters: { label: string; value: DateFilter }[] = [
	{ label: "7D", value: "7d" },
	{ label: "30D", value: "30d" },
	{ label: "90D", value: "90d" },
	{ label: "All", value: "all" },
];

const statusClasses: Record<AdminTransactionStatus, string> = {
	Completed: "bg-[#e6f3ec] text-[#2e8f5b]",
	Credited: "bg-[#e6f3ec] text-[#2e8f5b]",
	Failed: "bg-[#fde8e8] text-[#b1423a]",
	Pending: "bg-[#fff1e0] text-[#a66510]",
	Processing: "bg-[#eef6f5] text-[#3c7f80]",
	Rejected: "bg-[#eef1f1] text-[#5d6163]",
	Reviewed: "bg-[#eef6f5] text-[#3c7f80]",
};

const typeClasses: Record<AdminTransactionType, string> = {
	Adjustment: "bg-[#fff1e0] text-[#a66510]",
	Deposit: "bg-[#e6f3ec] text-[#2e8f5b]",
	Fee: "bg-[#eef1f1] text-[#5d6163]",
	Investment: "bg-[#eef6f5] text-[#3c7f80]",
	Profit: "bg-[#e6f3ec] text-[#2e8f5b]",
	Referral: "bg-[#eef6f5] text-[#3c7f80]",
	Withdrawal: "bg-[#fde8e8] text-[#b1423a]",
};

const severityClasses: Record<AdminTransactionExceptionSeverity, string> = {
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

function formatAssetAmount(value: number) {
	const trimmed = Number.parseFloat(value.toFixed(8));

	return Number.isFinite(trimmed) ? trimmed.toString() : "0";
}

function maskHash(value?: string) {
	if (!value) {
		return "Not recorded";
	}

	if (value.length <= 18) {
		return value;
	}

	return `${value.slice(0, 10)}...${value.slice(-8)}`;
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

export function AdminTransactions({ data }: AdminTransactionsProps) {
	const [transactions, setTransactions] = useState(data.transactions);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [isReviewOpen, setIsReviewOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [directionFilter, setDirectionFilter] = useState<DirectionFilter>("all");
	const [assetFilter, setAssetFilter] = useState("all");
	const [dateFilter, setDateFilter] = useState<DateFilter>("30d");
	const [note, setNote] = useState("");
	const [noteSaved, setNoteSaved] = useState(false);

	const assetFilters = useMemo(
		() => ["all", ...Array.from(new Set(transactions.map((item) => item.assetSymbol)))],
		[transactions],
	);

	const selectedTransaction = selectedId
		? transactions.find((transaction) => transaction.id === selectedId) ?? null
		: null;

	const filteredTransactions = useMemo(() => {
		const trimmed = query.trim().toLowerCase();
		const now = new Date("2026-04-22T12:00:00Z");
		const dayWindow =
			dateFilter === "7d"
				? 7
				: dateFilter === "30d"
					? 30
					: dateFilter === "90d"
						? 90
						: null;

		return transactions.filter((transaction) => {
			if (typeFilter !== "all" && transaction.type !== typeFilter) {
				return false;
			}

			if (statusFilter !== "all" && transaction.status !== statusFilter) {
				return false;
			}

			if (
				directionFilter !== "all" &&
				transaction.direction !== directionFilter
			) {
				return false;
			}

			if (assetFilter !== "all" && transaction.assetSymbol !== assetFilter) {
				return false;
			}

			if (dayWindow) {
				const ageMs = now.getTime() - new Date(transaction.createdAt).getTime();
				const ageDays = ageMs / (1000 * 60 * 60 * 24);

				if (ageDays > dayWindow) {
					return false;
				}
			}

			if (trimmed) {
				const haystack = [
					transaction.reference,
					transaction.userName,
					transaction.userEmail,
					transaction.txHash ?? "",
					transaction.walletAddress ?? "",
					transaction.linkedReference,
					transaction.method,
					transaction.network,
					transaction.exception ?? "",
					...transaction.internalNotes,
				]
					.join(" ")
					.toLowerCase();

				if (!haystack.includes(trimmed)) {
					return false;
				}
			}

			return true;
		});
	}, [
		assetFilter,
		dateFilter,
		directionFilter,
		query,
		statusFilter,
		transactions,
		typeFilter,
	]);

	const visibleInflow = useMemo(
		() =>
			filteredTransactions
				.filter((transaction) => transaction.direction === "In")
				.reduce((sum, transaction) => sum + transaction.amountUsd, 0),
		[filteredTransactions],
	);

	const visibleOutflow = useMemo(
		() =>
			filteredTransactions
				.filter((transaction) => transaction.direction === "Out")
				.reduce((sum, transaction) => sum + transaction.amountUsd, 0),
		[filteredTransactions],
	);

	const markReviewed = (id: string) => {
		setTransactions((current) =>
			current.map((transaction) =>
				transaction.id === id
					? {
							...transaction,
							reviewed: true,
							status:
								transaction.status === "Failed" || transaction.status === "Rejected"
									? "Reviewed"
									: transaction.status,
							timeline: [
								{
									createdAt: new Date("2026-04-22T11:45:00Z").toISOString(),
									id: `${transaction.id}-reviewed`,
									label: "Marked reviewed by admin",
								},
								...transaction.timeline,
							],
						}
					: transaction,
			),
		);
	};

	const saveNote = () => {
		const trimmed = note.trim();

		if (!selectedTransaction || !trimmed) {
			return;
		}

		setTransactions((current) =>
			current.map((transaction) =>
				transaction.id === selectedTransaction.id
					? {
							...transaction,
							internalNotes: [trimmed, ...transaction.internalNotes],
						}
					: transaction,
			),
		);
		setNote("");
		setNoteSaved(true);
		window.setTimeout(() => setNoteSaved(false), 2500);
	};

	const resetFilters = () => {
		setQuery("");
		setTypeFilter("all");
		setStatusFilter("all");
		setDirectionFilter("all");
		setAssetFilter("all");
		setDateFilter("30d");
	};

	const openReview = (id: string) => {
		setSelectedId(id);
		setIsReviewOpen(true);
	};

	const closeReview = () => {
		setIsReviewOpen(false);
	};

	return (
		<div className="space-y-6">
			<header className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
				<div className="min-w-0">
					<h1 className="text-2xl font-semibold text-[#576363]">
						Transaction Management
					</h1>
					<p className="mt-1 max-w-3xl text-sm leading-6 text-[#5d6163]">
						Inspect every deposit, withdrawal, investment, profit, fee, referral,
						and manual adjustment across the platform ledger.
					</p>
				</div>
				<div className="flex flex-wrap gap-3">
					<Button type="button" onClick={() => setStatusFilter("Failed")}>
						Review Exceptions
					</Button>
					<Link
						href="/nexcoin-admin-priv/deposits-management"
						className={buttonVariants({ size: "md", variant: "outline" })}
					>
						Review Deposits
					</Link>
					<Link
						href="/nexcoin-admin-priv/withdrawals-management"
						className={buttonVariants({ size: "md", variant: "outline" })}
					>
						Review Withdrawals
					</Link>
				</div>
			</header>

			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
				<SummaryCard
					hint="Deposits and credits"
					label="Total inflow"
					value={formatUsd(data.summary.totalInflowUsd)}
					tone="positive"
				/>
				<SummaryCard
					hint="Withdrawals and debits"
					label="Total outflow"
					value={formatUsd(data.summary.totalOutflowUsd)}
				/>
				<SummaryCard
					hint={`${data.summary.pendingProcessingCount} entries`}
					label="Pending / processing"
					value={data.summary.pendingProcessingCount.toString()}
					tone="warning"
				/>
				<SummaryCard
					hint={`${data.summary.failedRejectedCount} entries`}
					label="Failed / rejected"
					value={data.summary.failedRejectedCount.toString()}
					tone="danger"
				/>
				<SummaryCard
					hint="Network and service fees"
					label="Fees collected"
					value={formatUsd(data.summary.feesCollectedUsd)}
				/>
				<SummaryCard
					hint="All-time ledger rows"
					label="Ledger entries"
					value={data.summary.ledgerEntries.toLocaleString("en-US")}
				/>
			</section>

			<div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_390px]">
				<section className="rounded-lg border border-[#d7e5e3] bg-white shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
					<div className="border-b border-[#d7e5e3] p-5">
						<div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
							<div className="min-w-0">
								<h2 className="text-lg font-semibold text-[#576363]">
									Ledger activity
								</h2>
								<p className="mt-1 text-sm leading-6 text-[#5d6163]">
									{filteredTransactions.length} entries match current filters.
									Inflow {formatUsd(visibleInflow)} - outflow{" "}
									{formatUsd(visibleOutflow)}.
								</p>
							</div>
							<div className="flex h-10 w-full min-w-0 items-center rounded-md border border-[#cfdcda] bg-white px-3 focus-within:border-[#5F9EA0] focus-within:ring-4 focus-within:ring-[#5F9EA0]/15 sm:max-w-md 2xl:w-80">
								<SearchIcon className="h-4 w-4 text-[#5d6163]" />
								<label className="sr-only" htmlFor="admin-transaction-search">
									Search transactions
								</label>
								<input
									id="admin-transaction-search"
									type="search"
									value={query}
									onChange={(event) => setQuery(event.target.value)}
									placeholder="Search reference, user, hash, wallet"
									className="ml-2 h-full min-w-0 flex-1 bg-transparent text-sm text-[#576363] outline-none placeholder:text-[#9aa5a4]"
								/>
							</div>
						</div>

						<FilterGroup
							filters={typeFilters}
							onChange={setTypeFilter}
							value={typeFilter}
						/>
						<FilterGroup
							filters={statusFilters}
							onChange={setStatusFilter}
							value={statusFilter}
						/>
						<FilterGroup
							filters={directionFilters}
							onChange={setDirectionFilter}
							value={directionFilter}
						/>
						<FilterGroup
							filters={assetFilters.map((asset) => ({
								label: asset === "all" ? "All assets" : asset,
								value: asset,
							}))}
							onChange={setAssetFilter}
							value={assetFilter}
						/>
						<div className="mt-3 flex flex-wrap items-start gap-2">
							<FilterGroup
								filters={dateFilters}
								onChange={setDateFilter}
								value={dateFilter}
								wrapperClassName="mt-0"
							/>
							<Button type="button" variant="outline" onClick={resetFilters}>
								Reset filters
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={() => window.alert("CSV export is ready for backend wiring.")}
							>
								Export CSV
							</Button>
						</div>
					</div>

					<div className="divide-y divide-[#eef1f1]">
						{filteredTransactions.length === 0 ? (
							<div className="p-8 text-center">
								<p className="font-semibold text-[#576363]">
									No transactions found
								</p>
								<p className="mt-2 text-sm text-[#5d6163]">
									Adjust filters or search terms.
								</p>
							</div>
						) : (
							filteredTransactions.map((transaction) => (
								<TransactionRow
									key={transaction.id}
									onMarkReviewed={markReviewed}
									onReview={openReview}
									transaction={transaction}
								/>
							))
						)}
					</div>
				</section>

				<div className="space-y-6 2xl:sticky 2xl:top-24 2xl:self-start">
					<ReconciliationCard items={data.reconciliation} />
					<ExceptionsCard exceptions={data.exceptions} />
				</div>
			</div>

			{isReviewOpen && selectedTransaction ? (
				<TransactionReviewModal
					onClose={closeReview}
					transaction={selectedTransaction}
				>
					<TransactionDetail
						note={note}
						noteSaved={noteSaved}
						onMarkReviewed={markReviewed}
						onNoteChange={setNote}
						onSaveNote={saveNote}
						transaction={selectedTransaction}
					/>
				</TransactionReviewModal>
			) : null}
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
	wrapperClassName,
}: {
	filters: { label: string; value: T }[];
	onChange: (value: T) => void;
	value: T;
	wrapperClassName?: string;
}) {
	return (
		<div className={cn("mt-3 flex flex-wrap gap-2", wrapperClassName)}>
			{filters.map((filter) => (
				<button
					key={filter.value}
					type="button"
					onClick={() => onChange(filter.value)}
					className={cn(
						"h-10 rounded-full px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15",
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

function TransactionRow({
	onMarkReviewed,
	onReview,
	transaction,
}: {
	onMarkReviewed: (id: string) => void;
	onReview: (id: string) => void;
	transaction: AdminTransaction;
}) {
	return (
		<div
			role="button"
			tabIndex={0}
			onClick={() => onReview(transaction.id)}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					onReview(transaction.id);
				}
			}}
			className="grid cursor-pointer gap-4 p-5 transition hover:bg-[#f7faf9] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15 lg:grid-cols-[minmax(240px,1fr)_minmax(150px,0.45fr)] 2xl:grid-cols-[minmax(260px,1fr)_minmax(160px,0.55fr)_minmax(180px,0.7fr)_auto]"
		>
			<div className="min-w-0">
				<div className="flex flex-wrap items-center gap-2">
					<p className="font-semibold text-[#576363]">
						{transaction.reference}
					</p>
					<span
						className={cn(
							"rounded-full px-2.5 py-1 text-xs font-semibold",
							typeClasses[transaction.type],
						)}
					>
						{transaction.type}
					</span>
					<span
						className={cn(
							"rounded-full px-2.5 py-1 text-xs font-semibold",
							statusClasses[transaction.status],
						)}
					>
						{transaction.status}
					</span>
				</div>
				<p className="mt-1 truncate text-sm text-[#5d6163]">
					{transaction.userName} - {transaction.userEmail}
				</p>
				<p className="mt-1 text-xs text-[#5d6163]">
					{formatDateTime(transaction.createdAt)} - linked to{" "}
					{transaction.linkedReference}
				</p>
			</div>
			<div>
				<p className="font-semibold text-[#576363]">
					{transaction.direction === "In" ? "+" : "-"}
					{formatAssetAmount(transaction.amount)} {transaction.assetSymbol}
				</p>
				<p className="mt-1 text-sm text-[#5d6163]">
					{formatUsd(transaction.amountUsd)}
				</p>
				<p className="mt-1 text-xs text-[#5d6163]">
					Fee {formatUsd(transaction.feeUsd)}
				</p>
			</div>
			<div className="min-w-0 lg:col-span-2 2xl:col-span-1">
				<p className="truncate text-sm font-semibold text-[#576363]">
					{transaction.method}
				</p>
				<p className="mt-1 truncate text-sm text-[#5d6163]">
					{transaction.network}
				</p>
				<p className="mt-1 truncate text-xs text-[#5d6163]">
					{maskHash(transaction.txHash)}
				</p>
			</div>
			<div className="flex flex-wrap items-start justify-end gap-2 self-start lg:col-span-2 2xl:col-span-1">
				{transaction.exception ? (
					<span className="rounded-full bg-[#fde8e8] px-2.5 py-1 text-xs font-semibold text-[#b1423a]">
						Exception
					</span>
				) : null}
				<Button
					type="button"
					size="sm"
					variant={transaction.reviewed ? "outline" : "primary"}
					onClick={(event) => {
						event.stopPropagation();
						onMarkReviewed(transaction.id);
					}}
				>
					{transaction.reviewed ? "Reviewed" : "Mark reviewed"}
				</Button>
			</div>
		</div>
	);
}

function TransactionReviewModal({
	children,
	onClose,
	transaction,
}: {
	children: React.ReactNode;
	onClose: () => void;
	transaction: AdminTransaction;
}) {
	return (
		<div
			className="fixed inset-0 z-[70] bg-[#1f2929]/45 p-3 backdrop-blur-sm sm:p-5"
			role="dialog"
			aria-modal="true"
			aria-labelledby="admin-transaction-review-modal-title"
		>
			<div
				className="absolute inset-0"
				aria-hidden="true"
				onClick={onClose}
			/>
			<section className="relative mx-auto flex max-h-[calc(100vh-24px)] max-w-3xl flex-col overflow-hidden rounded-lg border border-[#d7e5e3] bg-[#f7faf9] shadow-[0_28px_90px_rgba(31,41,41,0.28)] sm:max-h-[calc(100vh-40px)]">
				<header className="flex items-start justify-between gap-4 border-b border-[#d7e5e3] bg-white px-5 py-4">
					<div className="min-w-0">
						<p className="text-sm text-[#5d6163]">Transaction review</p>
						<h2
							id="admin-transaction-review-modal-title"
							className="mt-1 text-lg font-semibold text-[#576363]"
						>
							{transaction.reference}
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-full border border-[#d7e5e3] bg-white px-3 py-1.5 text-sm font-semibold text-[#576363] transition hover:border-[#5F9EA0] hover:text-[#5F9EA0] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15"
					>
						Close
					</button>
				</header>
				<div className="overflow-y-auto p-4 sm:p-6">{children}</div>
			</section>
		</div>
	);
}

function TransactionDetail({
	note,
	noteSaved,
	onMarkReviewed,
	onNoteChange,
	onSaveNote,
	transaction,
}: {
	note: string;
	noteSaved: boolean;
	onMarkReviewed: (id: string) => void;
	onNoteChange: (value: string) => void;
	onSaveNote: () => void;
	transaction: AdminTransaction;
}) {
	return (
		<div className="space-y-5">
			<div className="flex flex-wrap items-center gap-2">
				<span
					className={cn(
						"rounded-full px-2.5 py-1 text-xs font-semibold",
						typeClasses[transaction.type],
					)}
				>
					{transaction.type}
				</span>
				<span
					className={cn(
						"rounded-full px-2.5 py-1 text-xs font-semibold",
						statusClasses[transaction.status],
					)}
				>
					{transaction.status}
				</span>
				<span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#5F9EA0]">
					{transaction.direction === "In" ? "Inflow" : "Outflow"}
				</span>
			</div>

			<div className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				<p className="text-sm font-semibold text-[#576363]">Ledger details</p>
				<div className="mt-3 grid gap-3 text-sm">
					<DetailLine label="User" value={`${transaction.userName} - ${transaction.userEmail}`} />
					<DetailLine label="Type" value={transaction.type} />
					<DetailLine label="Direction" value={transaction.direction} />
					<DetailLine
						label="Amount"
						value={`${formatAssetAmount(transaction.amount)} ${transaction.assetSymbol} (${formatUsd(transaction.amountUsd)})`}
					/>
					<DetailLine label="Fee" value={formatUsd(transaction.feeUsd)} />
					<DetailLine label="Network" value={transaction.network} />
					<DetailLine label="Method" value={transaction.method} />
					<DetailLine label="Linked ref" value={transaction.linkedReference} />
					<DetailLine label="Tx hash" value={maskHash(transaction.txHash)} />
					{transaction.walletAddress ? (
						<DetailLine label="Wallet" value={maskHash(transaction.walletAddress)} />
					) : null}
				</div>
			</div>

			{transaction.exception ? (
				<div className="rounded-lg border border-[#f2c5c0] bg-[#fff7f6] p-5">
					<p className="text-sm font-semibold text-[#b1423a]">Exception</p>
					<p className="mt-1 text-sm leading-6 text-[#5d6163]">
						{transaction.exception}
					</p>
				</div>
			) : null}

			<div className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				<p className="text-sm font-semibold text-[#576363]">Timeline</p>
				<div className="mt-3 space-y-3">
					{transaction.timeline.map((item) => (
						<div key={item.id} className="border-l-2 border-[#d7e5e3] pl-3">
							<p className="text-sm font-medium text-[#576363]">{item.label}</p>
							<p className="mt-1 text-xs text-[#5d6163]">
								{formatDateTime(item.createdAt)}
							</p>
						</div>
					))}
				</div>
			</div>

			<div className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				<p className="text-sm font-semibold text-[#576363]">Internal notes</p>
				<div className="mt-3 space-y-2">
					{transaction.internalNotes.map((item) => (
						<p
							key={item}
							className="rounded-md bg-[#f7faf9] px-3 py-2 text-sm leading-6 text-[#5d6163]"
						>
							{item}
						</p>
					))}
				</div>
				<label className="sr-only" htmlFor="admin-transaction-note">
					Add internal note
				</label>
				<textarea
					id="admin-transaction-note"
					value={note}
					onChange={(event) => onNoteChange(event.target.value)}
					placeholder="Add an internal note"
					className="mt-3 min-h-24 w-full rounded-md border border-[#cfdcda] bg-white px-3 py-2 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
				/>
				<div className="mt-3 flex flex-wrap gap-3">
					<Button type="button" onClick={onSaveNote}>
						Save note
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={() => onMarkReviewed(transaction.id)}
					>
						Mark reviewed
					</Button>
				</div>
				{noteSaved ? (
					<p className="mt-2 text-sm font-semibold text-[#2e8f5b]">Note saved.</p>
				) : null}
			</div>
		</div>
	);
}

function DetailLine({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-start justify-between gap-4 border-b border-[#eef1f1] pb-2 last:border-b-0">
			<span className="text-[#5d6163]">{label}</span>
			<span className="min-w-0 text-right font-semibold text-[#576363]">
				{value}
			</span>
		</div>
	);
}

function ReconciliationCard({
	items,
}: {
	items: AdminTransactionsData["reconciliation"];
}) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<h2 className="text-lg font-semibold text-[#576363]">Reconciliation</h2>
			<div className="mt-4 space-y-3">
				{items.map((item) => (
					<div
						key={item.id}
						className="rounded-lg border border-[#eef1f1] bg-[#f7faf9] p-4"
					>
						<div className="flex items-start justify-between gap-3">
							<p className="font-semibold text-[#576363]">{item.label}</p>
							<span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#5F9EA0]">
								{item.count}
							</span>
						</div>
						<p className="mt-2 text-sm text-[#5d6163]">
							{formatUsd(item.valueUsd)} requires matching or review.
						</p>
					</div>
				))}
			</div>
		</section>
	);
}

function ExceptionsCard({
	exceptions,
}: {
	exceptions: AdminTransactionsData["exceptions"];
}) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<h2 className="text-lg font-semibold text-[#576363]">Exceptions</h2>
			<div className="mt-4 space-y-3">
				{exceptions.map((exception) => (
					<div key={exception.id} className="border-b border-[#eef1f1] pb-3 last:border-b-0 last:pb-0">
						<div className="flex flex-wrap items-center gap-2">
							<p className="font-semibold text-[#576363]">{exception.title}</p>
							<span
								className={cn(
									"rounded-full px-2.5 py-1 text-xs font-semibold",
									severityClasses[exception.severity],
								)}
							>
								{exception.severity}
							</span>
							<span className="rounded-full bg-[#f7faf9] px-2.5 py-1 text-xs font-semibold text-[#5F9EA0]">
								{exception.count}
							</span>
						</div>
						<p className="mt-2 text-sm leading-6 text-[#5d6163]">
							{exception.description}
						</p>
					</div>
				))}
			</div>
		</section>
	);
}
