import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
	title: "Risk Disclosure | Nexcoin",
	description:
		"Review important crypto investment risks, including market volatility, liquidity, technology, withdrawal, regulatory, and personal decision risks.",
};

const riskSections = [
	{
		description:
			"Crypto asset prices can rise or fall sharply in short periods of time. Market movement may be affected by demand, liquidity, regulation, technology events, exchange activity, and broader economic conditions.",
		title: "Market Volatility",
	},
	{
		description:
			"Projected returns, plan terms, examples, or historical market information should not be treated as guaranteed future results. Users may earn less than expected or lose some or all deposited funds.",
		title: "No Guaranteed Returns",
	},
	{
		description:
			"Withdrawals may be affected by platform review, verification requirements, blockchain traffic, payment-mode rules, account status, or security checks.",
		title: "Withdrawal and Liquidity Risk",
	},
	{
		description:
			"Blockchain networks, wallets, exchanges, APIs, payment systems, and third-party services may experience downtime, congestion, errors, delays, or security issues.",
		title: "Technology and Network Risk",
	},
	{
		description:
			"Laws, regulations, tax treatment, and compliance requirements for crypto assets may change. These changes may affect deposits, withdrawals, access, reporting, and investment activity.",
		title: "Regulatory Risk",
	},
	{
		description:
			"Users are responsible for protecting login details, email accounts, devices, wallet access, and recovery information. Sharing passwords, private keys, or seed phrases can lead to permanent loss.",
		title: "Account and Security Risk",
	},
];

const userResponsibilities = [
	"Only invest funds you can afford to risk.",
	"Review plan terms, withdrawal rules, and privacy information before depositing.",
	"Do not treat projected returns as guaranteed income.",
	"Keep your password, private keys, seed phrase, and wallet recovery details private.",
	"Contact support before taking action if a loan, withdrawal, or account rule is unclear.",
	"Consider independent financial, legal, or tax advice before making investment decisions.",
];

export default function RiskDisclosurePage() {
	return (
		<>
			<section className="border-b border-[#d7e5e3] bg-white">
				<div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:px-8 lg:py-20">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
							Risk disclosure
						</p>
						<h1 className="mt-5 text-4xl font-semibold text-[#576363] sm:text-5xl">
							Crypto investing involves real risk.
						</h1>
					</div>
					<p className="max-w-2xl text-base leading-8 text-[#5d6163] sm:text-lg">
						This disclosure explains important risks connected to crypto assets,
						investment plans, deposits, withdrawals, technology systems, account
						security, and market volatility.
					</p>
				</div>
			</section>

			<section className="bg-[#f7faf9]">
				<div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
					<div className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_24px_80px_rgba(87,99,99,0.12)] sm:p-8">
						<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
							Important
						</p>
						<h2 className="mt-4 text-3xl font-semibold text-[#576363] sm:text-4xl">
							Nexcoin does not remove market risk.
						</h2>
						<p className="mt-4 max-w-4xl text-base leading-7 text-[#5d6163]">
							Nexcoin may provide access to plans, market context, support, and
							account tools, but users remain responsible for understanding the
							risks of crypto investing before depositing funds.
						</p>
					</div>

					<div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
						{riskSections.map((risk) => (
							<article
								key={risk.title}
								className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]"
							>
								<div className="h-1.5 w-12 rounded-full bg-[#5F9EA0]" />
								<h3 className="mt-6 text-xl font-semibold text-[#576363]">
									{risk.title}
								</h3>
								<p className="mt-3 text-sm leading-7 text-[#5d6163]">
									{risk.description}
								</p>
							</article>
						))}
					</div>
				</div>
			</section>

			<section className="border-y border-[#d7e5e3] bg-white">
				<div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
							User responsibility
						</p>
						<h2 className="mt-4 text-3xl font-semibold text-[#576363] sm:text-4xl">
							Make decisions carefully and independently.
						</h2>
						<p className="mt-4 max-w-xl text-base leading-7 text-[#5d6163]">
							Before using Nexcoin, users should understand their financial
							position, risk tolerance, and the possibility of loss.
						</p>
					</div>

					<div className="grid gap-4">
						{userResponsibilities.map((item) => (
							<div
								key={item}
								className="rounded-md border border-[#e3ecea] bg-[#f7faf9] p-4"
							>
								<div className="flex gap-3">
									<span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#5F9EA0] text-[10px] font-semibold text-white">
										✓
									</span>
									<p className="text-sm leading-6 text-[#5d6163]">{item}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="bg-[#f7faf9]">
				<div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
					<div className="grid items-center gap-8 rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_24px_80px_rgba(87,99,99,0.12)] sm:p-8 lg:grid-cols-[1fr_auto] lg:p-10">
						<div className="max-w-2xl">
							<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
								Questions before depositing?
							</p>
							<h2 className="mt-4 text-3xl font-semibold text-[#576363] sm:text-4xl">
								Review the terms or contact support first.
							</h2>
							<p className="mt-4 text-base leading-7 text-[#5d6163]">
								If a plan rule, withdrawal process, loan requirement, or account
								condition is unclear, ask for support before taking action.
							</p>
						</div>

						<div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
							<Link
								href="/terms"
								className={buttonVariants({
									className: "w-full sm:w-auto lg:w-44",
									size: "lg",
								})}
							>
								Read Terms
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
