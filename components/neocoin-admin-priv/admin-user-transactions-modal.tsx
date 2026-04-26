"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
	adjustUserTransaction,
	addManualTransaction,
	type AssetNetworkOption,
	fetchAssetNetworkOptions,
	fetchUserTransactions,
	revertUserTransaction,
} from "@/app/nexcoin-admin-priv/users/transaction-actions";
import type {
	AdminUserTransaction,
	AdminUserTransactionStatus,
} from "@/lib/admin-user-transactions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
	onClose: () => void;
	user: { id: string; name: string; email: string };
};

const depositStatusOptions: { label: string; value: string }[] = [
	{ label: "Pending", value: "pending" },
	{ label: "Confirming", value: "confirming" },
	{ label: "Needs review", value: "needs_review" },
	{ label: "Credited", value: "credited" },
	{ label: "Rejected", value: "rejected" },
];

const withdrawalStatusOptions: { label: string; value: string }[] = [
	{ label: "Pending", value: "pending" },
	{ label: "AML review", value: "aml_review" },
	{ label: "Approved", value: "approved" },
	{ label: "Processing", value: "processing" },
	{ label: "Completed", value: "completed" },
	{ label: "Rejected", value: "rejected" },
];

const statusBadgeClasses: Record<AdminUserTransactionStatus, string> = {
	Completed: "bg-[#e6f3ec] text-[#2e8f5b]",
	Credited: "bg-[#e6f3ec] text-[#2e8f5b]",
	Failed: "bg-[#fde8e8] text-[#b1423a]",
	Pending: "bg-[#fff1e0] text-[#a66510]",
	Processing: "bg-[#e6eef9] text-[#3360a8]",
	Rejected: "bg-[#fde8e8] text-[#b1423a]",
	Reviewed: "bg-[#eef1f1] text-[#5d6163]",
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

export function AdminUserTransactionsModal({ onClose, user }: Props) {
	const router = useRouter();
	const [transactions, setTransactions] = useState<AdminUserTransaction[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [assetNetworkOptions, setAssetNetworkOptions] = useState<
		AssetNetworkOption[]
	>([]);
	const [notice, setNotice] = useState<
		{ tone: "error" | "success"; message: string } | null
	>(null);
	const [isSaving, startSavingTransition] = useTransition();
	const [editor, setEditor] = useState<
		| {
				kind: "status";
				transaction: AdminUserTransaction;
		  }
		| {
				kind: "amount";
				transaction: AdminUserTransaction;
		  }
		| {
				kind: "add";
				type: "deposit" | "withdrawal";
		  }
		| null
	>(null);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				if (editor) {
					setEditor(null);
				} else {
					onClose();
				}
			}
		};
		document.addEventListener("keydown", handleKeyDown);
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.body.style.overflow = "";
		};
	}, [editor, onClose]);

	const loadTransactions = async () => {
		setIsLoading(true);
		setLoadError(null);
		const result = await fetchUserTransactions(user.id);
		if (!result.ok) {
			setLoadError(result.error);
			setIsLoading(false);
			return;
		}
		setTransactions(result.data ?? []);
		setIsLoading(false);
	};

	useEffect(() => {
		void loadTransactions();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user.id]);

	useEffect(() => {
		let cancelled = false;
		const loadOptions = async () => {
			const result = await fetchAssetNetworkOptions();
			if (cancelled || !result.ok) return;
			setAssetNetworkOptions(result.data ?? []);
		};
		void loadOptions();
		return () => {
			cancelled = true;
		};
	}, []);

	const handleRevert = (
		transaction: AdminUserTransaction,
		newStatus: string,
		reason: string,
	) => {
		startSavingTransition(async () => {
			const result = await revertUserTransaction(
				transaction.sourceType,
				transaction.sourceId,
				newStatus,
				reason,
			);

			if (!result.ok) {
				setNotice({ tone: "error", message: result.error });
				return;
			}

			setNotice({
				tone: "success",
				message: "Transaction status updated and balances rebalanced.",
			});
			setEditor(null);
			await loadTransactions();
			router.refresh();
		});
	};

	const handleAdjust = (
		transaction: AdminUserTransaction,
		newAmount: number,
		newAmountUsd: number,
		reason: string,
	) => {
		startSavingTransition(async () => {
			const result = await adjustUserTransaction(
				transaction.sourceType,
				transaction.sourceId,
				newAmount,
				newAmountUsd,
				reason,
			);

			if (!result.ok) {
				setNotice({ tone: "error", message: result.error });
				return;
			}

			setNotice({
				tone: "success",
				message: "Transaction amount updated and balances rebalanced.",
			});
			setEditor(null);
			await loadTransactions();
			router.refresh();
		});
	};

	const handleAdd = (
		type: "deposit" | "withdrawal",
		amount: number,
		amountUsd: number,
		assetSymbol: string,
		method: string,
		network: string,
		walletAddress: string,
		txHash: string,
		createdAt: string,
		status: string,
		feeUsd: number,
		reason: string,
	) => {
		startSavingTransition(async () => {
			const result = await addManualTransaction(
				user.id,
				type,
				amount,
				amountUsd,
				assetSymbol,
				method,
				network,
				walletAddress,
				txHash,
				createdAt,
				status,
				feeUsd,
				reason,
			);

			if (!result.ok) {
				setNotice({ tone: "error", message: result.error });
				return;
			}

			setNotice({
				tone: "success",
				message: "Manual transaction added successfully.",
			});
			setEditor(null);
			await loadTransactions();
			router.refresh();
		});
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#1f2b2b]/45 p-4 backdrop-blur-sm sm:p-6"
			role="dialog"
			aria-modal="true"
			aria-labelledby="user-transactions-modal-title"
			onMouseDown={(event) => {
				if (event.currentTarget === event.target && !editor) onClose();
			}}
		>
			<section className="my-8 w-full max-w-4xl rounded-lg border border-[#d7e5e3] bg-white shadow-[0_24px_70px_rgba(31,43,43,0.24)]">
				<header className="flex items-start justify-between gap-4 border-b border-[#d7e5e3] px-5 py-4">
					<div>
						<h2
							id="user-transactions-modal-title"
							className="text-lg font-semibold text-[#576363]"
						>
							Manage transactions for {user.name}
						</h2>
						<p className="mt-1 text-sm text-[#5d6163]">
							{user.email} · Editing here updates the user's balances.
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-md p-1 text-[#5d6163] transition hover:bg-[#eef6f5] hover:text-[#576363]"
						aria-label="Close"
					>
						<CloseIcon className="h-5 w-5" />
					</button>
				</header>

				<div className="space-y-4 px-5 py-5">
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

					{isLoading ? (
						<p className="py-6 text-center text-sm text-[#5d6163]">
							Loading transactions…
						</p>
					) : loadError ? (
						<p className="py-6 text-center text-sm font-semibold text-[#b1423a]">
							{loadError}
						</p>
					) : transactions.length === 0 ? (
						<p className="py-6 text-center text-sm text-[#5d6163]">
							This user has no deposit or withdrawal records yet.
						</p>
					) : (
						<ul className="divide-y divide-[#eef1f1] rounded-md border border-[#d7e5e3]">
							{transactions.map((transaction) => (
								<li key={transaction.id} className="p-4">
									<TransactionRow
										transaction={transaction}
										onEditStatus={() =>
											setEditor({ kind: "status", transaction })
										}
										onEditAmount={() =>
											setEditor({ kind: "amount", transaction })
										}
										disabled={isSaving}
									/>
								</li>
							))}
						</ul>
					)}
				</div>

				<footer className="flex justify-between border-t border-[#d7e5e3] px-5 py-4">
					<div className="flex gap-2">
						<Button
							type="button"
							variant="secondary"
							onClick={() => setEditor({ kind: "add", type: "deposit" })}
							disabled={isSaving}
						>
							Add Deposit
						</Button>
						<Button
							type="button"
							variant="secondary"
							onClick={() => setEditor({ kind: "add", type: "withdrawal" })}
							disabled={isSaving}
						>
							Add Withdrawal
						</Button>
					</div>
					<Button type="button" variant="outline" onClick={onClose}>
						Close
					</Button>
				</footer>
			</section>

			{editor?.kind === "status" ? (
				<StatusEditor
					transaction={editor.transaction}
					isSubmitting={isSaving}
					onCancel={() => setEditor(null)}
					onSubmit={handleRevert}
				/>
			) : null}

			{editor?.kind === "amount" ? (
				<AmountEditor
					transaction={editor.transaction}
					isSubmitting={isSaving}
					onCancel={() => setEditor(null)}
					onSubmit={handleAdjust}
				/>
			) : null}

			{editor?.kind === "add" ? (
				<AddEditor
					type={editor.type}
					assetNetworkOptions={assetNetworkOptions}
					isSubmitting={isSaving}
					onCancel={() => setEditor(null)}
					onSubmit={handleAdd}
				/>
			) : null}
		</div>
	);
}

