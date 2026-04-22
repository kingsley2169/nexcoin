"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
	type PortfolioAllocationSegment,
	type PortfolioData,
	type PortfolioHolding,
	type PortfolioPosition,
	type PortfolioProfitEntry,
	type PortfolioRange,
	type PortfolioSummary,
} from "@/lib/portfolio";
import { formatMarketChange } from "@/lib/market-data";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AccountPortfolioProps = {
	data: PortfolioData;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
	currency: "USD",
	maximumFractionDigits: 2,
	style: "currency",
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
	currency: "USD",
	maximumFractionDigits: 0,
	style: "currency",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
	day: "numeric",
	month: "short",
	year: "numeric",
});

const ranges: PortfolioRange[] = ["30D", "90D", "1Y"];

const positionStatusClasses: Record<PortfolioPosition["status"], string> = {
	Active: "bg-[#e5f3f1] text-[#3c7f80]",
	Maturing: "bg-[#fff1e0] text-[#a66510]",
	"Near completion": "bg-[#eef6f5] text-[#3c7f80]",
	Pending: "bg-[#eef1f1] text-[#5d6163]",
};

const profitStatusClasses: Record<PortfolioProfitEntry["status"], string> = {
	Accruing: "bg-[#eef6f5] text-[#3c7f80]",
	Credited: "bg-[#e6f3ec] text-[#2e8f5b]",
	Pending: "bg-[#fff1e0] text-[#a66510]",
};

function formatCurrency(value: number) {
	return currencyFormatter.format(value);
}

function formatCompactCurrency(value: number) {
	return compactCurrencyFormatter.format(value);
}

function formatDate(iso: string) {
	return dateFormatter.format(new Date(iso));
}

