"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
	type AdminWithdrawal,
	type AdminWithdrawalCheckStatus,
	type AdminWithdrawalKycStatus,
	type AdminWithdrawalRisk,
	type AdminWithdrawalsManagementData,
	type AdminWithdrawalStatus,
} from "@/lib/admin-withdrawals-management";
import {
	addWithdrawalNote,
	updateWithdrawalStatus,
} from "@/app/nexcoin-admin-priv/withdrawals-management/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_TO_DB: Record<
	AdminWithdrawalStatus,
	"aml_review" | "approved" | "completed" | "pending" | "processing" | "rejected"
> = {
	"AML Review": "aml_review",
	Approved: "approved",
	Completed: "completed",
	Pending: "pending",
	Processing: "processing",
	Rejected: "rejected",
};

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
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const withdrawals = data.withdrawals;
	const [selectedId, setSelectedId] = useState(data.withdrawals[0]?.id ?? "");
	const [detailsOpen, setDetailsOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [kycFilter, setKycFilter] = useState<KycFilter>("all");
	const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
	const [note, setNote] = useState("");
	const [noteSaved, setNoteSaved] = useState(false);
	const [notice, setNotice] = useState<
		{ tone: "error" | "success"; message: string } | null
	>(null);
	const [prompt, setPrompt] = useState<{
		confirmLabel: string;
		hint?: string;
		multiline?: boolean;
		placeholder: string;
		title: string;
		tone: "danger" | "primary";
		onSubmit: (value: string) => void;
	} | null>(null);

	const selectedWithdrawal =
		withdrawals.find((withdrawal) => withdrawal.id === selectedId) ??
		withdrawals[0];

	useEffect(() => {
		if (!detailsOpen) {
			return;
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setDetailsOpen(false);
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		document.body.style.overflow = "hidden";

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.body.style.overflow = "";
		};
	}, [detailsOpen]);

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

	const submitStatus = (
		id: string,
		status: AdminWithdrawalStatus,
		extras: { payoutTxHash?: string; reason?: string } = {},
	) => {
		const dbStatus = STATUS_TO_DB[status];

		startTransition(async () => {
			const result = await updateWithdrawalStatus({
				withdrawalId: id,
				status: dbStatus,
				reason: extras.reason,
				payoutTxHash: extras.payoutTxHash,
			});

			if (!result.ok) {
				setNotice({ tone: "error", message: result.error });
				return;
			}

			setNotice({
				tone: "success",
				message: `Withdrawal updated to ${status}.`,
			});
			router.refresh();
		});
	};

	const updateStatus = (id: string, status: AdminWithdrawalStatus) => {
		if (isPending) return;

		if (status === "Completed") {
			setPrompt({
				confirmLabel: "Mark completed",
				hint: "The hash is recorded on the withdrawal and shown to the user.",
				placeholder: "0x… or chain-specific hash",
				title: "Confirm payout transaction hash",
				tone: "primary",
				onSubmit: (value) =>
					submitStatus(id, status, { payoutTxHash: value.trim() }),
			});
			return;
		}

		if (status === "Rejected") {
			setPrompt({
				confirmLabel: "Reject withdrawal",
				hint: "The reason is shown to the user. The locked balance is refunded automatically.",
				multiline: true,
				placeholder: "e.g. Destination address fails sanctions screening.",
				title: "Reject withdrawal",
				tone: "danger",
				onSubmit: (value) =>
					submitStatus(id, status, { reason: value.trim() }),
			});
			return;
		}

		submitStatus(id, status);
	};

	const openDetails = (id: string) => {
		setSelectedId(id);
		setNote("");
		setNoteSaved(false);
		setDetailsOpen(true);
	};

	const saveNote = () => {
		const trimmed = note.trim();

		if (!selectedWithdrawal || !trimmed || isPending) {
			return;
		}

		startTransition(async () => {
			const result = await addWithdrawalNote(selectedWithdrawal.id, trimmed);

			if (!result.ok) {
				setNotice({ tone: "error", message: result.error });
				return;
			}

			setNote("");
			setNoteSaved(true);
			setNotice({ tone: "success", message: "Note saved." });
			router.refresh();
			window.setTimeout(() => setNoteSaved(false), 2500);
		});
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
						href="/nexcoin-admin-priv/support"
						className={buttonVariants({ size: "md", variant: "outline" })}
					>
						Open Support
					</Link>
				</div>
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

			<div className="space-y-6">
				<section className="rounded-lg border border-[#d7e5e3] bg-white shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
					<div className="border-b border-[#d7e5e3] p-5">
						<div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
							<div>
								<h2 className="text-lg font-semibold text-[#576363]">
									Withdrawal queue
								</h2>
								<p className="mt-1 text-sm leading-6 text-[#5d6163]">
									{filteredWithdrawals.length} withdrawals match current filters
									- {formatUsd(visibleTotal)} total.
								</p>
							</div>
							<div className="flex h-10 w-full items-center rounded-md border border-[#cfdcda] bg-white px-3 focus-within:border-[#5F9EA0] focus-within:ring-4 focus-within:ring-[#5F9EA0]/15 2xl:max-w-md">
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
										onSelect={openDetails}
										onStatusChange={updateStatus}
										withdrawal={withdrawal}
									/>
								))
							)}
						</div>
				</section>

				<RulesCard rules={data.rules} />
			</div>

			{detailsOpen && selectedWithdrawal ? (
				<WithdrawalDetailModal
					note={note}
					noteSaved={noteSaved}
					onClose={() => setDetailsOpen(false)}
					onNoteChange={setNote}
					onSaveNote={saveNote}
					onStatusChange={updateStatus}
					withdrawal={selectedWithdrawal}
				/>
			) : null}

			{prompt ? (
				<PromptModal
					confirmLabel={prompt.confirmLabel}
					hint={prompt.hint}
					isSubmitting={isPending}
					multiline={prompt.multiline}
					onCancel={() => setPrompt(null)}
					onSubmit={(value) => {
						const trimmed = value.trim();
						if (!trimmed) return;
						setPrompt(null);
						prompt.onSubmit(trimmed);
					}}
					placeholder={prompt.placeholder}
					title={prompt.title}
					tone={prompt.tone}
				/>
			) : null}
		</div>
	);
}