function TransactionRow({
	disabled,
	onEditAmount,
	onEditStatus,
	transaction,
}: {
	disabled: boolean;
	onEditAmount: () => void;
	onEditStatus: () => void;
	transaction: AdminUserTransaction;
}) {
	return (
		<div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_minmax(170px,0.6fr)_auto]">
			<div className="min-w-0">
				<div className="flex flex-wrap items-center gap-2">
					<p className="font-semibold text-[#576363]">{transaction.type}</p>
					<span
						className={cn(
							"rounded-full px-2.5 py-1 text-xs font-semibold",
							statusBadgeClasses[transaction.status],
						)}
					>
						{transaction.status}
					</span>
					<span className="rounded-full bg-[#eef1f1] px-2.5 py-1 text-xs font-semibold text-[#576363]">
						{transaction.direction}
					</span>
				</div>
				<p className="mt-1 truncate text-sm text-[#5d6163]">
					{transaction.reference}
				</p>
				<p className="mt-1 text-xs text-[#5d6163]">
					{transaction.network} · {formatDateTime(transaction.createdAt)}
				</p>
			</div>

			<div>
				<p className="font-semibold text-[#576363]">
					{transaction.amount} {transaction.assetSymbol}
				</p>
				<p className="mt-1 text-sm text-[#5d6163]">
					{formatUsd(transaction.amountUsd)}
				</p>
				{transaction.feeUsd > 0 ? (
					<p className="mt-1 text-xs text-[#5d6163]">
						Fee {formatUsd(transaction.feeUsd)}
					</p>
				) : null}
			</div>

			<div className="flex flex-wrap items-start gap-2 lg:justify-end">
				<Button
					type="button"
					size="sm"
					variant="outline"
					disabled={disabled}
					onClick={onEditStatus}
				>
					Change status
				</Button>
				<Button
					type="button"
					size="sm"
					variant="secondary"
					disabled={disabled}
					onClick={onEditAmount}
				>
					Edit amount
				</Button>
			</div>
		</div>
	);
}

