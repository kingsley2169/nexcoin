export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import Link from "next/link";
import { InvestmentPlanCard } from "@/components/investment-plan-card";
import { buttonVariants } from "@/components/ui/button";
import { getPublicInvestmentPlans, investmentPlans } from "@/lib/investment-plans";

export const metadata: Metadata = {
	title: "Investment Plans | Nexcoin",
	description:
		"Compare Nexcoin investment plans by USD deposit range, projected return, duration, and reinvestment rules.",
};

const planGuides = [
	{
		description:
			"New users can begin with a lower deposit range before choosing larger packages.",
		title: "Start with the right range",
	},
	{
		description:
			"Each plan has a duration and reinvestment structure. Review the rules before selecting a package.",
		title: "Understand the plan cycle",
	},
	{
		description:
			"Withdrawals follow platform rules, payment-mode alignment, and account verification requirements.",
		title: "Prepare for withdrawal rules",
	},
];

const depositMethods = [
	"Bitcoin",
	"Ethereum",
	"USDT",
];

export default async function PlansPage() {
	const publicPlans = await getPublicInvestmentPlans();
	const plansToDisplay = publicPlans.length > 0 ? publicPlans : investmentPlans;

	return (
		<>
			<section className="bg-white">
				<div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:items-center lg:px-8 lg:py-20">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
							Investment plans
						</p>
						<h1 className="mt-5 max-w-4xl text-4xl font-semibold text-[#576363] sm:text-5xl lg:text-6xl">
							Compare Nexcoin plans before you invest.
						</h1>
						<p className="mt-6 max-w-2xl text-base leading-8 text-[#5d6163] sm:text-lg">
							Choose a package based on your USD deposit range, projected
							return, duration, and reinvestment rules. Every plan is designed
							to keep the investment path clear before funds are committed.
						</p>
						<div className="mt-8 flex flex-col gap-3 sm:flex-row">
							<Link
								href="/auth/register"
								className={buttonVariants({
									className: "w-full sm:w-auto",
									size: "lg",
								})}
							>
								Create Account
							</Link>
							<Link
								href="/terms"
								className={buttonVariants({
									className: "w-full sm:w-auto",
									size: "lg",
									variant: "outline",
								})}
							>
								Read Terms
							</Link>
						</div>
					</div>

					<div className="rounded-lg border border-[#d7e5e3] bg-[#f7faf9] p-6 shadow-[0_24px_80px_rgba(87,99,99,0.12)] sm:p-8">
						<p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#5F9EA0]">
							Plan overview
						</p>
						<div className="mt-6 grid gap-4">
							<div className="rounded-md bg-white p-5">
								<p className="text-3xl font-semibold text-[#576363]">4</p>
								<p className="mt-2 text-sm text-[#5d6163]">
									Plan levels from Beginner to Pro
								</p>
							</div>
							<div className="rounded-md bg-white p-5">
								<p className="text-3xl font-semibold text-[#576363]">
									$100+
								</p>
								<p className="mt-2 text-sm text-[#5d6163]">
									Starting USD deposit range
								</p>
							</div>
							<div className="rounded-md bg-white p-5">
								<p className="text-3xl font-semibold text-[#576363]">
									24-72h
								</p>
								<p className="mt-2 text-sm text-[#5d6163]">
									Plan cycle duration range
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="border-y border-[#d7e5e3] bg-[#f7faf9]">
				<div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
					<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
						{plansToDisplay.map((plan) => (
							<InvestmentPlanCard key={plan.name} plan={plan} />
						))}
					</div>

					<p className="mt-6 max-w-3xl text-sm leading-6 text-[#5d6163]">
						Projected returns are package terms, not a guarantee of market
						performance. Crypto markets are volatile, and users should review
						Nexcoin terms and risk guidance before depositing funds.
					</p>
				</div>
			</section>

			<section className="bg-white">
				<div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
							Plan guidance
						</p>
						<h2 className="mt-4 text-3xl font-semibold text-[#576363] sm:text-4xl">
							Pick a plan with the full process in mind.
						</h2>
						<p className="mt-4 max-w-xl text-base leading-7 text-[#5d6163]">
							The best plan is not only the highest projected return. It should
							match your deposit range, reinvestment expectations, and ability
							to follow withdrawal rules.
						</p>
					</div>

					<div className="grid gap-5 sm:grid-cols-3">
						{planGuides.map((guide, index) => (
							<article
								key={guide.title}
								className="rounded-lg border border-[#d7e5e3] bg-[#f7faf9] p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]"
							>
								<p className="text-3xl font-semibold text-[#5F9EA0]">
									{String(index + 1).padStart(2, "0")}
								</p>
								<h3 className="mt-5 text-xl font-semibold text-[#576363]">
									{guide.title}
								</h3>
								<p className="mt-3 text-sm leading-6 text-[#5d6163]">
									{guide.description}
								</p>
							</article>
						))}
					</div>
				</div>
			</section>

			<section className="border-y border-[#d7e5e3] bg-[#f7faf9]">
				<div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-20">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
							Deposit methods
						</p>
						<h2 className="mt-4 text-3xl font-semibold text-[#576363] sm:text-4xl">
							Funding options for different users.
						</h2>
						<p className="mt-4 max-w-xl text-base leading-7 text-[#5d6163]">
							Nexcoin accepts crypto deposits only. Users can fund with Bitcoin,
							Ethereum, or USDT through the matching network shown in their
							account.
						</p>
					</div>

					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{depositMethods.map((method) => (
							<div
								key={method}
								className="rounded-md border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]"
							>
								<p className="text-base font-semibold text-[#576363]">
									{method}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="bg-white">
				<div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
					<div className="grid items-center gap-8 rounded-lg border border-[#d7e5e3] bg-[#f7faf9] p-6 shadow-[0_24px_80px_rgba(87,99,99,0.12)] sm:p-8 lg:grid-cols-[1fr_auto] lg:p-10">
						<div className="max-w-2xl">
							<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
								Ready to compare plans?
							</p>
							<h2 className="mt-4 text-3xl font-semibold text-[#576363] sm:text-4xl">
								Create your account and choose your investment path.
							</h2>
							<p className="mt-4 text-base leading-7 text-[#5d6163]">
								Register to access plan selection, account funding, portfolio
								monitoring, and support guidance.
							</p>
						</div>

						<div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
							<Link
								href="/auth/register"
								className={buttonVariants({
									className: "w-full sm:w-auto lg:w-44",
									size: "lg",
								})}
							>
								Get Started
							</Link>
							<Link
								href="/contact"
								className={buttonVariants({
									className: "w-full sm:w-auto lg:w-44",
									size: "lg",
									variant: "outline",
								})}
							>
								Contact Us
							</Link>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
