"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
	type CryptoDepositAsset,
	type DepositData,
	type DepositMethodType,
	type DepositStatus,
	type RecentDeposit,
} from "@/lib/deposits";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AccountDepositProps = {
	data: DepositData;
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

const statusClasses: Record<DepositStatus, string> = {
	Confirming: "bg-[#fff1e0] text-[#a66510]",
	Credited: "bg-[#e6f3ec] text-[#2e8f5b]",
	Pending: "bg-[#eef6f5] text-[#3c7f80]",
	Rejected: "bg-[#fde8e8] text-[#b1423a]",
};

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
			<path d="M8 8h11v11H8z" />
			<path d="M5 16H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
		</svg>
	);
}

function QrIcon({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 48 48" className={className} aria-hidden="true">
			<path
				d="M8 8h12v12H8zM28 8h12v12H28zM8 28h12v12H8z"
				fill="none"
				stroke="currentColor"
				strokeWidth="3"
			/>
			<path
				d="M29 29h4v4h-4zM36 28h4v8h-4zM28 37h8v3h-8zM39 39h2v2h-2z"
				fill="currentColor"
			/>
			<path d="M12 12h4v4h-4zM32 12h4v4h-4zM12 32h4v4h-4z" fill="currentColor" />
		</svg>
	);
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
			<path d="M12 4v11M8 11l4 4 4-4M5 20h14" />
		</svg>
	);
}

export function AccountDeposit({ data }: AccountDepositProps) {
	const [method, setMethod] = useState<DepositMethodType>("crypto");
	const [assetId, setAssetId] = useState(data.assets[0]?.id ?? "");
	const [amountUsd, setAmountUsd] = useState("2500");
	const [copied, setCopied] = useState(false);
	const [sentNotice, setSentNotice] = useState(false);
	const [deposits, setDeposits] = useState(data.recentDeposits);

	const selectedMethod =
		data.methods.find((item) => item.id === method) ?? data.methods[0];
	const selectedAsset =
		data.assets.find((asset) => asset.id === assetId) ?? data.assets[0];

	const numericAmount = Number.parseFloat(amountUsd);
	const isValidAmount = Number.isFinite(numericAmount) && numericAmount > 0;
	const estimatedAssetAmount =
		method === "crypto" && selectedAsset && isValidAmount
			? numericAmount / selectedAsset.rateUsd
			: 0;
	const reference = useMemo(() => generateReference(deposits), [deposits]);

	const amountError = useMemo(() => {
		if (!isValidAmount) {
			return "Enter a deposit amount.";
		}

		if (numericAmount < selectedMethod.minUsd) {
			return `Minimum ${selectedMethod.label} deposit is ${formatUsd(selectedMethod.minUsd)}.`;
		}

		if (
			method === "crypto" &&
			selectedAsset &&
			estimatedAssetAmount < selectedAsset.minDeposit
		) {
			return `Minimum ${selectedAsset.symbol} deposit is ${selectedAsset.minDeposit} ${selectedAsset.symbol}.`;
		}

		return "";
	}, [estimatedAssetAmount, isValidAmount, method, numericAmount, selectedAsset, selectedMethod]);

	const handleCopy = async () => {
		if (!selectedAsset) {
			return;
		}

		try {
			await navigator.clipboard.writeText(selectedAsset.address);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1800);
		} catch {
			setCopied(false);
		}
	};

	const handleSentFunds = () => {
		if (amountError) {
			return;
		}

		const nextDeposit: RecentDeposit = {
			amount: method === "crypto" ? estimatedAssetAmount : numericAmount,
			amountUsd: numericAmount,
			assetSymbol: method === "crypto" && selectedAsset ? selectedAsset.symbol : "USD",
			createdAt: new Date("2026-04-22T10:00:00Z").toISOString(),
			id: `deposit-${reference.toLowerCase()}`,
			method:
				method === "crypto" && selectedAsset
					? selectedAsset.network
					: selectedMethod.label,
			reference,
			status: method === "crypto" ? "Confirming" : "Pending",
		};

		setDeposits((current) => [nextDeposit, ...current]);
		setSentNotice(true);
		window.setTimeout(() => setSentNotice(false), 3000);
	};

	return (
		<div className="space-y-6">
			<header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="text-2xl font-semibold text-[#576363]">
						Deposit Funds
					</h1>
					<p className="mt-1 max-w-2xl text-sm leading-6 text-[#5d6163]">
						Fund your Nexcoin account with supported crypto assets or approved
						payment methods.
					</p>
				</div>
				<div className="flex flex-wrap gap-3">
					<Link href="/account/wallets" className={buttonVariants({ size: "md" })}>
						View Wallets
					</Link>
					<Link
						href="/account/transactions"
						className={buttonVariants({ size: "md", variant: "outline" })}
					>
						View Transactions
					</Link>
				</div>
			</header>

			{sentNotice ? (
				<div className="rounded-lg border border-[#d7e5e3] bg-white p-4 text-sm font-medium text-[#3c7f80] shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
					Deposit reference {reference} was added as a pending mock deposit.
				</div>
			) : null}

			<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<SummaryCard
					hint="Ready for investing or withdrawal"
					label="Available balance"
					value={formatUsd(data.summary.availableBalanceUsd)}
				/>
				<SummaryCard
					hint="Awaiting confirmation or review"
					label="Pending deposits"
					value={formatUsd(data.summary.pendingDepositsUsd)}
					tone="warning"
				/>
				<SummaryCard
					hint="Most recent credited funding"
					label="Last deposit"
					value={data.summary.lastDepositLabel}
				/>
				<SummaryCard
					hint="Crypto and approved payment routes"
					label="Supported methods"
					value={String(data.summary.supportedMethods)}
				/>
			</section>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_370px]">
				<div className="space-y-6">
					<DepositForm
						amountError={amountError}
						amountUsd={amountUsd}
						assets={data.assets}
						estimatedAssetAmount={estimatedAssetAmount}
						method={method}
						methods={data.methods}
						onAmountChange={setAmountUsd}
						onAssetChange={setAssetId}
						onMethodChange={setMethod}
						selectedAsset={selectedAsset}
						selectedMethod={selectedMethod}
					/>
					<InstructionsPanel
						amountUsd={numericAmount}
						copied={copied}
						estimatedAssetAmount={estimatedAssetAmount}
						method={method}
						onCopy={handleCopy}
						onSentFunds={handleSentFunds}
						reference={reference}
						selectedAsset={selectedAsset}
						selectedMethod={selectedMethod}
					/>
					<RecentDeposits deposits={deposits} />
				</div>
				<RulesCard rules={data.rules} />
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
	tone?: "neutral" | "warning";
	value: string;
}) {
	return (
		<div className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<p className="text-sm text-[#5d6163]">{label}</p>
			<p className="mt-2 text-2xl font-semibold text-[#576363]">{value}</p>
			<p
				className={cn(
					"mt-2 text-sm",
					tone === "warning" ? "text-[#a66510]" : "text-[#5d6163]",
				)}
			>
				{hint}
			</p>
		</div>
	);
}