function StatusEditor({
	isSubmitting,
	onCancel,
	onSubmit,
	transaction,
}: {
	isSubmitting: boolean;
	onCancel: () => void;
	onSubmit: (
		transaction: AdminUserTransaction,
		newStatus: string,
		reason: string,
	) => void;
	transaction: AdminUserTransaction;
}) {
	const options =
		transaction.sourceType === "crypto_withdrawal"
			? withdrawalStatusOptions
			: depositStatusOptions;
	const [status, setStatus] = useState(options[0]?.value ?? "pending");
	const [reason, setReason] = useState("");

	const trimmedReason = reason.trim();
	const canSubmit = !isSubmitting && status.length > 0;

	return (
		<div
			className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1f2b2b]/55 p-4 backdrop-blur-sm sm:p-6"
			role="dialog"
			aria-modal="true"
			aria-labelledby="status-editor-title"
			onMouseDown={(event) => {
				if (event.currentTarget === event.target) onCancel();
			}}
		>
			<section className="w-full max-w-md rounded-lg border border-[#d7e5e3] bg-white shadow-[0_24px_70px_rgba(31,43,43,0.24)]">
				<header className="border-b border-[#d7e5e3] px-5 py-4">
					<h3
						id="status-editor-title"
						className="text-lg font-semibold text-[#576363]"
					>
						Change status
					</h3>
					<p className="mt-1 text-sm text-[#5d6163]">
						{transaction.reference} · Reverting a credited or completed
						transaction will adjust the user's balance.
					</p>
				</header>

				<form
					onSubmit={(event) => {
						event.preventDefault();
						if (canSubmit) onSubmit(transaction, status, trimmedReason);
					}}
					className="px-5 py-4"
				>
					<label className="block text-sm font-semibold text-[#576363]">
						New status
					</label>
					<select
						value={status}
						onChange={(event) => setStatus(event.target.value)}
						className="mt-1 h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
					>
						{options.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>

					<label className="mt-4 block text-sm font-semibold text-[#576363]">
						Reason (optional)
					</label>
					<textarea
						value={reason}
						onChange={(event) => setReason(event.target.value)}
						placeholder="Add a reason for this revert"
						rows={3}
						className="mt-1 w-full rounded-md border border-[#cfdcda] bg-white px-3 py-2 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
					/>

					<footer className="mt-5 flex flex-wrap justify-end gap-3">
						<Button type="button" variant="outline" onClick={onCancel}>
							Cancel
						</Button>
						<Button type="submit" disabled={!canSubmit}>
							{isSubmitting ? "Saving…" : "Apply revert"}
						</Button>
					</footer>
				</form>
			</section>
		</div>
	);
}

