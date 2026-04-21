import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
	title: "Privacy Policy | Nexcoin",
	description:
		"Read how Nexcoin collects, uses, protects, and shares personal information connected to accounts, deposits, withdrawals, support, and platform activity.",
};

const policySections = [
	{
		items: [
			"Account registration details, including name, email address, and other information submitted during signup.",
			"Verification information submitted for sensitive actions, loan-related requests, or withdrawal review.",
			"Deposit, investment, withdrawal, referral, and account activity records.",
			"Support messages, contact form submissions, and communication history with Nexcoin.",
			"Technical information such as device data, browser type, IP address, pages visited, and security logs.",
		],
		title: "Information We Collect",
	},
	{
		items: [
			"To create, maintain, secure, and recover user accounts.",
			"To process deposits, investment activity, withdrawals, referrals, and account requests.",
			"To review sensitive actions, verify account ownership, and support fraud-prevention efforts.",
			"To respond to support requests, account questions, and business inquiries.",
			"To improve platform reliability, user experience, security controls, and customer support.",
		],
		title: "How We Use Information",
	},
	{
		items: [
			"Personal data may be used to verify account ownership and protect users from unauthorized account access.",
			"Nexcoin may request identity documents for loan-related withdrawals, representative requirements, or other sensitive reviews.",
			"Users should not send passwords, private keys, seed phrases, or wallet recovery phrases to Nexcoin.",
		],
		title: "Verification and Account Security",
	},
	{
		items: [
			"Nexcoin does not sell user personal information.",
			"Information may be shared with service providers that help operate the platform, support users, secure accounts, or process communications.",
			"Information may be disclosed if required by law, regulatory request, fraud investigation, security review, or legal process.",
			"Transaction information may be reviewed for anti-money-laundering awareness and platform integrity.",
		],
		title: "How Information May Be Shared",
	},
	{
		items: [
			"Nexcoin uses security-conscious account processes, access controls, and review workflows to help protect user information.",
			"No online system can be guaranteed to be completely secure, especially where cryptocurrency, blockchain activity, or third-party networks are involved.",
			"Users are responsible for keeping their login details, devices, email accounts, wallets, and recovery information secure.",
		],
		title: "Data Protection",
	},
	{
		items: [
			"Nexcoin keeps information for as long as needed to provide services, support account activity, meet operational needs, resolve disputes, and comply with applicable requirements.",
			"If an account becomes inactive, abandoned, deactivated, or deleted under platform rules, related records may still be retained where required for security, legal, or operational reasons.",
		],
		title: "Data Retention",
	},
	{
		items: [
			"Users may contact Nexcoin to request updates to account information or ask questions about privacy-related matters.",
			"Some information may be required to maintain account access, process transactions, review withdrawals, or satisfy platform security requirements.",
			"Users can contact support if they believe their account information is inaccurate or compromised.",
		],
		title: "User Choices",
	},
];

export default function PrivacyPage() {
	return (
		<>
			<section className="border-b border-[#d7e5e3] bg-white">
				<div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:px-8 lg:py-20">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
							Privacy policy
						</p>
						<h1 className="mt-5 text-4xl font-semibold text-[#576363] sm:text-5xl">
							How Nexcoin handles user information.
						</h1>
					</div>
					<p className="max-w-2xl text-base leading-8 text-[#5d6163] sm:text-lg">
						This policy explains how Nexcoin may collect, use, protect, retain,
						and share information connected to accounts, deposits, withdrawals,
						investment activity, support, and platform security.
					</p>
				</div>
			</section>

			<section className="bg-[#f7faf9]">
				<div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
					{policySections.map((section) => (
						<section
							key={section.title}
							className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)] sm:p-8"
						>
							<h2 className="text-2xl font-semibold text-[#576363]">
								{section.title}
							</h2>
							<div className="mt-6 grid gap-4">
								{section.items.map((item) => (
									<div key={item} className="flex gap-3">
										<span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5F9EA0]" />
										<p className="text-sm leading-7 text-[#5d6163] sm:text-base">
											{item}
										</p>
									</div>
								))}
							</div>
						</section>
					))}
				</div>
			</section>

			<section className="bg-white">
				<div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
					<div className="grid items-center gap-8 rounded-lg border border-[#d7e5e3] bg-[#f7faf9] p-6 shadow-[0_24px_80px_rgba(87,99,99,0.12)] sm:p-8 lg:grid-cols-[1fr_auto] lg:p-10">
						<div className="max-w-2xl">
							<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
								Privacy questions
							</p>
							<h2 className="mt-4 text-3xl font-semibold text-[#576363] sm:text-4xl">
								Contact support about your account information.
							</h2>
							<p className="mt-4 text-base leading-7 text-[#5d6163]">
								For privacy questions, account updates, or information concerns,
								contact Nexcoin support through the contact page.
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
