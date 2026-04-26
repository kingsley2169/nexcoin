"use client";

import { useMemo, useState, useTransition } from "react";
import {
	archiveInvestmentPlan,
	createInvestmentPlan,
	setInvestmentPlanStatus,
	updateInvestmentPlan,
} from "@/app/nexcoin-admin-priv/investment-plans/actions";
import { Button } from "@/components/ui/button";
import {
	type AdminInvestmentPlan,
	type AdminInvestmentPlansData,
	type AdminPlanRisk,
	type AdminPlanStatus,
} from "@/lib/admin-investment-plans";
import { cn } from "@/lib/utils";

type AdminInvestmentPlansProps = {
	data: AdminInvestmentPlansData;
};

type StatusFilter = AdminPlanStatus | "all";

type Notice = {
	message: string;
	tone: "error" | "success";
};

const statusFilters: { label: string; value: StatusFilter }[] = [
	{ label: "All", value: "all" },
	{ label: "Active", value: "Active" },
	{ label: "Paused", value: "Paused" },
	{ label: "Draft", value: "Draft" },
];

const statusClasses: Record<AdminPlanStatus, string> = {
	Active: "bg-[#e6f3ec] text-[#2e8f5b]",
	Draft: "bg-[#eef1f1] text-[#5d6163]",
	Paused: "bg-[#fff1e0] text-[#a66510]",
};

const riskClasses: Record<AdminPlanRisk, string> = {
	Balanced: "bg-[#eef6f5] text-[#3c7f80]",
	Conservative: "bg-[#e6f3ec] text-[#2e8f5b]",
	High: "bg-[#fde8e8] text-[#b1423a]",
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
	currency: "USD",
	maximumFractionDigits: 0,
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

function PlanIcon({ className }: { className?: string }) {
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
			<path d="M5 5h14v14H5zM9 9h6M9 13h6M9 17h3" />
		</svg>
	);
}