function AmountEditor({
	isSubmitting,
	onCancel,
	onSubmit,
	transaction,
}: {
	isSubmitting: boolean;
	onCancel: () => void;
	onSubmit: (
		transaction: AdminUserTransaction,
		newAmount: number,
		newAmountUsd: number,
		reason: string,
	) => void;
	transaction: AdminUserTransaction;
}) {
	const [amount, setAmount] = useState(String(transaction.amount));
	const [amountUsd, setAmountUsd] = useState(String(transaction.amountUsd));
	const [reason, setReason] = useState("");

	const parsedAmount = Number(amount);
	const parsedAmountUsd = Number(amountUsd);
	const canSubmit =
		!isSubmitting &&
		Number.isFinite(parsedAmount) &&
		parsedAmount > 0 &&
		Number.isFinite(parsedAmountUsd) &&
		parsedAmountUsd > 0;

	return (
		<div
			className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1f2b2b]/55 p-4 backdrop-blur-sm sm:p-6"
			role="dialog"
			aria-modal="true"
			aria-labelledby="amount-editor-title"
			onMouseDown={(event) => {
				if (event.currentTarget === event.target) onCancel();
			}}
		>
			<section className="w-full max-w-md rounded-lg border border-[#d7e5e3] bg-white shadow-[0_24px_70px_rgba(31,43,43,0.24)]">
				<header className="border-b border-[#d7e5e3] px-5 py-4">
					<h3
						id="amount-editor-title"
						className="text-lg font-semibold text-[#576363]"
					>
						Edit amount
					</h3>
					<p className="mt-1 text-sm text-[#5d6163]">
						{transaction.reference} · The user's balance will be adjusted by
						the difference if this transaction is in a credited or completed
						state.
					</p>
				</header>

				<form
					onSubmit={(event) => {
						event.preventDefault();
						if (canSubmit) {
							onSubmit(
								transaction,
								parsedAmount,
								parsedAmountUsd,
								reason.trim(),
							);
						}
					}}
					className="px-5 py-4"
				>
					<label className="block text-sm font-semibold text-[#576363]">
						Asset amount ({transaction.assetSymbol})
					</label>
					<input
						type="number"
						step="any"
						min="0"
						value={amount}
						onChange={(event) => setAmount(event.target.value)}
						className="mt-1 h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
					/>

					<label className="mt-4 block text-sm font-semibold text-[#576363]">
						USD amount
					</label>
					<input
						type="number"
						step="0.01"
						min="0"
						value={amountUsd}
						onChange={(event) => setAmountUsd(event.target.value)}
						className="mt-1 h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
					/>

					<label className="mt-4 block text-sm font-semibold text-[#576363]">
						Reason (optional)
					</label>
					<textarea
						value={reason}
						onChange={(event) => setReason(event.target.value)}
						placeholder="Why is this amount being changed?"
						rows={3}
						className="mt-1 w-full rounded-md border border-[#cfdcda] bg-white px-3 py-2 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
					/>

					<footer className="mt-5 flex flex-wrap justify-end gap-3">
						<Button type="button" variant="outline" onClick={onCancel}>
							Cancel
						</Button>
						<Button type="submit" disabled={!canSubmit}>
							{isSubmitting ? "Saving…" : "Apply change"}
						</Button>
					</footer>
				</form>
			</section>
		</div>
	);
}

