"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
	type CryptoDepositAsset,
	type DepositData,
	type DepositStatus,
	type RecentDeposit,
} from "@/lib/deposits";
import { submitDeposit } from "@/app/account/deposit/actions";
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
	"Needs Review": "bg-[#fff1e0] text-[#a66510]",
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

function buildQrCodeUrl(address: string, size = 256) {
	const encoded = encodeURIComponent(address);
	return `https://api.qrserver.com/v1/create-qr-code/?data=${encoded}&size=${size}x${size}&margin=8&qzone=2`;
}

function WalletQrCode({
	address,
	className,
	label,
}: {
	address: string;
	className?: string;
	label: string;
}) {
	if (!address) {
		return (
			<div
				className={cn(
					"flex aspect-square items-center justify-center rounded-md bg-[#eef1f1] text-xs text-[#5d6163]",
					className,
				)}
			>
				No address yet
			</div>
		);
	}

	return (
		// eslint-disable-next-line @next/next/no-img-element
		<img
			src={buildQrCodeUrl(address)}
			alt={`QR code for ${label}`}
			className={cn("h-full w-full object-contain", className)}
			loading="lazy"
		/>
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
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [assetId, setAssetId] = useState(data.assets[0]?.id ?? "");
	const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
	const [amountUsd, setAmountUsd] = useState("2500");
	const [txHash, setTxHash] = useState("");
	const [senderAddress, setSenderAddress] = useState("");
	const [copied, setCopied] = useState(false);
	const [notice, setNotice] = useState<
		| { tone: "success"; message: string }
		| { tone: "error"; message: string }
		| null
	>(null);

	const selectedAsset =
		data.assets.find((asset) => asset.id === assetId) ?? data.assets[0];

	const numericAmount = Number.parseFloat(amountUsd);
	const isValidAmount = Number.isFinite(numericAmount) && numericAmount > 0;
	const estimatedAssetAmount =
		selectedAsset && isValidAmount
			? numericAmount / selectedAsset.rateUsd
			: 0;

	const amountError = useMemo(() => {
		if (!isValidAmount) {
			return "Enter a deposit amount.";
		}

		if (selectedAsset && estimatedAssetAmount < selectedAsset.minDeposit) {
			return `Minimum ${selectedAsset.symbol} deposit is ${selectedAsset.minDeposit} ${selectedAsset.symbol}.`;
		}

		return "";
	}, [estimatedAssetAmount, isValidAmount, selectedAsset]);

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

	const trimmedTxHash = txHash.trim();
	const isTxHashValid = trimmedTxHash.length >= 10;

	const handleSentFunds = () => {
		if (amountError || !selectedAsset || isPending || !isTxHashValid) {
			return;
		}

		startTransition(async () => {
			const result = await submitDeposit({
				walletId: selectedAsset.id,
				amount: estimatedAssetAmount,
				amountUsd: numericAmount,
				rateUsd: selectedAsset.rateUsd,
				txHash: trimmedTxHash,
				senderAddress: senderAddress.trim() || undefined,
			});

			if (!result.ok) {
				setNotice({ tone: "error", message: result.error });
				return;
			}

			setNotice({
				tone: "success",
				message: `Deposit ${result.reference} is being confirmed.`,
			});
			setIsInstructionsOpen(false);
			setTxHash("");
			setSenderAddress("");
			router.refresh();
		});
	};

	const handleAssetSelect = (nextAssetId: string) => {
		setAssetId(nextAssetId);
		setCopied(false);
		setNotice(null);
		setTxHash("");
		setSenderAddress("");
		setIsInstructionsOpen(true);
	};

	return (
		<div className="space-y-6">
			<header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="text-2xl font-semibold text-[#576363]">
						Deposit Funds
					</h1>
					<p className="mt-1 max-w-2xl text-sm leading-6 text-[#5d6163]">
						Fund your Nexcoin account with supported crypto assets only.
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
					hint="Bitcoin, Ethereum, and USDT"
					label="Supported assets"
					value={String(data.summary.supportedAssets)}
				/>
			</section>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_370px]">
				<div className="space-y-6">
					<DepositForm
						amountError={amountError}
						amountUsd={amountUsd}
						assets={data.assets}
						estimatedAssetAmount={estimatedAssetAmount}
						onAmountChange={setAmountUsd}
						onAssetChange={handleAssetSelect}
						selectedAsset={selectedAsset}
					/>
					<RecentDeposits deposits={data.recentDeposits} />
				</div>
				<RulesCard rules={data.rules} />
			</div>

			{selectedAsset && isInstructionsOpen ? (
				<DepositInstructionsModal
					onClose={() => setIsInstructionsOpen(false)}
					title={`Deposit ${selectedAsset.symbol}`}
				>
					<InstructionsPanel
						amountUsd={numericAmount}
						copied={copied}
						estimatedAssetAmount={estimatedAssetAmount}
						isSubmitting={isPending}
						isTxHashValid={isTxHashValid}
						onCopy={handleCopy}
						onSenderAddressChange={setSenderAddress}
						onSentFunds={handleSentFunds}
						onTxHashChange={setTxHash}
						selectedAsset={selectedAsset}
						senderAddress={senderAddress}
						txHash={txHash}
					/>
				</DepositInstructionsModal>
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
	onAmountChange,
	onAssetChange,
	selectedAsset,
}: {
	amountError: string;
	amountUsd: string;
	assets: CryptoDepositAsset[];
	estimatedAssetAmount: number;
	onAmountChange: (value: string) => void;
	onAssetChange: (value: string) => void;
	selectedAsset: CryptoDepositAsset;
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
						Choose an asset, enter the amount, and send to the matching wallet.
					</p>
				</div>
			</div>

			<div className="mt-5">
				<p className="text-sm font-semibold text-[#576363]">Crypto asset</p>
				<div className="mt-3 grid gap-3 md:grid-cols-3">
					{assets.map((asset) => {
						const active = selectedAsset.id === asset.id;

						return (
							<button
								key={asset.id}
								type="button"
								onClick={() => onAssetChange(asset.id)}
								disabled={asset.status === "Maintenance"}
								className={cn(
									"rounded-lg border p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15",
									active
										? "border-[#5F9EA0] bg-[#eef6f5]"
										: "border-[#d7e5e3] bg-white hover:bg-[#f7faf9]",
									asset.status === "Maintenance" &&
										"cursor-not-allowed opacity-60 hover:bg-white",
								)}
							>
								<div className="flex items-center gap-3">
									<AssetMark asset={asset} />
									<div>
										<p className="font-semibold text-[#576363]">
											{asset.symbol}
										</p>
										<p className="text-xs text-[#5d6163]">{asset.network}</p>
									</div>
								</div>
								<p className="mt-1 text-sm leading-6 text-[#5d6163]">
									{asset.name}
								</p>
								<p className="mt-2 text-xs font-semibold text-[#3c7f80]">
									Min {asset.minDeposit} {asset.symbol}
								</p>
							</button>
						);
					})}
				</div>
			</div>

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
						min="0"
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
						Estimated {formatAssetAmount(estimatedAssetAmount)}{" "}
						{selectedAsset.symbol}
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
	isSubmitting,
	isTxHashValid,
	onCopy,
	onSenderAddressChange,
	onSentFunds,
	onTxHashChange,
	selectedAsset,
	senderAddress,
	txHash,
}: {
	amountUsd: number;
	copied: boolean;
	estimatedAssetAmount: number;
	isSubmitting: boolean;
	isTxHashValid: boolean;
	onCopy: () => void;
	onSenderAddressChange: (value: string) => void;
	onSentFunds: () => void;
	onTxHashChange: (value: string) => void;
	selectedAsset: CryptoDepositAsset;
	senderAddress: string;
	txHash: string;
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
						Send funds from your wallet, then confirm below.
					</p>
				</div>
				<span className="self-start rounded-full bg-[#eef6f5] px-3 py-1.5 text-xs font-semibold text-[#3c7f80]">
					Crypto only
				</span>
			</div>

			<div className="mt-5 grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
				<div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-[#cfdcda] bg-white p-2">
					<WalletQrCode
						address={selectedAsset.address}
						label={`${selectedAsset.symbol} on ${selectedAsset.network}`}
					/>
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
							Receiving address
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
						<InfoTile label="USD value" value={formatUsd(validUsd)} />
						<InfoTile
							label="Confirmations"
							value={`${selectedAsset.confirmationsRequired}`}
						/>
					</div>
				</div>
			</div>

			<div className="mt-5 rounded-lg bg-[#fff8ec] p-4 text-sm leading-6 text-[#8a5b14]">
				Only send {selectedAsset.symbol} through {selectedAsset.network}.
				Sending another asset or network may cause permanent loss.
			</div>

			<div className="mt-5 space-y-4">
				<div>
					<label
						htmlFor="deposit-tx-hash"
						className="text-sm font-semibold text-[#576363]"
					>
						Transaction hash
						<span className="ml-1 text-[#b1423a]">*</span>
					</label>
					<p className="mt-1 text-xs text-[#5d6163]">
						Paste the {selectedAsset.network} transaction hash from your wallet
						or block explorer so admins can verify your transfer.
					</p>
					<input
						id="deposit-tx-hash"
						type="text"
						value={txHash}
						onChange={(event) => onTxHashChange(event.target.value)}
						placeholder={
							selectedAsset.network.toLowerCase().includes("bitcoin")
								? "e.g. 8a1b2c3d4e…"
								: "e.g. 0x8a1b2c3d4e…"
						}
						className="mt-2 h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 font-mono text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
						autoComplete="off"
						spellCheck={false}
					/>
				</div>
				<div>
					<label
						htmlFor="deposit-sender-address"
						className="text-sm font-semibold text-[#576363]"
					>
						Sender address
						<span className="ml-1 text-[#5d6163] font-normal">(optional)</span>
					</label>
					<p className="mt-1 text-xs text-[#5d6163]">
						The wallet address the funds were sent from. Helps admins match the
						on-chain transfer faster.
					</p>
					<input
						id="deposit-sender-address"
						type="text"
						value={senderAddress}
						onChange={(event) => onSenderAddressChange(event.target.value)}
						className="mt-2 h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 font-mono text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
						autoComplete="off"
						spellCheck={false}
					/>
				</div>
			</div>

			<Button
				type="button"
				className="mt-5 w-full"
				onClick={onSentFunds}
				disabled={isSubmitting || !isTxHashValid}
			>
				{isSubmitting ? "Submitting…" : "I Have Sent Funds"}
			</Button>
		</section>
	);
}

function DepositInstructionsModal({
	children,
	onClose,
	title,
}: {
	children: React.ReactNode;
	onClose: () => void;
	title: string;
}) {
	return (
		<div
			className="fixed inset-0 z-[70] bg-[#1f2929]/45 p-3 backdrop-blur-sm sm:p-5"
			role="dialog"
			aria-modal="true"
			aria-labelledby="deposit-instructions-modal-title"
		>
			<div className="absolute inset-0" aria-hidden="true" onClick={onClose} />
			<section className="relative mx-auto flex max-h-[calc(100vh-24px)] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-[#d7e5e3] bg-[#f7faf9] shadow-[0_28px_90px_rgba(31,41,41,0.28)] sm:max-h-[calc(100vh-40px)]">
				<header className="flex items-start justify-between gap-4 border-b border-[#d7e5e3] bg-white px-4 py-4 sm:px-6">
					<div className="min-w-0">
						<p className="text-sm text-[#5d6163]">Deposit instructions</p>
						<h2
							id="deposit-instructions-modal-title"
							className="mt-1 truncate text-xl font-semibold text-[#576363]"
						>
							{title}
						</h2>
					</div>
					<Button type="button" variant="outline" size="sm" onClick={onClose}>
						Close
					</Button>
				</header>
				<div className="overflow-y-auto p-4 sm:p-6">{children}</div>
			</section>
		</div>
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
					Support can help match delayed deposits or confirm crypto network
					confirmations.
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

