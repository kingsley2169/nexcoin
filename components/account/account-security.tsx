"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
	type SecurityActivity,
	type SecurityActivityStatus,
	type SecurityData,
	type SecurityProtection,
	type SecurityStrength,
	type TrustedDevice,
	type TrustedDeviceStatus,
} from "@/lib/security";
import {
	changePassword,
	disableTwoFactor,
	enableTwoFactor,
	regenerateBackupCodes,
	revokeDevice,
	updateSecuritySettings,
} from "@/app/account/security/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AccountSecurityProps = {
	data: SecurityData;
};

type Notice = {
	tone: "success" | "error";
	message: string;
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
	day: "numeric",
	hour: "numeric",
	minute: "2-digit",
	month: "short",
	year: "numeric",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
	day: "numeric",
	month: "short",
	year: "numeric",
});

const deviceStatusClasses: Record<TrustedDeviceStatus, string> = {
	Current: "bg-[#e5f3f1] text-[#3c7f80]",
	Review: "bg-[#fde8e8] text-[#b1423a]",
	Trusted: "bg-[#eef6f5] text-[#3c7f80]",
};

const activityStatusClasses: Record<SecurityActivityStatus, string> = {
	Completed: "bg-[#e6f3ec] text-[#2e8f5b]",
	Review: "bg-[#fde8e8] text-[#b1423a]",
};

function formatDateTime(iso: string) {
	return dateTimeFormatter.format(new Date(iso));
}

function formatDate(iso: string) {
	return dateFormatter.format(new Date(iso));
}

function ShieldIcon({ className }: { className?: string }) {
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
			<path d="M12 3 5 6v5c0 4.5 2.8 8 7 10 4.2-2 7-5.5 7-10V6z" />
			<path d="m9 12 2 2 4-5" strokeLinecap="round" />
		</svg>
	);
}

function KeyIcon({ className }: { className?: string }) {
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
			<path d="M15 7a4 4 0 1 0 2 3.46L21 6.5V4h-2.5l-1.2 1.2H15z" />
			<path d="M7 14h.01" />
		</svg>
	);
}

function DeviceIcon({ className }: { className?: string }) {
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
			<path d="M5 5h14v11H5zM9 20h6M12 16v4" />
		</svg>
	);
}

function LockIcon({ className }: { className?: string }) {
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
			<path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" />
		</svg>
	);
}