function AddEditor({
	assetNetworkOptions,
	isSubmitting,
	onCancel,
	onSubmit,
	type,
}: {
	assetNetworkOptions: AssetNetworkOption[];
	isSubmitting: boolean;
	onCancel: () => void;
	onSubmit: (
		type: "deposit" | "withdrawal",
		amount: number,
		amountUsd: number,
		assetSymbol: string,
		method: string,
		network: string,
		walletAddress: string,
		txHash: string,
		createdAt: string,
		status: string,
		feeUsd: number,
		reason: string,
	) => void;
	type: "deposit" | "withdrawal";
}) {
	const assetOptions = useMemo(() => {
		const seen = new Set<string>();
		const list: string[] = [];
		for (const option of assetNetworkOptions) {
			if (seen.has(option.asset)) continue;
			seen.add(option.asset);
			list.push(option.asset);
		}
		return list;
	}, [assetNetworkOptions]);

	const [assetSymbol, setAssetSymbol] = useState(assetOptions[0] ?? "");
	const networkOptions = useMemo(
		() =>
			assetNetworkOptions
				.filter((option) => option.asset === assetSymbol)
				.map((option) => option.network),
		[assetNetworkOptions, assetSymbol],
	);
	const [network, setNetwork] = useState(networkOptions[0] ?? "");

	useEffect(() => {
		if (!networkOptions.includes(network)) {
			setNetwork(networkOptions[0] ?? "");
		}
	}, [network, networkOptions]);

	const [amount, setAmount] = useState("");
	const [amountUsd, setAmountUsd] = useState("");
	const [method, setMethod] = useState("Manual");
	const [walletAddress, setWalletAddress] = useState("");
	const [txHash, setTxHash] = useState("");
	const [createdAt, setCreatedAt] = useState(new Date().toISOString().slice(0, 16));
	const [status, setStatus] = useState(
		type === "deposit" ? "credited" : "completed",
	);
	const [feeUsd, setFeeUsd] = useState("0");
	const [reason, setReason] = useState("");

	const parsedAmount = Number(amount);
	const parsedAmountUsd = Number(amountUsd);
	const parsedFeeUsd = Number(feeUsd);
	const canSubmit =
		!isSubmitting &&
		Number.isFinite(parsedAmount) &&
		parsedAmount > 0 &&
		Number.isFinite(parsedAmountUsd) &&
		parsedAmountUsd > 0 &&
		assetSymbol.trim().length > 0 &&
		method.trim().length > 0 &&
		network.trim().length > 0 &&
		createdAt.length > 0;

	return (
		<div
			className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1f2b2b]/55 p-4 backdrop-blur-sm sm:p-6"
			role="dialog"
			aria-modal="true"
			aria-labelledby="add-editor-title"
			onMouseDown={(event) => {
				if (event.currentTarget === event.target) onCancel();
			}}
		>
			<section className="w-full max-w-md rounded-lg border border-[#d7e5e3] bg-white shadow-[0_24px_70px_rgba(31,43,43,0.24)]">
				<header className="border-b border-[#d7e5e3] px-5 py-4">
					<h3
						id="add-editor-title"
						className="text-lg font-semibold text-[#576363]"
					>
						Add Manual {type === "deposit" ? "Deposit" : "Withdrawal"}
					</h3>
					<p className="mt-1 text-sm text-[#5d6163]">
						Create a new transaction record for this user.
					</p>
				</header>

				<form
					onSubmit={(event) => {
						event.preventDefault();
						if (canSubmit) {
							onSubmit(
								type,
								parsedAmount,
								parsedAmountUsd,
								assetSymbol.trim(),
								method.trim(),
								network.trim(),
								walletAddress.trim(),
								txHash.trim(),
								createdAt,
								status,
								parsedFeeUsd,
								reason.trim(),
							);
						}
					}}
					className="max-h-[70vh] overflow-y-auto px-5 py-4"
				>
					<label className="block text-sm font-semibold text-[#576363]">
						Asset
					</label>
					<select
						value={assetSymbol}
						onChange={(event) => setAssetSymbol(event.target.value)}
						disabled={assetOptions.length === 0}
						className="mt-1 h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15 disabled:bg-gray-100"
					>
						{assetOptions.length === 0 ? (
							<option value="">No assets configured</option>
						) : null}
						{assetOptions.map((option) => (
							<option key={option} value={option}>
								{option.toUpperCase()}
							</option>
						))}
					</select>

					<label className="mt-4 block text-sm font-semibold text-[#576363]">
						Asset Amount
					</label>
					<input
						type="number"
						step="any"
						min="0"
						value={amount}
						onChange={(event) => setAmount(event.target.value)}
						className="mt-1 h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
					/>

					<label className="mt-4 block text-sm font-semibold text-[#576363]">
						USD Amount
					</label>
					<input
						type="number"
						step="0.01"
						min="0"
						value={amountUsd}
						onChange={(event) => setAmountUsd(event.target.value)}
						className="mt-1 h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
					/>

					<label className="mt-4 block text-sm font-semibold text-[#576363]">
						Method
					</label>
					<input
						type="text"
						value={method}
						onChange={(event) => setMethod(event.target.value)}
						className="mt-1 h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
					/>

					<label className="mt-4 block text-sm font-semibold text-[#576363]">
						Network
					</label>
					<select
						value={network}
						onChange={(event) => setNetwork(event.target.value)}
						disabled={networkOptions.length === 0}
						className="mt-1 h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15 disabled:bg-gray-100"
					>
						{networkOptions.length === 0 ? (
							<option value="">No networks configured</option>
						) : null}
						{networkOptions.map((option) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>

					<label className="mt-4 block text-sm font-semibold text-[#576363]">
						Wallet Address (optional)
					</label>
					<input
						type="text"
						value={walletAddress}
						onChange={(event) => setWalletAddress(event.target.value)}
						className="mt-1 h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
					/>

					<label className="mt-4 block text-sm font-semibold text-[#576363]">
						Tx Hash (optional)
					</label>
					<input
						type="text"
						value={txHash}
						onChange={(event) => setTxHash(event.target.value)}
						className="mt-1 h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
					/>

					<label className="mt-4 block text-sm font-semibold text-[#576363]">
						Created At
					</label>
					<input
						type="datetime-local"
						value={createdAt}
						onChange={(event) => setCreatedAt(event.target.value)}
						className="mt-1 h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
					/>

					<label className="mt-4 block text-sm font-semibold text-[#576363]">
						Status
					</label>
					<select
						value={status}
						onChange={(event) => setStatus(event.target.value)}
						className="mt-1 h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
					>
						{(type === "deposit" ? depositStatusOptions : withdrawalStatusOptions).map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>

					<label className="mt-4 block text-sm font-semibold text-[#576363]">
						Fee USD (optional)
					</label>
					<input
						type="number"
						step="0.01"
						min="0"
						value={feeUsd}
						onChange={(event) => setFeeUsd(event.target.value)}
						className="mt-1 h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
					/>

					<label className="mt-4 block text-sm font-semibold text-[#576363]">
						Reason (optional)
					</label>
					<textarea
						value={reason}
						onChange={(event) => setReason(event.target.value)}
						placeholder="Why is this transaction being added?"
						rows={3}
						className="mt-1 w-full rounded-md border border-[#cfdcda] bg-white px-3 py-2 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
					/>

					<footer className="mt-5 flex flex-wrap justify-end gap-3">
						<Button type="button" variant="outline" onClick={onCancel}>
							Cancel
						</Button>
						<Button type="submit" disabled={!canSubmit}>
							{isSubmitting ? "Adding…" : "Add Transaction"}
						</Button>
					</footer>
				</form>
			</section>
		</div>
	);
}

function CloseIcon({ className }: { className?: string }) {
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
			<path d="M18 6 6 18M6 6l12 12" />
		</svg>
	);
}
