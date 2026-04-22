"use client";

import { useMemo, useState } from "react";
import {
	type Transaction,
	type TransactionStatus,
	type TransactionType,
	transactionStatusLabels,
	transactionTypeLabels,
} from "@/lib/transactions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AccountTransactionsProps = {
	data: Transaction[];
};

type DateRangeKey = "30D" | "7D" | "90D" | "all";

type TypeFilter = "all" | TransactionType;
type StatusFilter = "all" | TransactionStatus;

const typeFilters: { label: string; value: TypeFilter }[] = [
	{ label: "All", value: "all" },
	{ label: "Deposits", value: "deposit" },
	{ label: "Withdrawals", value: "withdrawal" },
	{ label: "Investments", value: "investment" },
	{ label: "Profits", value: "profit" },
	{ label: "Fees", value: "fee" },
	{ label: "Referrals", value: "referral" },
];

const statusOptions: { label: string; value: StatusFilter }[] = [
	{ label: "All statuses", value: "all" },
	{ label: "Completed", value: "completed" },
	{ label: "Credited", value: "credited" },
	{ label: "Pending", value: "pending" },
	{ label: "Processing", value: "processing" },
	{ label: "Accruing", value: "accruing" },
	{ label: "Failed", value: "failed" },
];

const dateRanges: { days: null | number; label: string; value: DateRangeKey }[] =
	[
		{ days: 7, label: "7D", value: "7D" },
		{ days: 30, label: "30D", value: "30D" },
		{ days: 90, label: "90D", value: "90D" },
		{ days: null, label: "All", value: "all" },
	];

const referenceTimestamp = new Date("2026-04-21T00:00:00Z").getTime();

const statusBadgeClasses: Record<TransactionStatus, string> = {
	accruing: "bg-[#eef6f5] text-[#3c7f80]",
	completed: "bg-[#e6f3ec] text-[#2e8f5b]",
	credited: "bg-[#e6f3ec] text-[#2e8f5b]",
	failed: "bg-[#fde8e8] text-[#b1423a]",
	pending: "bg-[#fff1e0] text-[#a66510]",
	processing: "bg-[#eef6f5] text-[#3c7f80]",
};

const typeIconBackgrounds: Record<TransactionType, string> = {
	deposit: "bg-[#e6f3ec] text-[#2e8f5b]",
	fee: "bg-[#eef1f1] text-[#5d6163]",
	investment: "bg-[#eef6f5] text-[#3c7f80]",
	profit: "bg-[#e5f3f1] text-[#3c7f80]",
	referral: "bg-[#fff1e0] text-[#a66510]",
	withdrawal: "bg-[#fde8e8] text-[#b1423a]",
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

const csvDateFormatter = new Intl.DateTimeFormat("en-CA", {
	day: "2-digit",
	month: "2-digit",
	year: "numeric",
});

function formatUsd(value: number) {
	return currencyFormatter.format(value);
}

function formatAssetAmount(value: number) {
	const trimmed = Number.parseFloat(value.toFixed(8));

	return Number.isFinite(trimmed) ? trimmed.toString() : "0";
}

function formatDateTime(iso: string) {
	return dateTimeFormatter.format(new Date(iso));
}

function formatCsvDate(iso: string) {
	return csvDateFormatter.format(new Date(iso));
}

function maskHash(hash: string) {
	if (hash.length <= 16) {
		return hash;
	}

	return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

function DepositIcon({ className }: { className?: string }) {
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
			<path d="M12 5v11M8 12l4 4 4-4M5 20h14" />
		</svg>
	);
}

function WithdrawalIcon({ className }: { className?: string }) {
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
			<path d="M12 19V8M8 12l4-4 4 4M5 4h14" />
		</svg>
	);
}

function InvestmentIcon({ className }: { className?: string }) {
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
			<path d="M5 5h14v14H5zM9 9h6M9 13h6M9 17h3" />
		</svg>
	);
}