export function AccountSecurity({ data }: AccountSecurityProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [notice, setNotice] = useState<Notice | null>(null);
	const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [passwordModalNotice, setPasswordModalNotice] = useState<Notice | null>(null);

	useEffect(() => {
		if (!notice) {
			return;
		}

		const id = window.setTimeout(() => setNotice(null), 3000);
		return () => window.clearTimeout(id);
	}, [notice]);

	const summary = useMemo(() => {
		const reviewDevices = data.devices.filter(
			(device) => device.status === "Review",
		).length;
		const enabledProtections = data.protections.filter(
			(protection) => protection.enabled,
		).length;

		return {
			enabledProtections,
			reviewDevices,
			trustedDevices: data.devices.length,
		};
	}, [data.devices, data.protections]);

	const handleToggleTwoFactor = () => {
		if (isPending) return;

		startTransition(async () => {
			const result = data.twoFactor.enabled
				? await disableTwoFactor()
				: await enableTwoFactor();

			if (!result.ok) {
				setNotice({ tone: "error", message: result.error });
				return;
			}

			setNotice({
				tone: "success",
				message: data.twoFactor.enabled
					? "Two-factor authentication disabled."
					: "Two-factor authentication enabled.",
			});
			router.refresh();
		});
	};

	const handleRegenerateBackupCodes = () => {
		if (isPending) return;

		startTransition(async () => {
			const result = await regenerateBackupCodes();

			if (!result.ok) {
				setNotice({ tone: "error", message: result.error });
				return;
			}

			setNotice({
				tone: "success",
				message: "Backup codes regenerated.",
			});
			router.refresh();
		});
	};

	const handleToggleProtection = (id: string) => {
		if (isPending) return;

		const protection = data.protections.find((item) => item.id === id);
		if (!protection || protection.isLocked) {
			return;
		}

		startTransition(async () => {
			const result = await updateSecuritySettings({
				confirmNewWithdrawalAddresses:
					id === "address-confirmation"
						? !protection.enabled
						: undefined,
				newDeviceAlerts:
					id === "new-device-alerts"
						? !protection.enabled
						: undefined,
			});

			if (!result.ok) {
				setNotice({ tone: "error", message: result.error });
				return;
			}

			setNotice({
				tone: "success",
				message: "Security settings updated.",
			});
			router.refresh();
		});
	};

	const handleRevokeDevice = (id: string) => {
		if (isPending) return;

		startTransition(async () => {
			const result = await revokeDevice(id);

			if (!result.ok) {
				setNotice({ tone: "error", message: result.error });
				return;
			}

			setNotice({ tone: "success", message: "Device removed." });
			router.refresh();
		});
	};

	const handleChangePasswordSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (newPassword !== confirmPassword) {
			setPasswordModalNotice({
				tone: "error",
				message: "New passwords do not match.",
			});
			return;
		}

		if (isPending) return;

		startTransition(async () => {
			const result = await changePassword(currentPassword, newPassword);

			if (!result.ok) {
				setPasswordModalNotice({ tone: "error", message: result.error });
				return;
			}

			setPasswordModalNotice({
				tone: "success",
				message: "Password changed successfully.",
			});

			window.setTimeout(() => {
				setIsPasswordModalOpen(false);
				setCurrentPassword("");
				setNewPassword("");
				setConfirmPassword("");
				setShowCurrentPassword(false);
				setShowNewPassword(false);
				setPasswordModalNotice(null);
				router.refresh();
			}, 2000);
		});
	};

	return (
		<div className="space-y-6">
			<header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="text-2xl font-semibold text-[#576363]">
						Security Settings
					</h1>
					<p className="mt-1 max-w-2xl text-sm leading-6 text-[#5d6163]">
						Manage sign-in protection, password access, trusted devices, and
						sensitive withdrawal safeguards.
					</p>
				</div>
				<div className="flex flex-wrap gap-3">
					<Button
						type="button"
						onClick={() => setIsPasswordModalOpen(true)}
					>
						Change Password
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={handleToggleTwoFactor}
					>
						{data.twoFactor.enabled ? "Disable 2FA" : "Enable 2FA"}
					</Button>
				</div>
			</header>

			{notice ? (
				<div
					className={cn(
						"rounded-lg border p-4 text-sm font-medium shadow-[0_18px_50px_rgba(87,99,99,0.08)]",
						notice.tone === "success"
							? "border-[#d7e5e3] bg-[#e6f3ec] text-[#2e8f5b]"
							: "border-[#fde8e8] bg-[#fff1f0] text-[#b1423a]",
					)}
				>
					{notice.message}
				</div>
			) : null}

			<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<SummaryCard
					hint={data.twoFactor.enabled ? data.twoFactor.method : "Not enabled"}
					label="2FA status"
					value={data.twoFactor.enabled ? "Enabled" : "Disabled"}
					tone={data.twoFactor.enabled ? "positive" : "warning"}
				/>
				<SummaryCard
					hint={`Last changed ${formatDate(data.password.lastChangedAt)}`}
					label="Password"
					value={data.password.strength}
					tone={data.password.strength === "Strong" ? "positive" : "warning"}
				/>
				<SummaryCard
					hint={`${summary.reviewDevices} need review`}
					label="Trusted devices"
					value={String(summary.trustedDevices)}
					tone={summary.reviewDevices > 0 ? "danger" : "neutral"}
				/>
				<SummaryCard
					hint={`${summary.enabledProtections}/${data.protections.length} protections on`}
					label="Security score"
					value={data.score}
					tone={data.score === "Strong" ? "positive" : "warning"}
				/>
			</section>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_370px]">
				<div className="space-y-6">
					<TwoFactorCard
						enabled={data.twoFactor.enabled}
						method={data.twoFactor.method}
						recoveryEmail={data.twoFactor.recoveryEmail}
						onBackupAction={handleRegenerateBackupCodes}
						onToggle={handleToggleTwoFactor}
						backupCodesGeneratedAt={data.twoFactor.backupCodesGeneratedAt}
					/>
					<PasswordCard
						cooldownHours={data.password.withdrawalCooldownHours}
						lastChangedAt={data.password.lastChangedAt}
						onChangePassword={() => setIsPasswordModalOpen(true)}
						strength={data.password.strength}
					/>
					<ProtectionCard
						onToggle={handleToggleProtection}
						protections={data.protections}
					/>
					<TrustedDevicesCard
						devices={data.devices}
						onRemove={handleRevokeDevice}
					/>
				</div>

				<div className="space-y-6">
					<ActivityCard activity={data.activity} />
					<RecommendationsCard recommendations={data.recommendations} />
				</div>
			</div>

			{isPasswordModalOpen ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
					<div className="w-full max-w-sm rounded-lg border border-[#d7e5e3] bg-white shadow-lg">
						<div className="border-b border-[#d7e5e3] p-5">
							<h2 className="text-lg font-semibold text-[#576363]">
								Change password
							</h2>
							<p className="mt-1 text-sm text-[#5d6163]">
								Enter your current password and a new password.
							</p>
						</div>
						<form onSubmit={handleChangePasswordSubmit} className="p-5 space-y-4">						{passwordModalNotice ? (
							<div
								className={cn(
									"rounded-lg border p-3 text-sm font-medium",
									passwordModalNotice.tone === "success"
										? "border-[#d7e5e3] bg-[#e6f3ec] text-[#2e8f5b]"
										: "border-[#fde8e8] bg-[#fff1f0] text-[#b1423a]",
								)}
							>
								{passwordModalNotice.message}
							</div>
						) : null}							<div>
								<label className="block text-sm font-medium text-[#576363]">
									Current password
								</label>
								<div className="relative mt-2">
									<input
										type={showCurrentPassword ? "text" : "password"}
										value={currentPassword}
										onChange={(e) => setCurrentPassword(e.target.value)}
										className="w-full rounded-md border border-[#cfdcda] bg-white px-4 py-2 text-sm text-[#576363] outline-none transition focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
										placeholder="Enter current password"
										disabled={isPending}
									/>
									<button
										type="button"
										onClick={() => setShowCurrentPassword(!showCurrentPassword)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5d6163] hover:text-[#3c7f80]"
										aria-label={
											showCurrentPassword ? "Hide password" : "Show password"
										}
									>
										{showCurrentPassword ? (
											<EyeOffIcon className="h-4 w-4" />
										) : (
											<EyeIcon className="h-4 w-4" />
										)}
									</button>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-[#576363]">
									New password
								</label>
								<div className="relative mt-2">
									<input
										type={showNewPassword ? "text" : "password"}
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										className="w-full rounded-md border border-[#cfdcda] bg-white px-4 py-2 text-sm text-[#576363] outline-none transition focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
										placeholder="Enter new password (min 8 characters)"
										disabled={isPending}
									/>
									<button
										type="button"
										onClick={() => setShowNewPassword(!showNewPassword)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5d6163] hover:text-[#3c7f80]"
										aria-label={
											showNewPassword ? "Hide password" : "Show password"
										}
									>
										{showNewPassword ? (
											<EyeOffIcon className="h-4 w-4" />
										) : (
											<EyeIcon className="h-4 w-4" />
										)}
									</button>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-[#576363]">
									Confirm new password
								</label>
								<div className="relative mt-2">
									<input
										type={showNewPassword ? "text" : "password"}
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										className="w-full rounded-md border border-[#cfdcda] bg-white px-4 py-2 text-sm text-[#576363] outline-none transition focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
										placeholder="Confirm new password"
										disabled={isPending}
									/>
									<button
										type="button"
										onClick={() => setShowNewPassword(!showNewPassword)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5d6163] hover:text-[#3c7f80]"
										aria-label={
											showNewPassword ? "Hide password" : "Show password"
										}
									>
										{showNewPassword ? (
											<EyeOffIcon className="h-4 w-4" />
										) : (
											<EyeIcon className="h-4 w-4" />
										)}
									</button>
								</div>
							</div>

							<div className="flex gap-3 border-t border-[#d7e5e3] pt-4">
								<Button
									type="button"
									variant="outline"
									onClick={() => {
										setIsPasswordModalOpen(false);
										setCurrentPassword("");
										setNewPassword("");
										setConfirmPassword("");
										setShowCurrentPassword(false);
										setShowNewPassword(false);
										setPasswordModalNotice(null);
									}}
									disabled={isPending}
									className="flex-1"
								>
									Cancel
								</Button>
								<Button
									type="submit"
									disabled={isPending || !currentPassword || !newPassword || !confirmPassword}
									className="flex-1"
								>
									{isPending ? "Updating…" : "Update password"}
								</Button>
							</div>
						</form>
					</div>
				</div>
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

function TwoFactorCard({
	backupCodesGeneratedAt,
	enabled,
	method,
	onBackupAction,
	onToggle,
	recoveryEmail,
}: {
	backupCodesGeneratedAt: string;
	enabled: boolean;
	method: string;
	onBackupAction: () => void;
	onToggle: () => void;
	recoveryEmail: string;
}) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex gap-3">
					<IconFrame tone={enabled ? "positive" : "warning"}>
						<KeyIcon className="h-5 w-5" />
					</IconFrame>
					<div>
						<h2 className="text-lg font-semibold text-[#576363]">
							Two-factor authentication
						</h2>
						<p className="mt-1 text-sm leading-6 text-[#5d6163]">
							Add an extra verification step before account changes and
							withdrawals.
						</p>
					</div>
				</div>
				<Button type="button" variant="outline" onClick={onToggle}>
					{enabled ? "Disable 2FA" : "Enable 2FA"}
				</Button>
			</div>

			<div className="mt-5 grid gap-3 sm:grid-cols-3">
				<InfoTile label="Status" value={enabled ? "Enabled" : "Disabled"} />
				<InfoTile label="Method" value={enabled ? method : "None"} />
				<InfoTile label="Recovery email" value={recoveryEmail} />
			</div>

			<div className="mt-5 flex flex-col gap-3 rounded-lg border border-[#eef1f1] bg-[#f7faf9] p-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="font-semibold text-[#576363]">Backup codes</p>
					<p className="mt-1 text-sm text-[#5d6163]">
						Last generated {formatDate(backupCodesGeneratedAt)}
					</p>
				</div>
				<Button type="button" variant="secondary" onClick={onBackupAction}>
					Regenerate Codes
				</Button>
			</div>
		</section>
	);
}

function PasswordCard({
	cooldownHours,
	lastChangedAt,
	onChangePassword,
	strength,
}: {
	cooldownHours: number;
	lastChangedAt: string;
	onChangePassword: () => void;
	strength: SecurityStrength;
}) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex gap-3">
					<IconFrame tone="positive">
						<LockIcon className="h-5 w-5" />
					</IconFrame>
					<div>
						<h2 className="text-lg font-semibold text-[#576363]">
							Password and login
						</h2>
						<p className="mt-1 text-sm leading-6 text-[#5d6163]">
							Keep account access separate from email, exchange, and wallet
							passwords.
						</p>
					</div>
				</div>
				<Button type="button" variant="outline" onClick={onChangePassword}>
					Change Password
				</Button>
			</div>

			<div className="mt-5 grid gap-3 sm:grid-cols-3">
				<InfoTile label="Strength" value={strength} />
				<InfoTile label="Last changed" value={formatDate(lastChangedAt)} />
				<InfoTile label="Withdrawal cooldown" value={`${cooldownHours} hours`} />
			</div>

			<p className="mt-4 rounded-lg bg-[#fff8ec] p-4 text-sm leading-6 text-[#8a5b14]">
				Changing your password starts a withdrawal cooldown. This protects your
				funds if account access changes unexpectedly.
			</p>
		</section>
	);
}

function ProtectionCard({
	onToggle,
	protections,
}: {
	onToggle: (id: string) => void;
	protections: SecurityProtection[];
}) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="border-b border-[#d7e5e3] p-5">
				<h2 className="text-lg font-semibold text-[#576363]">
					Withdrawal protection
				</h2>
				<p className="mt-1 text-sm leading-6 text-[#5d6163]">
					Control the checks used before money moves out of the account.
				</p>
			</div>
			<div className="divide-y divide-[#eef1f1]">
				{protections.map((protection) => (
					<div
						key={protection.id}
						className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto]"
					>
						<div>
							<div className="flex flex-wrap items-center gap-2">
								<p className="font-semibold text-[#576363]">
									{protection.label}
								</p>
								{protection.isLocked ? (
									<span className="rounded-full bg-[#eef1f1] px-2.5 py-1 text-xs font-semibold text-[#5d6163]">
										Required
									</span>
								) : null}
							</div>
							<p className="mt-1 text-sm leading-6 text-[#5d6163]">
								{protection.description}
							</p>
							<p className="mt-2 text-xs text-[#5d6163]">
								Channels: {protection.channels.join(", ")}
							</p>
						</div>
						<ToggleButton
							checked={protection.enabled}
							disabled={protection.isLocked}
							onClick={() => onToggle(protection.id)}
						/>
					</div>
				))}
			</div>
		</section>
	);
}

