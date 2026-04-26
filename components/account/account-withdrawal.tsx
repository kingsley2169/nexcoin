"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
	type SavedAddress,
	type WithdrawalData,
	type WithdrawalStatus,
} from "@/lib/withdrawals";
import {
	addWallet,
	removeWallet,
	setDefaultWallet,
} from "@/app/account/wallets/actions";
import { createWithdrawal } from "@/app/account/withdrawal/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WalletAssetKey = "BTC" | "ETH" | "USDT";

const ASSET_KEY_BY_ID: Record<string, WalletAssetKey> = {
	btc: "BTC",
	eth: "ETH",
	usdt: "USDT",
};

type AccountWithdrawalProps = {
	data: WithdrawalData;
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
});

const statusBadgeClasses: Record<WithdrawalStatus, string> = {
	Completed: "bg-[#e6f3ec] text-[#2e8f5b]",
	Pending: "bg-[#fff1e0] text-[#a66510]",
	Processing: "bg-[#eef6f5] text-[#3c7f80]",
	Rejected: "bg-[#fde8e8] text-[#b1423a]",
};

function formatUsd(value: number) {
	return currencyFormatter.format(value);
}

function formatAssetAmount(value: number, decimals = 6) {
	const trimmed = Number.parseFloat(value.toFixed(decimals));

	return Number.isFinite(trimmed) ? trimmed.toString() : "0";
}

function formatDateTime(iso: string) {
	return dateTimeFormatter.format(new Date(iso));
}

