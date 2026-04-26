import Link from "next/link";
import {
	type AdminActivityStatus,
	type AdminDashboardData,
	type AdminMetricTone,
	type AdminQueuePriority,
} from "@/lib/admin-dashboard";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminDashboardProps = {
	data: AdminDashboardData;
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
	day: "numeric",
	hour: "numeric",
	minute: "2-digit",
	month: "short",
});

const metricToneClasses: Record<AdminMetricTone, string> = {
	danger: "text-[#b1423a]",
	neutral: "text-[#5d6163]",
	positive: "text-[#2e8f5b]",
	warning: "text-[#a66510]",
};

const priorityClasses: Record<AdminQueuePriority, string> = {
	High: "bg-[#fff1e0] text-[#a66510]",
	Normal: "bg-[#eef6f5] text-[#3c7f80]",
	Urgent: "bg-[#fde8e8] text-[#b1423a]",
};

const activityStatusClasses: Record<AdminActivityStatus, string> = {
	Approved: "bg-[#e6f3ec] text-[#2e8f5b]",
	Completed: "bg-[#e6f3ec] text-[#2e8f5b]",
	Flagged: "bg-[#fde8e8] text-[#b1423a]",
	Pending: "bg-[#fff1e0] text-[#a66510]",
	Resolved: "bg-[#eef6f5] text-[#3c7f80]",
};

function formatDateTime(iso: string) {
	return dateTimeFormatter.format(new Date(iso));
}

function AlertIcon({ className }: { className?: string }) {
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
			<path d="M12 3 2 20h20zM12 9v5M12 17h.01" />
		</svg>
	);
}

function ChartIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			className={className}
			aria-hidden="true"
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeWidth="2"
		>
			<path d="M4 19V5M8 17v-6M12 17V7M16 17v-3M20 17V9" />
		</svg>
	);
}

export function AdminDashboard({ data }: AdminDashboardProps) {
	return (
		<div className="space-y-6">
			<header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
				<div>
					<h1 className="text-2xl font-semibold text-[#576363]">
						Admin Dashboard
					</h1>
					<p className="mt-1 max-w-3xl text-sm leading-6 text-[#5d6163]">
						Monitor users, deposits, withdrawals, KYC reviews, support, and
						platform activity from one operational view.
					</p>
				</div>
				<div className="flex flex-wrap gap-3">
					<Link
						href="/nexcoin-admin-priv/deposits-management"
						className={buttonVariants({ size: "md" })}
					>
						Review Deposits
					</Link>
					<Link
						href="/nexcoin-admin-priv/withdrawals-management"
						className={buttonVariants({ size: "md", variant: "outline" })}
					>
						Review Withdrawals
					</Link>
					<Link
						href="/nexcoin-admin-priv/kyc-review"
						className={buttonVariants({ size: "md", variant: "outline" })}
					>
						KYC Queue
					</Link>
				</div>
			</header>

			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
				{data.metrics.length > 0 ? (
					data.metrics.map((metric) => (
						<div
							key={metric.label}
							className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]"
						>
							<p className="text-sm text-[#5d6163]">{metric.label}</p>
							<p className="mt-2 text-2xl font-semibold text-[#576363]">
								{metric.value}
							</p>
							<p className={cn("mt-2 text-sm", metricToneClasses[metric.tone])}>
								{metric.hint}
							</p>
						</div>
					))
				) : (
					<EmptySection
						className="md:col-span-2 xl:col-span-3 2xl:col-span-6"
						message="Dashboard metrics will appear once admin reporting data is available."
						title="No summary metrics yet"
					/>
				)}
			</section>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
				<div className="space-y-6">
					<ReviewQueue data={data} />
					<FinancialSnapshots data={data} />
					<InvestmentOverview data={data} />
					<RecentActivity data={data} />
				</div>
				<div className="space-y-6">
					<RiskAlerts data={data} />
					<ShiftNotes data={data} />
				</div>
			</div>
		</div>
	);
}

