"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
	type AdminDeposit,
	type AdminDepositMethod,
	type AdminDepositsManagementData,
	type AdminDepositRisk,
	type AdminDepositStatus,
} from "@/lib/admin-deposits-management";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminDepositsManagementProps = {
	data: AdminDepositsManagementData;
};

type StatusFilter = AdminDepositStatus | "all";
type MethodFilter = AdminDepositMethod | "all";
type RiskFilter = AdminDepositRisk | "all";

const statusFilters: { label: string; value: StatusFilter }[] = [
	{ label: "All", value: "all" },
	{ label: "Pending", value: "Pending" },
	{ label: "Confirming", value: "Confirming" },
	{ label: "Needs Review", value: "Needs Review" },
	{ label: "Credited", value: "Credited" },
	{ label: "Rejected", value: "Rejected" },
];

const methodFilters: { label: string; value: MethodFilter }[] = [
	{ label: "All methods", value: "all" },
	{ label: "Crypto", value: "Crypto" },
	{ label: "PayPal", value: "PayPal" },
	{ label: "Cash", value: "Cash" },
	{ label: "E-currency", value: "E-currency" },
];

const riskFilters: { label: string; value: RiskFilter }[] = [
	{ label: "All risk", value: "all" },
	{ label: "High", value: "High" },
	{ label: "Medium", value: "Medium" },
	{ label: "Low", value: "Low" },
];

const statusClasses: Record<AdminDepositStatus, string> = {
	Confirming: "bg-[#fff1e0] text-[#a66510]",
	Credited: "bg-[#e6f3ec] text-[#2e8f5b]",
	"Needs Review": "bg-[#fde8e8] text-[#b1423a]",
	Pending: "bg-[#eef6f5] text-[#3c7f80]",
	Rejected: "bg-[#eef1f1] text-[#5d6163]",
};

