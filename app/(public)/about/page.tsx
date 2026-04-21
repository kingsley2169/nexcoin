import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
	title: "About | Nexcoin",
	description:
		"Learn how Nexcoin helps crypto investors compare plans, follow market context, monitor portfolios, and manage account activity with more structure.",
};

const platformCapabilities = [
	{
		description:
			"Users can compare plan ranges, projected returns, durations, and reinvestment rules before choosing a package.",
		title: "Structured investment plans",
	},
	{
		description:
			"Market context and trader discovery tools help users evaluate opportunities with less guesswork.",
		title: "Trader and market discovery",
	},
	{
		description:
			"Portfolio activity, deposits, withdrawals, and transaction status belong in one clear account experience.",
		title: "Dashboard visibility",
	},
	{
		description:
			"Support paths help users handle account access, sensitive withdrawals, loan questions, and verification requirements.",
		title: "Guided account support",
	},
];

const standards = [
	"Clear registration information and account ownership rules",
	"Published plan ranges in USD before users commit funds",
	"Withdrawal processes aligned with deposit methods for AML awareness",
	"Verification requirements for sensitive loan and withdrawal actions",
	"Security guidance that reminds users never to share passwords or private keys",
	"Support review for unusual account activity or transaction delays",
];

const expectations = [
	{
		label: "Before depositing",
		text: "Users should review the terms, understand plan limits, and decide whether the risk level fits their financial situation.",
	},
	{
		label: "After investing",
		text: "Users can monitor investment activity, portfolio performance, and account actions from the dashboard experience.",
	},
	{
		label: "When withdrawing",
		text: "Withdrawals follow account rules, verification requirements, and payment-mode alignment for security and compliance awareness.",
	},
];

export default function AboutPage() {
	return (
		<>
			<section className="bg-white">
				<div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:px-8 lg:py-20">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
							About Nexcoin
						</p>
						<h1 className="mt-5 max-w-4xl text-4xl font-semibold text-[#576363] sm:text-5xl lg:text-6xl">
							Built for investors who want structure in a volatile market.
						</h1>
						<p className="mt-6 max-w-2xl text-base leading-8 text-[#5d6163] sm:text-lg">
							Nexcoin brings plan comparison, trader discovery, market context,
							portfolio visibility, and account support into one focused crypto
							investment experience.
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
							Our focus
						</p>
						<div className="mt-6 space-y-5">
							<div className="rounded-md bg-white p-5">
								<p className="text-3xl font-semibold text-[#576363]">01</p>
								<p className="mt-2 text-sm leading-6 text-[#5d6163]">
									Make plan details easier to compare before users deposit.
								</p>
							</div>
							<div className="rounded-md bg-white p-5">
								<p className="text-3xl font-semibold text-[#576363]">02</p>
								<p className="mt-2 text-sm leading-6 text-[#5d6163]">
									Keep account activity, support, and portfolio movement in one
									clear place.
								</p>
							</div>
							<div className="rounded-md bg-white p-5">
								<p className="text-3xl font-semibold text-[#576363]">03</p>
								<p className="mt-2 text-sm leading-6 text-[#5d6163]">
									Use security-conscious account rules for sensitive actions.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="border-y border-[#d7e5e3] bg-[#f7faf9]">
				<div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
							The problem
						</p>
						<h2 className="mt-4 text-3xl font-semibold text-[#576363] sm:text-4xl">
							Crypto investing is crowded with noise.
						</h2>
						<p className="mt-4 max-w-xl text-base leading-7 text-[#5d6163]">
							Many users are asked to make decisions from fast-moving prices,
							unclear plan terms, scattered dashboards, and incomplete support.
							That creates confusion before the investment even begins.
						</p>
					</div>

					<div className="grid gap-5 sm:grid-cols-2">
						{platformCapabilities.map((item) => (
							<article
								key={item.title}
								className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]"
							>
								<div className="h-1.5 w-12 rounded-full bg-[#5F9EA0]" />
								<h3 className="mt-6 text-xl font-semibold text-[#576363]">
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

			<section className="bg-white">
				<div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1fr] lg:items-start lg:px-8 lg:py-20">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
							Operating standard
						</p>
						<h2 className="mt-4 text-3xl font-semibold text-[#576363] sm:text-4xl">
							We favor clear rules over guesswork.
						</h2>
						<p className="mt-4 max-w-xl text-base leading-7 text-[#5d6163]">
							Nexcoin is designed around visible plan information,
							security-conscious account handling, and support paths for actions
							that require extra care.
						</p>
					</div>

					<div className="rounded-lg border border-[#d7e5e3] bg-[#f7faf9] p-6 shadow-[0_24px_80px_rgba(87,99,99,0.12)] sm:p-8">
						<div className="grid gap-4">
							{standards.map((standard) => (
								<div
									key={standard}
									className="rounded-md border border-[#e3ecea] bg-white p-4"
								>
									<div className="flex gap-3">
										<span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#5F9EA0] text-[10px] font-semibold text-white">
											✓
										</span>
										<p className="text-sm leading-6 text-[#5d6163]">
											{standard}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			<section className="border-y border-[#d7e5e3] bg-[#f7faf9]">
				<div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
					<div className="max-w-2xl">
						<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
							What users can expect
						</p>
						<h2 className="mt-4 text-3xl font-semibold text-[#576363] sm:text-4xl">
							A more deliberate investment workflow.
						</h2>
					</div>

					<div className="mt-10 grid gap-5 md:grid-cols-3">
						{expectations.map((item) => (
							<article
								key={item.label}
								className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]"
							>
								<p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#5F9EA0]">
									{item.label}
								</p>
								<p className="mt-4 text-sm leading-7 text-[#5d6163]">
									{item.text}
								</p>
							</article>
						))}
					</div>
				</div>
			</section>

			<section className="bg-white">
				<div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
					<div className="grid items-center gap-8 rounded-lg border border-[#d7e5e3] bg-[#f7faf9] p-6 shadow-[0_24px_80px_rgba(87,99,99,0.12)] sm:p-8 lg:grid-cols-[1fr_auto] lg:p-10">
						<div className="max-w-2xl">
							<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
								Start with the details
							</p>
							<h2 className="mt-4 text-3xl font-semibold text-[#576363] sm:text-4xl">
								Review the rules, compare plans, then create your account.
							</h2>
							<p className="mt-4 text-base leading-7 text-[#5d6163]">
								Nexcoin is built for users who want a clearer path into crypto
								investing, not a rushed decision.
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
								href="/terms"
								className={buttonVariants({
									className: "w-full sm:w-auto lg:w-44",
									size: "lg",
									variant: "outline",
								})}
							>
								Read Terms
							</Link>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