function formatSignedPercent(value: number) {
	return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function buildChartPaths(series: number[]) {
	if (series.length === 0) {
		return { areaPath: "", linePath: "", maxValue: 0, minValue: 0 };
	}

	const minValue = Math.min(...series);
	const maxValue = Math.max(...series);
	const range = Math.max(maxValue - minValue, 1);
	const stepX = 600 / Math.max(series.length - 1, 1);

	const points = series.map((value, index) => {
		const x = index * stepX;
		const y = 190 - ((value - minValue) / range) * 170;

		return { x, y };
	});

	const linePath = points
		.map(
			(point, index) =>
				`${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`,
		)
		.join(" ");
	const last = points[points.length - 1];
	const first = points[0];
	const areaPath = `${linePath} L${last.x.toFixed(2)},200 L${first.x.toFixed(2)},200 Z`;

	return { areaPath, linePath, maxValue, minValue };
}

export function AccountPortfolio({ data }: AccountPortfolioProps) {
	const [range, setRange] = useState<PortfolioRange>("30D");
	const series = data.performance[range];

	const chart = useMemo(() => buildChartPaths(series), [series]);

	const rangeChangePercent = useMemo(() => {
		if (series.length < 2) {
			return 0;
		}

		const start = series[0];
		const end = series[series.length - 1];

		return ((end - start) / start) * 100;
	}, [series]);

	const totalAllocation = useMemo(
		() => data.allocation.reduce((sum, segment) => sum + segment.amount, 0),
		[data.allocation],
	);

	return (
		<div className="space-y-8">
			<HeaderSection />
			<SummaryStrip summary={data.summary} />
			<PerformanceChart
				areaPath={chart.areaPath}
				linePath={chart.linePath}
				onRangeChange={setRange}
				range={range}
				rangeChangePercent={rangeChangePercent}
				totalValue={data.summary.totalValue}
			/>
			<AllocationCard segments={data.allocation} total={totalAllocation} />
			<PositionsCard positions={data.positions} />
			<HoldingsCard holdings={data.holdings} />
			<ProfitHistoryCard entries={data.profitHistory} />
		</div>
	);
}

function HeaderSection() {
	return (
		<section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
			<div className="max-w-2xl">
				<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
					Portfolio
				</p>
				<h1 className="mt-3 text-3xl font-semibold text-[#576363] sm:text-4xl">
					How your investments are performing
				</h1>
				<p className="mt-3 text-sm leading-6 text-[#5d6163] sm:text-base">
					Track portfolio value, plan positions, crypto holdings, and profit
					credits in one focused view.
				</p>
			</div>
			<div className="flex flex-wrap gap-3">
				<Link
					href="/account/plans"
					className={buttonVariants({ size: "md" })}
				>
					Start Investment
				</Link>
				<Link
					href="/account/deposit"
					className={buttonVariants({ size: "md", variant: "outline" })}
				>
					Deposit Funds
				</Link>
			</div>
		</section>
	);
}

function SummaryStrip({ summary }: { summary: PortfolioSummary }) {
	return (
		<section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
			<SummaryCard
				label="Total portfolio value"
				value={formatCurrency(summary.totalValue)}
				hint="Invested capital plus accrued profit."
			/>
			<SummaryCard
				label="Total invested"
				value={formatCurrency(summary.totalInvested)}
				hint="Capital currently committed across active plans."
			/>
			<SummaryCard
				label="Total profit"
				value={formatCurrency(summary.totalProfit)}
				hint={`${formatSignedPercent(summary.profitChangePercent)} lifetime return`}
				hintTone={summary.profitChangePercent >= 0 ? "positive" : "negative"}
			/>
			<SummaryCard
				label="Best-performing plan"
				value={summary.bestPlan.name}
				hint={`${formatSignedPercent(summary.bestPlan.returnPercent)} over current cycle`}
				hintTone="positive"
			/>
		</section>
	);
}

function SummaryCard({
	hint,
	hintTone = "neutral",
	label,
	value,
}: {
	hint: string;
	hintTone?: "negative" | "neutral" | "positive";
	label: string;
	value: string;
}) {
	return (
		<div className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<p className="text-sm text-[#5d6163]">{label}</p>
			<p className="mt-2 text-2xl font-semibold text-[#576363]">{value}</p>
			<p
				className={cn(
					"mt-2 text-xs font-medium leading-5",
					hintTone === "positive"
						? "text-[#2e8f5b]"
						: hintTone === "negative"
							? "text-[#b1423a]"
							: "text-[#5d6163]",
				)}
			>
				{hint}
			</p>
		</div>
	);
}

function PerformanceChart({
	areaPath,
	linePath,
	onRangeChange,
	range,
	rangeChangePercent,
	totalValue,
}: {
	areaPath: string;
	linePath: string;
	onRangeChange: (value: PortfolioRange) => void;
	range: PortfolioRange;
	rangeChangePercent: number;
	totalValue: number;
}) {
	const isPositive = rangeChangePercent >= 0;

	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5F9EA0]">
						Performance
					</p>
					<p className="mt-2 text-3xl font-semibold text-[#576363]">
						{formatCurrency(totalValue)}
					</p>
					<p
						className={cn(
							"mt-1 text-sm font-medium",
							isPositive ? "text-[#2e8f5b]" : "text-[#b1423a]",
						)}
					>
						{formatSignedPercent(rangeChangePercent)} over last {range}
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					{ranges.map((option) => {
						const isActive = range === option;

						return (
							<button
								key={option}
								type="button"
								onClick={() => onRangeChange(option)}
								className={cn(
									"rounded-full px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15",
									isActive
										? "bg-[#5F9EA0] text-white"
										: "bg-[#f7faf9] text-[#576363] hover:bg-[#eef6f5] hover:text-[#5F9EA0]",
								)}
							>
								{option}
							</button>
						);
					})}
				</div>
			</div>

			<div className="mt-6 h-48 w-full overflow-hidden rounded-md bg-[#f7faf9]">
				<svg
					viewBox="0 0 600 200"
					preserveAspectRatio="none"
					className="h-full w-full"
					aria-hidden="true"
				>
					<defs>
						<linearGradient
							id="portfolio-chart-gradient"
							x1="0"
							x2="0"
							y1="0"
							y2="1"
						>
							<stop offset="0%" stopColor="#5F9EA0" stopOpacity="0.4" />
							<stop offset="100%" stopColor="#5F9EA0" stopOpacity="0" />
						</linearGradient>
					</defs>
					<path d={areaPath} fill="url(#portfolio-chart-gradient)" />
					<path
						d={linePath}
						fill="none"
						stroke="#5F9EA0"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2.5"
						vectorEffect="non-scaling-stroke"
					/>
				</svg>
			</div>
		</section>
	);
}

function AllocationCard({
	segments,
	total,
}: {
	segments: PortfolioAllocationSegment[];
	total: number;
}) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div>
				<p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5F9EA0]">
					Allocation
				</p>
				<h2 className="mt-2 text-xl font-semibold text-[#576363]">
					Invested capital by plan tier
				</h2>
				<p className="mt-1 text-sm text-[#5d6163]">
					Total invested: {formatCurrency(total)}
				</p>
			</div>

			<div className="mt-5 flex h-4 w-full overflow-hidden rounded-full bg-[#f7faf9]">
				{segments.map((segment) => {
					const percent = total > 0 ? (segment.amount / total) * 100 : 0;

					return (
						<span
							key={segment.name}
							style={{ background: segment.color, width: `${percent}%` }}
							aria-label={`${segment.name}: ${percent.toFixed(1)}%`}
						/>
					);
				})}
			</div>

			<ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{segments.map((segment) => {
					const percent = total > 0 ? (segment.amount / total) * 100 : 0;

					return (
						<li
							key={segment.name}
							className="flex items-center gap-3 rounded-md bg-[#f7faf9] p-3"
						>
							<span
								className="h-3 w-3 shrink-0 rounded-full"
								style={{ background: segment.color }}
								aria-hidden="true"
							/>
							<div className="min-w-0 flex-1">
								<p className="text-sm font-semibold text-[#576363]">
									{segment.name}
								</p>
								<p className="text-xs text-[#5d6163]">
									{formatCompactCurrency(segment.amount)} · {percent.toFixed(1)}%
								</p>
							</div>
						</li>
					);
				})}
			</ul>
		</section>
	);
}