function TrustedDevicesCard({
	devices,
	onRemove,
}: {
	devices: TrustedDevice[];
	onRemove: (id: string) => void;
}) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="border-b border-[#d7e5e3] p-5">
				<h2 className="text-lg font-semibold text-[#576363]">
					Trusted devices
				</h2>
				<p className="mt-1 text-sm leading-6 text-[#5d6163]">
					Remove devices you no longer use or do not recognise.
				</p>
			</div>
			<div className="divide-y divide-[#eef1f1]">
				{devices.length === 0 ? (
					<div className="p-6 text-sm text-[#5d6163]">
						No trusted devices are currently listed.
					</div>
				) : (
					devices.map((device) => (
						<DeviceRow key={device.id} device={device} onRemove={onRemove} />
					))
				)}
			</div>
		</section>
	);
}

function DeviceRow({
	device,
	onRemove,
}: {
	device: TrustedDevice;
	onRemove: (id: string) => void;
}) {
	return (
		<div className="grid gap-4 p-5 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
			<div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#eef6f5] text-[#3c7f80]">
				<DeviceIcon className="h-5 w-5" />
			</div>
			<div className="min-w-0">
				<div className="flex flex-wrap items-center gap-2">
					<p className="font-semibold text-[#576363]">{device.device}</p>
					<span
						className={cn(
							"rounded-full px-2.5 py-1 text-xs font-semibold",
							deviceStatusClasses[device.status],
						)}
					>
						{device.status}
					</span>
				</div>
				<p className="mt-1 text-sm leading-6 text-[#5d6163]">
					{device.browser} - {device.location}
				</p>
				<p className="mt-1 text-xs text-[#5d6163]">
					Last active {formatDateTime(device.lastActiveAt)} - IP {device.ipAddress}
				</p>
			</div>
			<Button
				type="button"
				variant="outline"
				size="sm"
				className="self-start"
				onClick={() => onRemove(device.id)}
				disabled={device.status === "Current"}
			>
				Remove
			</Button>
		</div>
	);
}

