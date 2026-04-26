"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
	type AdminDeposit,
	type AdminDepositsManagementData,
	type AdminDepositRisk,
	type AdminDepositStatus,
	type AdminReceivingWallet,
	type AdminReceivingWalletAsset,
} from "@/lib/admin-deposits-management";
import {
	addDepositNote,
	createReceivingWallet,
	removeReceivingWallet,
	setReceivingWalletActive,
	updateDepositStatus,
} from "@/app/nexcoin-admin-priv/deposits-management/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminDepositsManagementProps = {
	data: AdminDepositsManagementData;
};

type StatusFilter = AdminDepositStatus | "all";
type RiskFilter = AdminDepositRisk | "all";

const statusFilters: { label: string; value: StatusFilter }[] = [
	{ label: "All", value: "all" },
	{ label: "Pending", value: "Pending" },
	{ label: "Confirming", value: "Confirming" },
	{ label: "Needs Review", value: "Needs Review" },
	{ label: "Credited", value: "Credited" },
	{ label: "Rejected", value: "Rejected" },
];

const riskFilters: { label: string; value: RiskFilter }[] = [
	{ label: "All risk", value: "all" },
	{ label: "High", value: "High" },
	{ label: "Medium", value: "Medium" },
	{ label: "Low", value: "Low" },
];

const receivingAssets: AdminReceivingWalletAsset[] = ["BTC", "ETH", "USDT"];

const defaultNetworkByAsset: Record<AdminReceivingWalletAsset, string> = {
	BTC: "Bitcoin",
	ETH: "Ethereum",
	USDT: "TRC-20",
};

const assetDisplayName: Record<AdminReceivingWalletAsset, string> = {
	BTC: "Bitcoin",
	ETH: "Ethereum",
	USDT: "Tether (USDT)",
};