export function AdminInvestmentPlans({ data }: AdminInvestmentPlansProps) {
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [creating, setCreating] = useState(false);
	const [notice, setNotice] = useState<Notice | null>(null);

	const filteredPlans = useMemo(() => {
		if (statusFilter === "all") {
			return data.plans;
		}

		return data.plans.filter((plan) => plan.status === statusFilter);
	}, [data.plans, statusFilter]);

	return (
		<div className="space-y-6">
			<header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
				<div>
					<h1 className="text-2xl font-semibold text-[#576363]">
						Investment Plan Management
					</h1>
					<p className="mt-1 max-w-3xl text-sm leading-6 text-[#5d6163]">
						Control plan availability, deposit ranges, projected returns, and
						active investor exposure.
					</p>
				</div>
				<Button
					type="button"
					onClick={() => {
						setCreating((current) => !current);
						setNotice(null);
					}}
				>
					{creating ? "Close" : "Create Plan"}
				</Button>
			</header>

			{notice ? (
				<div
					className={cn(
						"rounded-lg border px-4 py-3 text-sm",
						notice.tone === "error"
							? "border-red-200 bg-red-50 text-red-700"
							: "border-[#cfe7db] bg-[#eef9f1] text-[#2e8f5b]",
					)}
				>
					{notice.message}
				</div>
			) : null}

			{creating ? (
				<CreatePlanPanel
					onCreated={() => {
						setCreating(false);
						setNotice({
							message: "Plan created. The management view is refreshing now.",
							tone: "success",
						});
					}}
					onError={(message) => setNotice({ message, tone: "error" })}
				/>
			) : null}

			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<SummaryCard
					hint={`${data.summary.totalPlans} total configured plans`}
					label="Active plans"
					value={String(data.summary.activePlans)}
				/>
				<SummaryCard
					hint={`${data.summary.activeInvestors} active investors`}
					label="Total invested"
					value={formatUsd(data.summary.totalInvestedUsd)}
				/>
				<SummaryCard
					hint="Credited across active plans"
					label="Profit credited"
					value={formatUsd(data.summary.totalProfitCreditedUsd)}
					tone="positive"
				/>
				<SummaryCard
					hint="Plans ending today"
					label="Maturing today"
					value={String(data.summary.maturingToday)}
					tone="warning"
				/>
			</section>

			<section className="rounded-lg border border-[#d7e5e3] bg-white shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				<div className="border-b border-[#d7e5e3] p-5">
					<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
						<div>
							<h2 className="text-lg font-semibold text-[#576363]">
								Plan catalog
							</h2>
							<p className="mt-1 text-sm leading-6 text-[#5d6163]">
								{filteredPlans.length} plans match the current filter.
							</p>
						</div>
						<div className="flex flex-wrap gap-2">
							{statusFilters.map((filter) => (
								<button
									key={filter.value}
									type="button"
									onClick={() => setStatusFilter(filter.value)}
									className={cn(
										"rounded-full px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15",
										statusFilter === filter.value
											? "bg-[#5F9EA0] text-white"
											: "bg-[#f7faf9] text-[#576363] hover:bg-[#eef6f5] hover:text-[#5F9EA0]",
									)}
								>
									{filter.label}
								</button>
							))}
						</div>
					</div>
				</div>

				<div className="divide-y divide-[#eef1f1]">
					{filteredPlans.length === 0 ? (
						<div className="p-5 text-sm text-[#5d6163]">
							No plans match this filter yet.
						</div>
					) : (
						filteredPlans.map((plan) => (
							<PlanRow
								key={plan.id}
								editing={editingId === plan.id}
								onActionError={(message) =>
									setNotice({ message, tone: "error" })
								}
								onActionSuccess={(message) =>
									setNotice({ message, tone: "success" })
								}
								onCancel={() => setEditingId(null)}
								onEdit={() => {
									setEditingId(plan.id);
									setNotice(null);
								}}
								plan={plan}
							/>
						))
					)}
				</div>
			</section>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_370px]">
				<PlanExposure plans={data.plans} />
				<ActivityPanel data={data} />
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
	tone?: "neutral" | "positive" | "warning";
	value: string;
}) {
	return (
		<div className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<p className="text-sm text-[#5d6163]">{label}</p>
			<p className="mt-2 text-2xl font-semibold text-[#576363]">{value}</p>
			<p
				className={cn(
					"mt-2 text-sm",
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

function CreatePlanPanel({
	onCreated,
	onError,
}: {
	onCreated: () => void;
	onError: (message: string) => void;
}) {
	const [isPending, startTransition] = useTransition();
	const [draft, setDraft] = useState({
		description: "",
		durationHours: "24",
		maxDepositUsd: "",
		minDepositUsd: "100",
		name: "",
		returnRatePercent: "8",
		risk: "balanced" as "balanced" | "conservative" | "high",
		tag: "",
	});

	const submit = () => {
		startTransition(async () => {
			const result = await createInvestmentPlan({
				description: draft.description,
				durationHours: Number.parseInt(draft.durationHours, 10),
				maxDepositUsd:
					draft.maxDepositUsd.trim() === ""
						? null
						: Number.parseFloat(draft.maxDepositUsd),
				minDepositUsd: Number.parseFloat(draft.minDepositUsd),
				name: draft.name,
				returnRatePercent: Number.parseFloat(draft.returnRatePercent),
				risk: draft.risk,
				tag: draft.tag,
			});

			if (!result.ok) {
				onError(result.error);
				return;
			}

			onCreated();
		});
	};

	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="flex flex-col gap-1">
				<h2 className="text-lg font-semibold text-[#576363]">Create plan</h2>
				<p className="text-sm text-[#5d6163]">
					Add a new plan as a draft, then review and activate it when ready.
				</p>
			</div>
			<div className="mt-5 grid gap-4 md:grid-cols-2">
				<TextField
					label="Plan name"
					onChange={(value) => setDraft((current) => ({ ...current, name: value }))}
					value={draft.name}
				/>
				<TextField
					label="Tag"
					onChange={(value) => setDraft((current) => ({ ...current, tag: value }))}
					placeholder="Starter"
					value={draft.tag}
				/>
				<NumberField
					label="Min deposit"
					onChange={(value) =>
						setDraft((current) => ({ ...current, minDepositUsd: value }))
					}
					value={draft.minDepositUsd}
				/>
				<NumberField
					label="Max deposit"
					onChange={(value) =>
						setDraft((current) => ({ ...current, maxDepositUsd: value }))
					}
					placeholder="No max"
					value={draft.maxDepositUsd}
				/>
				<NumberField
					label="Return %"
					onChange={(value) =>
						setDraft((current) => ({ ...current, returnRatePercent: value }))
					}
					value={draft.returnRatePercent}
				/>
				<NumberField
					label="Hours"
					onChange={(value) =>
						setDraft((current) => ({ ...current, durationHours: value }))
					}
					value={draft.durationHours}
				/>
				<label className="text-sm text-[#5d6163]">
					<span className="font-semibold text-[#576363]">Risk</span>
					<select
						value={draft.risk}
						onChange={(event) =>
							setDraft((current) => ({
								...current,
								risk: event.target.value as "balanced" | "conservative" | "high",
							}))
						}
						className="mt-1 h-10 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm font-medium text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
					>
						<option value="balanced">Balanced</option>
						<option value="conservative">Conservative</option>
						<option value="high">High</option>
					</select>
				</label>
				<TextField
					label="Description"
					onChange={(value) =>
						setDraft((current) => ({ ...current, description: value }))
					}
					value={draft.description}
				/>
			</div>
			<div className="mt-5 flex flex-wrap gap-2">
				<Button type="button" onClick={submit} disabled={isPending}>
					{isPending ? "Creating..." : "Create Draft Plan"}
				</Button>
			</div>
		</section>
	);
}

function PlanRow({
	editing,
	onActionError,
	onActionSuccess,
	onCancel,
	onEdit,
	plan,
}: {
	editing: boolean;
	onActionError: (message: string) => void;
	onActionSuccess: (message: string) => void;
	onCancel: () => void;
	onEdit: () => void;
	plan: AdminInvestmentPlan;
}) {
	const [isPending, startTransition] = useTransition();
	const [draft, setDraft] = useState({
		durationHours: String(plan.durationHours),
		maxDepositUsd: plan.maxDepositUsd === null ? "" : String(plan.maxDepositUsd),
		minDepositUsd: String(plan.minDepositUsd),
		returnRatePercent: String(plan.returnRatePercent),
	});

	const save = () => {
		startTransition(async () => {
			const result = await updateInvestmentPlan({
				durationHours: Number.parseInt(draft.durationHours, 10),
				id: plan.id,
				maxDepositUsd:
					draft.maxDepositUsd.trim() === ""
						? null
						: Number.parseFloat(draft.maxDepositUsd),
				minDepositUsd: Number.parseFloat(draft.minDepositUsd),
				returnRatePercent: Number.parseFloat(draft.returnRatePercent),
			});

			if (!result.ok) {
				onActionError(result.error);
				return;
			}

			onCancel();
			onActionSuccess(`${plan.name} was updated.`);
		});
	};

	const toggleStatus = () => {
		const nextStatus =
			plan.status === "Active"
				? "paused"
				: plan.status === "Draft"
					? "active"
					: "active";

		startTransition(async () => {
			const result = await setInvestmentPlanStatus({
				id: plan.id,
				status: nextStatus,
			});

			if (!result.ok) {
				onActionError(result.error);
				return;
			}

			onActionSuccess(
				nextStatus === "active"
					? `${plan.name} is now active.`
					: `${plan.name} was paused.`,
			);
		});
	};

	const archive = () => {
		startTransition(async () => {
			const result = await archiveInvestmentPlan(plan.id);

			if (!result.ok) {
				onActionError(result.error);
				return;
			}

			onActionSuccess(`${plan.name} was archived.`);
		});
	};

	return (
		<div className="grid gap-5 p-5 xl:grid-cols-[minmax(280px,1fr)_minmax(260px,0.9fr)_auto]">
			<div className="min-w-0">
				<div className="flex flex-wrap items-center gap-2">
					<div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e5f3f1] text-[#3c7f80]">
						<PlanIcon className="h-5 w-5" />
					</div>
					<div>
						<p className="font-semibold text-[#576363]">{plan.name}</p>
						<p className="text-sm text-[#5d6163]">{plan.description}</p>
					</div>
				</div>
				<div className="mt-3 flex flex-wrap gap-2">
					<span
						className={cn(
							"rounded-full px-2.5 py-1 text-xs font-semibold",
							statusClasses[plan.status],
						)}
					>
						{plan.status}
					</span>
					<span
						className={cn(
							"rounded-full px-2.5 py-1 text-xs font-semibold",
							riskClasses[plan.risk],
						)}
					>
						{plan.risk} risk
					</span>
					{plan.tag ? (
						<span className="rounded-full bg-[#eef6f5] px-2.5 py-1 text-xs font-semibold text-[#3c7f80]">
							{plan.tag}
						</span>
					) : null}
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2">
				{editing ? (
					<>
						<NumberField
							label="Min deposit"
							onChange={(value) =>
								setDraft((current) => ({ ...current, minDepositUsd: value }))
							}
							value={draft.minDepositUsd}
						/>
						<NumberField
							label="Max deposit"
							onChange={(value) =>
								setDraft((current) => ({ ...current, maxDepositUsd: value }))
							}
							placeholder="No max"
							value={draft.maxDepositUsd}
						/>
						<NumberField
							label="Return %"
							onChange={(value) =>
								setDraft((current) => ({ ...current, returnRatePercent: value }))
							}
							value={draft.returnRatePercent}
						/>
						<NumberField
							label="Hours"
							onChange={(value) =>
								setDraft((current) => ({ ...current, durationHours: value }))
							}
							value={draft.durationHours}
						/>
					</>
				) : (
					<>
						<InfoTile
							label="Deposit range"
							value={`${formatUsd(plan.minDepositUsd)} - ${
								plan.maxDepositUsd === null ? "No max" : formatUsd(plan.maxDepositUsd)
							}`}
						/>
						<InfoTile label="Return" value={`${plan.returnRatePercent}%`} />
						<InfoTile label="Duration" value={`${plan.durationHours} hours`} />
						<InfoTile label="Investors" value={String(plan.activeInvestors)} />
					</>
				)}
			</div>

			<div className="flex flex-wrap items-start gap-2 xl:justify-end">
				{editing ? (
					<>
						<Button type="button" size="sm" onClick={save} disabled={isPending}>
							{isPending ? "Saving..." : "Save"}
						</Button>
						<Button
							type="button"
							size="sm"
							variant="outline"
							onClick={onCancel}
							disabled={isPending}
						>
							Cancel
						</Button>
					</>
				) : (
					<>
						<Button
							type="button"
							size="sm"
							variant="outline"
							onClick={onEdit}
							disabled={isPending}
						>
							Edit
						</Button>
						<Button
							type="button"
							size="sm"
							variant="secondary"
							onClick={toggleStatus}
							disabled={isPending}
						>
							{plan.status === "Active" ? "Pause" : "Activate"}
						</Button>
						<Button
							type="button"
							size="sm"
							variant="outline"
							onClick={archive}
							disabled={isPending}
						>
							Archive
						</Button>
					</>
				)}
				<p className="basis-full text-xs text-[#5d6163] xl:text-right">
					Updated {formatDateTime(plan.updatedAt)}
				</p>
			</div>
		</div>
	);
}

function TextField({
	label,
	onChange,
	placeholder,
	value,
}: {
	label: string;
	onChange: (value: string) => void;
	placeholder?: string;
	value: string;
}) {
	return (
		<label className="text-sm text-[#5d6163]">
			<span className="font-semibold text-[#576363]">{label}</span>
			<input
				type="text"
				value={value}
				placeholder={placeholder}
				onChange={(event) => onChange(event.target.value)}
				className="mt-1 h-10 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm font-medium text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
			/>
		</label>
	);
}

function NumberField({
	label,
	onChange,
	placeholder,
	value,
}: {
	label: string;
	onChange: (value: string) => void;
	placeholder?: string;
	value: string;
}) {
	return (
		<label className="text-sm text-[#5d6163]">
			<span className="font-semibold text-[#576363]">{label}</span>
			<input
				type="number"
				value={value}
				placeholder={placeholder}
				onChange={(event) => onChange(event.target.value)}
				className="mt-1 h-10 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm font-medium text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
			/>
		</label>
	);
}

function PlanExposure({ plans }: { plans: AdminInvestmentPlan[] }) {
	const largest = plans.reduce<AdminInvestmentPlan | null>((current, plan) => {
		if (!current || plan.totalInvestedUsd > current.totalInvestedUsd) {
			return plan;
		}

		return current;
	}, null);

	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<h2 className="text-lg font-semibold text-[#576363]">Plan exposure</h2>
			<p className="mt-1 text-sm text-[#5d6163]">
				Total invested capital by plan.
			</p>
			<div className="mt-5 space-y-4">
				{plans.length === 0 ? (
					<p className="text-sm text-[#5d6163]">No plans available yet.</p>
				) : (
					plans.map((plan) => {
						const width = largest?.totalInvestedUsd
							? Math.max((plan.totalInvestedUsd / largest.totalInvestedUsd) * 100, 8)
							: 8;

						return (
							<div key={plan.id}>
								<div className="flex items-center justify-between gap-4 text-sm">
									<span className="font-semibold text-[#576363]">{plan.name}</span>
									<span className="text-[#5d6163]">
										{formatUsd(plan.totalInvestedUsd)}
									</span>
								</div>
								<div className="mt-2 h-2 rounded-full bg-[#eef1f1]">
									<div
										className="h-2 rounded-full bg-[#5F9EA0]"
										style={{ width: `${width}%` }}
									/>
								</div>
							</div>
						);
					})
				)}
			</div>
		</section>
	);
}

function ActivityPanel({ data }: AdminInvestmentPlansProps) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="border-b border-[#d7e5e3] p-5">
				<h2 className="text-lg font-semibold text-[#576363]">Plan activity</h2>
				<p className="mt-1 text-sm text-[#5d6163]">
					Recent plan changes and staff actions.
				</p>
			</div>
			<div className="divide-y divide-[#eef1f1]">
				{data.activity.length === 0 ? (
					<div className="p-5 text-sm text-[#5d6163]">
						No plan activity has been recorded yet.
					</div>
				) : (
					data.activity.map((item) => (
						<div key={item.id} className="p-5">
							<div className="flex flex-wrap items-center gap-2">
								<p className="font-semibold text-[#576363]">{item.title}</p>
								<span
									className={cn(
										"rounded-full px-2.5 py-1 text-xs font-semibold",
										statusClasses[item.status],
									)}
								>
									{item.status}
								</span>
							</div>
							<p className="mt-1 text-sm text-[#5d6163]">{item.planName}</p>
							<p className="mt-1 text-xs text-[#5d6163]">
								{formatDateTime(item.createdAt)}
							</p>
						</div>
					))
				)}
			</div>
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