function ActivityCard({ activity }: { activity: SecurityActivity[] }) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="border-b border-[#d7e5e3] p-5">
				<h2 className="text-lg font-semibold text-[#576363]">
					Recent activity
				</h2>
				<p className="mt-1 text-sm leading-6 text-[#5d6163]">
					Recent sign-ins and sensitive account changes.
				</p>
			</div>
			<div className="divide-y divide-[#eef1f1]">
				{activity.map((item) => (
					<div key={item.id} className="p-5">
						<div className="flex flex-wrap items-center justify-between gap-2">
							<p className="font-semibold text-[#576363]">{item.title}</p>
							<span
								className={cn(
									"rounded-full px-2.5 py-1 text-xs font-semibold",
									activityStatusClasses[item.status],
								)}
							>
								{item.status}
							</span>
						</div>
						<p className="mt-1 text-sm leading-6 text-[#5d6163]">
							{item.device} - {item.location}
						</p>
						<p className="mt-1 text-xs text-[#5d6163]">
							{formatDateTime(item.createdAt)}
						</p>
					</div>
				))}
			</div>
		</section>
	);
}

function RecommendationsCard({
	recommendations,
}: {
	recommendations: string[];
}) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="flex items-center gap-3">
				<IconFrame tone="positive">
					<ShieldIcon className="h-5 w-5" />
				</IconFrame>
				<h2 className="text-lg font-semibold text-[#576363]">
					Security recommendations
				</h2>
			</div>
			<ul className="mt-4 space-y-3">
				{recommendations.map((recommendation) => (
					<li
						key={recommendation}
						className="flex gap-3 text-sm leading-6 text-[#5d6163]"
					>
						<span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5F9EA0]" />
						<span>{recommendation}</span>
					</li>
				))}
			</ul>
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