type ReceivingWalletDraft = {
	address: string;
	asset: AdminReceivingWalletAsset;
	label: string;
	network: string;
};

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
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const wallets = data.receivingWallets;
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [isReviewOpen, setIsReviewOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
	const [note, setNote] = useState("");
	const [noteSaved, setNoteSaved] = useState(false);
	const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
	const [notice, setNotice] = useState<
		{ tone: "error" | "success"; message: string } | null
	>(null);

	const addWallet = (draft: ReceivingWalletDraft) => {
		if (isPending) return;

		const assetMap: Record<AdminReceivingWalletAsset, "btc" | "eth" | "usdt"> = {
			BTC: "btc",
			ETH: "eth",
			USDT: "usdt",
		};

		startTransition(async () => {
			const result = await createReceivingWallet({
				address: draft.address,
				asset: assetMap[draft.asset],
				label: draft.label.trim() || `${draft.asset} wallet`,
				network: draft.network,
			});

			if (!result.ok) {
				setNotice({ tone: "error", message: result.error });
				return;
			}

			setNotice({ tone: "success", message: "Receiving wallet added." });
			setIsWalletModalOpen(false);
			router.refresh();
		});
	};

	const removeWallet = (id: string) => {
		if (isPending) return;

		startTransition(async () => {
			const result = await removeReceivingWallet(id);

			if (!result.ok) {
				setNotice({ tone: "error", message: result.error });
				return;
			}

			setNotice({ tone: "success", message: "Receiving wallet removed." });
			router.refresh();
		});
	};

	const toggleWalletActive = (id: string) => {
		if (isPending) return;

		const wallet = wallets.find((item) => item.id === id);
		if (!wallet) return;

		const nextActive = !wallet.isActive;

		startTransition(async () => {
			const result = await setReceivingWalletActive(id, nextActive);

			if (!result.ok) {
				setNotice({ tone: "error", message: result.error });
				return;
			}

			setNotice({
				tone: "success",
				message: `Wallet ${nextActive ? "activated" : "disabled"}.`,
			});
			router.refresh();
		});
	};

	const selectedDeposit = data.deposits.find((deposit) => deposit.id === selectedId);

	const openReview = (id: string) => {
		setSelectedId(id);
		setNote("");
		setNoteSaved(false);
		setIsReviewOpen(true);
	};

	const closeReview = () => {
		setIsReviewOpen(false);
	};

	const filteredDeposits = useMemo(() => {
		const trimmed = query.trim().toLowerCase();

		return data.deposits.filter((deposit) => {
			if (statusFilter !== "all" && deposit.status !== statusFilter) {
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
					deposit.senderAddress ?? "",
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
	}, [data.deposits, query, riskFilter, statusFilter]);

	const visibleTotal = useMemo(
		() => filteredDeposits.reduce((sum, deposit) => sum + deposit.amountUsd, 0),
		[filteredDeposits],
	);

	const updateStatus = (id: string, status: AdminDepositStatus) => {
		if (isPending) return;

		const rpcStatus: Record<
			AdminDepositStatus,
			"confirming" | "credited" | "needs_review" | "pending" | "rejected"
		> = {
			Confirming: "confirming",
			Credited: "credited",
			"Needs Review": "needs_review",
			Pending: "pending",
			Rejected: "rejected",
		};

		startTransition(async () => {
			const result = await updateDepositStatus({
				depositId: id,
				status: rpcStatus[status],
			});

			if (!result.ok) {
				setNotice({ tone: "error", message: result.error });
				return;
			}

			setNotice({
				tone: "success",
				message: `Deposit updated to ${status}.`,
			});
			router.refresh();
		});
	};

	const saveNote = () => {
		const trimmed = note.trim();

		if (!selectedDeposit || !trimmed || isPending) {
			return;
		}

		startTransition(async () => {
			const result = await addDepositNote(selectedDeposit.id, trimmed);

			if (!result.ok) {
				setNotice({ tone: "error", message: result.error });
				return;
			}

			setNote("");
			setNotice({ tone: "success", message: "Note saved." });
			setNoteSaved(true);
			router.refresh();
			window.setTimeout(() => setNoteSaved(false), 2500);
		});
	};

	return (
		<div className="space-y-6">
			<header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
				<div>
					<h1 className="text-2xl font-semibold text-[#576363]">
						Deposits Management
					</h1>
					<p className="mt-1 max-w-3xl text-sm leading-6 text-[#5d6163]">
						Review incoming crypto deposits, confirmations, receiving wallets,
						and unmatched funding requests.
					</p>
				</div>
				<div className="flex flex-wrap gap-3">
					<Button type="button" onClick={() => setStatusFilter("Needs Review")}>
						Pending Queue
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
					className={cn(
						"rounded-lg border p-4 text-sm font-medium shadow-[0_18px_50px_rgba(87,99,99,0.08)]",
						notice.tone === "success"
							? "border-[#c7e4d5] bg-[#f1fbf6] text-[#2e8f5b]"
							: "border-[#f2c5c0] bg-[#fff7f6] text-[#b1423a]",
					)}
				>
					{notice.message}
				</div>
			) : null}

			<section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
				<SummaryCard
					hint={`${data.summary.pendingCount} requests`}
					label="Pending deposits"
					value={formatUsd(data.summary.pendingUsd)}
					tone="warning"
				/>
				<SummaryCard
					hint={`${data.summary.confirmingCount} awaiting confirmations`}
					label="Confirming"
					value={formatUsd(data.summary.confirmingUsd)}
					tone="warning"
				/>
				<SummaryCard
					hint={`${data.summary.needsReviewCount} flagged deposits`}
					label="Needs review"
					value={formatUsd(data.summary.needsReviewUsd)}
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

			<ReceivingWalletsCard
				onAdd={() => setIsWalletModalOpen(true)}
				onRemove={removeWallet}
				onToggleActive={toggleWalletActive}
				wallets={wallets}
			/>

			<div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
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

							<div className="mt-5 flex flex-col gap-3">
								<FilterGroup
									label="Status"
									filters={statusFilters}
									onChange={setStatusFilter}
									value={statusFilter}
								/>
								<FilterGroup
									label="Risk"
									filters={riskFilters}
									onChange={setRiskFilter}
									value={riskFilter}
								/>
							</div>
						</div>

						<div className="divide-y divide-[#eef1f1]">
							{filteredDeposits.length === 0 ? (
								<div className="p-8 text-center">
									<p className="font-semibold text-[#576363]">
										No deposits found
									</p>
									<p className="mt-2 text-sm text-[#5d6163]">
										Adjust filters or search terms.
									</p>
								</div>
							) : (
								filteredDeposits.map((deposit) => (
									<DepositRow
										key={deposit.id}
										deposit={deposit}
										onReview={openReview}
										onStatusChange={updateStatus}
										isSubmitting={isPending}
									/>
								))
							)}
						</div>
					</section>
				</div>

				<div className="space-y-6 2xl:sticky 2xl:top-24 2xl:self-start">
					<RulesCard rules={data.rules} />
				</div>
			</div>

			{isReviewOpen && selectedDeposit ? (
				<DepositReviewModal deposit={selectedDeposit} onClose={closeReview}>
					<DepositDetail
						deposit={selectedDeposit}
						isSubmitting={isPending}
						note={note}
						noteSaved={noteSaved}
						onNoteChange={setNote}
						onSaveNote={saveNote}
						onStatusChange={updateStatus}
					/>
				</DepositReviewModal>
			) : null}

			{isWalletModalOpen ? (
				<ReceivingWalletModal
					onAdd={addWallet}
					onClose={() => setIsWalletModalOpen(false)}
				/>
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
	label,
	onChange,
	value,
}: {
	filters: { label: string; value: T }[];
	label: string;
	onChange: (value: T) => void;
	value: T;
}) {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<span className="mr-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#5F9EA0]">
				{label}
			</span>
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
	isSubmitting,
	onReview,
	onStatusChange,
}: {
	deposit: AdminDeposit;
	isSubmitting: boolean;
	onReview: (id: string) => void;
	onStatusChange: (id: string, status: AdminDepositStatus) => void;
}) {
	return (
		<div
			role="button"
			tabIndex={0}
			onClick={() => onReview(deposit.id)}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					onReview(deposit.id);
				}
			}}
			className="grid cursor-pointer gap-5 p-5 transition hover:bg-[#f7faf9] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.9fr)_auto]"
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
				<p className="mt-2 truncate text-sm text-[#5d6163]">
					{deposit.userName} - {deposit.userEmail}
				</p>
				<p className="mt-1 text-xs text-[#5d6163]">
					{deposit.assetSymbol} - {deposit.network}
				</p>
				<p className="mt-1 text-xs text-[#5d6163]">
					Created {formatDateTime(deposit.createdAt)}
				</p>
			</div>
			<div>
				<p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5F9EA0]">
					Amount
				</p>
				<p className="mt-2 font-semibold text-[#576363]">
					{formatAssetAmount(deposit.amount)} {deposit.assetSymbol}
				</p>
				<p className="mt-1 text-sm text-[#5d6163]">
					{formatUsd(deposit.amountUsd)}
				</p>
			</div>
			<div>
				<p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5F9EA0]">
					Signals
				</p>
				<span
					className={cn(
						"mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold",
						riskClasses[deposit.risk],
					)}
				>
					{deposit.risk} risk
				</span>
				<p className="mt-2 text-sm text-[#5d6163]">
					{deposit.confirmationsRequired > 0
						? `${deposit.confirmations}/${deposit.confirmationsRequired} confirmations`
						: "Awaiting network confirmation"}
				</p>
			</div>
			<div className="flex flex-wrap items-start gap-2 sm:col-span-2 xl:col-span-1 xl:justify-end">
				<Button
					type="button"
					size="sm"
					variant="outline"
					onClick={(event) => {
						event.stopPropagation();
						onStatusChange(deposit.id, "Confirming");
					}}
					disabled={deposit.status === "Confirming" || isSubmitting}
				>
					Mark Confirming
				</Button>
				<Button
					type="button"
					size="sm"
					onClick={(event) => {
						event.stopPropagation();
						onStatusChange(deposit.id, "Credited");
					}}
					disabled={deposit.status === "Credited" || isSubmitting}
				>
					{isSubmitting ? "Saving..." : "Credit"}
				</Button>
				<Button
					type="button"
					size="sm"
					variant="outline"
					onClick={(event) => {
						event.stopPropagation();
						onStatusChange(deposit.id, "Rejected");
					}}
					disabled={deposit.status === "Rejected" || isSubmitting}
				>
					Reject
				</Button>
			</div>
		</div>
	);
}