function ReviewQueue({ data }: AdminDashboardProps) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="flex flex-col gap-3 border-b border-[#d7e5e3] p-5 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-lg font-semibold text-[#576363]">
						Review queue
					</h2>
					<p className="mt-1 text-sm leading-6 text-[#5d6163]">
						Highest-priority operational items waiting for staff action.
					</p>
				</div>
				<Link
					href="/nexcoin-admin-priv/support"
					className={buttonVariants({ size: "sm", variant: "outline" })}
				>
					Open Queue
				</Link>
			</div>
			<div className="divide-y divide-[#eef1f1]">
				{data.queue.length > 0 ? (
					data.queue.map((item) => (
						<div
							key={item.id}
							className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_auto]"
						>
							<div>
								<div className="flex flex-wrap items-center gap-2">
									<p className="font-semibold text-[#576363]">{item.title}</p>
									<span
										className={cn(
											"rounded-full px-2.5 py-1 text-xs font-semibold",
											priorityClasses[item.priority],
										)}
									>
										{item.priority}
									</span>
								</div>
								<p className="mt-1 text-sm leading-6 text-[#5d6163]">
									{item.user} - {item.reference} - {item.type}
									{item.amount ? ` - ${item.amount}` : ""}
								</p>
								<p className="mt-1 text-xs text-[#5d6163]">Waiting {item.age}</p>
							</div>
							<Link
								href={item.href}
								className={buttonVariants({ size: "sm", variant: "outline" })}
							>
								Review
							</Link>
						</div>
					))
				) : (
					<EmptySection
						message="The highest-priority review queue is currently clear."
						title="No items are waiting"
					/>
				)}
			</div>
		</section>
	);
}

function FinancialSnapshots({ data }: AdminDashboardProps) {
	return (
		<section className="grid gap-6 lg:grid-cols-2">
			{data.financialSnapshots.length > 0 ? (
				data.financialSnapshots.map((snapshot) => (
					<div
						key={snapshot.title}
						className="rounded-lg border border-[#d7e5e3] bg-white shadow-[0_18px_50px_rgba(87,99,99,0.08)]"
					>
						<div className="border-b border-[#d7e5e3] p-5">
							<p className="text-sm text-[#5d6163]">{snapshot.title}</p>
							<p className="mt-2 text-2xl font-semibold text-[#576363]">
								{snapshot.total}
							</p>
						</div>
						<div className="divide-y divide-[#eef1f1]">
							{snapshot.breakdown.length > 0 ? (
								snapshot.breakdown.map((item) => (
									<div
										key={item.label}
										className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 p-4"
									>
										<div>
											<p className="font-semibold text-[#576363]">{item.label}</p>
											<p className="mt-1 text-sm text-[#5d6163]">
												{item.count} requests
											</p>
										</div>
										<p className="font-semibold text-[#576363]">{item.value}</p>
									</div>
								))
							) : (
								<EmptySection
									message="This operational summary has no line items yet."
									title="No breakdown available"
								/>
							)}
						</div>
						<p className="border-t border-[#eef1f1] p-4 text-sm text-[#5d6163]">
							{snapshot.footer}
						</p>
					</div>
				))
			) : (
				<EmptySection
					className="lg:col-span-2"
					message="Deposit and withdrawal snapshot cards will appear here once reporting is available."
					title="No financial snapshots yet"
				/>
			)}
		</section>
	);
}

function InvestmentOverview({ data }: AdminDashboardProps) {
	const overview = data.investmentOverview;

	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e5f3f1] text-[#3c7f80]">
					<ChartIcon className="h-5 w-5" />
				</div>
				<div>
					<h2 className="text-lg font-semibold text-[#576363]">
						Investment overview
					</h2>
					<p className="mt-1 text-sm text-[#5d6163]">
						Active plan performance and maturity load.
					</p>
				</div>
			</div>
			<div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
				{[
					{ label: "Active plans", value: overview.activePlans },
					{ label: "Total invested", value: overview.totalInvested },
					{
						label: "Profit credited today",
						value: overview.profitCreditedToday,
					},
					{
						label: "Maturing today",
						value: String(overview.maturingToday),
					},
					{ label: "Most popular", value: overview.mostPopularPlan },
				].map((item) => (
					<InfoTile key={item.label} label={item.label} value={item.value} />
				))}
			</div>
		</section>
	);
}