function PositionsCard({ positions }: { positions: PortfolioPosition[] }) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5F9EA0]">
						Positions
					</p>
					<h2 className="mt-2 text-xl font-semibold text-[#576363]">
						Active investment plans
					</h2>
				</div>
				<Link
					href="/account/plans"
					className={buttonVariants({ size: "sm", variant: "outline" })}
				>
					Start new investment
				</Link>
			</div>

			<ul className="mt-5 space-y-3">
				{positions.map((position) => (
					<li
						key={position.id}
						className="rounded-md border border-[#eef1f0] bg-white p-4"
					>
						<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
							<div>
								<p className="text-sm font-semibold text-[#576363] sm:text-base">
									{position.planName}
								</p>
								<p className="mt-1 text-xs text-[#5d6163]">
									{formatCurrency(position.amount)} invested · Started{" "}
									{formatDate(position.startDate)}
								</p>
							</div>
							<span
								className={cn(
									"shrink-0 self-start rounded-md px-2 py-0.5 text-xs font-semibold",
									positionStatusClasses[position.status],
								)}
							>
								{position.status}
							</span>
						</div>

						<div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
							<Stat label="Matures" value={formatDate(position.maturityDate)} />
							<Stat
								label="Projected return"
								value={`+${formatCurrency(position.projectedReturn)}`}
								tone="positive"
							/>
							<Stat
								label="Progress"
								value={`${position.progress}%`}
							/>
						</div>

						<div className="mt-3 h-2 rounded-full bg-[#f7faf9]">
							<div
								className="h-2 rounded-full bg-[#5F9EA0]"
								style={{ width: `${position.progress}%` }}
							/>
						</div>
					</li>
				))}
			</ul>
		</section>
	);
}

function Stat({
	label,
	tone = "neutral",
	value,
}: {
	label: string;
	tone?: "neutral" | "positive";
	value: string;
}) {
	return (
		<div>
			<p className="text-[11px] uppercase tracking-[0.14em] text-[#5F9EA0]">
				{label}
			</p>
			<p
				className={cn(
					"mt-1 font-semibold",
					tone === "positive" ? "text-[#2e8f5b]" : "text-[#576363]",
				)}
			>
				{value}
			</p>
		</div>
	);
}

function HoldingsCard({ holdings }: { holdings: PortfolioHolding[] }) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5F9EA0]">
						Holdings
					</p>
					<h2 className="mt-2 text-xl font-semibold text-[#576363]">
						Top assets backing the portfolio
					</h2>
					<p className="mt-1 text-sm text-[#5d6163]">
						Snapshot view — manage deposit addresses from the Wallets page.
					</p>
				</div>
				<Link
					href="/account/wallets"
					className={buttonVariants({ size: "sm", variant: "outline" })}
				>
					View wallets
				</Link>
			</div>

			<ul className="mt-5 divide-y divide-[#eef1f0]">
				{holdings.map((holding) => {
					const isPositive = holding.change24h >= 0;

					return (
						<li
							key={holding.symbol}
							className="flex items-center justify-between gap-4 py-3"
						>
							<div className="flex min-w-0 items-center gap-3">
								<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef6f5] text-sm font-semibold text-[#3c7f80]">
									{holding.symbol}
								</span>
								<div className="min-w-0">
									<p className="text-sm font-semibold text-[#576363]">
										{holding.name}
									</p>
									<p className="text-xs text-[#5d6163]">
										{holding.amount} {holding.symbol}
									</p>
								</div>
							</div>
							<div className="text-right">
								<p className="text-sm font-semibold text-[#576363]">
									{formatCurrency(holding.valueUsd)}
								</p>
								<p
									className={cn(
										"text-xs font-medium",
										isPositive ? "text-[#2e8f5b]" : "text-[#b1423a]",
									)}
								>
									{formatMarketChange(holding.change24h)} 24h
								</p>
							</div>
						</li>
					);
				})}
			</ul>
		</section>
	);
}

function ProfitHistoryCard({ entries }: { entries: PortfolioProfitEntry[] }) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5F9EA0]">
						Profit history
					</p>
					<h2 className="mt-2 text-xl font-semibold text-[#576363]">
						Recent profit credits
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
				{entries.map((entry) => (
					<li
						key={entry.id}
						className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
					>
						<div>
							<p className="text-sm font-semibold text-[#576363]">
								{entry.planName}
							</p>
							<p className="text-xs text-[#5d6163]">
								{formatDate(entry.date)}
							</p>
						</div>
						<div className="flex items-center gap-3">
							<span
								className={cn(
									"rounded-md px-2 py-0.5 text-xs font-semibold",
									profitStatusClasses[entry.status],
								)}
							>
								{entry.status}
							</span>
							<span className="text-sm font-semibold text-[#2e8f5b]">
								+{formatCurrency(entry.amount)}
							</span>
						</div>
					</li>
				))}
			</ul>
		</section>
	);
}
