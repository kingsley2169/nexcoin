import type { Metadata } from "next";
import Link from "next/link";
import { MarketOverview } from "@/components/market-overview";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
	title: "Market | Nexcoin",
	description:
		"Track major crypto assets, USD prices, 24-hour movement, top movers, and market context on Nexcoin.",
};

export default function MarketPage() {
	return (
		<>
			<section className="bg-white">
				<div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:items-center lg:px-8 lg:py-20">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
							Crypto market overview
						</p>
						<h1 className="mt-5 max-w-4xl text-4xl font-semibold text-[#576363] sm:text-5xl lg:text-6xl">
							Track major crypto assets before choosing a plan.
						</h1>
						<p className="mt-6 max-w-2xl text-base leading-8 text-[#5d6163] sm:text-lg">
							Review USD prices, 24-hour movement, market status, and top
							movers across major assets supported by the Nexcoin market
							experience.
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
								View Plans
							</Link>
						</div>
					</div>

					<div className="rounded-lg border border-[#d7e5e3] bg-[#f7faf9] p-6 shadow-[0_24px_80px_rgba(87,99,99,0.12)] sm:p-8">
						<p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#5F9EA0]">
							Market note
						</p>
						<p className="mt-5 text-base leading-7 text-[#5d6163]">
							Market prices are shown for informational purposes and may not
							match exact execution, deposit, or withdrawal values. Crypto
							markets can move quickly.
						</p>
					</div>
				</div>
			</section>

			<section className="border-y border-[#d7e5e3] bg-[#f7faf9]">
				<div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
					<MarketOverview />
				</div>
			</section>

			<section className="bg-white">
				<div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
					<div className="grid items-center gap-8 rounded-lg border border-[#d7e5e3] bg-[#f7faf9] p-6 shadow-[0_24px_80px_rgba(87,99,99,0.12)] sm:p-8 lg:grid-cols-[1fr_auto] lg:p-10">
						<div className="max-w-2xl">
							<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
								Risk reminder
							</p>
							<h2 className="mt-4 text-3xl font-semibold text-[#576363] sm:text-4xl">
								Market context is not a guarantee.
							</h2>
							<p className="mt-4 text-base leading-7 text-[#5d6163]">
								Crypto prices can change rapidly and significantly. Review
								Nexcoin plan terms, withdrawal rules, and risk guidance before
								depositing funds.
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
