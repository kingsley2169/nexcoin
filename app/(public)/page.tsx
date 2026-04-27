export const dynamic = 'force-dynamic';

import Link from "next/link";
import Image from "next/image";
import { InvestmentPlanCard } from "@/components/investment-plan-card";
import { MarketTicker } from "@/components/market-ticker";
import { buttonVariants } from "@/components/ui/button";
import { getPublicInvestmentPlans, investmentPlans } from "@/lib/investment-plans";
import HeroSvg from "@/public/homepage-hero.svg"

const howItWorksSteps = [
	{
		description: "Create your free Nexcoin account in minutes",
		icon: (
			<svg viewBox="0 0 48 48" role="img" aria-hidden="true">
				<path
					d="M18.5 23.5a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z"
					fill="none"
					stroke="currentColor"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="3"
				/>
				<path
					d="M6.5 39.5c1.8-7 6.2-10.5 12-10.5 4.2 0 7.6 1.8 9.8 5.4"
					fill="none"
					stroke="currentColor"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="3"
				/>
				<path
					d="M34 17.5v13M27.5 24h13"
					fill="none"
					stroke="currentColor"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="3"
				/>
			</svg>
		),
		step: "Step 1",
		title: "Register",
	},
	{
		description:
			"Browse a comprehensive directory of verified and successful crypto traders",
		icon: (
			<svg viewBox="0 0 48 48" role="img" aria-hidden="true">
				<path
					d="M9 13.5h30M9 24h30M9 34.5h18"
					fill="none"
					stroke="currentColor"
					strokeLinecap="round"
					strokeWidth="3"
				/>
				<path
					d="M35.5 32.5 41 38M33 35.5a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"
					fill="none"
					stroke="currentColor"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="3"
				/>
			</svg>
		),
		step: "Step 2",
		title: "Discover Pro Traders",
	},
	{
		description:
			"Manage your investments and copied trades from a centralized dashboard",
		icon: (
			<svg viewBox="0 0 48 48" role="img" aria-hidden="true">
				<path
					d="M8.5 10.5h31v27h-31z"
					fill="none"
					stroke="currentColor"
					strokeLinejoin="round"
					strokeWidth="3"
				/>
				<path
					d="M15 31V21M24 31V16M33 31v-6"
					fill="none"
					stroke="currentColor"
					strokeLinecap="round"
					strokeWidth="3"
				/>
			</svg>
		),
		step: "Step 3",
		title: "Start trading",
	},
	{
		description:
			"Monitor your portfolio performance as Nexcoin automates the copying process",
		icon: (
			<svg viewBox="0 0 48 48" role="img" aria-hidden="true">
				<path
					d="M8 33.5 18 24l8 6.5L40 15"
					fill="none"
					stroke="currentColor"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="3"
				/>
				<path
					d="M31 15h9v9"
					fill="none"
					stroke="currentColor"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="3"
				/>
				<path
					d="M8 40h32"
					fill="none"
					stroke="currentColor"
					strokeLinecap="round"
					strokeWidth="3"
				/>
			</svg>
		),
		step: "Step 4",
		title: "Earn money",
	},
];

const marketStats = [
	{ label: "Countries", value: "38+" },
	{ label: "Trading Pairs", value: "350+" },
	{ label: "Trades", value: "20 million+" },
];

const reasonsToChooseNexcoin = [
	{
		description:
			"Review plans, copied trades, deposits, withdrawals, and portfolio movement from one focused dashboard.",
		title: "Centralized portfolio view",
	},
	{
		description:
			"Explore a curated trader experience designed to help users compare opportunities before committing funds.",
		title: "Trader discovery tools",
	},
	{
		description:
			"Track deposits, investment activity, and withdrawal status with clear records inside your account.",
		title: "Transparent account activity",
	},
	{
		description:
			"Access support guidance for account, investment, loan, and withdrawal questions when you need help.",
		title: "Support-driven experience",
	},
];

const securityPractices = [
	"Password recovery support for account access issues",
	"Verification requirements for sensitive loan and withdrawal actions",
	"Withdrawal modes aligned with deposit methods for AML awareness",
	"Security reminders against sharing passwords, private keys, or seed phrases",
	"System upgrades designed to improve platform protection",
	"Customer support review for unusual account or transaction issues",
];