function ProfitIcon({ className }: { className?: string }) {
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
			<path d="M4 17 9 12l3 2 5-7M14 8h4v4" />
		</svg>
	);
}

function FeeIcon({ className }: { className?: string }) {
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
			<path d="M7 17 17 7M8.5 8.5h.01M15.5 15.5h.01" />
		</svg>
	);
}

function ReferralIcon({ className }: { className?: string }) {
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
			<path d="M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM15.5 13a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3 20c.9-3.4 2.7-5 5.5-5 2.2 0 3.8 1 4.8 3M13 20c.7-2 1.9-3 3.7-3 1.7 0 3 1 3.8 3" />
		</svg>
	);
}

const typeIcons: Record<
	TransactionType,
	(props: { className?: string }) => React.JSX.Element
> = {
	deposit: DepositIcon,
	fee: FeeIcon,
	investment: InvestmentIcon,
	profit: ProfitIcon,
	referral: ReferralIcon,
	withdrawal: WithdrawalIcon,
};

function DownloadIcon({ className }: { className?: string }) {
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
			<path d="M12 4v12M7 11l5 5 5-5M5 20h14" />
		</svg>
	);
}

function ChevronIcon({
	className,
	expanded,
}: {
	className?: string;
	expanded: boolean;
}) {
	return (
		<svg
			viewBox="0 0 24 24"
			className={cn(
				"transition-transform",
				expanded && "rotate-180",
				className,
			)}
			aria-hidden="true"
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2"
		>
			<path d="m6 9 6 6 6-6" />
		</svg>
	);
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

function buildCsv(rows: Transaction[]) {
	const header = [
		"Date",
		"Reference",
		"Type",
		"Status",
		"Asset",
		"Amount",
		"Direction",
		"Amount (USD)",
		"Detail",
	];

	const lines = rows.map((row) =>
		[
			formatCsvDate(row.createdAt),
			row.reference,
			transactionTypeLabels[row.type],
			transactionStatusLabels[row.status],
			row.assetSymbol,
			formatAssetAmount(row.amount),
			row.direction,
			row.amountUsd.toFixed(2),
			row.detail.replace(/"/g, '""'),
		]
			.map((cell) => `"${cell}"`)
			.join(","),
	);

	return [header.map((cell) => `"${cell}"`).join(","), ...lines].join("\n");
}

function downloadCsv(rows: Transaction[]) {
	const csv = buildCsv(rows);
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	const timestamp = new Date().toISOString().slice(0, 10);

	anchor.href = url;
	anchor.download = `nexcoin-transactions-${timestamp}.csv`;
	anchor.click();
	URL.revokeObjectURL(url);
}

export function AccountTransactions({ data }: AccountTransactionsProps) {
	const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [assetFilter, setAssetFilter] = useState<string>("all");
	const [search, setSearch] = useState("");
	const [dateRange, setDateRange] = useState<DateRangeKey>("30D");
	const [expandedId, setExpandedId] = useState<null | string>(null);

	const assets = useMemo(() => {
		const set = new Set<string>();

		for (const tx of data) {
			set.add(tx.assetSymbol);
		}

		return Array.from(set).sort();
	}, [data]);

	const filtered = useMemo(() => {
		const range = dateRanges.find((item) => item.value === dateRange);
		const cutoff =
			range && range.days !== null
				? referenceTimestamp - range.days * 86400000
				: null;
		const term = search.trim().toLowerCase();

		return data.filter((tx) => {
			if (typeFilter !== "all" && tx.type !== typeFilter) {
				return false;
			}

			if (statusFilter !== "all" && tx.status !== statusFilter) {
				return false;
			}

			if (assetFilter !== "all" && tx.assetSymbol !== assetFilter) {
				return false;
			}

			if (cutoff !== null) {
				const created = new Date(tx.createdAt).getTime();

				if (created < cutoff) {
					return false;
				}
			}

			if (term) {
				const haystack = [
					tx.reference,
					tx.detail,
					tx.assetSymbol,
					tx.planName ?? "",
					tx.txHash ?? "",
					tx.fullAddress ?? "",
				]
					.join(" ")
					.toLowerCase();

				if (!haystack.includes(term)) {
					return false;
				}
			}

			return true;
		});
	}, [assetFilter, data, dateRange, search, statusFilter, typeFilter]);

	const summary = useMemo(() => {
		let totalIn = 0;
		let totalOut = 0;
		let deposits = 0;
		let withdrawals = 0;
		let profits = 0;

		for (const tx of filtered) {
			if (tx.status === "failed") {
				continue;
			}

			if (tx.direction === "in") {
				totalIn += tx.amountUsd;
			} else {
				totalOut += tx.amountUsd;
			}

			if (tx.type === "deposit") {
				deposits += tx.amountUsd;
			}
			if (tx.type === "withdrawal") {
				withdrawals += tx.amountUsd;
			}
			if (tx.type === "profit") {
				profits += tx.amountUsd;
			}
		}

		return {
			count: filtered.length,
			deposits,
			netFlow: totalIn - totalOut,
			profits,
			totalIn,
			totalOut,
			withdrawals,
		};
	}, [filtered]);

	const handleReset = () => {
		setTypeFilter("all");
		setStatusFilter("all");
		setAssetFilter("all");
		setSearch("");
		setDateRange("30D");
	};

	const hasActiveFilters =
		typeFilter !== "all" ||
		statusFilter !== "all" ||
		assetFilter !== "all" ||
		search.trim() !== "" ||
		dateRange !== "30D";

	return (
		<div className="space-y-6">
			<header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="text-2xl font-semibold text-[#576363]">
						Transactions
					</h1>
					<p className="mt-1 max-w-2xl text-sm leading-6 text-[#5d6163]">
						Review every deposit, withdrawal, investment, profit, fee, and
						referral credit on your account. Filter, search, and export what you
						need.
					</p>
				</div>
				<Button
					type="button"
					variant="outline"
					className="gap-2 self-start"
					onClick={() => downloadCsv(filtered)}
					disabled={filtered.length === 0}
				>
					<DownloadIcon className="h-4 w-4" />
					Export CSV
				</Button>
			</header>

			<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<SummaryCard
					label="Total in"
					value={formatUsd(summary.totalIn)}
					hint={`${filtered.filter((tx) => tx.direction === "in").length} credits`}
					tone="positive"
				/>
				<SummaryCard
					label="Total out"
					value={formatUsd(summary.totalOut)}
					hint={`${filtered.filter((tx) => tx.direction === "out").length} debits`}
					tone="negative"
				/>
				<SummaryCard
					label="Profits credited"
					value={formatUsd(summary.profits)}
					hint="Daily plan accruals"
					tone="neutral"
				/>
				<SummaryCard
					label="Net flow"
					value={formatUsd(summary.netFlow)}
					hint={`${summary.count} transactions`}
					tone={summary.netFlow >= 0 ? "positive" : "negative"}
				/>
			</section>

			<section className="rounded-lg border border-[#d7e5e3] bg-white p-4 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				<div className="flex flex-wrap items-center gap-2">
					{typeFilters.map((item) => {
						const isActive = typeFilter === item.value;

						return (
							<button
								key={item.value}
								type="button"
								onClick={() => setTypeFilter(item.value)}
								className={cn(
									"inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition",
									isActive
										? "bg-[#5F9EA0] text-white"
										: "bg-[#eef1f1] text-[#576363] hover:bg-[#e5f3f1] hover:text-[#3c7f80]",
								)}
							>
								{item.label}
							</button>
						);
					})}
				</div>

				<div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
					<label className="relative block">
						<span className="sr-only">Search transactions</span>
						<SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a9a9a]" />
						<input
							type="search"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Search by reference, detail, asset, or tx hash"
							className="w-full rounded-md border border-[#d7e5e3] bg-white py-2 pl-9 pr-3 text-sm text-[#576363] placeholder:text-[#8a9a9a] focus:border-[#5F9EA0] focus:outline-none focus:ring-2 focus:ring-[#5F9EA0]/20"
						/>
					</label>
					<select
						value={statusFilter}
						onChange={(event) =>
							setStatusFilter(event.target.value as StatusFilter)
						}
						className="rounded-md border border-[#d7e5e3] bg-white px-3 py-2 text-sm text-[#576363] focus:border-[#5F9EA0] focus:outline-none focus:ring-2 focus:ring-[#5F9EA0]/20"
					>
						{statusOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
					<select
						value={assetFilter}
						onChange={(event) => setAssetFilter(event.target.value)}
						className="rounded-md border border-[#d7e5e3] bg-white px-3 py-2 text-sm text-[#576363] focus:border-[#5F9EA0] focus:outline-none focus:ring-2 focus:ring-[#5F9EA0]/20"
					>
						<option value="all">All assets</option>
						{assets.map((asset) => (
							<option key={asset} value={asset}>
								{asset}
							</option>
						))}
					</select>
					<div className="inline-flex rounded-md border border-[#d7e5e3] bg-[#f7faf9] p-0.5">
						{dateRanges.map((range) => {
							const isActive = dateRange === range.value;

							return (
								<button
									key={range.value}
									type="button"
									onClick={() => setDateRange(range.value)}
									className={cn(
										"rounded px-3 py-1.5 text-xs font-medium transition",
										isActive
											? "bg-white text-[#3c7f80] shadow-sm"
											: "text-[#5d6163] hover:text-[#3c7f80]",
									)}
								>
									{range.label}
								</button>
							);
						})}
					</div>
				</div>

				{hasActiveFilters ? (
					<div className="mt-3 flex items-center justify-between text-xs text-[#5d6163]">
						<span>
							Showing {filtered.length} of {data.length} transactions
						</span>
						<button
							type="button"
							onClick={handleReset}
							className="font-medium text-[#3c7f80] hover:text-[#1f5556]"
						>
							Reset filters
						</button>
					</div>
				) : null}
			</section>

			<section className="rounded-lg border border-[#d7e5e3] bg-white shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				{filtered.length === 0 ? (
					<EmptyState onReset={handleReset} hasFilters={hasActiveFilters} />
				) : (
					<ul className="divide-y divide-[#eef1f1]">
						{filtered.map((tx) => (
							<TransactionRow
								key={tx.id}
								transaction={tx}
								expanded={expandedId === tx.id}
								onToggle={() =>
									setExpandedId((current) => (current === tx.id ? null : tx.id))
								}
							/>
						))}
					</ul>
				)}
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
	tone: "negative" | "neutral" | "positive";
	value: string;
}) {
	const toneClass =
		tone === "positive"
			? "text-[#2e8f5b]"
			: tone === "negative"
				? "text-[#b1423a]"
				: "text-[#3c7f80]";

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

function TransactionRow({
	expanded,
	onToggle,
	transaction,
}: {
	expanded: boolean;
	onToggle: () => void;
	transaction: Transaction;
}) {
	const Icon = typeIcons[transaction.type];
	const signPrefix = transaction.direction === "in" ? "+" : "-";
	const amountToneClass =
		transaction.direction === "in" ? "text-[#2e8f5b]" : "text-[#b1423a]";

	return (
		<li>
			<button
				type="button"
				onClick={onToggle}
				aria-expanded={expanded}
				className="flex w-full items-center gap-4 px-4 py-4 text-left transition hover:bg-[#f7faf9] sm:px-6"
			>
				<span
					className={cn(
						"flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
						typeIconBackgrounds[transaction.type],
					)}
				>
					<Icon className="h-5 w-5" />
				</span>
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
						<p className="truncate text-sm font-semibold text-[#576363]">
							{transaction.detail}
						</p>
						<span
							className={cn(
								"inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
								statusBadgeClasses[transaction.status],
							)}
						>
							{transactionStatusLabels[transaction.status]}
						</span>
					</div>
					<div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5d6163]">
						<span>{transaction.reference}</span>
						<span aria-hidden="true">·</span>
						<span>{transactionTypeLabels[transaction.type]}</span>
						<span aria-hidden="true">·</span>
						<span>{formatDateTime(transaction.createdAt)}</span>
					</div>
				</div>
				<div className="text-right">
					<p className={cn("text-sm font-semibold", amountToneClass)}>
						{signPrefix}
						{formatAssetAmount(transaction.amount)} {transaction.assetSymbol}
					</p>
					<p className="mt-1 text-xs text-[#5d6163]">
						{signPrefix}
						{formatUsd(transaction.amountUsd)}
					</p>
				</div>
				<ChevronIcon className="h-4 w-4 shrink-0 text-[#8a9a9a]" expanded={expanded} />
			</button>
			{expanded ? <TransactionDetail transaction={transaction} /> : null}
		</li>
	);
}

