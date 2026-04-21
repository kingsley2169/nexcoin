import Image from "next/image";
import Link from "next/link";

const companyLinks = [
	{ href: "/about", label: "About" },
	{ href: "/plans", label: "Investment Plans" },
	{ href: "/how-it-works", label: "How It Works" },
	{ href: "/contact", label: "Contact" },
];

const supportLinks = [
	{ href: "/faq", label: "FAQ" },
	{ href: "/support", label: "Support" },
	{ href: "/auth/login", label: "Login" },
	{ href: "/auth/register", label: "Signup" },
];

const legalLinks = [
	{ href: "/terms", label: "Terms" },
	{ href: "/privacy", label: "Privacy" },
	{ href: "/risk-disclosure", label: "Risk Disclosure" },
];

function FooterLink({ href, label }: { href: string; label: string }) {
	return (
		<Link
			href={href}
			className="text-sm text-[#5d6163] transition hover:text-[#5F9EA0] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15"
		>
			{label}
		</Link>
	);
}

export function SiteFooter() {
	return (
		<footer className="border-t border-[#d7e5e3] bg-white text-[#576363]">
			<div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.25fr_2fr] lg:px-8 lg:py-14">
				<div className="max-w-sm">
					<Link href="/" aria-label="Nexcoin home" className="inline-flex">
						<Image
							src="/branding/nexcoin-name.svg"
							alt="Nexcoin"
							width={175}
							height={38}
							priority
							className="h-8 w-auto object-contain sm:h-9"
						/>
					</Link>
					<p className="mt-5 text-sm leading-6 text-[#5d6163]">
						A crypto investment platform for monitoring plans, deposits,
						withdrawals, and portfolio activity from one secure dashboard.
					</p>
				</div>

				<div className="grid gap-8 sm:grid-cols-3">
					<div>
						<h2 className="text-sm font-semibold text-[#576363]">Company</h2>
						<div className="mt-4 flex flex-col gap-3">
							{companyLinks.map((link) => (
								<FooterLink key={link.href} {...link} />
							))}
						</div>
					</div>

					<div>
						<h2 className="text-sm font-semibold text-[#576363]">Support</h2>
						<div className="mt-4 flex flex-col gap-3">
							{supportLinks.map((link) => (
								<FooterLink key={link.href} {...link} />
							))}
						</div>
					</div>

					<div>
						<h2 className="text-sm font-semibold text-[#576363]">Legal</h2>
						<div className="mt-4 flex flex-col gap-3">
							{legalLinks.map((link) => (
								<FooterLink key={link.href} {...link} />
							))}
						</div>
					</div>
				</div>
			</div>

			<div className="border-t border-[#e3ecea]">
				<div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-5 text-sm text-[#5d6163] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
					<p>Copyright 2026 Nexcoin. All rights reserved.</p>
					<p>Crypto assets involve risk and market volatility.</p>
				</div>
			</div>
		</footer>
	);
}
