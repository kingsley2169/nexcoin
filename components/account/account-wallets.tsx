"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
	type WalletActivity,
	type WalletActivityStatus,
	type WalletAsset,
	type WalletsData,
	type WalletStatus,
} from "@/lib/wallets";
import { buttonVariants, Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AccountWalletsProps = {
	data: WalletsData;
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

const statusClasses: Record<WalletStatus, string> = {
	Active: "bg-[#e6f3ec] text-[#2e8f5b]",
	Confirming: "bg-[#fff1e0] text-[#a66510]",
	Maintenance: "bg-[#eef1f1] text-[#5d6163]",
};

const activityStatusClasses: Record<WalletActivityStatus, string> = {
	Completed: "bg-[#e6f3ec] text-[#2e8f5b]",
	Credited: "bg-[#e6f3ec] text-[#2e8f5b]",
	Pending: "bg-[#fff1e0] text-[#a66510]",
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

function maskAddress(address: string) {
	if (address.length <= 20) {
		return address;
	}

	return `${address.slice(0, 10)}...${address.slice(-8)}`;
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

function WalletIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			className={className}
			aria-hidden="true"
			fill="none"
			stroke="currentColor"
			strokeLinejoin="round"
			strokeWidth="2"
		>
			<path d="M4 7.5h16v12H4zM16 12h4" />
			<path d="M7 7.5V5h10v2.5" />
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

export function AccountWallets({ data }: AccountWalletsProps) {
	const [selectedId, setSelectedId] = useState(data.assets[0]?.id ?? "");
	const [copiedId, setCopiedId] = useState<null | string>(null);

	const selectedAsset =
		data.assets.find((asset) => asset.id === selectedId) ?? data.assets[0];

	const summary = useMemo(() => {
		return data.assets.reduce(
			(result, asset) => {
				result.totalValue += asset.balance * asset.rateUsd;
				result.availableValue += asset.availableBalance * asset.rateUsd;
				result.pendingValue += asset.pendingDeposit * asset.rateUsd;

				if (asset.status === "Active") {
					result.activeWallets += 1;
				}

				return result;
			},
			{
				activeWallets: 0,
				availableValue: 0,
				pendingValue: 0,
				totalValue: 0,
			},
		);
	}, [data.assets]);

	const handleCopy = async (asset: WalletAsset) => {
		try {
			await navigator.clipboard.writeText(asset.address);
			setCopiedId(asset.id);
			window.setTimeout(() => setCopiedId(null), 1800);
		} catch {
			setCopiedId(null);
		}
	};

	return (
		<div className="space-y-6">
			<header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="text-2xl font-semibold text-[#576363]">Wallets</h1>
					<p className="mt-1 max-w-2xl text-sm leading-6 text-[#5d6163]">
						Manage supported balances, deposit addresses, network requirements,
						and recent wallet activity.
					</p>
				</div>
				<div className="flex flex-wrap gap-3">
					<Link href="/account/deposit" className={buttonVariants({ size: "md" })}>
						Deposit Funds
					</Link>
					<Link
						href="/account/withdrawal"
						className={buttonVariants({ size: "md", variant: "outline" })}
					>
						Withdraw
					</Link>
				</div>
			</header>

			<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<SummaryCard
					label="Total wallet value"
					value={formatUsd(summary.totalValue)}
					hint={`${data.assets.length} supported wallets`}
				/>
				<SummaryCard
					label="Available balance"
					value={formatUsd(summary.availableValue)}
					hint="Ready for investing or withdrawal"
				/>
				<SummaryCard
					label="Pending deposits"
					value={formatUsd(summary.pendingValue)}
					hint="Awaiting network confirmations"
					tone={summary.pendingValue > 0 ? "warning" : "neutral"}
				/>
				<SummaryCard
					label="Active wallets"
					value={`${summary.activeWallets}/${data.assets.length}`}
					hint="Deposit addresses online"
				/>
			</section>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
				<WalletList
					assets={data.assets}
					copiedId={copiedId}
					onCopy={handleCopy}
					onSelect={setSelectedId}
					selectedId={selectedAsset.id}
				/>
				<DepositPanel
					asset={selectedAsset}
					copied={copiedId === selectedAsset.id}
					onCopy={() => handleCopy(selectedAsset)}
				/>
			</div>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
				<ActivityCard activities={data.activities} />
				<SecurityNotes notes={data.notes} />
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

function WalletList({
	assets,
	copiedId,
	onCopy,
	onSelect,
	selectedId,
}: {
	assets: WalletAsset[];
	copiedId: null | string;
	onCopy: (asset: WalletAsset) => void;
	onSelect: (id: string) => void;
	selectedId: string;
}) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="border-b border-[#d7e5e3] p-5">
				<h2 className="text-lg font-semibold text-[#576363]">
					Supported wallets
				</h2>
				<p className="mt-1 text-sm leading-6 text-[#5d6163]">
					Select a wallet to review its deposit address and network rules.
				</p>
			</div>
			<div className="divide-y divide-[#eef1f1]">
				{assets.map((asset) => {
					const selected = selectedId === asset.id;

					return (
						<div
							key={asset.id}
							role="button"
							tabIndex={0}
							onClick={() => onSelect(asset.id)}
							onKeyDown={(event) => {
								if (event.key === "Enter" || event.key === " ") {
									event.preventDefault();
									onSelect(asset.id);
								}
							}}
							className={cn(
								"grid w-full cursor-pointer gap-4 p-5 text-left transition hover:bg-[#f7faf9] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15 lg:grid-cols-[minmax(220px,1fr)_minmax(160px,0.75fr)_minmax(150px,0.7fr)_auto]",
								selected && "bg-[#f7faf9]",
							)}
						>
							<div className="flex min-w-0 items-center gap-3">
								<AssetMark asset={asset} />
								<div className="min-w-0">
									<p className="font-semibold text-[#576363]">
										{asset.name}{" "}
										<span className="text-sm text-[#5d6163]">{asset.symbol}</span>
									</p>
									<p className="mt-1 truncate text-sm text-[#5d6163]">
										{asset.network}
									</p>
								</div>
							</div>
							<div>
								<p className="text-sm text-[#5d6163]">Balance</p>
								<p className="mt-1 font-semibold text-[#576363]">
									{formatAssetAmount(asset.balance)} {asset.symbol}
								</p>
							</div>
							<div>
								<p className="text-sm text-[#5d6163]">Value</p>
								<p className="mt-1 font-semibold text-[#576363]">
									{formatUsd(asset.balance * asset.rateUsd)}
								</p>
								<p className="mt-1 font-mono text-xs text-[#5d6163]">
									{maskAddress(asset.address)}
								</p>
							</div>
							<div className="flex items-center gap-2 lg:justify-end">
								<span
									className={cn(
										"rounded-full px-2.5 py-1 text-xs font-semibold",
										statusClasses[asset.status],
									)}
								>
									{asset.status}
								</span>
								<button
									type="button"
									onClick={(event) => {
										event.stopPropagation();
										onCopy(asset);
									}}
									onKeyDown={(event) => {
										if (event.key === "Enter" || event.key === " ") {
											event.preventDefault();
											event.stopPropagation();
											onCopy(asset);
										}
									}}
									className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#cfdcda] bg-white text-[#576363] transition hover:border-[#5F9EA0] hover:text-[#5F9EA0]"
									aria-label={`Copy ${asset.symbol} address`}
									title={copiedId === asset.id ? "Copied" : "Copy address"}
								>
									<CopyIcon className="h-4 w-4" />
								</button>
							</div>
						</div>
					);
				})}
			</div>
		</section>
	);
}

function DepositPanel({
	asset,
	copied,
	onCopy,
}: {
	asset: WalletAsset;
	copied: boolean;
	onCopy: () => void;
}) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="flex items-start justify-between gap-4">
				<div className="flex min-w-0 items-center gap-3">
					<AssetMark asset={asset} />
					<div className="min-w-0">
						<h2 className="font-semibold text-[#576363]">
							{asset.symbol} deposit address
						</h2>
						<p className="mt-1 text-sm text-[#5d6163]">{asset.network}</p>
					</div>
				</div>
				<span
					className={cn(
						"shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
						statusClasses[asset.status],
					)}
				>
					{asset.status}
				</span>
			</div>

			<div className="mt-5 flex aspect-square max-h-52 w-full items-center justify-center rounded-lg border border-dashed border-[#cfdcda] bg-[#f7faf9] text-[#5F9EA0]">
				<QrIcon className="h-28 w-28" />
			</div>

			<div className="mt-5 rounded-lg border border-[#d7e5e3] bg-[#f7faf9] p-4">
				<p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5F9EA0]">
					Address
				</p>
				<p className="mt-2 break-all font-mono text-sm leading-6 text-[#576363]">
					{asset.address}
				</p>
				<Button
					type="button"
					variant="outline"
					className="mt-4 w-full gap-2"
					onClick={onCopy}
				>
					<CopyIcon className="h-4 w-4" />
					{copied ? "Copied" : "Copy Address"}
				</Button>
			</div>

			<div className="mt-5 grid gap-3 text-sm">
				<DetailRow label="Minimum deposit" value={`${asset.minDeposit} ${asset.symbol}`} />
				<DetailRow
					label="Confirmations"
					value={`${asset.confirmationsRequired} required`}
				/>
				<DetailRow
					label="Pending deposit"
					value={`${formatAssetAmount(asset.pendingDeposit)} ${asset.symbol}`}
				/>
				<DetailRow
					label="Last updated"
					value={formatDateTime(asset.lastUpdatedAt)}
				/>
			</div>

			<div className="mt-5 rounded-lg bg-[#fff8ec] p-4 text-sm leading-6 text-[#8a5b14]">
				Only send {asset.symbol} through {asset.network}. Sending another asset
				or network to this address may cause permanent loss.
			</div>
		</section>
	);
}

function ActivityCard({ activities }: { activities: WalletActivity[] }) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="flex flex-col gap-3 border-b border-[#d7e5e3] p-5 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-lg font-semibold text-[#576363]">
						Recent wallet activity
					</h2>
					<p className="mt-1 text-sm leading-6 text-[#5d6163]">
						Latest deposits, withdrawals, holds, and credited transfers.
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
				{activities.map((activity) => (
					<div
						key={activity.id}
						className="grid gap-3 p-5 sm:grid-cols-[minmax(0,1fr)_auto]"
					>
						<div className="min-w-0">
							<div className="flex flex-wrap items-center gap-2">
								<p className="font-semibold text-[#576363]">{activity.label}</p>
								<span
									className={cn(
										"rounded-full px-2.5 py-1 text-xs font-semibold",
										activityStatusClasses[activity.status],
									)}
								>
									{activity.status}
								</span>
							</div>
							<p className="mt-1 text-sm text-[#5d6163]">
								{activity.reference} · {activity.type} ·{" "}
								{formatDateTime(activity.createdAt)}
							</p>
						</div>
						<p className="font-semibold text-[#576363] sm:text-right">
							{formatAssetAmount(activity.amount)} {activity.assetSymbol}
						</p>
					</div>
				))}
			</div>
		</section>
	);
}

function SecurityNotes({ notes }: { notes: string[] }) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e5f3f1] text-[#3c7f80]">
					<WalletIcon className="h-5 w-5" />
				</div>
				<h2 className="text-lg font-semibold text-[#576363]">Wallet safety</h2>
			</div>
			<ul className="mt-4 space-y-3">
				{notes.map((note) => (
					<li key={note} className="flex gap-3 text-sm leading-6 text-[#5d6163]">
						<span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5F9EA0]" />
						<span>{note}</span>
					</li>
				))}
			</ul>
		</section>
	);
}

function AssetMark({ asset }: { asset: WalletAsset }) {
	return (
		<div
			className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-sm font-semibold text-white"
			style={{ backgroundColor: asset.color }}
		>
			{asset.symbol.slice(0, 3)}
		</div>
	);
}

function DetailRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-start justify-between gap-4 border-b border-[#eef1f1] pb-3 last:border-b-0 last:pb-0">
			<span className="text-[#5d6163]">{label}</span>
			<span className="text-right font-semibold text-[#576363]">{value}</span>
		</div>
	);
}