function DepositForm({
	amountError,
	amountUsd,
	assets,
	estimatedAssetAmount,
	method,
	methods,
	onAmountChange,
	onAssetChange,
	onMethodChange,
	selectedAsset,
	selectedMethod,
}: {
	amountError: string;
	amountUsd: string;
	assets: CryptoDepositAsset[];
	estimatedAssetAmount: number;
	method: DepositMethodType;
	methods: DepositData["methods"];
	onAmountChange: (value: string) => void;
	onAssetChange: (value: string) => void;
	onMethodChange: (value: DepositMethodType) => void;
	selectedAsset: CryptoDepositAsset;
	selectedMethod: DepositData["methods"][number];
}) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e5f3f1] text-[#3c7f80]">
					<DepositIcon className="h-5 w-5" />
				</div>
				<div>
					<h2 className="text-lg font-semibold text-[#576363]">
						Start a deposit
					</h2>
					<p className="mt-1 text-sm text-[#5d6163]">
						Choose a method, amount, and funding route.
					</p>
				</div>
			</div>

			<div className="mt-5">
				<p className="text-sm font-semibold text-[#576363]">Funding method</p>
				<div className="mt-3 grid gap-3 md:grid-cols-2">
					{methods.map((item) => {
						const active = method === item.id;

						return (
							<button
								key={item.id}
								type="button"
								onClick={() => onMethodChange(item.id)}
								className={cn(
									"rounded-lg border p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15",
									active
										? "border-[#5F9EA0] bg-[#eef6f5]"
										: "border-[#d7e5e3] bg-white hover:bg-[#f7faf9]",
								)}
							>
								<p className="font-semibold text-[#576363]">{item.label}</p>
								<p className="mt-1 text-sm leading-6 text-[#5d6163]">
									{item.description}
								</p>
								<p className="mt-2 text-xs font-semibold text-[#3c7f80]">
									Min {formatUsd(item.minUsd)}
								</p>
							</button>
						);
					})}
				</div>
			</div>

			{method === "crypto" ? (
				<div className="mt-5">
					<label
						htmlFor="deposit-asset"
						className="text-sm font-semibold text-[#576363]"
					>
						Asset and network
					</label>
					<select
						id="deposit-asset"
						value={selectedAsset.id}
						onChange={(event) => onAssetChange(event.target.value)}
						className="mt-2 h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm font-medium text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
					>
						{assets.map((asset) => (
							<option
								key={asset.id}
								value={asset.id}
								disabled={asset.status === "Maintenance"}
							>
								{asset.name} - {asset.network}
								{asset.status === "Maintenance" ? " (maintenance)" : ""}
							</option>
						))}
					</select>
				</div>
			) : null}

			<div className="mt-5">
				<label
					htmlFor="deposit-amount"
					className="text-sm font-semibold text-[#576363]"
				>
					Amount in USD
				</label>
				<div className="mt-2 flex h-11 items-center rounded-md border border-[#cfdcda] bg-white px-3 focus-within:border-[#5F9EA0] focus-within:ring-4 focus-within:ring-[#5F9EA0]/15">
					<span className="text-sm font-semibold text-[#5d6163]">$</span>
					<input
						id="deposit-amount"
						type="number"
						min={selectedMethod.minUsd}
						step="0.01"
						value={amountUsd}
						onChange={(event) => onAmountChange(event.target.value)}
						className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm font-medium text-[#576363] outline-none"
					/>
				</div>
				{amountError ? (
					<p className="mt-2 text-sm text-[#b1423a]">{amountError}</p>
				) : (
					<p className="mt-2 text-sm text-[#5d6163]">
						{method === "crypto"
							? `Estimated ${formatAssetAmount(estimatedAssetAmount)} ${selectedAsset.symbol}`
							: selectedMethod.reviewTime}
					</p>
				)}
			</div>
		</section>
	);
}