function maskAddress(address: string) {
	if (address.length <= 14) {
		return address;
	}

	return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function pickDefaultAddress(addresses: SavedAddress[], assetId: string) {
	return (
		addresses.find((item) => item.assetId === assetId && item.isDefault) ??
		addresses.find((item) => item.assetId === assetId)
	);
}

export function AccountWithdrawal({ data }: AccountWithdrawalProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const addresses = data.savedAddresses;
	const withdrawals = data.recentWithdrawals;
	const firstAssetId = data.assets[0]?.id ?? "";
	const [selectedAssetId, setSelectedAssetId] = useState(firstAssetId);
	const [addressMode, setAddressMode] = useState<"saved" | "new">(() => {
		const match = pickDefaultAddress(addresses, firstAssetId);

		return match ? "saved" : "new";
	});
	const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
		() => pickDefaultAddress(addresses, firstAssetId)?.id ?? null,
	);
	const [amount, setAmount] = useState("");
	const [newAddress, setNewAddress] = useState("");
	const [newLabel, setNewLabel] = useState("");
	const [twoFactorCode, setTwoFactorCode] = useState("");
	const [acceptedTerms, setAcceptedTerms] = useState(false);
	const [saveNewAddress, setSaveNewAddress] = useState(false);
	const [notice, setNotice] = useState<
		{ tone: "success" | "error"; message: string } | null
	>(null);
	const [isAdding, setIsAdding] = useState(false);
	const [addDraft, setAddDraft] = useState({
		address: "",
		assetId: firstAssetId,
		label: "",
	});

	const selectedAsset = useMemo(
		() => data.assets.find((asset) => asset.id === selectedAssetId) ?? data.assets[0],
		[data.assets, selectedAssetId],
	);

	const addressesForAsset = useMemo(
		() => addresses.filter((item) => item.assetId === selectedAsset.id),
		[addresses, selectedAsset.id],
	);

	const selectedAddress = useMemo(
		() =>
			addressesForAsset.find((item) => item.id === selectedAddressId) ?? null,
		[addressesForAsset, selectedAddressId],
	);

	const numericAmount = Number(amount);
	const isNumericAmount = Number.isFinite(numericAmount) && numericAmount > 0;
	const networkFeeCrypto = selectedAsset.feeFlat;
	const nexcoinFeeCrypto = isNumericAmount
		? (numericAmount * selectedAsset.feePercent) / 100
		: 0;
	const receiveAmount = Math.max(
		numericAmount - networkFeeCrypto - nexcoinFeeCrypto,
		0,
	);
	const amountUsd = isNumericAmount ? numericAmount * selectedAsset.rateUsd : 0;

	const hasDestination =
		addressMode === "saved"
			? Boolean(selectedAddress)
			: newAddress.trim().length >= 20;
	const meetsMinimum = numericAmount >= selectedAsset.minWithdrawal;
	const withinBalance = numericAmount <= selectedAsset.balance;
	const netPositive = receiveAmount > 0;
	const validCode = /^\d{6}$/.test(twoFactorCode);

	const amountError = !isNumericAmount
		? null
		: !meetsMinimum
			? `Minimum withdrawal is ${selectedAsset.minWithdrawal} ${selectedAsset.symbol}.`
			: !withinBalance
				? `Exceeds your available balance of ${selectedAsset.balance} ${selectedAsset.symbol}.`
				: !netPositive
					? "Amount is too small to cover the fees."
					: null;

	const canSubmit =
		isNumericAmount &&
		meetsMinimum &&
		withinBalance &&
		netPositive &&
		hasDestination &&
		validCode &&
		acceptedTerms;

	useEffect(() => {
		if (!notice || notice.tone !== "success") {
			return;
		}

		const id = window.setTimeout(() => setNotice(null), 4000);

		return () => window.clearTimeout(id);
	}, [notice]);

	function handleAssetChange(assetId: string) {
		setSelectedAssetId(assetId);
		const fallback = pickDefaultAddress(addresses, assetId);
		setSelectedAddressId(fallback?.id ?? null);
		setAddressMode(fallback ? "saved" : "new");
		setAmount("");
		setNewAddress("");
		setNewLabel("");
		setSaveNewAddress(false);
	}

	function handleMax() {
		setAmount(formatAssetAmount(selectedAsset.balance));
	}

	function handleSetDefault(addressId: string) {
		if (isPending) return;

		startTransition(async () => {
			const result = await setDefaultWallet(addressId);

			if (!result.ok) {
				setNotice({ tone: "error", message: result.error });
				return;
			}

			setNotice({ tone: "success", message: "Default address updated." });
			router.refresh();
		});
	}

	function handleRemove(addressId: string) {
		if (isPending) return;

		startTransition(async () => {
			const result = await removeWallet(addressId);

			if (!result.ok) {
				setNotice({ tone: "error", message: result.error });
				return;
			}

			if (selectedAddressId === addressId) {
				const remaining = addresses.filter(
					(item) => item.id !== addressId && item.assetId === selectedAsset.id,
				);
				setSelectedAddressId(remaining[0]?.id ?? null);
				setAddressMode(remaining.length > 0 ? "saved" : "new");
			}

			setNotice({ tone: "success", message: "Address removed." });
			router.refresh();
		});
	}

	function handleAddAddress(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (
			addDraft.label.trim().length < 2 ||
			addDraft.address.trim().length < 20 ||
			isPending
		) {
			return;
		}

		const asset =
			data.assets.find((item) => item.id === addDraft.assetId) ?? data.assets[0];
		const assetKey = ASSET_KEY_BY_ID[asset.id];

		if (!assetKey) {
			setNotice({ tone: "error", message: "Unsupported asset." });
			return;
		}

		startTransition(async () => {
			const result = await addWallet({
				address: addDraft.address.trim(),
				asset: assetKey,
				label: addDraft.label.trim(),
				network: asset.network,
			});

			if (!result.ok) {
				setNotice({ tone: "error", message: result.error });
				return;
			}

			setNotice({ tone: "success", message: "Address saved." });
			setAddDraft({ address: "", assetId: firstAssetId, label: "" });
			setIsAdding(false);
			router.refresh();
		});
	}

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!canSubmit || isPending) {
			return;
		}

		if (addressMode === "new") {
			const trimmedAddress = newAddress.trim();
			const trimmedLabel = newLabel.trim();
			const assetKey = ASSET_KEY_BY_ID[selectedAsset.id];

			if (!saveNewAddress) {
				setNotice({
					tone: "error",
					message:
						"Save the address first by checking 'Save this address', then submit.",
				});
				return;
			}

			if (trimmedLabel.length < 2) {
				setNotice({ tone: "error", message: "Add a label to save the address." });
				return;
			}

			if (!assetKey) {
				setNotice({ tone: "error", message: "Unsupported asset." });
				return;
			}

			startTransition(async () => {
				const saveResult = await addWallet({
					address: trimmedAddress,
					asset: assetKey,
					label: trimmedLabel,
					network: selectedAsset.network,
				});

				if (!saveResult.ok) {
					setNotice({ tone: "error", message: saveResult.error });
					return;
				}

				setNotice({
					tone: "success",
					message:
						"Address saved. Switch to 'Saved address' and select it to confirm the withdrawal.",
				});
				setSaveNewAddress(false);
				setNewLabel("");
				setNewAddress("");
				setAddressMode("saved");
				router.refresh();
			});
			return;
		}

		if (!selectedAddress) {
			setNotice({ tone: "error", message: "Choose a saved address." });
			return;
		}

		const destinationAddress = selectedAddress.address;
		const addressId = selectedAddress.id;

		startTransition(async () => {
			const result = await createWithdrawal({
				addressId,
				amount: numericAmount,
				amountUsd,
				feeCrypto: networkFeeCrypto + nexcoinFeeCrypto,
				feeUsd: (networkFeeCrypto + nexcoinFeeCrypto) * selectedAsset.rateUsd,
				rateUsd: selectedAsset.rateUsd,
			});

			if (!result.ok) {
				setNotice({ tone: "error", message: result.error });
				return;
			}

			setNotice({
				tone: "success",
				message: `${result.reference} queued — ${formatAssetAmount(numericAmount)} ${selectedAsset.symbol} to ${maskAddress(destinationAddress)}.`,
			});
			setAmount("");
			setNewAddress("");
			setNewLabel("");
			setTwoFactorCode("");
			setAcceptedTerms(false);
			setSaveNewAddress(false);
			router.refresh();
		});
	}

	return (
		<div className="space-y-8">
			<section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
				<div className="max-w-2xl">
					<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
						Withdrawal
					</p>
					<h1 className="mt-3 text-3xl font-semibold text-[#576363] sm:text-4xl">
						Request a withdrawal
					</h1>
					<p className="mt-3 text-sm leading-6 text-[#5d6163] sm:text-base">
						Send funds to a saved wallet or a new address. Review the fee
						breakdown, confirm with your 2FA code, and track the status here.
					</p>
				</div>
				<div className="flex flex-wrap gap-3">
					<Link
						href="/account/transactions"
						className={buttonVariants({ size: "md", variant: "outline" })}
					>
						View all transactions
					</Link>
				</div>
			</section>

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

			<div className="grid gap-6 xl:grid-cols-[1fr_360px]">
				<div className="space-y-6">
					<form
						onSubmit={handleSubmit}
						className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]"
					>
						<h2 className="text-xl font-semibold text-[#576363]">
							Withdrawal details
						</h2>

						<div className="mt-5 space-y-5">
							<Field label="Asset" htmlFor="withdraw-asset">
								<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
									{data.assets.map((asset) => {
										const isActive = asset.id === selectedAssetId;

										return (
											<button
												key={asset.id}
												type="button"
												onClick={() => handleAssetChange(asset.id)}
												className={cn(
													"rounded-md border p-3 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15",
													isActive
														? "border-[#5F9EA0] bg-[#eef6f5]"
														: "border-[#cfdcda] bg-white hover:border-[#5F9EA0]",
												)}
											>
												<div className="flex items-center justify-between">
													<span className="text-sm font-semibold text-[#576363]">
														{asset.symbol}
													</span>
													<span className="text-xs text-[#5d6163]">
														{formatAssetAmount(asset.balance, 4)}
													</span>
												</div>
												<p className="mt-1 text-xs text-[#5d6163]">
													{asset.network}
												</p>
											</button>
										);
									})}
								</div>
								<p className="mt-2 text-xs text-[#5d6163]">
									Network: {selectedAsset.network} · Balance{" "}
									{formatAssetAmount(selectedAsset.balance)}{" "}
									{selectedAsset.symbol}
								</p>
							</Field>

							<Field label="Amount" htmlFor="withdraw-amount" error={amountError}>
								<div className="flex h-12 items-center rounded-md border border-[#cfdcda] bg-white px-3 focus-within:border-[#5F9EA0] focus-within:ring-4 focus-within:ring-[#5F9EA0]/15">
									<input
										id="withdraw-amount"
										type="number"
										inputMode="decimal"
										step="any"
										min={0}
										max={selectedAsset.balance}
										value={amount}
										onChange={(event) => setAmount(event.target.value)}
										placeholder={`Min ${selectedAsset.minWithdrawal} ${selectedAsset.symbol}`}
										className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#576363] outline-none placeholder:text-[#9aa5a4]"
									/>
									<span className="ml-2 text-sm font-semibold text-[#5d6163]">
										{selectedAsset.symbol}
									</span>
									<button
										type="button"
										onClick={handleMax}
										className="ml-3 rounded-md bg-[#eef6f5] px-2.5 py-1 text-xs font-semibold text-[#3c7f80] transition hover:bg-[#dbeceb]"
									>
										Max
									</button>
								</div>
								<p className="mt-2 text-xs text-[#5d6163]">
									≈ {formatUsd(amountUsd)}
								</p>
							</Field>

							<Field label="Destination" htmlFor="withdraw-destination">
								<div className="flex gap-2">
									<ToggleChip
										active={addressMode === "saved"}
										disabled={addressesForAsset.length === 0}
										onClick={() => setAddressMode("saved")}
									>
										Saved address
									</ToggleChip>
									<ToggleChip
										active={addressMode === "new"}
										onClick={() => setAddressMode("new")}
									>
										New address
									</ToggleChip>
								</div>

								{addressMode === "saved" ? (
									addressesForAsset.length === 0 ? (
										<p className="mt-3 text-xs text-[#5d6163]">
											No saved addresses for {selectedAsset.symbol}. Switch to
											&ldquo;New address&rdquo; or add one below.
										</p>
									) : (
										<select
											id="withdraw-destination"
											value={selectedAddressId ?? ""}
											onChange={(event) =>
												setSelectedAddressId(event.target.value)
											}
											className="mt-3 h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
										>
											{addressesForAsset.map((item) => (
												<option key={item.id} value={item.id}>
													{item.label} · {maskAddress(item.address)}
													{item.isDefault ? " · default" : ""}
												</option>
											))}
										</select>
									)
								) : (
									<div className="mt-3 space-y-3">
										<input
											id="withdraw-destination"
											type="text"
											value={newAddress}
											onChange={(event) => setNewAddress(event.target.value)}
											placeholder={`Paste a ${selectedAsset.network} address`}
											className="h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
										/>
										<label className="flex items-start gap-3 text-sm leading-6 text-[#5d6163]">
											<input
												type="checkbox"
												checked={saveNewAddress}
												onChange={(event) =>
													setSaveNewAddress(event.target.checked)
												}
												className="mt-1 h-4 w-4 rounded border-[#cfdcda] accent-[#5F9EA0]"
											/>
											<span>
												Save this address for future{" "}
												{selectedAsset.symbol} withdrawals.
											</span>
										</label>
										{saveNewAddress ? (
											<input
												type="text"
												value={newLabel}
												onChange={(event) => setNewLabel(event.target.value)}
												placeholder="Label (e.g. Hardware wallet)"
												className="h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
											/>
										) : null}
									</div>
								)}
							</Field>

							<FeeBreakdown
								networkFee={networkFeeCrypto}
								nexcoinFee={nexcoinFeeCrypto}
								receiveAmount={receiveAmount}
								symbol={selectedAsset.symbol}
								totalDeducted={numericAmount}
							/>

							<Field
								label="2FA code"
								htmlFor="withdraw-2fa"
								hint="Enter the 6-digit code from your authenticator app."
							>
								<input
									id="withdraw-2fa"
									type="text"
									inputMode="numeric"
									pattern="\d{6}"
									maxLength={6}
									value={twoFactorCode}
									onChange={(event) =>
										setTwoFactorCode(event.target.value.replace(/\D/g, ""))
									}
									placeholder="123456"
									className="h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm font-semibold tracking-[0.3em] text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
								/>
							</Field>

							<label className="flex items-start gap-3 text-sm leading-6 text-[#5d6163]">
								<input
									type="checkbox"
									checked={acceptedTerms}
									onChange={(event) => setAcceptedTerms(event.target.checked)}
									className="mt-1 h-4 w-4 rounded border-[#cfdcda] accent-[#5F9EA0]"
								/>
								<span>
									I have verified the destination address and understand this
									withdrawal cannot be reversed once confirmed.
								</span>
							</label>
						</div>

						<div className="mt-6 flex justify-end">
							<Button type="submit" disabled={!canSubmit || isPending}>
								{isPending ? "Submitting…" : "Confirm withdrawal"}
							</Button>
						</div>
					</form>

					<section className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
						<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
							<div>
								<p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5F9EA0]">
									Saved addresses
								</p>
								<h2 className="mt-2 text-xl font-semibold text-[#576363]">
									Approved withdrawal destinations
								</h2>
							</div>
							<Button
								type="button"
								size="sm"
								variant={isAdding ? "secondary" : "primary"}
								onClick={() => setIsAdding((current) => !current)}
							>
								{isAdding ? "Cancel" : "Add address"}
							</Button>
						</div>

						{isAdding ? (
							<form
								onSubmit={handleAddAddress}
								className="mt-5 space-y-3 rounded-md bg-[#f7faf9] p-4"
							>
								<Field label="Label" htmlFor="add-label">
									<input
										id="add-label"
										type="text"
										value={addDraft.label}
										onChange={(event) =>
											setAddDraft((current) => ({
												...current,
												label: event.target.value,
											}))
										}
										placeholder="e.g. Hardware wallet"
										className="h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
									/>
								</Field>
								<Field label="Asset" htmlFor="add-asset">
									<select
										id="add-asset"
										value={addDraft.assetId}
										onChange={(event) =>
											setAddDraft((current) => ({
												...current,
												assetId: event.target.value,
											}))
										}
										className="h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
									>
										{data.assets.map((asset) => (
											<option key={asset.id} value={asset.id}>
												{asset.symbol} · {asset.network}
											</option>
										))}
									</select>
								</Field>
								<Field label="Wallet address" htmlFor="add-address">
									<input
										id="add-address"
										type="text"
										value={addDraft.address}
										onChange={(event) =>
											setAddDraft((current) => ({
												...current,
												address: event.target.value,
											}))
										}
										placeholder="Paste the wallet address"
										className="h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
									/>
								</Field>
								<div className="flex justify-end">
									<Button
										type="submit"
										size="sm"
										disabled={
											addDraft.label.trim().length < 2 ||
											addDraft.address.trim().length < 20
										}
									>
										Save address
									</Button>
								</div>
							</form>
						) : null}

						<ul className="mt-5 space-y-3">
							{addresses.length === 0 ? (
								<li className="rounded-md bg-[#f7faf9] p-4 text-sm text-[#5d6163]">
									No saved addresses yet. Add one to speed up future withdrawals.
								</li>
							) : (
								addresses.map((item) => {
									const asset = data.assets.find(
										(candidate) => candidate.id === item.assetId,
									);

									return (
										<li
											key={item.id}
											className="flex flex-col gap-3 rounded-md border border-[#eef1f0] p-4 sm:flex-row sm:items-center sm:justify-between"
										>
											<div className="min-w-0">
												<div className="flex flex-wrap items-center gap-2">
													<span className="text-sm font-semibold text-[#576363]">
														{item.label}
													</span>
													<span className="rounded-md bg-[#eef6f5] px-2 py-0.5 text-xs font-semibold text-[#3c7f80]">
														{asset?.symbol ?? "—"}
													</span>
													<span className="rounded-md bg-[#f7faf9] px-2 py-0.5 text-xs font-semibold text-[#576363]">
														{item.network}
													</span>
													{item.isDefault ? (
														<span className="rounded-md bg-[#e6f3ec] px-2 py-0.5 text-xs font-semibold text-[#2e8f5b]">
															Default
														</span>
													) : null}
												</div>
												<p className="mt-1 break-all text-xs text-[#5d6163]">
													{maskAddress(item.address)}
												</p>
											</div>
											<div className="flex shrink-0 flex-wrap gap-2">
												{item.isDefault ? null : (
													<Button
														type="button"
														size="sm"
														variant="outline"
														onClick={() => handleSetDefault(item.id)}
													>
														Set default
													</Button>
												)}
												<Button
													type="button"
													size="sm"
													variant="outline"
													onClick={() => handleRemove(item.id)}
												>
													Remove
												</Button>
											</div>
										</li>
									);
								})
							)}
						</ul>
					</section>

					<section className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
						<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
							<div>
								<p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5F9EA0]">
									Recent withdrawals
								</p>
								<h2 className="mt-2 text-xl font-semibold text-[#576363]">
									Last 5 requests
								</h2>
							</div>
							<Link
								href="/account/transactions"
								className={buttonVariants({ size: "sm", variant: "outline" })}
							>
								See all transactions
							</Link>
						</div>

						<ul className="mt-5 divide-y divide-[#eef1f0]">
							{withdrawals.slice(0, 5).map((item) => (
								<li
									key={item.id}
									className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
								>
									<div className="min-w-0">
										<div className="flex flex-wrap items-center gap-2">
											<span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5F9EA0]">
												{item.reference}
											</span>
											<span
												className={cn(
													"rounded-md px-2 py-0.5 text-xs font-semibold",
													statusBadgeClasses[item.status],
												)}
											>
												{item.status}
											</span>
										</div>
										<p className="mt-1 text-sm font-semibold text-[#576363]">
											{formatAssetAmount(item.amount)} {item.assetSymbol}
										</p>
										<p className="text-xs text-[#5d6163]">
											To {item.addressMasked} · {formatDateTime(item.createdAt)}
										</p>
									</div>
								</li>
							))}
						</ul>
					</section>
				</div>

				<aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
					<section className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
						<h2 className="text-lg font-semibold text-[#576363]">
							Limits & availability
						</h2>
						<div className="mt-4 space-y-4 text-sm">
							<Row label="Available balance" value={formatUsd(data.limits.availableBalanceUsd)} />
							<Row label="Pending withdrawals" value={formatUsd(data.limits.pendingUsd)} />
							<div>
								<div className="flex justify-between text-xs font-medium text-[#5d6163]">
									<span>Daily limit</span>
									<span>
										{formatUsd(data.limits.dailyUsedUsd)} /{" "}
										{formatUsd(data.limits.dailyLimitUsd)}
									</span>
								</div>
								<ProgressBar
									value={data.limits.dailyUsedUsd}
									max={data.limits.dailyLimitUsd}
								/>
							</div>
							<div>
								<div className="flex justify-between text-xs font-medium text-[#5d6163]">
									<span>Monthly limit</span>
									<span>
										{formatUsd(data.limits.monthlyUsedUsd)} /{" "}
										{formatUsd(data.limits.monthlyLimitUsd)}
									</span>
								</div>
								<ProgressBar
									value={data.limits.monthlyUsedUsd}
									max={data.limits.monthlyLimitUsd}
								/>
							</div>
							<p className="rounded-md bg-[#f7faf9] p-3 text-xs leading-5 text-[#5d6163]">
								Processing time: {data.limits.processingTime}
							</p>
						</div>
					</section>

					<section className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
						<h2 className="text-lg font-semibold text-[#576363]">
							Security reminders
						</h2>
						<ul className="mt-4 space-y-3 text-sm leading-6 text-[#5d6163]">
							{data.securityNotes.map((note) => (
								<li key={note} className="flex gap-2">
									<span
										aria-hidden="true"
										className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5F9EA0]"
									/>
									<span>{note}</span>
								</li>
							))}
						</ul>
						<div className="mt-5">
							<Link
								href="/account/security"
								className={buttonVariants({
									className: "w-full",
									size: "sm",
									variant: "outline",
								})}
							>
								Security settings
							</Link>
						</div>
					</section>
				</aside>
			</div>
		</div>
	);
}

