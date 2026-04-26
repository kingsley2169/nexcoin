"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
	type WalletActivity,
	type WalletActivityStatus,
	type WalletAsset,
	type WalletsData,
	type WalletStatus,
} from "@/lib/wallets";
import {
	addWallet,
	removeWallet,
	setDefaultWallet,
} from "@/app/account/wallets/actions";
import { buttonVariants, Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AccountWalletsProps = {
	data: WalletsData;
};

type WalletAssetKey = "BTC" | "ETH" | "USDT";

type WalletDraft = {
	address: string;
	asset: WalletAssetKey;
	label: string;
	network: string;
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
	day: "numeric",
	hour: "numeric",
	minute: "2-digit",
	month: "short",
	year: "numeric",
});

const statusClasses: Record<WalletStatus, string> = {
	Active: "bg-[#eef6f5] text-[#3c7f80]",
	Default: "bg-[#e6f3ec] text-[#2e8f5b]",
	Review: "bg-[#fff1e0] text-[#a66510]",
};

const activityStatusClasses: Record<WalletActivityStatus, string> = {
	Completed: "bg-[#e6f3ec] text-[#2e8f5b]",
	Pending: "bg-[#fff1e0] text-[#a66510]",
	Saved: "bg-[#eef6f5] text-[#3c7f80]",
};

const walletCreationOptions: readonly {
	asset: WalletAssetKey;
	name: string;
	network: string;
}[] = [
	{ asset: "BTC", name: "Bitcoin", network: "Bitcoin" },
	{ asset: "ETH", name: "Ethereum", network: "Ethereum (ERC-20)" },
	{ asset: "USDT", name: "Tether USD", network: "Tron (TRC-20)" },
];

function formatDateTime(iso: string) {
	return dateTimeFormatter.format(new Date(iso));
}