function InstructionsPanel({
	amountUsd,
	copied,
	estimatedAssetAmount,
	method,
	onCopy,
	onSentFunds,
	reference,
	selectedAsset,
	selectedMethod,
}: {
	amountUsd: number;
	copied: boolean;
	estimatedAssetAmount: number;
	method: DepositMethodType;
	onCopy: () => void;
	onSentFunds: () => void;
	reference: string;
	selectedAsset: CryptoDepositAsset;
	selectedMethod: DepositData["methods"][number];
}) {
	const validUsd = Number.isFinite(amountUsd) ? amountUsd : 0;

	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div>
					<h2 className="text-lg font-semibold text-[#576363]">
						Deposit instructions
					</h2>
					<p className="mt-1 text-sm leading-6 text-[#5d6163]">
						Reference {reference} is used to match your funding request.
					</p>
				</div>
				<span className="self-start rounded-full bg-[#eef6f5] px-3 py-1.5 text-xs font-semibold text-[#3c7f80]">
					{selectedMethod.label}
				</span>
			</div>

			{method === "crypto" ? (
				<div className="mt-5 grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
					<div className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-[#cfdcda] bg-[#f7faf9] text-[#5F9EA0]">
						<QrIcon className="h-28 w-28" />
					</div>
					<div>
						<div className="flex items-center gap-3">
							<AssetMark asset={selectedAsset} />
							<div>
								<p className="font-semibold text-[#576363]">
									Send {selectedAsset.symbol}
								</p>
								<p className="text-sm text-[#5d6163]">
									{selectedAsset.network}
								</p>
							</div>
						</div>

						<div className="mt-4 rounded-lg border border-[#d7e5e3] bg-[#f7faf9] p-4">
							<p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5F9EA0]">
								Address
							</p>
							<p className="mt-2 break-all font-mono text-sm leading-6 text-[#576363]">
								{selectedAsset.address}
							</p>
							<Button
								type="button"
								variant="outline"
								className="mt-4 gap-2"
								onClick={onCopy}
							>
								<CopyIcon className="h-4 w-4" />
								{copied ? "Copied" : "Copy Address"}
							</Button>
						</div>

						<div className="mt-4 grid gap-3 sm:grid-cols-3">
							<InfoTile
								label="Amount"
								value={`${formatAssetAmount(estimatedAssetAmount)} ${selectedAsset.symbol}`}
							/>
							<InfoTile
								label="USD value"
								value={formatUsd(validUsd)}
							/>
							<InfoTile
								label="Confirmations"
								value={`${selectedAsset.confirmationsRequired}`}
							/>
						</div>
					</div>
				</div>
			) : (
				<div className="mt-5 rounded-lg border border-[#d7e5e3] bg-[#f7faf9] p-5">
					<p className="font-semibold text-[#576363]">
						{selectedMethod.label} review instructions
					</p>
					<p className="mt-2 text-sm leading-6 text-[#5d6163]">
						Submit {formatUsd(validUsd)} using reference {reference}. A support
						specialist will confirm the payment before crediting your available
						balance.
					</p>
					<p className="mt-3 text-sm font-semibold text-[#3c7f80]">
						{selectedMethod.reviewTime}
					</p>
				</div>
			)}

			<div className="mt-5 rounded-lg bg-[#fff8ec] p-4 text-sm leading-6 text-[#8a5b14]">
				{method === "crypto"
					? `Only send ${selectedAsset.symbol} through ${selectedAsset.network}. Sending another asset or network may cause permanent loss.`
					: "Do not send payment details through unofficial channels. Support will confirm the correct instructions inside your account."}
			</div>

			<Button type="button" className="mt-5 w-full" onClick={onSentFunds}>
				I Have Sent Funds
			</Button>
		</section>
	);
}