function DepositDetail({
	deposit,
	isSubmitting,
	note,
	noteSaved,
	onNoteChange,
	onSaveNote,
	onStatusChange,
}: {
	deposit: AdminDeposit;
	isSubmitting: boolean;
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
					<DetailRow label="Asset/network" value={`${deposit.assetSymbol} - ${deposit.network}`} />
					<DetailRow
						label="Amount"
						value={`${formatAssetAmount(deposit.amount)} ${deposit.assetSymbol} (${formatUsd(deposit.amountUsd)})`}
					/>
					<DetailRow
						label="Confirmations"
						value={
							deposit.confirmationsRequired > 0
								? `${deposit.confirmations}/${deposit.confirmationsRequired}`
								: "Awaiting network confirmation"
						}
					/>
					{deposit.txHash ? <DetailRow label="Tx hash" value={deposit.txHash} /> : null}
					<DetailRow
						label="Sender wallet"
						value={deposit.senderAddress || "Not provided on this deposit"}
					/>
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
						{deposit.timeline.length > 0 ? (
							deposit.timeline.map((item) => (
								<div key={item.id} className="border-l-2 border-[#d7e5e3] pl-3">
									<p className="text-sm font-semibold text-[#576363]">{item.label}</p>
									<p className="mt-1 text-xs text-[#5d6163]">
										{formatDateTime(item.createdAt)}
									</p>
								</div>
							))
						) : (
							<div className="rounded-lg border border-[#eef1f1] bg-[#f7faf9] p-3 text-sm text-[#5d6163]">
								No timeline events have been recorded for this deposit yet.
							</div>
						)}
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
						{isSubmitting ? "Saving..." : "Save Note"}
					</Button>
					{noteSaved ? (
						<p className="mt-2 text-sm font-medium text-[#3c7f80]">Note saved.</p>
					) : null}
				</div>

				<div className="grid gap-2 sm:grid-cols-3">
					<Button
						type="button"
						variant="outline"
						onClick={() => onStatusChange(deposit.id, "Confirming")}
						disabled={isSubmitting}
					>
						Mark Confirming
					</Button>
					<Button
						type="button"
						onClick={() => onStatusChange(deposit.id, "Credited")}
						disabled={isSubmitting}
					>
						{isSubmitting ? "Saving..." : "Credit"}
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={() => onStatusChange(deposit.id, "Rejected")}
						disabled={isSubmitting}
					>
						Reject
					</Button>
				</div>
				<Button
					type="button"
					variant="secondary"
					onClick={() => onStatusChange(deposit.id, "Needs Review")}
					disabled={isSubmitting}
					className="w-full sm:w-auto"
				>
					Request Info
				</Button>
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

function ReceivingWalletsCard({
	onAdd,
	onRemove,
	onToggleActive,
	wallets,
}: {
	onAdd: () => void;
	onRemove: (id: string) => void;
	onToggleActive: (id: string) => void;
	wallets: AdminReceivingWallet[];
}) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="flex flex-col gap-4 border-b border-[#d7e5e3] p-5 xl:flex-row xl:items-start xl:justify-between">
				<div>
					<h2 className="text-lg font-semibold text-[#576363]">
						Receiving wallets
					</h2>
					<p className="mt-1 max-w-3xl text-sm leading-6 text-[#5d6163]">
						Manage the active BTC, ETH, and USDT addresses shown to users when
						they create crypto deposits.
					</p>
				</div>
				<Button type="button" onClick={onAdd}>
					Add Wallet
				</Button>
			</div>

			<div className="grid gap-4 p-5 md:grid-cols-3">
				{wallets.map((wallet) => (
					<div
						key={wallet.id}
						className="rounded-lg border border-[#eef1f1] bg-[#f7faf9] p-4"
					>
						<div className="flex items-start justify-between gap-3">
							<div>
								<p className="font-semibold text-[#576363]">{wallet.label}</p>
								<p className="mt-1 text-sm text-[#5d6163]">
									{wallet.asset} - {wallet.network}
								</p>
							</div>
							<span
								className={cn(
									"rounded-full px-2.5 py-1 text-xs font-semibold",
									wallet.isActive
										? "bg-[#e6f3ec] text-[#2e8f5b]"
										: "bg-[#eef1f1] text-[#5d6163]",
								)}
							>
								{wallet.isActive ? "Active" : "Inactive"}
							</span>
						</div>
						<p className="mt-3 break-all font-mono text-xs leading-5 text-[#576363]">
							{wallet.address}
						</p>
						<p className="mt-3 text-xs text-[#5d6163]">
							Updated {formatDateTime(wallet.updatedAt)}
						</p>
						<div className="mt-4 flex flex-wrap gap-2">
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={() => onToggleActive(wallet.id)}
							>
								{wallet.isActive ? "Disable" : "Activate"}
							</Button>
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={() => onRemove(wallet.id)}
							>
								Remove
							</Button>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}

function ReceivingWalletModal({
	onAdd,
	onClose,
}: {
	onAdd: (draft: ReceivingWalletDraft) => void;
	onClose: () => void;
}) {
	const [draft, setDraft] = useState<ReceivingWalletDraft>({
		address: "",
		asset: "BTC",
		label: "",
		network: defaultNetworkByAsset.BTC,
	});

	const updateAsset = (asset: AdminReceivingWalletAsset) => {
		setDraft((current) => ({
			...current,
			asset,
			network: defaultNetworkByAsset[asset],
		}));
	};

	const handleSubmit = () => {
		if (!draft.address.trim() || !draft.network.trim()) {
			return;
		}

		onAdd(draft);
	};

	return (
		<div
			className="fixed inset-0 z-[70] bg-[#1f2929]/45 p-3 backdrop-blur-sm sm:p-5"
			role="dialog"
			aria-modal="true"
			aria-labelledby="admin-wallet-modal-title"
		>
			<div className="absolute inset-0" aria-hidden="true" onClick={onClose} />
			<section className="relative mx-auto flex max-h-[calc(100vh-24px)] max-w-2xl flex-col overflow-hidden rounded-lg border border-[#d7e5e3] bg-white shadow-[0_28px_90px_rgba(31,41,41,0.28)] sm:max-h-[calc(100vh-40px)]">
				<header className="flex items-start justify-between gap-4 border-b border-[#d7e5e3] px-4 py-4 sm:px-6">
					<div className="min-w-0">
						<p className="text-sm text-[#5d6163]">Receiving wallet</p>
						<h2
							id="admin-wallet-modal-title"
							className="mt-1 text-xl font-semibold text-[#576363]"
						>
							Add deposit address
						</h2>
					</div>
					<Button type="button" variant="outline" onClick={onClose}>
						Close
					</Button>
				</header>

				<div className="overflow-y-auto p-4 sm:p-6">
					<div className="grid gap-5">
						<div>
							<p className="text-sm font-semibold text-[#576363]">Asset</p>
							<div className="mt-3 grid gap-3 sm:grid-cols-3">
								{receivingAssets.map((asset) => {
									const active = draft.asset === asset;

									return (
										<button
											key={asset}
											type="button"
											onClick={() => updateAsset(asset)}
											className={cn(
												"rounded-lg border p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15",
												active
													? "border-[#5F9EA0] bg-[#eef6f5]"
													: "border-[#d7e5e3] bg-white hover:bg-[#f7faf9]",
											)}
										>
											<p className="font-semibold text-[#576363]">{asset}</p>
											<p className="mt-1 text-sm text-[#5d6163]">
												{assetDisplayName[asset]}
											</p>
											<p className="mt-2 text-xs font-semibold text-[#3c7f80]">
												{defaultNetworkByAsset[asset]}
											</p>
										</button>
									);
								})}
							</div>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<label className="text-sm font-semibold text-[#576363]" htmlFor="wallet-label">
									Label
								</label>
								<input
									id="wallet-label"
									value={draft.label}
									onChange={(event) =>
										setDraft((current) => ({
											...current,
											label: event.target.value,
										}))
									}
									placeholder={`Primary ${draft.asset}`}
									className="mt-2 h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm font-medium text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
								/>
							</div>

							<div>
								<label className="text-sm font-semibold text-[#576363]" htmlFor="wallet-network">
									Network
								</label>
								<input
									id="wallet-network"
									value={draft.network}
									onChange={(event) =>
										setDraft((current) => ({
											...current,
											network: event.target.value,
										}))
									}
									className="mt-2 h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm font-medium text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
								/>
							</div>
						</div>

						<div>
							<label className="text-sm font-semibold text-[#576363]" htmlFor="wallet-address">
								Wallet address
							</label>
							<textarea
								id="wallet-address"
								value={draft.address}
								onChange={(event) =>
									setDraft((current) => ({
										...current,
										address: event.target.value,
									}))
								}
								placeholder="Paste the receiving address shown to users"
								rows={5}
								className="mt-2 w-full rounded-md border border-[#cfdcda] bg-white px-3 py-2 text-sm font-medium text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
							/>
						</div>

						<div className="rounded-lg bg-[#fff8ec] p-4 text-sm leading-6 text-[#8a5b14]">
							Only add addresses that match the selected asset and network.
							Users may lose funds if the wrong network is displayed.
						</div>
					</div>
				</div>

				<footer className="flex flex-col-reverse gap-3 border-t border-[#d7e5e3] px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
					<Button type="button" variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={handleSubmit}
						disabled={!draft.address.trim() || !draft.network.trim()}
					>
						Add wallet
					</Button>
				</footer>
			</section>
		</div>
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

function DepositReviewModal({
	children,
	deposit,
	onClose,
}: {
	children: React.ReactNode;
	deposit: AdminDeposit;
	onClose: () => void;
}) {
	return (
		<div
			className="fixed inset-0 z-[70] bg-[#1f2929]/45 p-3 backdrop-blur-sm sm:p-5"
			role="dialog"
			aria-modal="true"
			aria-labelledby="admin-deposit-review-modal-title"
		>
			<div
				className="absolute inset-0"
				aria-hidden="true"
				onClick={onClose}
			/>
			<section className="relative mx-auto flex max-h-[calc(100vh-24px)] max-w-4xl flex-col overflow-hidden rounded-lg border border-[#d7e5e3] bg-[#f7faf9] shadow-[0_28px_90px_rgba(31,41,41,0.28)] sm:max-h-[calc(100vh-40px)]">
				<header className="flex items-start justify-between gap-4 border-b border-[#d7e5e3] bg-white px-4 py-4 sm:px-6">
					<div className="min-w-0">
						<p className="text-sm text-[#5d6163]">Deposit review</p>
						<h2
							id="admin-deposit-review-modal-title"
							className="mt-1 truncate text-xl font-semibold text-[#576363]"
						>
							{deposit.reference} - {deposit.userName}
						</h2>
					</div>
					<Button type="button" variant="outline" onClick={onClose}>
						Close
					</Button>
				</header>
				<div className="overflow-y-auto p-4 sm:p-6">{children}</div>
			</section>
		</div>
	);
}