function maskAddress(address: string) {
	if (address.length <= 18) {
		return address;
	}

	return `${address.slice(0, 8)}...${address.slice(-6)}`;
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

export function AccountWallets({ data }: AccountWalletsProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const assets = data.assets;
	const [selectedId, setSelectedId] = useState(data.assets[0]?.id ?? "");
	const [copiedId, setCopiedId] = useState<null | string>(null);
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [notice, setNotice] = useState<
		{ tone: "success" | "error"; message: string } | null
	>(null);

	const selectedAsset =
		assets.find((asset) => asset.id === selectedId) ?? assets[0] ?? null;

	const summary = useMemo(() => {
		return assets.reduce(
			(result, asset) => {
				result.totalWallets += 1;

				if (asset.status === "Active" || asset.status === "Default") {
					result.activeWallets += 1;
				}

				if (asset.isDefault) {
					result.defaultWallets += 1;
				}

				const createdAt = new Date(asset.createdAt).getTime();
				if (createdAt > result.latestCreatedAt) {
					result.latestCreatedAt = createdAt;
					result.latestLabel = asset.label;
				}

				return result;
			},
			{
				activeWallets: 0,
				defaultWallets: 0,
				latestCreatedAt: 0,
				latestLabel: "",
				totalWallets: 0,
			},
		);
	}, [assets]);

	const handleCopy = async (asset: WalletAsset) => {
		try {
			await navigator.clipboard.writeText(asset.address);
			setCopiedId(asset.id);
			window.setTimeout(() => setCopiedId(null), 1800);
		} catch {
			setCopiedId(null);
		}
	};

	const handleSelect = (id: string) => {
		setSelectedId(id);
		setIsDetailsOpen(true);
	};

	const handleCreateWallet = (draft: WalletDraft) => {
		if (isPending) return;

		startTransition(async () => {
			const result = await addWallet({
				asset: draft.asset,
				network: draft.network,
				label: draft.label,
				address: draft.address,
			});

			if (!result.ok) {
				setNotice({ tone: "error", message: result.error });
				return;
			}

			setNotice({
				tone: "success",
				message: `${draft.label.trim()} saved to your wallets.`,
			});
			setIsCreateOpen(false);
			router.refresh();
		});
	};

	const handleRemoveWallet = (walletId: string) => {
		if (isPending) return;

		startTransition(async () => {
			const result = await removeWallet(walletId);

			if (!result.ok) {
				setNotice({ tone: "error", message: result.error });
				return;
			}

			setNotice({ tone: "success", message: "Wallet removed." });
			setIsDetailsOpen(false);
			setSelectedId("");
			router.refresh();
		});
	};

	const handleSetDefaultWallet = (wallet: WalletAsset) => {
		if (isPending || wallet.isDefault) return;

		startTransition(async () => {
			const result = await setDefaultWallet(wallet.id);

			if (!result.ok) {
				setNotice({ tone: "error", message: result.error });
				return;
			}

			setNotice({
				tone: "success",
				message: `${wallet.label} is now your default ${wallet.symbol} wallet.`,
			});
			router.refresh();
		});
	};

	return (
		<div className="space-y-6">
			<header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="text-2xl font-semibold text-[#576363]">Wallets</h1>
					<p className="mt-1 max-w-2xl text-sm leading-6 text-[#5d6163]">
						Save and review your own withdrawal wallets so you can pick the
						right destination faster when moving funds.
					</p>
				</div>
				<div className="flex flex-wrap gap-3">
					<Button type="button" variant="outline" onClick={() => setIsCreateOpen(true)}>
						Add Wallet
					</Button>
					<Link href="/account/withdrawal" className={buttonVariants({ size: "md" })}>
						Use In Withdrawal
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
					label="Saved wallets"
					value={summary.totalWallets.toString()}
					hint="Wallets you added to your account"
				/>
				<SummaryCard
					label="Active wallets"
					value={summary.activeWallets.toString()}
					hint="Ready to use during withdrawal"
				/>
				<SummaryCard
					label="Default wallets"
					value={summary.defaultWallets.toString()}
					hint="One default can exist per asset"
				/>
				<SummaryCard
					label="Latest added"
					value={summary.latestLabel || "No wallet"}
					hint={
						summary.latestCreatedAt
							? formatDateTime(new Date(summary.latestCreatedAt).toISOString())
							: "Add your first wallet to get started"
					}
				/>
			</section>

			<WalletList
				assets={assets}
				copiedId={copiedId}
				onCopy={handleCopy}
				onSelect={handleSelect}
				selectedId={selectedAsset?.id ?? ""}
			/>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
				<ActivityCard activities={data.activities} />
				<SecurityNotes notes={data.notes} />
			</div>

			{isDetailsOpen && selectedAsset ? (
				<WalletDetailsModal
					asset={selectedAsset}
					copied={copiedId === selectedAsset.id}
					isSubmitting={isPending}
					onClose={() => setIsDetailsOpen(false)}
					onCopy={() => handleCopy(selectedAsset)}
					onRemove={() => handleRemoveWallet(selectedAsset.id)}
					onSetDefault={() => handleSetDefaultWallet(selectedAsset)}
				/>
			) : null}

			{isCreateOpen ? (
				<CreateWalletModal
					assets={walletCreationOptions}
					isSubmitting={isPending}
					onClose={() => setIsCreateOpen(false)}
					onCreate={handleCreateWallet}
				/>
			) : null}
		</div>
	);
}

function SummaryCard({
	hint,
	label,
	value,
}: {
	hint: string;
	label: string;
	value: string;
}) {
	return (
		<div className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<p className="text-sm text-[#5d6163]">{label}</p>
			<p className="mt-2 text-2xl font-semibold text-[#576363]">{value}</p>
			<p className="mt-2 text-sm text-[#5d6163]">{hint}</p>
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
				<h2 className="text-lg font-semibold text-[#576363]">My saved wallets</h2>
				<p className="mt-1 text-sm leading-6 text-[#5d6163]">
					Open a wallet to review the full address, label, network, and recent use.
				</p>
			</div>
			<div className="divide-y divide-[#eef1f1]">
				{assets.length === 0 ? (
					<div className="p-8 text-center text-sm text-[#5d6163]">
						No saved wallets yet. Add a wallet here before using it in withdrawal.
					</div>
				) : null}
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
								"grid w-full cursor-pointer gap-4 p-5 text-left transition hover:bg-[#f7faf9] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15 lg:grid-cols-[minmax(220px,1fr)_minmax(180px,0.8fr)_minmax(160px,0.8fr)_auto]",
								selected && "bg-[#f7faf9]",
							)}
						>
							<div className="flex min-w-0 items-center gap-3">
								<AssetMark asset={asset} />
								<div className="min-w-0">
									<p className="font-semibold text-[#576363]">{asset.label}</p>
									<p className="mt-1 text-sm text-[#5d6163]">
										{asset.name} · {asset.symbol}
									</p>
								</div>
							</div>
							<div>
								<p className="text-sm text-[#5d6163]">Network</p>
								<p className="mt-1 font-semibold text-[#576363]">{asset.network}</p>
								<p className="mt-1 text-xs text-[#5d6163]">
									Added {formatDateTime(asset.createdAt)}
								</p>
							</div>
							<div>
								<p className="text-sm text-[#5d6163]">Address</p>
								<p className="mt-1 font-mono text-xs text-[#576363]">
									{maskAddress(asset.address)}
								</p>
								<p className="mt-1 text-xs text-[#5d6163]">
									Last used {formatDateTime(asset.lastUsedAt)}
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
									aria-label={`Copy ${asset.label} address`}
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

function WalletDetailsModal({
	asset,
	copied,
	isSubmitting,
	onClose,
	onCopy,
	onRemove,
	onSetDefault,
}: {
	asset: WalletAsset;
	copied: boolean;
	isSubmitting: boolean;
	onClose: () => void;
	onCopy: () => void;
	onRemove: () => void;
	onSetDefault: () => void;
}) {
	return (
		<div
			className="fixed inset-0 z-[70] bg-[#1f2929]/45 p-3 backdrop-blur-sm sm:p-5"
			role="dialog"
			aria-modal="true"
			aria-labelledby="wallet-details-modal-title"
		>
			<div className="absolute inset-0" aria-hidden="true" onClick={onClose} />
			<section className="relative mx-auto flex max-h-[calc(100vh-24px)] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-[#d7e5e3] bg-[#f7faf9] shadow-[0_28px_90px_rgba(31,41,41,0.28)] sm:max-h-[calc(100vh-40px)]">
				<header className="flex items-start justify-between gap-4 border-b border-[#d7e5e3] bg-white px-4 py-4 sm:px-6">
					<div className="min-w-0">
						<p className="text-sm text-[#5d6163]">Wallet details</p>
						<h2
							id="wallet-details-modal-title"
							className="mt-1 truncate text-xl font-semibold text-[#576363]"
						>
							{asset.label}
						</h2>
					</div>
					<Button type="button" variant="outline" size="sm" onClick={onClose}>
						Close
					</Button>
				</header>
				<div className="overflow-y-auto p-4 sm:p-6">
					<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
						<div className="flex items-start justify-between gap-4">
							<div className="flex min-w-0 items-center gap-3">
								<AssetMark asset={asset} />
								<div className="min-w-0">
									<h3 className="font-semibold text-[#576363]">{asset.name}</h3>
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
							<DetailRow label="Asset" value={`${asset.name} (${asset.symbol})`} />
							<DetailRow label="Network" value={asset.network} />
							<DetailRow label="Created" value={formatDateTime(asset.createdAt)} />
							<DetailRow label="Last used" value={formatDateTime(asset.lastUsedAt)} />
							<DetailRow label="Default wallet" value={asset.isDefault ? "Yes" : "No"} />
						</div>

						<div className="mt-5 rounded-lg bg-[#fff8ec] p-4 text-sm leading-6 text-[#8a5b14]">
							This page is for wallets you saved to your account. Review the
							address carefully before choosing it during a withdrawal.
						</div>

						<div className="mt-5 flex flex-wrap justify-end gap-3">
							<Button
								type="button"
								variant={asset.isDefault ? "secondary" : "outline"}
								onClick={onSetDefault}
								disabled={isSubmitting || asset.isDefault}
							>
								{asset.isDefault
									? "Default Wallet"
									: isSubmitting
										? "Saving…"
										: "Make Default"}
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={onRemove}
								disabled={isSubmitting}
								className="border-[#efc9c7] text-[#b1423a] hover:border-[#b1423a] hover:bg-[#fde8e8] hover:text-[#b1423a]"
							>
								{isSubmitting ? "Removing…" : "Remove Wallet"}
							</Button>
						</div>
					</section>
				</div>
			</section>
		</div>
	);
}

function CreateWalletModal({
	assets,
	isSubmitting,
	onClose,
	onCreate,
}: {
	assets: readonly { asset: WalletAssetKey; name: string; network: string }[];
	isSubmitting: boolean;
	onClose: () => void;
	onCreate: (draft: WalletDraft) => void;
}) {
	const [draft, setDraft] = useState<WalletDraft>({
		address: "",
		asset: assets[0]?.asset ?? "BTC",
		label: "",
		network: assets[0]?.network ?? "Bitcoin",
	});

	const selectedAsset =
		assets.find((item) => item.asset === draft.asset) ?? assets[0];

	const handleAssetChange = (asset: (typeof assets)[number]) => {
		setDraft((current) => ({
			...current,
			asset: asset.asset,
			network: asset.network,
		}));
	};

	const canCreate =
		draft.label.trim().length >= 2 &&
		draft.network.trim().length >= 2 &&
		draft.address.trim().length >= 20;

	return (
		<div
			className="fixed inset-0 z-[70] bg-[#1f2929]/45 p-3 backdrop-blur-sm sm:p-5"
			role="dialog"
			aria-modal="true"
			aria-labelledby="create-wallet-modal-title"
		>
			<div className="absolute inset-0" aria-hidden="true" onClick={onClose} />
			<section className="relative mx-auto flex max-h-[calc(100vh-24px)] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-[#d7e5e3] bg-white shadow-[0_28px_90px_rgba(31,41,41,0.28)] sm:max-h-[calc(100vh-40px)]">
				<header className="flex items-start justify-between gap-4 border-b border-[#d7e5e3] px-4 py-4 sm:px-6">
					<div className="min-w-0">
						<p className="text-sm text-[#5d6163]">Wallet</p>
						<h2
							id="create-wallet-modal-title"
							className="mt-1 text-xl font-semibold text-[#576363]"
						>
							Add saved wallet
						</h2>
					</div>
					<Button type="button" variant="outline" size="sm" onClick={onClose}>
						Close
					</Button>
				</header>

				<div className="overflow-y-auto p-4 sm:p-6">
					<div className="grid gap-5">
						<div>
							<p className="text-sm font-semibold text-[#576363]">Asset</p>
							<div className="mt-3 grid gap-3 sm:grid-cols-3">
								{assets.map((asset) => {
									const active = draft.asset === asset.asset;

									return (
										<button
											key={asset.asset}
											type="button"
											onClick={() => handleAssetChange(asset)}
											className={cn(
												"rounded-lg border p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15",
												active
													? "border-[#5F9EA0] bg-[#eef6f5]"
													: "border-[#d7e5e3] bg-white hover:bg-[#f7faf9]",
											)}
										>
											<p className="font-semibold text-[#576363]">{asset.asset}</p>
											<p className="mt-1 text-sm text-[#5d6163]">{asset.name}</p>
											<p className="mt-2 text-xs font-semibold text-[#3c7f80]">
												{asset.network}
											</p>
										</button>
									);
								})}
							</div>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<label className="text-sm font-semibold text-[#576363]" htmlFor="wallet-create-label">
									Label
								</label>
								<input
									id="wallet-create-label"
									value={draft.label}
									onChange={(event) =>
										setDraft((current) => ({
											...current,
											label: event.target.value,
										}))
									}
									placeholder={`Primary ${selectedAsset?.asset ?? "wallet"}`}
									className="mt-2 h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm font-medium text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
								/>
							</div>

							<div>
								<label className="text-sm font-semibold text-[#576363]" htmlFor="wallet-create-network">
									Network
								</label>
								<input
									id="wallet-create-network"
									disabled
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
							<label className="text-sm font-semibold text-[#576363]" htmlFor="wallet-create-address">
								Wallet address
							</label>
							<textarea
								id="wallet-create-address"
								value={draft.address}
								onChange={(event) =>
									setDraft((current) => ({
										...current,
										address: event.target.value,
									}))
								}
								placeholder="Paste the wallet address you want saved on your account"
								rows={5}
								className="mt-2 w-full rounded-md border border-[#cfdcda] bg-white px-3 py-2 text-sm font-medium text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
							/>
						</div>

						<div className="rounded-lg bg-[#f7faf9] p-4 text-sm leading-6 text-[#5d6163]">
							Add a wallet you want available in your account later for
							withdrawals.
						</div>
					</div>
				</div>

				<footer className="flex items-center justify-end gap-3 border-t border-[#d7e5e3] px-4 py-4 sm:px-6">
					<Button type="button" variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={() => canCreate && onCreate(draft)}
						disabled={!canCreate || isSubmitting}
					>
						{isSubmitting ? "Saving…" : "Save Wallet"}
					</Button>
				</footer>
			</section>
		</div>
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
						Recent wallet saves and wallet-linked withdrawal activity.
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
							{activity.assetSymbol}
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