function PromptModal({
	confirmLabel,
	hint,
	isSubmitting,
	multiline,
	onCancel,
	onSubmit,
	placeholder,
	title,
	tone,
}: {
	confirmLabel: string;
	hint?: string;
	isSubmitting: boolean;
	multiline?: boolean;
	onCancel: () => void;
	onSubmit: (value: string) => void;
	placeholder: string;
	title: string;
	tone: "danger" | "primary";
}) {
	const [value, setValue] = useState("");

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onCancel();
		};
		document.addEventListener("keydown", handleKeyDown);
		document.body.style.overflow = "hidden";

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.body.style.overflow = "";
		};
	}, [onCancel]);

	const trimmed = value.trim();
	const canSubmit = trimmed.length > 0 && !isSubmitting;

	return (
		<div
			className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1f2b2b]/45 p-4 backdrop-blur-sm sm:p-6"
			role="dialog"
			aria-modal="true"
			aria-labelledby="withdrawal-prompt-title"
			onMouseDown={(event) => {
				if (event.currentTarget === event.target) onCancel();
			}}
		>
			<section className="w-full max-w-md rounded-lg border border-[#d7e5e3] bg-white shadow-[0_24px_70px_rgba(31,43,43,0.24)]">
				<header className="border-b border-[#d7e5e3] px-5 py-4">
					<h2
						id="withdrawal-prompt-title"
						className="text-lg font-semibold text-[#576363]"
					>
						{title}
					</h2>
					{hint ? (
						<p className="mt-1 text-sm leading-6 text-[#5d6163]">{hint}</p>
					) : null}
				</header>

				<form
					onSubmit={(event) => {
						event.preventDefault();
						if (canSubmit) onSubmit(value);
					}}
					className="px-5 py-4"
				>
					{multiline ? (
						<textarea
							autoFocus
							value={value}
							onChange={(event) => setValue(event.target.value)}
							placeholder={placeholder}
							rows={4}
							className="w-full rounded-md border border-[#cfdcda] bg-white px-3 py-2 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
						/>
					) : (
						<input
							autoFocus
							type="text"
							value={value}
							onChange={(event) => setValue(event.target.value)}
							placeholder={placeholder}
							className="h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm font-mono text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
						/>
					)}

					<footer className="mt-5 flex flex-wrap justify-end gap-3">
						<Button type="button" variant="outline" onClick={onCancel}>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={!canSubmit}
							className={cn(
								tone === "danger" &&
									"bg-[#b1423a] text-white hover:bg-[#9b3830] focus-visible:ring-[#b1423a]/20 disabled:bg-[#b1423a]/60",
							)}
						>
							{isSubmitting ? "Saving…" : confirmLabel}
						</Button>
					</footer>
				</form>
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
	withdrawal,
}: {
	onSelect: (id: string) => void;
	onStatusChange: (id: string, status: AdminWithdrawalStatus) => void;
	withdrawal: AdminWithdrawal;
}) {
	return (
		<div
			className="grid gap-5 p-5 transition hover:bg-[#f7faf9] md:grid-cols-2 2xl:grid-cols-[minmax(320px,1fr)_minmax(190px,0.55fr)_minmax(260px,0.75fr)_auto]"
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
			<div className="flex flex-wrap items-start gap-2 md:col-span-2 2xl:col-span-1 2xl:justify-end">
				<Button
					type="button"
					size="sm"
					variant="secondary"
					onClick={() => onSelect(withdrawal.id)}
				>
					Review
				</Button>
				<Button
					type="button"
					size="sm"
					onClick={() => {
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
					onClick={() => {
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

function WithdrawalDetailModal({
	note,
	noteSaved,
	onClose,
	onNoteChange,
	onSaveNote,
	onStatusChange,
	withdrawal,
}: {
	note: string;
	noteSaved: boolean;
	onClose: () => void;
	onNoteChange: (value: string) => void;
	onSaveNote: () => void;
	onStatusChange: (id: string, status: AdminWithdrawalStatus) => void;
	withdrawal: AdminWithdrawal;
}) {
	return (
		<div
			className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#1f2b2b]/45 p-4 backdrop-blur-sm sm:p-6"
			role="dialog"
			aria-modal="true"
			aria-labelledby="withdrawal-detail-title"
			onMouseDown={(event) => {
				if (event.currentTarget === event.target) {
					onClose();
				}
			}}
		>
			<section className="my-auto max-h-[calc(100vh-2rem)] w-full max-w-5xl overflow-hidden rounded-lg border border-[#d7e5e3] bg-white shadow-[0_24px_70px_rgba(31,43,43,0.24)] sm:max-h-[calc(100vh-3rem)]">
				<div className="flex items-start justify-between gap-4 border-b border-[#d7e5e3] p-5">
					<div className="min-w-0">
						<div className="flex flex-wrap items-center gap-2">
							<h2
								id="withdrawal-detail-title"
								className="text-lg font-semibold text-[#576363]"
							>
								Withdrawal details
							</h2>
							<span
								className={cn(
									"rounded-full px-2.5 py-1 text-xs font-semibold",
									statusClasses[withdrawal.status],
								)}
							>
								{withdrawal.status}
							</span>
						</div>
						<p className="mt-1 text-sm text-[#5d6163]">
							{withdrawal.reference} - {withdrawal.userName}
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#d7e5e3] text-[#5d6163] transition hover:border-[#5F9EA0] hover:text-[#5F9EA0] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15"
						aria-label="Close withdrawal details"
					>
						<svg
							viewBox="0 0 24 24"
							className="h-4 w-4"
							aria-hidden="true"
							fill="none"
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
						>
							<path d="M18 6 6 18M6 6l12 12" />
						</svg>
					</button>
				</div>

				<div className="max-h-[calc(100vh-13.5rem)] overflow-y-auto p-5">
					<div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
						<div className="space-y-5">
							<div className="grid gap-3 rounded-lg border border-[#eef1f1] p-4 sm:grid-cols-2">
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
								{withdrawal.txHash ? (
									<DetailRow label="Tx hash" value={withdrawal.txHash} />
								) : null}
							</div>

							<div>
								<p className="font-semibold text-[#576363]">
									AML and security checks
								</p>
								<div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
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
						</div>

						<div className="space-y-5">
							<div>
								<p className="font-semibold text-[#576363]">Timeline</p>
								<div className="mt-3 space-y-3">
									{withdrawal.timeline.map((item) => (
										<div
											key={item.id}
											className="border-l-2 border-[#d7e5e3] pl-3"
										>
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
								<div className="mt-3 flex flex-wrap items-center gap-3">
									<Button type="button" onClick={onSaveNote}>
										Save Note
									</Button>
									{noteSaved ? (
										<p className="text-sm font-medium text-[#3c7f80]">
											Note saved.
										</p>
									) : null}
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="grid gap-2 border-t border-[#d7e5e3] bg-[#f7faf9] px-5 pb-7 pt-4 sm:grid-cols-2 lg:grid-cols-4">
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
			</section>
		</div>
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
