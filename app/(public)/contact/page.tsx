import type { Metadata } from "next";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
	title: "Contact | Nexcoin",
	description:
		"Contact Nexcoin for account support, investment questions, and platform assistance.",
};

const contactOptions = [
	{
		description: "Get help with deposits, withdrawals, account access, and security.",
		label: "Support",
		value: "support@nexcoin.com",
	},
	{
		description: "Speak with our team about plans, traders, and portfolio tools.",
		label: "Investments",
		value: "invest@nexcoin.com",
	},
	{
		description: "Send compliance, legal, or business partnership requests.",
		label: "Business",
		value: "business@nexcoin.com",
	},
];

export default function ContactPage() {
	return (
		<>
			<section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
				<div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
							Contact us
						</p>
						<h1 className="mt-5 text-4xl font-semibold text-[#576363] sm:text-5xl">
							Reach the Nexcoin team.
						</h1>
						<p className="mt-5 max-w-xl text-base leading-7 text-[#5d6163] sm:text-lg">
							Questions about your account, investment plans, deposits, or
							withdrawals? Send us a message and our team will help route your
							request to the right desk.
						</p>

						<div className="mt-10 grid gap-4">
							{contactOptions.map((option) => (
								<article
									key={option.label}
									className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]"
								>
									<p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5F9EA0]">
										{option.label}
									</p>
									<p className="mt-3 text-lg font-semibold text-[#576363]">
										{option.value}
									</p>
									<p className="mt-2 text-sm leading-6 text-[#5d6163]">
										{option.description}
									</p>
								</article>
							))}
						</div>
					</div>

					<div className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_24px_80px_rgba(87,99,99,0.12)] sm:p-8">
						<div>
							<h2 className="text-2xl font-semibold text-[#576363]">
								Send a message
							</h2>
							<p className="mt-2 text-sm leading-6 text-[#5d6163]">
								Share a few details and we will get back to you.
							</p>
						</div>

						<form className="mt-8 space-y-5">
							<div className="grid gap-5 sm:grid-cols-2">
								<div>
									<label
										htmlFor="first-name"
										className="block text-sm font-medium text-[#576363]"
									>
										First name
									</label>
									<input
										id="first-name"
										name="first-name"
										type="text"
										autoComplete="given-name"
										required
										placeholder="Jane"
										className="mt-2 h-12 w-full rounded-md border border-[#cfdcda] bg-white px-4 text-base text-[#576363] outline-none transition focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
									/>
								</div>

								<div>
									<label
										htmlFor="last-name"
										className="block text-sm font-medium text-[#576363]"
									>
										Last name
									</label>
									<input
										id="last-name"
										name="last-name"
										type="text"
										autoComplete="family-name"
										required
										placeholder="Doe"
										className="mt-2 h-12 w-full rounded-md border border-[#cfdcda] bg-white px-4 text-base text-[#576363] outline-none transition focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
									/>
								</div>
							</div>

							<div>
								<label
									htmlFor="email"
									className="block text-sm font-medium text-[#576363]"
								>
									Email address
								</label>
								<input
									id="email"
									name="email"
									type="email"
									autoComplete="email"
									required
									placeholder="you@example.com"
									className="mt-2 h-12 w-full rounded-md border border-[#cfdcda] bg-white px-4 text-base text-[#576363] outline-none transition focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
								/>
							</div>

							<div>
								<label
									htmlFor="topic"
									className="block text-sm font-medium text-[#576363]"
								>
									Topic
								</label>
								<select
									id="topic"
									name="topic"
									required
									className="mt-2 h-12 w-full rounded-md border border-[#cfdcda] bg-white px-4 text-base text-[#576363] outline-none transition focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
								>
									<option value="">Select a topic</option>
									<option value="account">Account support</option>
									<option value="deposits">Deposits and withdrawals</option>
									<option value="plans">Investment plans</option>
									<option value="security">Security</option>
									<option value="business">Business inquiry</option>
								</select>
							</div>

							<div>
								<label
									htmlFor="message"
									className="block text-sm font-medium text-[#576363]"
								>
									Message
								</label>
								<textarea
									id="message"
									name="message"
									required
									rows={6}
									placeholder="Tell us how we can help."
									className="mt-2 w-full resize-y rounded-md border border-[#cfdcda] bg-white px-4 py-3 text-base text-[#576363] outline-none transition focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
								/>
							</div>

							<Button type="submit" size="lg" className="w-full">
								Send Message
							</Button>
						</form>
					</div>
				</div>
			</section>

			<section className="border-t border-[#d7e5e3] bg-white">
				<div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
					<div>
						<p className="text-sm font-semibold text-[#576363]">
							Response window
						</p>
						<p className="mt-2 text-sm leading-6 text-[#5d6163]">
							Most support requests receive a reply within one business day.
						</p>
					</div>
					<div>
						<p className="text-sm font-semibold text-[#576363]">
							Account security
						</p>
						<p className="mt-2 text-sm leading-6 text-[#5d6163]">
							Never share passwords, private keys, or seed phrases with anyone.
						</p>
					</div>
					<div>
						<p className="text-sm font-semibold text-[#576363]">
							Already a user?
						</p>
						<Link
							href="/auth/login"
							className={buttonVariants({
								className: "mt-4 w-full sm:w-auto",
								variant: "outline",
							})}
						>
							Login to dashboard
						</Link>
					</div>
				</div>
			</section>
		</>
	);
}