function RecentActivity({ data }: AdminDashboardProps) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="border-b border-[#d7e5e3] p-5">
				<h2 className="text-lg font-semibold text-[#576363]">
					Recent platform activity
				</h2>
				<p className="mt-1 text-sm leading-6 text-[#5d6163]">
					Latest admin-relevant events across the platform.
				</p>
			</div>
			<div className="divide-y divide-[#eef1f1]">
				{data.activity.length > 0 ? (
					data.activity.map((item) => (
						<div
							key={item.id}
							className="grid gap-3 p-5 sm:grid-cols-[minmax(0,1fr)_auto]"
						>
							<div>
								<div className="flex flex-wrap items-center gap-2">
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
								<p className="mt-1 text-sm text-[#5d6163]">
									{item.user} - {item.reference}
								</p>
							</div>
							<p className="text-sm text-[#5d6163] sm:text-right">
								{formatDateTime(item.createdAt)}
							</p>
						</div>
					))
				) : (
					<EmptySection
						message="New admin-relevant activity will appear here as the platform starts moving."
						title="No recent activity"
					/>
				)}
			</div>
		</section>
	);
}

function RiskAlerts({ data }: AdminDashboardProps) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#fde8e8] text-[#b1423a]">
					<AlertIcon className="h-5 w-5" />
				</div>
				<div>
					<h2 className="text-lg font-semibold text-[#576363]">
						Risk alerts
					</h2>
					<p className="mt-1 text-sm text-[#5d6163]">
						Items that should not wait.
					</p>
				</div>
			</div>
			<div className="mt-5 space-y-4">
				{data.riskAlerts.length > 0 ? (
					data.riskAlerts.map((alert) => (
						<div key={alert.id} className="rounded-lg border border-[#eef1f1] p-4">
							<div className="flex flex-wrap items-center gap-2">
								<p className="font-semibold text-[#576363]">{alert.title}</p>
								<span
									className={cn(
										"rounded-full px-2.5 py-1 text-xs font-semibold",
										priorityClasses[alert.severity],
									)}
								>
									{alert.severity}
								</span>
							</div>
							<p className="mt-2 text-sm leading-6 text-[#5d6163]">
								{alert.description}
							</p>
							<Link
								href={alert.href}
								className="mt-3 inline-flex text-sm font-semibold text-[#3c7f80] hover:text-[#1f5556]"
							>
								Review alert
							</Link>
						</div>
					))
				) : (
					<EmptySection
						message="No urgent risk alerts are active right now."
						title="Risk queue is clear"
					/>
				)}
			</div>
		</section>
	);
}

function ShiftNotes({ data }: AdminDashboardProps) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<h2 className="text-lg font-semibold text-[#576363]">
				Shift summary
			</h2>
			<ul className="mt-4 space-y-3">
				{data.shiftNotes.length > 0 ? (
					data.shiftNotes.map((note) => (
						<li key={note} className="flex gap-3 text-sm leading-6 text-[#5d6163]">
							<span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5F9EA0]" />
							<span>{note}</span>
						</li>
					))
				) : (
					<li className="text-sm leading-6 text-[#5d6163]">
						No handoff notes have been added for this shift.
					</li>
				)}
			</ul>
		</section>
	);
}

function EmptySection({
	className,
	message,
	title,
}: {
	className?: string;
	message: string;
	title: string;
}) {
	return (
		<div
			className={cn(
				"rounded-lg border border-dashed border-[#d7e5e3] bg-[#f7faf9] p-5 text-sm shadow-[0_18px_50px_rgba(87,99,99,0.04)]",
				className,
			)}
		>
			<p className="font-semibold text-[#576363]">{title}</p>
			<p className="mt-2 leading-6 text-[#5d6163]">{message}</p>
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
