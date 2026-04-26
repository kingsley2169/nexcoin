import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export type DashboardOverviewData = {
	accountDetails: Array<{
		label: string;
		value: string;
	}>;
	activePlans: Array<{
		amount: string;
		expectedReturn: string;
		maturityDate: string;
		name: string;
		progress: number;
		startDate: string;
		status: string;
	}>;
	metrics: Array<{
		label: string;
		value: string;
	}>;
	portfolioSnapshot: Array<{
		label: string;
		value: string;
	}>;
	recentActivity: Array<{
		amount: string;
		date: string;
		label: string;
		status: string;
		type: string;
	}>;
	user: {
		email: string;
		name: string;
	};
};

export function DashboardOverview({ data }: { data: DashboardOverviewData }) {
	return (
		<div className="space-y-8">
			<section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
				<div className="max-w-2xl">
					<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
						Overview
					</p>
					<h1 className="mt-3 text-3xl font-semibold text-[#576363] sm:text-4xl">
						Account Overview
					</h1>
					<p className="mt-3 text-sm leading-6 text-[#5d6163] sm:text-base">
						Welcome back, {data.user.name}. Track your portfolio, active
						plans, deposits, withdrawals, and earnings.
					</p>
				</div>
				<div className="flex flex-wrap gap-3">
					<Link
						href="/account/deposit"
						className={buttonVariants({ size: "md" })}
					>
						Deposit
					</Link>
					<Link
						href="/account/withdrawal"
						className={buttonVariants({ size: "md", variant: "outline" })}
					>
						Withdraw
					</Link>
					<Link
						href="/account/plans"
						className={buttonVariants({ size: "md", variant: "secondary" })}
					>
						Invest Now
					</Link>
				</div>
			</section>

			<section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
				{data.metrics.map((metric) => (
					<div
						key={metric.label}
						className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]"
					>
						<p className="text-sm text-[#5d6163]">{metric.label}</p>
						<p className="mt-2 text-2xl font-semibold text-[#576363]">
							{metric.value}
						</p>
					</div>
				))}
			</section>

			<section className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5F9EA0]">
							Account Details
						</p>
						<h2 className="mt-2 text-xl font-semibold text-[#576363]">
							Your profile at a glance
						</h2>
					</div>
				</div>
				<div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
					{data.accountDetails.map((detail) => (
						<div key={detail.label} className="rounded-md bg-[#f7faf9] p-4">
							<p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5F9EA0]">
								{detail.label}
							</p>
							<p className="mt-2 text-base font-semibold text-[#576363]">
								{detail.value}
							</p>
						</div>
					))}
				</div>
			</section>

			<section className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5F9EA0]">
							Quick Actions
						</p>
						<h2 className="mt-2 text-xl font-semibold text-[#576363]">
							Move faster from one place
						</h2>
					</div>
				</div>
				<div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
					<Link
						href="/account/deposit"
						className={buttonVariants({
							className: "w-full",
							size: "md",
						})}
					>
						Make a Deposit
					</Link>
					<Link
						href="/account/plans"
						className={buttonVariants({
							className: "w-full",
							size: "md",
							variant: "secondary",
						})}
					>
						Choose a Plan
					</Link>
					<Link
						href="/account/withdrawal"
						className={buttonVariants({
							className: "w-full",
							size: "md",
							variant: "outline",
						})}
					>
						Request Withdrawal
					</Link>
					<Link
						href="/account/verification"
						className={buttonVariants({
							className: "w-full",
							size: "md",
							variant: "outline",
						})}
					>
						Verify Account
					</Link>
					<Link
						href="/account/support"
						className={buttonVariants({
							className: "w-full",
							size: "md",
							variant: "outline",
						})}
					>
						Contact Support
					</Link>
				</div>
			</section>

			<section className="grid gap-5 rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)] lg:grid-cols-[0.9fr_1.1fr] lg:p-7">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5F9EA0]">
						Portfolio Snapshot
					</p>
					<h2 className="mt-3 text-2xl font-semibold text-[#576363]">
						Your investment position
					</h2>
					<p className="mt-3 text-sm leading-6 text-[#5d6163]">
						A quick view of available funds, current plan exposure, and the
						next expected payout window.
					</p>
				</div>
				<div className="grid gap-3 sm:grid-cols-2">
					{data.portfolioSnapshot.map((item) => (
						<div key={item.label} className="rounded-md bg-[#f7faf9] p-4">
							<p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5F9EA0]">
								{item.label}
							</p>
							<p className="mt-2 text-lg font-semibold text-[#576363]">
								{item.value}
							</p>
						</div>
					))}
				</div>
			</section>

			<div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
				<section className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
					<h2 className="text-xl font-semibold text-[#576363]">
						Active plans
					</h2>
					{data.activePlans.length > 0 ? (
						<div className="mt-6 space-y-5">
							{data.activePlans.map((plan) => (
								<div key={plan.name} className="rounded-md bg-[#f7faf9] p-4">
									<div className="flex items-start justify-between gap-4">
										<div>
											<p className="font-semibold text-[#576363]">
												{plan.name}
											</p>
											<p className="mt-1 text-sm text-[#5d6163]">
												{plan.amount} invested
											</p>
										</div>
										<span className="rounded-md bg-[#e5f3f1] px-2.5 py-1 text-xs font-semibold text-[#3c7f80]">
											{plan.status}
										</span>
									</div>
									<div className="mt-4 h-2 rounded-full bg-white">
										<div
											className="h-2 rounded-full bg-[#5F9EA0]"
											style={{ width: `${plan.progress}%` }}
										/>
									</div>
									<div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
										<div>
											<p className="text-xs uppercase tracking-[0.14em] text-[#5F9EA0]">
												Expected
											</p>
											<p className="mt-1 font-semibold text-[#576363]">
												{plan.expectedReturn}
											</p>
										</div>
										<div>
											<p className="text-xs uppercase tracking-[0.14em] text-[#5F9EA0]">
												Started
											</p>
											<p className="mt-1 font-semibold text-[#576363]">
												{plan.startDate}
											</p>
										</div>
										<div>
											<p className="text-xs uppercase tracking-[0.14em] text-[#5F9EA0]">
												Matures
											</p>
											<p className="mt-1 font-semibold text-[#576363]">
												{plan.maturityDate}
											</p>
										</div>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="mt-6 rounded-md bg-[#f7faf9] p-5">
							<p className="font-semibold text-[#576363]">
								No active plans yet.
							</p>
							<p className="mt-2 text-sm leading-6 text-[#5d6163]">
								Choose an investment plan when you are ready to start tracking
								active returns here.
							</p>
							<Link
								href="/account/plans"
								className={buttonVariants({
									className: "mt-4",
									size: "md",
									variant: "secondary",
								})}
							>
								View Plans
							</Link>
						</div>
					)}
				</section>

				<section className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
					<h2 className="text-xl font-semibold text-[#576363]">
						Recent activity
					</h2>
					<div className="mt-6 divide-y divide-[#e3ecea]">
						{data.recentActivity.map((activity) => (
							<div
								key={`${activity.label}-${activity.amount}`}
								className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
							>
								<div>
									<div className="flex flex-wrap items-center gap-2">
										<p className="font-medium text-[#576363]">
											{activity.label}
										</p>
										<span className="rounded-md bg-[#eef6f5] px-2 py-0.5 text-xs font-semibold text-[#3c7f80]">
											{activity.type}
										</span>
									</div>
									<p className="mt-1 text-sm text-[#5d6163]">
										{activity.status} · {activity.date}
									</p>
								</div>
								<p className="text-sm font-semibold text-[#576363]">
									{activity.amount}
								</p>
							</div>
						))}
					</div>
				</section>
			</div>
		</div>
	);
}
