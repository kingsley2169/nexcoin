"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type MenuIconProps = {
	className?: string;
};

function ChartIcon({ className }: MenuIconProps) {
	return (
		<svg viewBox="0 0 24 24" className={className} aria-hidden="true">
			<path
				d="M4 19V5M8 17v-6M12 17V7M16 17v-3M20 17V9"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
			/>
		</svg>
	);
}

function PortfolioIcon({ className }: MenuIconProps) {
	return (
		<svg viewBox="0 0 24 24" className={className} aria-hidden="true">
			<path
				d="M4 19V6M4 19h16M8 16l3-4 3 2 5-7"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
			<path d="M18 7h1v1" fill="none" stroke="currentColor" strokeWidth="2" />
		</svg>
	);
}

function WalletIcon({ className }: MenuIconProps) {
	return (
		<svg viewBox="0 0 24 24" className={className} aria-hidden="true">
			<path
				d="M4 7.5h16v12H4zM16 12h4"
				fill="none"
				stroke="currentColor"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</svg>
	);
}

function DepositIcon({ className }: MenuIconProps) {
	return (
		<svg viewBox="0 0 24 24" className={className} aria-hidden="true">
			<path
				d="M12 4v11M8 11l4 4 4-4M5 20h14"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</svg>
	);
}

function WithdrawalIcon({ className }: MenuIconProps) {
	return (
		<svg viewBox="0 0 24 24" className={className} aria-hidden="true">
			<path
				d="M12 20V9M8 13l4-4 4 4M5 4h14"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</svg>
	);
}

function PlansIcon({ className }: MenuIconProps) {
	return (
		<svg viewBox="0 0 24 24" className={className} aria-hidden="true">
			<path
				d="M5 5h14v14H5zM9 9h6M9 13h6M9 17h3"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</svg>
	);
}

function TransactionsIcon({ className }: MenuIconProps) {
	return (
		<svg viewBox="0 0 24 24" className={className} aria-hidden="true">
			<path
				d="M7 7h11M7 7l3-3M7 7l3 3M17 17H6M17 17l-3-3M17 17l-3 3"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</svg>
	);
}

function ReferralsIcon({ className }: MenuIconProps) {
	return (
		<svg viewBox="0 0 24 24" className={className} aria-hidden="true">
			<path
				d="M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM15.5 13a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3 20c.9-3.4 2.7-5 5.5-5 2.2 0 3.8 1 4.8 3M13 20c.7-2 1.9-3 3.7-3 1.7 0 3 1 3.8 3"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</svg>
	);
}

function NotificationIcon({ className }: MenuIconProps) {
	return (
		<svg viewBox="0 0 24 24" className={className} aria-hidden="true">
			<path
				d="M18 10a6 6 0 1 0-12 0c0 7-2 7-2 9h16c0-2-2-2-2-9ZM10 21h4"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</svg>
	);
}

function ProfileIcon({ className }: MenuIconProps) {
	return (
		<svg viewBox="0 0 24 24" className={className} aria-hidden="true">
			<path
				d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20c1.2-4 3.6-6 7-6s5.8 2 7 6"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</svg>
	);
}

function SecurityIcon({ className }: MenuIconProps) {
	return (
		<svg viewBox="0 0 24 24" className={className} aria-hidden="true">
			<path
				d="M12 3 5 6v5c0 4.5 2.8 8 7 10 4.2-2 7-5.5 7-10V6z"
				fill="none"
				stroke="currentColor"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</svg>
	);
}

function VerificationIcon({ className }: MenuIconProps) {
	return (
		<svg viewBox="0 0 24 24" className={className} aria-hidden="true">
			<path
				d="M5 4h14v16H5zM8 9h8M8 13h4M15 15l1.5 1.5L20 13"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</svg>
	);
}

function SupportIcon({ className }: MenuIconProps) {
	return (
		<svg viewBox="0 0 24 24" className={className} aria-hidden="true">
			<path
				d="M5 11a7 7 0 0 1 14 0v4a3 3 0 0 1-3 3h-2M5 11v4h3v-4H5ZM19 11v4h-3v-4h3ZM12 18h2"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</svg>
	);
}

const menuItems = [
	{ href: "/account", icon: ChartIcon, label: "Dashboard" },
	{ href: "/account/portfolio", icon: PortfolioIcon, label: "Portfolio" },
	{ href: "/account/deposit", icon: DepositIcon, label: "Deposit" },
	{ href: "/account/withdrawal", icon: WithdrawalIcon, label: "Withdrawal" },
	{ href: "/account/plans", icon: PlansIcon, label: "Investment Plans" },
	{ href: "/account/transactions", icon: TransactionsIcon, label: "Transactions" },
	{ href: "/account/wallets", icon: WalletIcon, label: "Wallets" },
	{ href: "/account/referrals", icon: ReferralsIcon, label: "Referrals" },
	{ href: "/account/notifications", icon: NotificationIcon, label: "Notifications" },
	{ href: "/account/profile", icon: ProfileIcon, label: "Profile" },
	{ href: "/account/security", icon: SecurityIcon, label: "Security" },
	{ href: "/account/verification", icon: VerificationIcon, label: "KYC Verification" },
	{ href: "/account/support", icon: SupportIcon, label: "Support Tickets" },
];

export function AccountSidebar({
	collapsed = false,
	onNavigate,
}: {
	collapsed?: boolean;
	onNavigate?: () => void;
}) {
	const pathname = usePathname();

	return (
		<aside className="flex h-full flex-col bg-white">
			<div
				className={cn(
					"flex h-16 items-center border-b border-[#d7e5e3]",
					collapsed ? "px-3" : "px-5",
				)}
			>
				<Link
					href="/account"
					className={cn(
						"inline-flex items-center",
						collapsed && "w-full justify-center",
					)}
					onClick={onNavigate}
				>
					{collapsed ? (
						<span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#5F9EA0] text-base font-semibold text-white">
							N
						</span>
					) : (
						<Image
							src="/branding/nexcoin-name.svg"
							alt="Nexcoin"
							width={175}
							height={38}
							priority
							className="h-8 w-auto object-contain"
						/>
					)}
				</Link>
			</div>

			<nav
				className="account-sidebar-scroll flex-1 overflow-y-auto overscroll-contain px-3 py-4"
				aria-label="Account"
			>
				<div className="space-y-1">
					{menuItems.map((item) => {
						const Icon = item.icon;
						const isActive =
							item.href === "/account"
								? pathname === item.href
								: pathname.startsWith(item.href);

						return (
							<Link
								key={item.href}
								href={item.href}
								onClick={onNavigate}
								title={collapsed ? item.label : undefined}
								className={cn(
									"flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15",
									collapsed && "justify-center px-0",
									isActive
										? "bg-[#e5f3f1] text-[#3c7f80]"
										: "text-[#576363] hover:bg-[#f7faf9] hover:text-[#5F9EA0]",
								)}
							>
								<Icon className="h-5 w-5 shrink-0" />
								<span className={cn(collapsed && "sr-only")}>{item.label}</span>
							</Link>
						);
					})}
				</div>
			</nav>

			<div className={cn("border-t border-[#d7e5e3] p-4", collapsed && "hidden")}>
				<div className="rounded-lg bg-[#f7faf9] p-4">
					<p className="text-sm font-semibold text-[#576363]">
						Account support
					</p>
					<p className="mt-2 text-xs leading-5 text-[#5d6163]">
						Get help with deposits, withdrawals, plans, and verification.
					</p>
				</div>
			</div>
		</aside>
	);
}