function Field({
	children,
	error,
	hint,
	htmlFor,
	label,
}: {
	children: React.ReactNode;
	error?: string | null;
	hint?: string;
	htmlFor: string;
	label: string;
}) {
	return (
		<div>
			<label
				htmlFor={htmlFor}
				className="block text-sm font-semibold text-[#576363]"
			>
				{label}
			</label>
			<div className="mt-2">{children}</div>
			{error ? (
				<p className="mt-2 text-sm text-[#b1423a]">{error}</p>
			) : hint ? (
				<p className="mt-2 text-xs text-[#5d6163]">{hint}</p>
			) : null}
		</div>
	);
}

function ToggleChip({
	active,
	children,
	disabled,
	onClick,
}: {
	active: boolean;
	children: React.ReactNode;
	disabled?: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className={cn(
				"rounded-full px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15",
				active
					? "bg-[#5F9EA0] text-white"
					: "bg-[#f7faf9] text-[#576363] hover:bg-[#eef6f5] hover:text-[#5F9EA0]",
				disabled && "cursor-not-allowed opacity-50 hover:bg-[#f7faf9] hover:text-[#576363]",
			)}
		>
			{children}
		</button>
	);
}

function FeeBreakdown({
	networkFee,
	nexcoinFee,
	receiveAmount,
	symbol,
	totalDeducted,
}: {
	networkFee: number;
	nexcoinFee: number;
	receiveAmount: number;
	symbol: string;
	totalDeducted: number;
}) {
	return (
		<div className="rounded-md bg-[#f7faf9] p-4">
			<p className="text-sm font-semibold text-[#576363]">Fee breakdown</p>
			<dl className="mt-3 space-y-2 text-sm">
				<FeeRow
					label="Network fee"
					value={`${formatAssetAmount(networkFee)} ${symbol}`}
				/>
				<FeeRow
					label="Nexcoin fee"
					value={`${formatAssetAmount(nexcoinFee)} ${symbol}`}
				/>
				<FeeRow
					label="You will receive"
					value={`${formatAssetAmount(receiveAmount)} ${symbol}`}
					emphasized
				/>
				<FeeRow
					label="Total deducted"
					value={`${formatAssetAmount(totalDeducted)} ${symbol}`}
				/>
			</dl>
		</div>
	);
}

function FeeRow({
	emphasized = false,
	label,
	value,
}: {
	emphasized?: boolean;
	label: string;
	value: string;
}) {
	return (
		<div className="flex items-center justify-between gap-3">
			<dt className="text-[#5d6163]">{label}</dt>
			<dd
				className={cn(
					"font-semibold",
					emphasized ? "text-[#2e8f5b]" : "text-[#576363]",
				)}
			>
				{value}
			</dd>
		</div>
	);
}

function Row({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between gap-3">
			<span className="text-[#5d6163]">{label}</span>
			<span className="font-semibold text-[#576363]">{value}</span>
		</div>
	);
}

function ProgressBar({ max, value }: { max: number; value: number }) {
	const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;

	return (
		<div className="mt-2 h-2 rounded-full bg-[#eef1f0]">
			<div
				className="h-2 rounded-full bg-[#5F9EA0]"
				style={{ width: `${percent}%` }}
			/>
		</div>
	);
}