function TransactionDetail({ transaction }: { transaction: Transaction }) {
	const items: { label: string; value: string }[] = [];

	items.push({ label: "Reference", value: transaction.reference });
	items.push({
		label: "Type",
		value: transactionTypeLabels[transaction.type],
	});
	items.push({
		label: "Status",
		value: transactionStatusLabels[transaction.status],
	});
	items.push({
		label: "Direction",
		value: transaction.direction === "in" ? "Inbound" : "Outbound",
	});
	items.push({
		label: "Created",
		value: formatDateTime(transaction.createdAt),
	});

	if (transaction.planName) {
		items.push({ label: "Plan", value: transaction.planName });
	}

	if (transaction.fee && transaction.feeAsset) {
		items.push({
			label: "Fee",
			value: `${formatAssetAmount(transaction.fee)} ${transaction.feeAsset}`,
		});
	}

	if (transaction.fullAddress) {
		items.push({
			label: "Wallet address",
			value: transaction.fullAddress,
		});
	}

	if (transaction.txHash) {
		items.push({
			label: "Transaction hash",
			value: maskHash(transaction.txHash),
		});
	}

	return (
		<div className="border-t border-[#eef1f1] bg-[#f7faf9] px-4 py-5 sm:px-6">
			<dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
				{items.map((item) => (
					<div key={item.label}>
						<dt className="text-[11px] font-medium uppercase tracking-wide text-[#8a9a9a]">
							{item.label}
						</dt>
						<dd className="mt-1 break-all text-sm text-[#576363]">
							{item.value}
						</dd>
					</div>
				))}
			</dl>
			{transaction.notes ? (
				<p className="mt-4 rounded-md border border-[#d7e5e3] bg-white p-3 text-xs leading-5 text-[#5d6163]">
					<span className="font-semibold text-[#576363]">Note: </span>
					{transaction.notes}
				</p>
			) : null}
		</div>
	);
}

function EmptyState({
	hasFilters,
	onReset,
}: {
	hasFilters: boolean;
	onReset: () => void;
}) {
	return (
		<div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
			<span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eef6f5] text-[#3c7f80]">
				<SearchIcon className="h-5 w-5" />
			</span>
			<h2 className="text-base font-semibold text-[#576363]">
				No transactions match these filters
			</h2>
			<p className="max-w-sm text-sm leading-6 text-[#5d6163]">
				{hasFilters
					? "Try a wider date range or clear the filters to see more activity."
					: "You have no recorded transactions yet. Fund your account to get started."}
			</p>
			{hasFilters ? (
				<Button type="button" variant="outline" onClick={onReset}>
					Reset filters
				</Button>
			) : null}
		</div>
	);
}