function RecentDeposits({ deposits }: { deposits: RecentDeposit[] }) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="flex flex-col gap-3 border-b border-[#d7e5e3] p-5 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-lg font-semibold text-[#576363]">
						Recent deposits
					</h2>
					<p className="mt-1 text-sm leading-6 text-[#5d6163]">
						Track funding requests and confirmation status.
					</p>
				</div>
				<Link
					href="/account/transactions"
					className={buttonVariants({ size: "sm", variant: "outline" })}
				>
					View All
				</Link>
			</div>
			<div className="divide-y divide-[#eef1f1]">
				{deposits.map((deposit) => (
					<div
						key={deposit.id}
						className="grid gap-3 p-5 sm:grid-cols-[minmax(0,1fr)_auto]"
					>
						<div>
							<div className="flex flex-wrap items-center gap-2">
								<p className="font-semibold text-[#576363]">
									{deposit.reference}
								</p>
								<span
									className={cn(
										"rounded-full px-2.5 py-1 text-xs font-semibold",
										statusClasses[deposit.status],
									)}
								>
									{deposit.status}
								</span>
							</div>
							<p className="mt-1 text-sm text-[#5d6163]">
								{deposit.method} - {formatDateTime(deposit.createdAt)}
							</p>
						</div>
						<div className="sm:text-right">
							<p className="font-semibold text-[#576363]">
								{formatAssetAmount(deposit.amount)} {deposit.assetSymbol}
							</p>
							<p className="mt-1 text-sm text-[#5d6163]">
								{formatUsd(deposit.amountUsd)}
							</p>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}

function RulesCard({ rules }: { rules: string[] }) {
	return (
		<aside className="space-y-6">
			<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e5f3f1] text-[#3c7f80]">
						<DepositIcon className="h-5 w-5" />
					</div>
					<h2 className="text-lg font-semibold text-[#576363]">
						Deposit rules
					</h2>
				</div>
				<ul className="mt-4 space-y-3">
					{rules.map((rule) => (
						<li key={rule} className="flex gap-3 text-sm leading-6 text-[#5d6163]">
							<span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5F9EA0]" />
							<span>{rule}</span>
						</li>
					))}
				</ul>
			</section>

			<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				<h2 className="font-semibold text-[#576363]">Need help funding?</h2>
				<p className="mt-2 text-sm leading-6 text-[#5d6163]">
					Support can help match delayed deposits or confirm manual payment
					instructions.
				</p>
				<Link
					href="/account/support"
					className={cn(
						buttonVariants({ size: "md", variant: "outline" }),
						"mt-5 w-full",
					)}
				>
					Contact Support
				</Link>
			</section>
		</aside>
	);
}

function AssetMark({ asset }: { asset: CryptoDepositAsset }) {
	return (
		<div
			className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-sm font-semibold text-white"
			style={{ backgroundColor: asset.color }}
		>
			{asset.symbol.slice(0, 3)}
		</div>
	);
}

function InfoTile({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-lg border border-[#eef1f1] bg-[#f7faf9] p-4">
			<p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5F9EA0]">
				{label}
			</p>
			<p className="mt-2 break-words text-sm font-semibold text-[#576363]">
				{value}
			</p>
		</div>
	);
}

function generateReference(deposits: RecentDeposit[]) {
	const numbers = deposits.map((deposit) => {
		const match = deposit.reference.match(/\d+/);

		return match ? Number(match[0]) : 0;
	});
	const next = Math.max(...numbers, 2300) + 1;

	return `DP-${next}`;
}
