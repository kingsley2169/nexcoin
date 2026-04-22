"use client";

import { useMemo, useState } from "react";
import {
	type AdminInvestmentPlan,
	type AdminInvestmentPlansData,
	type AdminPlanRisk,
	type AdminPlanStatus,
} from "@/lib/admin-investment-plans";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminInvestmentPlansProps = {
	data: AdminInvestmentPlansData;
};

type StatusFilter = AdminPlanStatus | "all";

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
	const [plans, setPlans] = useState(data.plans);
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [editingId, setEditingId] = useState<string | null>(null);

	const filteredPlans = useMemo(() => {
		if (statusFilter === "all") {
			return plans;
		}

		return plans.filter((plan) => plan.status === statusFilter);
	}, [plans, statusFilter]);

	const totals = useMemo(() => {
		return plans.reduce(
			(result, plan) => {
				result.activeInvestors += plan.activeInvestors;
				result.totalInvested += plan.totalInvestedUsd;
				result.profitCredited += plan.profitCreditedUsd;

				if (plan.status === "Active") {
					result.activePlans += 1;
				}

				return result;
			},
			{
				activeInvestors: 0,
				activePlans: 0,
				profitCredited: 0,
				totalInvested: 0,
			},
		);
	}, [plans]);

	const updatePlan = (id: string, patch: Partial<AdminInvestmentPlan>) => {
		setPlans((current) =>
			current.map((plan) =>
				plan.id === id
					? {
							...plan,
							...patch,
							updatedAt: new Date("2026-04-22T10:30:00Z").toISOString(),
						}
					: plan,
			),
		);
	};

	const toggleStatus = (plan: AdminInvestmentPlan) => {
		updatePlan(plan.id, {
			status: plan.status === "Active" ? "Paused" : "Active",
		});
	};

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
				<Button type="button" onClick={() => setEditingId("new-plan")}>
					Create Plan
				</Button>
			</header>

			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<SummaryCard
					hint={`${plans.length} total configured plans`}
					label="Active plans"
					value={String(totals.activePlans)}
				/>
				<SummaryCard
					hint={`${totals.activeInvestors} active investors`}
					label="Total invested"
					value={formatUsd(totals.totalInvested)}
				/>
				<SummaryCard
					hint="Credited across active plans today"
					label="Profit credited"
					value={formatUsd(totals.profitCredited)}
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
					{filteredPlans.map((plan) => (
						<PlanRow
							key={plan.id}
							editing={editingId === plan.id}
							onCancel={() => setEditingId(null)}
							onEdit={() => setEditingId(plan.id)}
							onToggleStatus={() => toggleStatus(plan)}
							onUpdate={updatePlan}
							plan={plan}
						/>
					))}
				</div>
			</section>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_370px]">
				<PlanExposure plans={plans} />
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

function PlanRow({
	editing,
	onCancel,
	onEdit,
	onToggleStatus,
	onUpdate,
	plan,
}: {
	editing: boolean;
	onCancel: () => void;
	onEdit: () => void;
	onToggleStatus: () => void;
	onUpdate: (id: string, patch: Partial<AdminInvestmentPlan>) => void;
	plan: AdminInvestmentPlan;
}) {
	const [draft, setDraft] = useState({
		durationHours: String(plan.durationHours),
		maxDepositUsd: plan.maxDepositUsd === null ? "" : String(plan.maxDepositUsd),
		minDepositUsd: String(plan.minDepositUsd),
		returnRatePercent: String(plan.returnRatePercent),
	});

	const save = () => {
		onUpdate(plan.id, {
			durationHours: Number.parseInt(draft.durationHours, 10) || plan.durationHours,
			maxDepositUsd:
				draft.maxDepositUsd.trim() === ""
					? null
					: Number.parseInt(draft.maxDepositUsd, 10) || plan.maxDepositUsd,
			minDepositUsd: Number.parseInt(draft.minDepositUsd, 10) || plan.minDepositUsd,
			returnRatePercent:
				Number.parseFloat(draft.returnRatePercent) || plan.returnRatePercent,
		});
		onCancel();
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
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2">
				{editing ? (
					<>
						<EditField
							label="Min deposit"
							onChange={(value) =>
								setDraft((current) => ({ ...current, minDepositUsd: value }))
							}
							value={draft.minDepositUsd}
						/>
						<EditField
							label="Max deposit"
							onChange={(value) =>
								setDraft((current) => ({ ...current, maxDepositUsd: value }))
							}
							placeholder="No max"
							value={draft.maxDepositUsd}
						/>
						<EditField
							label="Return %"
							onChange={(value) =>
								setDraft((current) => ({ ...current, returnRatePercent: value }))
							}
							value={draft.returnRatePercent}
						/>
						<EditField
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
						<Button type="button" size="sm" onClick={save}>
							Save
						</Button>
						<Button type="button" size="sm" variant="outline" onClick={onCancel}>
							Cancel
						</Button>
					</>
				) : (
					<>
						<Button type="button" size="sm" variant="outline" onClick={onEdit}>
							Edit
						</Button>
						<Button type="button" size="sm" variant="secondary" onClick={onToggleStatus}>
							{plan.status === "Active" ? "Pause" : "Activate"}
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

function EditField({
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
	const largest = plans.reduce((current, plan) =>
		plan.totalInvestedUsd > current.totalInvestedUsd ? plan : current,
	);

	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<h2 className="text-lg font-semibold text-[#576363]">Plan exposure</h2>
			<p className="mt-1 text-sm text-[#5d6163]">
				Total invested capital by plan.
			</p>
			<div className="mt-5 space-y-4">
				{plans.map((plan) => {
					const width = Math.max(
						(plan.totalInvestedUsd / largest.totalInvestedUsd) * 100,
						8,
					);

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
				})}
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
				{data.activity.map((item) => (
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
				))}
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
