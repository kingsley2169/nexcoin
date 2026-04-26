import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
	title: "FAQ | Nexcoin",
	description:
		"Find answers to common questions about Nexcoin registration, deposits, investment plans, withdrawals, security, and support.",
};

const faqGroups = [
	{
		items: [
			{
				answer:
					"Create an account with accurate personal information, choose a plan, fund your account, and monitor your portfolio activity from the dashboard.",
				question: "How do I start using Nexcoin?",
			},
			{
				answer:
					"Registration requires accurate details so account recovery, verification, support, and withdrawal reviews can be handled properly.",
				question: "Why do I need to provide accurate registration details?",
			},
			{
				answer:
					"No. Users are not allowed to operate multiple accounts. Multiple accounts may lead to penalties, account restriction, or account closure.",
				question: "Can I create more than one account?",
			},
		],
		title: "Getting started",
	},
	{
		items: [
			{
				answer:
					"Nexcoin accepts crypto deposits only. Supported assets are Bitcoin, Ethereum, and USDT through the network shown on the deposit page.",
				question: "Which deposit methods are supported?",
			},
			{
				answer:
					"Deposited funds must go through the investment process before withdrawal. A funded account cannot withdraw the deposited amount immediately unless it has first been invested according to platform rules.",
				question: "Can I withdraw immediately after depositing?",
			},
			{
				answer:
					"Plan ranges are listed in USD so users can compare packages clearly before depositing funds.",
				question: "Are investment plan prices shown in USD?",
			},
		],
		title: "Deposits and plans",
	},
	{
		items: [
			{
				answer:
					"Withdrawals are generally processed through the same mode used for deposit. For example, a Bitcoin deposit will be withdrawn through Bitcoin. This supports anti-money-laundering awareness.",
				question: "How are withdrawals handled?",
			},
			{
				answer:
					"Withdrawals may take up to 24 hours. Blockchain traffic, verification requirements, or account review may create additional delays.",
				question: "How long do withdrawals take?",
			},
			{
				answer:
					"Loan-related withdrawals may require valid documents such as a National ID or passport and a utility bill.",
				question: "Do I need documents to withdraw loan funds?",
			},
		],
		title: "Withdrawals",
	},
	{
		items: [
			{
				answer:
					"Yes. Nexcoin provides password recovery support for users who need to regain access to their accounts.",
				question: "Does Nexcoin support password recovery?",
			},
			{
				answer:
					"No. Nexcoin will never ask for your password, private keys, seed phrase, or wallet recovery phrase.",
				question: "Will Nexcoin ask for my private keys or seed phrase?",
			},
			{
				answer:
					"Nexcoin performs system upgrades twice every month to improve platform security and reliability. Temporary access issues may occur during upgrades.",
				question: "Why might my account be temporarily unavailable?",
			},
		],
		title: "Security and support",
	},
	{
		items: [
			{
				answer:
					"Referral commission is 4%. There is no indirect commission, and users do not earn commission from referrals who do not have active investments.",
				question: "How does referral commission work?",
			},
			{
				answer:
					"Nexcoin offers representative opportunities for eligible users who meet experience, referral, and active-investor requirements.",
				question: "Can I become a Nexcoin representative?",
			},
			{
				answer:
					"Contact customer support through the contact page for account, investment, withdrawal, loan, or representative questions.",
				question: "How do I contact support?",
			},
		],
		title: "Referrals and representatives",
	},
];

export default function FAQPage() {
	return (
		<>
			<section className="border-b border-[#d7e5e3] bg-white">
				<div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:px-8 lg:py-20">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
							Frequently asked questions
						</p>
						<h1 className="mt-5 text-4xl font-semibold text-[#576363] sm:text-5xl">
							Answers before you invest.
						</h1>
					</div>
					<p className="max-w-2xl text-base leading-8 text-[#5d6163] sm:text-lg">
						Review common questions about registration, deposits, plans,
						withdrawals, security, support, and representative opportunities on
						Nexcoin.
					</p>
				</div>
			</section>

			<section className="bg-[#f7faf9]">
				<div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
					{faqGroups.map((group) => (
						<div
							key={group.title}
							className="grid gap-5 lg:grid-cols-[0.35fr_1fr]"
						>
							<div>
								<h2 className="text-2xl font-semibold text-[#576363]">
									{group.title}
								</h2>
							</div>

							<div className="grid gap-3">
								{group.items.map((item) => (
									<details
										key={item.question}
										className="group rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]"
									>
										<summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-[#576363]">
											<span>{item.question}</span>
											<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#f7faf9] text-[#5F9EA0] transition group-open:rotate-45">
												+
											</span>
										</summary>
										<p className="mt-4 text-sm leading-7 text-[#5d6163]">
											{item.answer}
										</p>
									</details>
								))}
							</div>
						</div>
					))}
				</div>
			</section>

			<section className="bg-white">
				<div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
					<div className="grid items-center gap-8 rounded-lg border border-[#d7e5e3] bg-[#f7faf9] p-6 shadow-[0_24px_80px_rgba(87,99,99,0.12)] sm:p-8 lg:grid-cols-[1fr_auto] lg:p-10">
						<div className="max-w-2xl">
							<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
								Need more help?
							</p>
							<h2 className="mt-4 text-3xl font-semibold text-[#576363] sm:text-4xl">
								Contact support for account-specific questions.
							</h2>
							<p className="mt-4 text-base leading-7 text-[#5d6163]">
								If your question is about a deposit, withdrawal, loan request, or
								account verification, our support team can help route it.
							</p>
						</div>

						<div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
							<Link
								href="/contact"
								className={buttonVariants({
									className: "w-full sm:w-auto lg:w-44",
									size: "lg",
								})}
							>
								Contact Us
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