const trustPillars = [
	{
		description:
			"We help you make sense of the coins, the terms, the dense charts and market changes.",
		title: "Clarity",
	},
	{
		description:
			"Our markets are always up to date, sparking curiosity with real-world relevance.",
		title: "Confidence",
	},
	{
		description:
			"We support the crypto community by putting data in the hands that need it most.",
		title: "Community",
	},
];

export default async function Home() {
	const publicPlans = await getPublicInvestmentPlans();
	const plansToDisplay = publicPlans.length > 0 ? publicPlans : investmentPlans;

	return (
		<>
			<section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:px-8">
				<div className="relative z-10 max-w-3xl lg:flex-1">
					<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
						Nexcoin investment platform
					</p>
					<h1 className="mt-5 text-4xl font-semibold text-[#576363] sm:text-5xl lg:text-6xl">
						Track crypto investments with clarity and control.
					</h1>
					<p className="mt-6 max-w-2xl text-base leading-7 text-[#5d6163] sm:text-lg">
						A focused dashboard experience for investment plans, deposits,
						withdrawals, transactions, and account security.
					</p>
					<div className="mt-8 flex flex-col gap-3 sm:flex-row">
						<Link
							href="/auth/register"
							className={buttonVariants({
								className: "w-full sm:w-auto",
								size: "lg",
							})}
						>
							Get Started
						</Link>
						<Link
							href="/auth/login"
							className={buttonVariants({
								className: "w-full sm:w-auto",
								size: "lg",
								variant: "outline",
							})}
						>
							Login
						</Link>
					</div>
				</div>
				<div className="mt-8 flex items-center justify-center lg:static lg:z-auto lg:flex-1 lg:justify-end lg:mt-0">
					<div className="max-w-4xl opacity-90 lg:opacity-100">
						<Image
							src={HeroSvg}
							alt="Nexcoin's Investment tracking platform."
							className="w-full h-auto"
						/>
					</div>
				</div>
			</section>

			<MarketTicker />

			<section className="border-y border-[#d7e5e3] bg-white">
				<div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
					<div className="max-w-2xl">
						<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
							How it works
						</p>
						<h2 className="mt-4 text-3xl font-semibold text-[#576363] sm:text-4xl">
							Start investing with a clear, guided process.
						</h2>
						<p className="mt-4 text-base leading-7 text-[#5d6163]">
							Move from account creation to automated portfolio activity with a
							simple workflow built for serious investors.
						</p>
					</div>

					<div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
						{howItWorksSteps.map((item) => (
							<article
								key={item.step}
								className="rounded-lg border border-[#d7e5e3] bg-[#f7faf9] p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]"
							>
								<div className="flex h-14 w-14 items-center justify-center rounded-md border border-[#c7dbd8] bg-white text-[#5F9EA0]">
									<div className="h-8 w-8">{item.icon}</div>
								</div>
								<p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-[#5F9EA0]">
									{item.step}
								</p>
								<h3 className="mt-3 text-xl font-semibold text-[#576363]">
									{item.title}
								</h3>
								<p className="mt-3 text-sm leading-6 text-[#5d6163]">
									{item.description}
								</p>
							</article>
						))}
					</div>
				</div>
			</section>

			<section className="bg-[#f7faf9]">
				<div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
					<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
						<div className="max-w-2xl">
							<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
								Investment plans
							</p>
							<h2 className="mt-4 text-3xl font-semibold text-[#576363] sm:text-4xl">
								Choose a plan that fits your investment level.
							</h2>
							<p className="mt-4 text-base leading-7 text-[#5d6163]">
								Compare Nexcoin packages by deposit range, projected return,
								duration, and reinvestment rules before creating your account.
							</p>
						</div>
						<Link
							href="/auth/register"
							className={buttonVariants({
								className: "w-full sm:w-auto",
								size: "lg",
								variant: "outline",
							})}
						>
							Register to invest
						</Link>
					</div>

					<div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
						{plansToDisplay.map((plan) => (
							<InvestmentPlanCard
								key={plan.name}
								plan={plan}
								variant="compact"
							/>
						))}
					</div>

					<p className="mt-6 max-w-3xl text-sm leading-6 text-[#5d6163]">
						Plan returns are presented as projected package terms. Crypto
						markets are volatile, and users should review Nexcoin terms and risk
						disclosures before depositing funds.
					</p>
				</div>
			</section>

			<section className="border-y border-[#d7e5e3] bg-white">
				<div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
					<div className="max-w-2xl">
						<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
							Why choose Nexcoin
						</p>
						<h2 className="mt-4 text-3xl font-semibold text-[#576363] sm:text-4xl">
							Built for users who want structure before they invest.
						</h2>
						<p className="mt-4 text-base leading-7 text-[#5d6163]">
							Nexcoin combines plan comparison, trader discovery, portfolio
							monitoring, and account support into a practical investment
							experience.
						</p>
					</div>

					<div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
						{reasonsToChooseNexcoin.map((reason, index) => (
							<article
								key={reason.title}
								className="rounded-lg border border-[#d7e5e3] bg-[#f7faf9] p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]"
							>
								<div className="flex h-11 w-11 items-center justify-center rounded-md bg-white text-sm font-semibold text-[#5F9EA0]">
									{String(index + 1).padStart(2, "0")}
								</div>
								<h3 className="mt-6 text-xl font-semibold text-[#576363]">
									{reason.title}
								</h3>
								<p className="mt-3 text-sm leading-6 text-[#5d6163]">
									{reason.description}
								</p>
							</article>
						))}
					</div>
				</div>
			</section>

			<section className="bg-[#f7faf9]">
				<div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
							Security and compliance
						</p>
						<h2 className="mt-4 text-3xl font-semibold text-[#576363] sm:text-4xl">
							Account protection and responsible transaction rules.
						</h2>
						<p className="mt-4 max-w-xl text-base leading-7 text-[#5d6163]">
							Nexcoin uses clear account requirements, withdrawal controls, and
							support review processes to help protect users and reduce
							transaction risk.
						</p>
						<p className="mt-5 max-w-xl text-sm leading-6 text-[#5d6163]">
							Crypto assets remain volatile. Security and compliance controls
							help protect the account process, but they do not remove market
							risk.
						</p>
					</div>

					<div className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_24px_80px_rgba(87,99,99,0.12)] sm:p-8">
						<div className="grid gap-4 sm:grid-cols-2">
							{securityPractices.map((practice) => (
								<div
									key={practice}
									className="rounded-md border border-[#e3ecea] bg-[#f7faf9] p-4"
								>
									<div className="flex gap-3">
										<span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#5F9EA0] text-[10px] font-semibold text-white">
											✓
										</span>
										<p className="text-sm leading-6 text-[#5d6163]">
											{practice}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			<section className="bg-[#f7faf9]">
				<div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
					<div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
						<div>
							<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
								Trusted by thousands
							</p>
							<h2 className="mt-4 text-3xl font-semibold text-[#576363] sm:text-4xl">
								Secure & Reliable Platform
							</h2>
							<p className="mt-4 max-w-xl text-base leading-7 text-[#5d6163]">
								Join a community of satisfied users who rely on Nexcoin
								for their crypto needs.
							</p>
						</div>

						<div className="grid gap-5">
							<div className="grid gap-5 sm:grid-cols-3">
								{marketStats.map((stat) => (
									<div
										key={stat.label}
										className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]"
									>
										<p className="text-3xl font-semibold text-[#5F9EA0]">
											{stat.value}
										</p>
										<p className="mt-2 text-sm font-medium text-[#576363]">
											{stat.label}
										</p>
									</div>
								))}
							</div>

							<div className="grid gap-5 md:grid-cols-3">
								{trustPillars.map((pillar) => (
									<article
										key={pillar.title}
										className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]"
									>
										<div className="h-1.5 w-12 rounded-full bg-[#5F9EA0]" />
										<h3 className="mt-5 text-xl font-semibold text-[#576363]">
											{pillar.title}
										</h3>
										<p className="mt-3 text-sm leading-6 text-[#5d6163]">
											{pillar.description}
										</p>
									</article>
								))}
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="bg-[#f7faf9]">
				<div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
					<div className="grid items-center gap-8 rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_24px_80px_rgba(87,99,99,0.12)] sm:p-8 lg:grid-cols-[1fr_auto] lg:p-10">
						<div className="max-w-2xl">
							<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
								Register now
							</p>
							<h2 className="mt-4 text-3xl font-semibold text-[#576363] sm:text-4xl">
								Create your account and start tracking smarter trades.
							</h2>
							<p className="mt-4 text-base leading-7 text-[#5d6163]">
								Join Nexcoin to discover verified traders, manage copied
								trades, and monitor your investment performance from one secure
								dashboard.
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
								Register Now
							</Link>
							<Link
								href="/auth/login"
								className={buttonVariants({
									className: "w-full sm:w-auto lg:w-44",
									size: "lg",
									variant: "outline",
								})}
							>
								Login
							</Link>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