function IconFrame({
	children,
	tone,
}: {
	children: React.ReactNode;
	tone: "positive" | "warning";
}) {
	return (
		<div
			className={cn(
				"flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
				tone === "positive"
					? "bg-[#e5f3f1] text-[#3c7f80]"
					: "bg-[#fff1e0] text-[#a66510]",
			)}
		>
			{children}
		</div>
	);
}

function ToggleButton({
	checked,
	disabled,
	onClick,
}: {
	checked: boolean;
	disabled?: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			aria-pressed={checked}
			disabled={disabled}
			onClick={onClick}
			className={cn(
				"relative h-7 w-12 rounded-full transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15 disabled:cursor-not-allowed disabled:opacity-70",
				checked ? "bg-[#5F9EA0]" : "bg-[#cfdcda]",
			)}
		>
			<span
				className={cn(
					"absolute top-1 h-5 w-5 rounded-full bg-white transition",
					checked ? "left-6" : "left-1",
				)}
			/>
		</button>
	);
}

function EyeIcon({ className }: { className?: string }) {
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
			<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
			<circle cx="12" cy="12" r="3" />
		</svg>
	);
}

function EyeOffIcon({ className }: { className?: string }) {
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
			<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
			<line x1="1" y1="1" x2="23" y2="23" />
		</svg>
	);
}