const riskClasses: Record<AdminDepositRisk, string> = {
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

export function AdminDepositsManagement({ data }: AdminDepositsManagementProps) {
	const [deposits, setDeposits] = useState(data.deposits);
	const [selectedId, setSelectedId] = useState(data.deposits[0]?.id ?? "");
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [methodFilter, setMethodFilter] = useState<MethodFilter>("all");
	const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
	const [note, setNote] = useState("");
	const [noteSaved, setNoteSaved] = useState(false);

	const selectedDeposit =
		deposits.find((deposit) => deposit.id === selectedId) ?? deposits[0];

	const filteredDeposits = useMemo(() => {
		const trimmed = query.trim().toLowerCase();

		return deposits.filter((deposit) => {
			if (statusFilter !== "all" && deposit.status !== statusFilter) {
				return false;
			}

			if (methodFilter !== "all" && deposit.method !== methodFilter) {
				return false;
			}

			if (riskFilter !== "all" && deposit.risk !== riskFilter) {
				return false;
			}

			if (trimmed) {
				const haystack = [
					deposit.reference,
					deposit.userName,
					deposit.userEmail,
					deposit.assetSymbol,
					deposit.network,
					deposit.txHash ?? "",
					deposit.walletAddress ?? "",
				]
					.join(" ")
					.toLowerCase();

				if (!haystack.includes(trimmed)) {
					return false;
				}
			}

			return true;
		});
	}, [deposits, methodFilter, query, riskFilter, statusFilter]);

	const visibleTotal = useMemo(
		() => filteredDeposits.reduce((sum, deposit) => sum + deposit.amountUsd, 0),
		[filteredDeposits],
	);

	const updateStatus = (id: string, status: AdminDepositStatus) => {
		setDeposits((current) =>
			current.map((deposit) =>
				deposit.id === id
					? {
							...deposit,
							status,
							timeline: [
								{
									createdAt: new Date("2026-04-22T10:45:00Z").toISOString(),
									id: `${deposit.id}-${status}`,
									label: `Status changed to ${status}`,
								},
								...deposit.timeline,
							],
						}
					: deposit,
			),
		);
	};

	const saveNote = () => {
		const trimmed = note.trim();

		if (!selectedDeposit || !trimmed) {
			return;
		}

		setDeposits((current) =>
			current.map((deposit) =>
				deposit.id === selectedDeposit.id
					? { ...deposit, internalNotes: [trimmed, ...deposit.internalNotes] }
					: deposit,
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
						Deposits Management
					</h1>
					<p className="mt-1 max-w-3xl text-sm leading-6 text-[#5d6163]">
						Review incoming deposits, confirmations, manual payment proofs, and
						unmatched funding requests.
					</p>
				</div>
				<div className="flex flex-wrap gap-3">
					<Button type="button" onClick={() => setStatusFilter("Needs Review")}>
						Pending Queue
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
					label="Pending deposits"
					value={formatUsd(data.summary.pendingUsd)}
					tone="warning"
				/>
				<SummaryCard
					hint={`${data.summary.confirmingCryptoCount} crypto deposits`}
					label="Confirming crypto"
					value={formatUsd(data.summary.confirmingCryptoUsd)}
					tone="warning"
				/>
				<SummaryCard
					hint={`${data.summary.manualReviewCount} payment proofs`}
					label="Manual review"
					value={formatUsd(data.summary.manualReviewUsd)}
					tone="danger"
				/>
				<SummaryCard
					hint="Successfully credited today"
					label="Credited today"
					value={formatUsd(data.summary.creditedTodayUsd)}
					tone="positive"
				/>
				<SummaryCard
					hint="Rejected today"
					label="Rejected"
					value={formatUsd(data.summary.rejectedTodayUsd)}
				/>
				<SummaryCard
					hint="Average credit time"
					label="SLA"
					value={data.summary.averageCreditTime}
				/>
			</section>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
				<div className="space-y-6">
					<section className="rounded-lg border border-[#d7e5e3] bg-white shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
						<div className="border-b border-[#d7e5e3] p-5">
							<div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
								<div>
									<h2 className="text-lg font-semibold text-[#576363]">
										Deposit queue
									</h2>
									<p className="mt-1 text-sm leading-6 text-[#5d6163]">
										{filteredDeposits.length} deposits match current filters -{" "}
										{formatUsd(visibleTotal)} total.
									</p>
								</div>
								<div className="flex h-10 min-w-72 items-center rounded-md border border-[#cfdcda] bg-white px-3 focus-within:border-[#5F9EA0] focus-within:ring-4 focus-within:ring-[#5F9EA0]/15">
									<SearchIcon className="h-4 w-4 text-[#5d6163]" />
									<label className="sr-only" htmlFor="admin-deposit-search">
										Search deposits
									</label>
									<input
										id="admin-deposit-search"
										type="search"
										value={query}
										onChange={(event) => setQuery(event.target.value)}
										placeholder="Search reference, user, tx hash"
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
								filters={methodFilters}
								onChange={setMethodFilter}
								value={methodFilter}
							/>
							<FilterGroup
								filters={riskFilters}
								onChange={setRiskFilter}
								value={riskFilter}
							/>
						</div>

						<div className="divide-y divide-[#eef1f1]">
							{filteredDeposits.length === 0 ? (
								<div className="p-8 text-center">
									<p className="font-semibold text-[#576363]">No deposits found</p>
									<p className="mt-2 text-sm text-[#5d6163]">
										Adjust filters or search terms.
									</p>
								</div>
							) : (
								filteredDeposits.map((deposit) => (
									<DepositRow
										key={deposit.id}
										deposit={deposit}
										onSelect={setSelectedId}
										onStatusChange={updateStatus}
										selected={selectedDeposit?.id === deposit.id}
									/>
								))
							)}
						</div>
					</section>
				</div>

				<div className="space-y-6">
					{selectedDeposit ? (
						<DepositDetail
							deposit={selectedDeposit}
							note={note}
							noteSaved={noteSaved}
							onNoteChange={setNote}
							onSaveNote={saveNote}
							onStatusChange={updateStatus}
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

function DepositRow({
	deposit,
	onSelect,
	onStatusChange,
	selected,
}: {
	deposit: AdminDeposit;
	onSelect: (id: string) => void;
	onStatusChange: (id: string, status: AdminDepositStatus) => void;
	selected: boolean;
}) {
	return (
		<div
			role="button"
			tabIndex={0}
			onClick={() => onSelect(deposit.id)}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					onSelect(deposit.id);
				}
			}}
			className={cn(
				"grid cursor-pointer gap-4 p-5 transition hover:bg-[#f7faf9] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15 xl:grid-cols-[minmax(260px,1fr)_minmax(180px,0.7fr)_minmax(180px,0.7fr)_auto]",
				selected && "bg-[#f7faf9]",
			)}
		>
			<div className="min-w-0">
				<div className="flex flex-wrap items-center gap-2">
					<p className="font-semibold text-[#576363]">{deposit.reference}</p>
					<span
						className={cn(
							"rounded-full px-2.5 py-1 text-xs font-semibold",
							statusClasses[deposit.status],
						)}
					>
						{deposit.status}
					</span>
				</div>
				<p className="mt-1 truncate text-sm text-[#5d6163]">
					{deposit.userName} - {deposit.userEmail}
				</p>
				<p className="mt-1 text-xs text-[#5d6163]">
					Created {formatDateTime(deposit.createdAt)}
				</p>
			</div>
			<div>
				<p className="font-semibold text-[#576363]">
					{formatAssetAmount(deposit.amount)} {deposit.assetSymbol}
				</p>
				<p className="mt-1 text-sm text-[#5d6163]">
					{formatUsd(deposit.amountUsd)}
				</p>
				<p className="mt-1 text-xs text-[#5d6163]">
					{deposit.method} - {deposit.network}
				</p>
			</div>
			<div>
				<span
					className={cn(
						"rounded-full px-2.5 py-1 text-xs font-semibold",
						riskClasses[deposit.risk],
					)}
				>
					{deposit.risk} risk
				</span>
				<p className="mt-2 text-sm text-[#5d6163]">
					{deposit.confirmationsRequired > 0
						? `${deposit.confirmations}/${deposit.confirmationsRequired} confirmations`
						: deposit.paymentProofStatus}
				</p>
			</div>
			<div className="flex flex-wrap items-start gap-2 xl:justify-end">
				<Button
					type="button"
					size="sm"
					onClick={(event) => {
						event.stopPropagation();
						onStatusChange(deposit.id, "Credited");
					}}
					disabled={deposit.status === "Credited"}
				>
					Credit
				</Button>
				<Button
					type="button"
					size="sm"
					variant="outline"
					onClick={(event) => {
						event.stopPropagation();
						onStatusChange(deposit.id, "Rejected");
					}}
					disabled={deposit.status === "Rejected"}
				>
					Reject
				</Button>
			</div>
		</div>
	);
}

function DepositDetail({
	deposit,
	note,
	noteSaved,
	onNoteChange,
	onSaveNote,
	onStatusChange,
}: {
	deposit: AdminDeposit;
	note: string;
	noteSaved: boolean;
	onNoteChange: (value: string) => void;
	onSaveNote: () => void;
	onStatusChange: (id: string, status: AdminDepositStatus) => void;
}) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="border-b border-[#d7e5e3] p-5">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h2 className="text-lg font-semibold text-[#576363]">
							Deposit details
						</h2>
						<p className="mt-1 text-sm text-[#5d6163]">{deposit.reference}</p>
					</div>
					<span
						className={cn(
							"rounded-full px-2.5 py-1 text-xs font-semibold",
							statusClasses[deposit.status],
						)}
					>
						{deposit.status}
					</span>
				</div>
			</div>

			<div className="space-y-5 p-5">
				<div className="grid gap-3">
					<DetailRow label="User" value={`${deposit.userName} - ${deposit.userEmail}`} />
					<DetailRow label="Method" value={`${deposit.method} - ${deposit.network}`} />
					<DetailRow
						label="Amount"
						value={`${formatAssetAmount(deposit.amount)} ${deposit.assetSymbol} (${formatUsd(deposit.amountUsd)})`}
					/>
					<DetailRow
						label="Confirmations"
						value={
							deposit.confirmationsRequired > 0
								? `${deposit.confirmations}/${deposit.confirmationsRequired}`
								: "Manual review"
						}
					/>
					<DetailRow label="Payment proof" value={deposit.paymentProofStatus} />
					{deposit.txHash ? <DetailRow label="Tx hash" value={deposit.txHash} /> : null}
					{deposit.walletAddress ? (
						<DetailRow label="Wallet" value={deposit.walletAddress} />
					) : null}
				</div>

				<div>
					<p className="font-semibold text-[#576363]">Risk notes</p>
					<ul className="mt-3 space-y-2">
						{deposit.riskNotes.map((riskNote) => (
							<li
								key={riskNote}
								className="rounded-lg bg-[#fff8ec] p-3 text-sm leading-6 text-[#8a5b14]"
							>
								{riskNote}
							</li>
						))}
					</ul>
				</div>

				<div>
					<p className="font-semibold text-[#576363]">Timeline</p>
					<div className="mt-3 space-y-3">
						{deposit.timeline.map((item) => (
							<div key={item.id} className="border-l-2 border-[#d7e5e3] pl-3">
								<p className="text-sm font-semibold text-[#576363]">{item.label}</p>
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
						{deposit.internalNotes.map((internalNote) => (
							<li
								key={internalNote}
								className="rounded-lg border border-[#eef1f1] p-3 text-sm leading-6 text-[#5d6163]"
							>
								{internalNote}
							</li>
						))}
					</ul>
					<label className="mt-4 block text-sm font-semibold text-[#576363]" htmlFor="deposit-note">
						Add note
					</label>
					<textarea
						id="deposit-note"
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

				<div className="grid gap-2 sm:grid-cols-3">
					<Button type="button" onClick={() => onStatusChange(deposit.id, "Credited")}>
						Credit
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={() => onStatusChange(deposit.id, "Rejected")}
					>
						Reject
					</Button>
					<Button
						type="button"
						variant="secondary"
						onClick={() => onStatusChange(deposit.id, "Needs Review")}
					>
						Request Info
					</Button>
				</div>
			</div>
		</section>
	);
}

function RulesCard({ rules }: { rules: string[] }) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<h2 className="text-lg font-semibold text-[#576363]">Review rules</h2>
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
