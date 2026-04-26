import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import type { InvestmentPlan, PublicInvestmentPlan } from "@/lib/investment-plans";
import { cn } from "@/lib/utils";

type InvestmentPlanCardProps = {
	plan: InvestmentPlan | PublicInvestmentPlan;
	variant?: "compact" | "detailed";
};

function isPublicPlan(plan: InvestmentPlan | PublicInvestmentPlan): plan is PublicInvestmentPlan {
	return 'id' in plan && 'minDepositUsd' in plan;
}

export function InvestmentPlanCard({
	plan,
	variant = "detailed",
}: InvestmentPlanCardProps) {
	const features =
		variant === "compact" ? plan.features.slice(0, 3) : plan.features;

	// Handle both legacy and new plan formats
	const planName = plan.name;
	const planTag = plan.tag;
	const planHighlight = plan.highlight;
	const planDescription = plan.description;

	let priceRange: string;
	let returnRate: string;
	let duration: string;

	if (isPublicPlan(plan)) {
		// New admin-configured plan format
		const minDeposit = plan.minDepositUsd;
		const maxDeposit = plan.maxDepositUsd;
		priceRange = maxDeposit
			? `$${minDeposit.toLocaleString()} - $${maxDeposit.toLocaleString()}`
			: `$${minDeposit.toLocaleString()}+`;
		returnRate = `${plan.returnRatePercent}%`;
		duration = `${plan.durationHours} hours`;
	} else {
		// Legacy static plan format
		priceRange = plan.price;
		returnRate = plan.returnRate;
		duration = plan.duration;
	}

	return (
		<article
			className={cn(
				"flex flex-col rounded-lg border bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]",
				planHighlight ? "border-[#5F9EA0]" : "border-[#d7e5e3]",
			)}
		>
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#5F9EA0]">
						{planName}
					</p>
					<p className="mt-2 text-xs font-semibold text-[#5d6163]">
						{planTag}
					</p>
				</div>
				{planHighlight ? (
					<span className="rounded-md bg-[#e5f3f1] px-2.5 py-1 text-xs font-semibold text-[#3c7f80]">
						Featured
					</span>
				) : null}
			</div>

			<p className="mt-6 text-3xl font-semibold text-[#576363]">
				{priceRange}
			</p>
			<p className="mt-2 text-sm text-[#5d6163]">Deposit range in USD</p>

			<div className="mt-6 grid grid-cols-2 gap-3">
				<div className="rounded-md bg-[#f7faf9] p-3">
					<p className="text-xs font-medium text-[#5d6163]">
						Projected return
					</p>
					<p className="mt-1 text-xl font-semibold text-[#576363]">
						{returnRate}
					</p>
				</div>
				<div className="rounded-md bg-[#f7faf9] p-3">
					<p className="text-xs font-medium text-[#5d6163]">Duration</p>
					<p className="mt-1 text-xl font-semibold text-[#576363]">
						{duration}
					</p>
				</div>
			</div>

			<p className="mt-6 text-sm leading-6 text-[#5d6163]">
				{planDescription}
			</p>

			<ul className="mt-6 space-y-3">
				{features.map((feature) => (
					<li key={feature} className="flex gap-3 text-sm leading-6 text-[#5d6163]">
						<span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5F9EA0]" />
						<span>{feature}</span>
					</li>
				))}
			</ul>

			<div className="mt-auto pt-8">
				<Link
					href="/auth/register"
					className={buttonVariants({
						className: "w-full",
						size: "lg",
						variant: planHighlight ? "primary" : "outline",
					})}
				>
					Select {planName}
				</Link>
			</div>
		</article>
	);
}
