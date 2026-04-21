"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
	{ href: "/about", label: "About" },
	{ href: "/plans", label: "Plans" },
	{ href: "/how-it-works", label: "How It Works" },
	{ href: "/market", label: "Market" },
	{ href: "/faq", label: "FAQ" },
	{ href: "/contact", label: "Contact Us" },
];

export function SiteHeader() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<header className="sticky top-0 z-40 border-b border-[#d7e5e3] bg-white/95 backdrop-blur">
			<div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
				<Link
					href="/"
					className="flex shrink-0 items-center gap-3"
					aria-label="Nexcoin home"
					onClick={() => setIsOpen(false)}
				>
					<Image 
						src="/branding/nexcoin-name.svg"
						alt="Nexcoin"
						width={175}
						height={38}
						priority
						className="h-8 w-auto object-contain sm:h-9"
					/>
				</Link>

				<nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
					{navItems.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className="rounded-md px-3 py-2 text-sm font-medium text-[#1c2121] transition hover:bg-[#eef6f5] hover:text-[#5F9EA0] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15"
						>
							{item.label}
						</Link>
					))}
				</nav>

				<div className="hidden items-center gap-3 lg:flex">
					<Link
						href="/auth/login"
						className={buttonVariants({ variant: "ghost" })}
					>
						Login
					</Link>
					<Link
						href="/auth/register"
						className={buttonVariants({ variant: "primary" })}
					>
						Get Started
					</Link>
				</div>

				<Button
					variant="outline"
					size="icon"
					className="lg:hidden"
					aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
					aria-expanded={isOpen}
					onClick={() => setIsOpen((current) => !current)}
				>
					<span className="relative h-5 w-5" aria-hidden="true">
						<svg
							viewBox="0 0 24 24"
							className={cn(
								"absolute inset-0 h-5 w-5 transition duration-200",
								isOpen ? "rotate-90 scale-75 opacity-0" : "rotate-0 scale-100 opacity-100",
							)}
						>
							<path
								d="M4 7h16M4 12h16M4 17h16"
								fill="none"
								stroke="currentColor"
								strokeLinecap="round"
								strokeWidth="2"
							/>
						</svg>
						<svg
							viewBox="0 0 24 24"
							className={cn(
								"absolute inset-0 h-5 w-5 transition duration-200",
								isOpen
									? "rotate-0 scale-100 opacity-100"
									: "-rotate-90 scale-75 opacity-0",
							)}
						>
							<path
								d="m6 6 12 12M18 6 6 18"
								fill="none"
								stroke="currentColor"
								strokeLinecap="round"
								strokeWidth="2"
							/>
						</svg>
					</span>
				</Button>
			</div>

			<div
				className={cn(
					"grid border-t border-[#d7e5e3] bg-white transition-all duration-200 lg:hidden",
					isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
				)}
			>
				<div className="overflow-hidden">
					<nav
						className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6"
						aria-label="Mobile primary"
					>
						{navItems.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className="rounded-md px-3 py-3 text-base font-medium text-[#576363] transition hover:bg-[#eef6f5] hover:text-[#5F9EA0] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15"
								onClick={() => setIsOpen(false)}
							>
								{item.label}
							</Link>
						))}
						<div className="mt-3 grid gap-3 border-t border-[#e3ecea] pt-4 sm:grid-cols-2">
							<Link
								href="/auth/login"
								className={buttonVariants({
									className: "w-full",
									variant: "outline",
								})}
								onClick={() => setIsOpen(false)}
							>
								Login
							</Link>
							<Link
								href="/auth/register"
								className={buttonVariants({ className: "w-full" })}
								onClick={() => setIsOpen(false)}
							>
								Get Started
							</Link>
						</div>
					</nav>
				</div>
			</div>
		</header>
	);
}
