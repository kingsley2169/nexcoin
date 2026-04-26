import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
	title: "How It Works | Nexcoin",
	description:
		"Learn how Nexcoin works from account creation and plan selection to funding, portfolio monitoring, withdrawals, and account security.",
};

const processSteps = [
	{
		description:
			"Register with accurate personal details so account access, verification, support, and withdrawal reviews can be handled properly.",
		title: "Create your account",
	},
	{
		description:
			"Compare plan levels by USD deposit range, projected return, duration, reinvestment rules, and support access.",
		title: "Review investment plans",
	},
	{
		description:
			"Deposit through supported crypto assets: Bitcoin, Ethereum, and USDT.",
		title: "Fund your account",
	},
	{
		description:
			"Once your account is funded, select an investment plan and move the funds into the investment cycle.",
		title: "Activate a plan",
	},
	{
		description:
			"Track portfolio activity, active plans, trading progress, referral activity, and transaction history from the dashboard.",
		title: "Monitor performance",
	},
	{
		description:
			"Request withdrawals according to platform rules, deposit-method alignment, verification requirements, and processing timelines.",
		title: "Request withdrawal",
	},
];

const beforeDepositItems = [
	"Review Nexcoin terms and plan rules",
	"Understand plan duration and projected return",
	"Confirm reinvestment limits before choosing a package",
	"Check that your preferred deposit method is supported",
	"Understand that funded amounts are not immediately withdrawn until invested",
	"Contact support if any plan rule is unclear",
];

const investmentStageItems = [
	"Your selected plan becomes active",
	"Dashboard records show investment status",
	"Portfolio performance can be monitored",
	"Bonus and referral eligibility may depend on plan and account activity",
	"Support remains available for account and transaction questions",
];

const withdrawalItems = [
	"Withdrawals generally use the same mode as the original deposit",
	"Withdrawal processing may take up to 24 hours",
	"Blockchain traffic may delay crypto withdrawals",
	"Loan-related withdrawals may require valid documents",
	"Support can help with delayed or sensitive withdrawal cases",
];

const securityItems = [
	"Nexcoin will never ask for your password",
	"Nexcoin will never ask for your private keys",
	"Nexcoin will never ask for your seed phrase or wallet recovery phrase",
	"Use password recovery only through official Nexcoin pages",
	"Contact support if account access or transaction activity looks unusual",
];

function Checklist({
	items,
	title,
}: {
	items: string[];
	title: string;
}) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)] sm:p-8">
			<h2 className="text-2xl font-semibold text-[#576363]">{title}</h2>
			<div className="mt-6 grid gap-4">
				{items.map((item) => (
					<div key={item} className="flex gap-3">
						<span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#5F9EA0] text-[10px] font-semibold text-white">
							✓
						</span>
						<p className="text-sm leading-6 text-[#5d6163]">{item}</p>
					</div>
				))}
			</div>
		</section>
	);
}

export default function HowItWorksPage() {
	return (
		<>
			<section className="bg-white">
				<div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:items-center lg:px-8 lg:py-20">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
							How it works
						</p>
						<h1 className="mt-5 max-w-4xl text-4xl font-semibold text-[#576363] sm:text-5xl lg:text-6xl">
							A clear path from registration to withdrawal.
						</h1>
						<p className="mt-6 max-w-2xl text-base leading-8 text-[#5d6163] sm:text-lg">
							Nexcoin gives users a structured process for account creation,
							plan selection, funding, portfolio monitoring, and withdrawals.
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
								href="/plans"
								className={buttonVariants({
									className: "w-full sm:w-auto",
									size: "lg",
									variant: "outline",
								})}
							>
								View Investment Plans
							</Link>
						</div>
					</div>

					<div className="rounded-lg border border-[#d7e5e3] bg-[#f7faf9] p-6 shadow-[0_24px_80px_rgba(87,99,99,0.12)] sm:p-8">
						<p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#5F9EA0]">
							Process overview
						</p>
						<div className="mt-6 grid gap-4">
							{["Register", "Fund", "Invest", "Monitor", "Withdraw"].map(
								(label, index) => (
									<div key={label} className="flex items-center gap-4">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-sm font-semibold text-[#5F9EA0]">
											{String(index + 1).padStart(2, "0")}
										</div>
										<p className="text-base font-semibold text-[#576363]">
											{label}
										</p>
									</div>
								),
							)}
						</div>
					</div>
				</div>
			</section>

			<section className="border-y border-[#d7e5e3] bg-[#f7faf9]">
				<div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
					<div className="max-w-2xl">
						<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
							Main process
						</p>
						<h2 className="mt-4 text-3xl font-semibold text-[#576363] sm:text-4xl">
							Six steps from account setup to withdrawal.
						</h2>
					</div>

					<div className="mt-10 grid gap-5 lg:grid-cols-2">
						{processSteps.map((step, index) => (
							<article
								key={step.title}
								className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]"
							>
								<p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#5F9EA0]">
									Step {index + 1}
								</p>
								<h3 className="mt-4 text-2xl font-semibold text-[#576363]">
									{step.title}
								</h3>
								<p className="mt-3 text-sm leading-7 text-[#5d6163]">
									{step.description}
								</p>
							</article>
						))}
					</div>
				</div>
			</section>

			<section className="bg-white">
				<div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-3 lg:px-8 lg:py-20">
					<Checklist title="Before You Deposit" items={beforeDepositItems} />
					<Checklist
						title="During an Investment"
						items={investmentStageItems}
					/>
					<Checklist title="Withdrawal Rules Preview" items={withdrawalItems} />
				</div>
			</section>

			<section className="border-y border-[#d7e5e3] bg-[#f7faf9]">
				<div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
							Security notes
						</p>
						<h2 className="mt-4 text-3xl font-semibold text-[#576363] sm:text-4xl">
							Protect your account before every transaction.
						</h2>
						<p className="mt-4 max-w-xl text-base leading-7 text-[#5d6163]">
							Account security is part of the investment process. Keep your
							login details and wallet recovery information private, and contact
							support if anything looks unusual.
						</p>
					</div>

					<Checklist title="Account Safety" items={securityItems} />
				</div>
			</section>

			<section className="bg-white">
				<div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
					<div className="grid items-center gap-8 rounded-lg border border-[#d7e5e3] bg-[#f7faf9] p-6 shadow-[0_24px_80px_rgba(87,99,99,0.12)] sm:p-8 lg:grid-cols-[1fr_auto] lg:p-10">
						<div className="max-w-2xl">
							<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
								Ready to begin?
							</p>
							<h2 className="mt-4 text-3xl font-semibold text-[#576363] sm:text-4xl">
								Start with a clear process.
							</h2>
							<p className="mt-4 text-base leading-7 text-[#5d6163]">
								Create your account or compare the available plans before
								choosing your investment path.
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
								Create Account
							</Link>
							<Link
								href="/plans"
								className={buttonVariants({
									className: "w-full sm:w-auto lg:w-44",
									size: "lg",
									variant: "outline",
								})}
							>
								Compare Plans
							</Link>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
