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

function UsersIcon({ className }: MenuIconProps) {
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

function SettingsIcon({ className }: MenuIconProps) {
	return (
		<svg viewBox="0 0 24 24" className={className} aria-hidden="true">
			<path
				d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19 13.5v-3l-2-.5a6 6 0 0 0-.6-1.4l1-1.8-2.1-2.1-1.8 1a6 6 0 0 0-1.5-.6L11.5 3h-3L8 5.1a6 6 0 0 0-1.4.6l-1.8-1-2.1 2.1 1 1.8a6 6 0 0 0-.6 1.4l-2 .5v3l2 .5a6 6 0 0 0 .6 1.4l-1 1.8 2.1 2.1 1.8-1a6 6 0 0 0 1.4.6l.5 2.1h3l.5-2.1a6 6 0 0 0 1.5-.6l1.8 1 2.1-2.1-1-1.8a6 6 0 0 0 .6-1.4z"
				fill="none"
				stroke="currentColor"
				strokeLinejoin="round"
				strokeWidth="1.8"
			/>
		</svg>
	);
}

const adminBase = "/nexcoin-admin-priv";

const menuItems = [
	{ href: `${adminBase}`, icon: ChartIcon, label: "Dashboard" },
	{ href: `${adminBase}/users`, icon: UsersIcon, label: "User Management" },
	{
		href: `${adminBase}/investment-plans`,
		icon: PlansIcon,
		label: "Investment Plans",
	},
	{
		href: `${adminBase}/deposits-management`,
		icon: DepositIcon,
		label: "Deposits Management",
	},
	{
		href: `${adminBase}/withdrawals-management`,
		icon: WithdrawalIcon,
		label: "Withdrawal Management",
	},
	{
		href: `${adminBase}/transactions`,
		icon: TransactionsIcon,
		label: "Transactions Management",
	},
	{ href: `${adminBase}/kyc-review`, icon: VerificationIcon, label: "KYC Review" },
    { href: `${adminBase}/support`, icon: SupportIcon, label: "Support Management" },
];

export function AdminSidebar({
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
					href={`${adminBase}`}
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
							alt="Nexcoin admin"
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
				aria-label="Admin"
			>
				<div className="space-y-1">
					{menuItems.map((item) => {
						const Icon = item.icon;
						const isActive =
							item.href === `${adminBase}`
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
								<span className={cn(collapsed && "sr-only")}>
									{item.label}
								</span>
							</Link>
						);
					})}
				</div>
			</nav>

			<div className={cn("border-t border-[#d7e5e3] p-4", collapsed && "hidden")}>
				<div className="rounded-lg bg-[#f7faf9] p-4">
					<p className="text-sm font-semibold text-[#576363]">Admin console</p>
					<p className="mt-2 text-xs leading-5 text-[#5d6163]">
						Review users, funding activity, support, KYC, and platform content.
					</p>
				</div>
			</div>
		</aside>
	);
}
