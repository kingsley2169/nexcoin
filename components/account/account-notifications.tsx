"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
	type NotificationCategory,
	type NotificationItem,
	type NotificationPreference,
	type NotificationsData,
	notificationCategoryLabels,
} from "@/lib/notifications";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AccountNotificationsProps = {
	data: NotificationsData;
};

type CategoryFilter = NotificationCategory | "all";
type ReadFilter = "all" | "read" | "unread";

const categoryFilters: { label: string; value: CategoryFilter }[] = [
	{ label: "All", value: "all" },
	{ label: "Transactions", value: "transaction" },
	{ label: "Investments", value: "investment" },
	{ label: "Security", value: "security" },
	{ label: "Support", value: "support" },
	{ label: "Account", value: "account" },
];

const readFilters: { label: string; value: ReadFilter }[] = [
	{ label: "All", value: "all" },
	{ label: "Unread", value: "unread" },
	{ label: "Read", value: "read" },
];

const categoryClasses: Record<NotificationCategory, string> = {
	account: "bg-[#eef6f5] text-[#3c7f80]",
	investment: "bg-[#e5f3f1] text-[#3c7f80]",
	security: "bg-[#fde8e8] text-[#b1423a]",
	support: "bg-[#eef1f1] text-[#5d6163]",
	transaction: "bg-[#fff1e0] text-[#a66510]",
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
	day: "numeric",
	hour: "numeric",
	minute: "2-digit",
	month: "short",
	year: "numeric",
});

function formatDateTime(iso: string) {
	return dateTimeFormatter.format(new Date(iso));
}

function BellIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			className={className}
			aria-hidden="true"
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2"
		>
			<path d="M18 10a6 6 0 1 0-12 0c0 7-2 7-2 9h16c0-2-2-2-2-9ZM10 21h4" />
		</svg>
	);
}

function CheckIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			className={className}
			aria-hidden="true"
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2"
		>
			<path d="m5 13 4 4L19 7" />
		</svg>
	);
}

function SearchIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			className={className}
			aria-hidden="true"
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2"
		>
			<path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16ZM21 21l-4.35-4.35" />
		</svg>
	);
}

export function AccountNotifications({ data }: AccountNotificationsProps) {
	const [items, setItems] = useState(data.items);
	const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
	const [readFilter, setReadFilter] = useState<ReadFilter>("all");
	const [query, setQuery] = useState("");

	const summary = useMemo(() => {
		const unread = items.filter((item) => !item.isRead).length;
		const highPriority = items.filter(
			(item) => !item.isRead && item.priority === "high",
		).length;
		const security = items.filter(
			(item) => !item.isRead && item.category === "security",
		).length;

		return {
			highPriority,
			security,
			total: items.length,
			unread,
		};
	}, [items]);

	const filteredItems = useMemo(() => {
		const trimmed = query.trim().toLowerCase();

		return items.filter((item) => {
			if (categoryFilter !== "all" && item.category !== categoryFilter) {
				return false;
			}

			if (readFilter === "read" && !item.isRead) {
				return false;
			}

			if (readFilter === "unread" && item.isRead) {
				return false;
			}

			if (trimmed) {
				const haystack = `${item.title} ${item.body} ${notificationCategoryLabels[item.category]}`.toLowerCase();

				if (!haystack.includes(trimmed)) {
					return false;
				}
			}

			return true;
		});
	}, [categoryFilter, items, query, readFilter]);

	const markAllRead = () => {
		setItems((current) => current.map((item) => ({ ...item, isRead: true })));
	};

	const toggleRead = (id: string) => {
		setItems((current) =>
			current.map((item) =>
				item.id === id ? { ...item, isRead: !item.isRead } : item,
			),
		);
	};

	return (
		<div className="space-y-6">
			<header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="text-2xl font-semibold text-[#576363]">
						Notifications
					</h1>
					<p className="mt-1 max-w-2xl text-sm leading-6 text-[#5d6163]">
						Review account alerts, investment updates, withdrawal status, and
						security notices in one place.
					</p>
				</div>
				<div className="flex flex-wrap gap-3">
					<Button
						type="button"
						variant="outline"
						className="gap-2"
						onClick={markAllRead}
						disabled={summary.unread === 0}
					>
						<CheckIcon className="h-4 w-4" />
						Mark All Read
					</Button>
					<Link
						href="/account/support"
						className={buttonVariants({ size: "md", variant: "outline" })}
					>
						Support
					</Link>
				</div>
			</header>

			<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<SummaryCard
					hint="Messages that need attention"
					label="Unread"
					value={String(summary.unread)}
					tone={summary.unread > 0 ? "warning" : "neutral"}
				/>
				<SummaryCard
					hint="Security or withdrawal-sensitive alerts"
					label="High priority"
					value={String(summary.highPriority)}
					tone={summary.highPriority > 0 ? "danger" : "neutral"}
				/>
				<SummaryCard
					hint="Unread sign-in or account protection notices"
					label="Security"
					value={String(summary.security)}
				/>
				<SummaryCard
					hint="Full notification history"
					label="Total notices"
					value={String(summary.total)}
				/>
			</section>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_370px]">
				<NotificationsList
					categoryFilter={categoryFilter}
					items={filteredItems}
					onCategoryChange={setCategoryFilter}
					onQueryChange={setQuery}
					onReadFilterChange={setReadFilter}
					onToggleRead={toggleRead}
					query={query}
					readFilter={readFilter}
				/>
				<PreferencesPanel preferences={data.preferences} />
			</div>
		</div>
	);
}

function SummaryCard({
	hint,
	label,
	tone = "neutral",
	value,
}: {
	hint: string;
	label: string;
	tone?: "danger" | "neutral" | "warning";
	value: string;
}) {
	return (
		<div className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<p className="text-sm text-[#5d6163]">{label}</p>
			<p className="mt-2 text-2xl font-semibold text-[#576363]">{value}</p>
			<p
				className={cn(
					"mt-2 text-sm",
					tone === "danger" && "text-[#b1423a]",
					tone === "warning" && "text-[#a66510]",
					tone === "neutral" && "text-[#5d6163]",
				)}
			>
				{hint}
			</p>
		</div>
	);
}

function NotificationsList({
	categoryFilter,
	items,
	onCategoryChange,
	onQueryChange,
	onReadFilterChange,
	onToggleRead,
	query,
	readFilter,
}: {
	categoryFilter: CategoryFilter;
	items: NotificationItem[];
	onCategoryChange: (value: CategoryFilter) => void;
	onQueryChange: (value: string) => void;
	onReadFilterChange: (value: ReadFilter) => void;
	onToggleRead: (id: string) => void;
	query: string;
	readFilter: ReadFilter;
}) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="border-b border-[#d7e5e3] p-5">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div>
						<h2 className="text-lg font-semibold text-[#576363]">
							Notification center
						</h2>
						<p className="mt-1 text-sm leading-6 text-[#5d6163]">
							Filter account messages by category, read state, or keyword.
						</p>
					</div>
					<div className="flex h-10 min-w-64 items-center rounded-md border border-[#cfdcda] bg-white px-3 focus-within:border-[#5F9EA0] focus-within:ring-4 focus-within:ring-[#5F9EA0]/15">
						<SearchIcon className="h-4 w-4 text-[#5d6163]" />
						<label className="sr-only" htmlFor="notification-search">
							Search notifications
						</label>
						<input
							id="notification-search"
							type="search"
							value={query}
							onChange={(event) => onQueryChange(event.target.value)}
							placeholder="Search notifications"
							className="ml-2 h-full min-w-0 flex-1 bg-transparent text-sm text-[#576363] outline-none placeholder:text-[#9aa5a4]"
						/>
					</div>
				</div>

				<div className="mt-5 flex flex-wrap gap-2">
					{categoryFilters.map((filter) => {
						const active = categoryFilter === filter.value;

						return (
							<button
								key={filter.value}
								type="button"
								onClick={() => onCategoryChange(filter.value)}
								className={cn(
									"rounded-full px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15",
									active
										? "bg-[#5F9EA0] text-white"
										: "bg-[#f7faf9] text-[#576363] hover:bg-[#eef6f5] hover:text-[#5F9EA0]",
								)}
							>
								{filter.label}
							</button>
						);
					})}
				</div>

				<div className="mt-3 flex flex-wrap gap-2">
					{readFilters.map((filter) => {
						const active = readFilter === filter.value;

						return (
							<button
								key={filter.value}
								type="button"
								onClick={() => onReadFilterChange(filter.value)}
								className={cn(
									"rounded-md px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15",
									active
										? "bg-[#eef6f5] text-[#3c7f80]"
										: "bg-white text-[#5d6163] hover:bg-[#f7faf9]",
								)}
							>
								{filter.label}
							</button>
						);
					})}
				</div>
			</div>

			<div className="divide-y divide-[#eef1f1]">
				{items.length === 0 ? (
					<div className="p-8 text-center">
						<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-[#eef6f5] text-[#3c7f80]">
							<BellIcon className="h-6 w-6" />
						</div>
						<p className="mt-4 font-semibold text-[#576363]">
							No notifications found
						</p>
						<p className="mt-2 text-sm leading-6 text-[#5d6163]">
							Try adjusting your filters or search phrase.
						</p>
					</div>
				) : (
					items.map((item) => (
						<NotificationRow
							key={item.id}
							item={item}
							onToggleRead={() => onToggleRead(item.id)}
						/>
					))
				)}
			</div>
		</section>
	);
}

function NotificationRow({
	item,
	onToggleRead,
}: {
	item: NotificationItem;
	onToggleRead: () => void;
}) {
	return (
		<article
			className={cn(
				"grid gap-4 p-5 sm:grid-cols-[auto_minmax(0,1fr)_auto]",
				!item.isRead && "bg-[#fbfdfc]",
			)}
		>
			<div
				className={cn(
					"mt-1 flex h-10 w-10 items-center justify-center rounded-md",
					item.priority === "high"
						? "bg-[#fde8e8] text-[#b1423a]"
						: "bg-[#e5f3f1] text-[#3c7f80]",
				)}
			>
				<BellIcon className="h-5 w-5" />
			</div>
			<div className="min-w-0">
				<div className="flex flex-wrap items-center gap-2">
					<h3 className="font-semibold text-[#576363]">{item.title}</h3>
					{!item.isRead ? (
						<span className="h-2 w-2 rounded-full bg-[#5F9EA0]" aria-label="Unread" />
					) : null}
					<span
						className={cn(
							"rounded-full px-2.5 py-1 text-xs font-semibold",
							categoryClasses[item.category],
						)}
					>
						{notificationCategoryLabels[item.category]}
					</span>
				</div>
				<p className="mt-2 text-sm leading-6 text-[#5d6163]">{item.body}</p>
				<div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#5d6163]">
					<span>{formatDateTime(item.createdAt)}</span>
					<span aria-hidden="true">·</span>
					<span>{item.channels.join(", ")}</span>
				</div>
				{item.actionHref && item.actionLabel ? (
					<Link
						href={item.actionHref}
						className="mt-4 inline-flex text-sm font-semibold text-[#3c7f80] hover:text-[#1f5556]"
					>
						{item.actionLabel}
					</Link>
				) : null}
			</div>
			<Button
				type="button"
				variant="ghost"
				size="sm"
				className="self-start"
				onClick={onToggleRead}
			>
				{item.isRead ? "Mark Unread" : "Mark Read"}
			</Button>
		</article>
	);
}

function PreferencesPanel({
	preferences,
}: {
	preferences: NotificationPreference[];
}) {
	const [settings, setSettings] = useState(preferences);

	const toggle = (
		id: string,
		channel: "email" | "inApp" | "sms",
	) => {
		setSettings((current) =>
			current.map((setting) =>
				setting.id === id
					? { ...setting, [channel]: !setting[channel] }
					: setting,
			),
		);
	};

	return (
		<aside className="space-y-6">
			<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e5f3f1] text-[#3c7f80]">
						<BellIcon className="h-5 w-5" />
					</div>
					<div>
						<h2 className="font-semibold text-[#576363]">Delivery settings</h2>
						<p className="mt-1 text-sm text-[#5d6163]">
							Choose where each alert type is sent.
						</p>
					</div>
				</div>

				<div className="mt-5 space-y-4">
					{settings.map((setting) => (
						<div
							key={setting.id}
							className="rounded-lg border border-[#eef1f1] p-4"
						>
							<p className="font-semibold text-[#576363]">{setting.label}</p>
							<p className="mt-1 text-sm leading-6 text-[#5d6163]">
								{setting.description}
							</p>
							<div className="mt-4 grid grid-cols-3 gap-2">
								<ChannelToggle
									checked={setting.inApp}
									label="In-app"
									onClick={() => toggle(setting.id, "inApp")}
								/>
								<ChannelToggle
									checked={setting.email}
									label="Email"
									onClick={() => toggle(setting.id, "email")}
								/>
								<ChannelToggle
									checked={setting.sms}
									label="SMS"
									onClick={() => toggle(setting.id, "sms")}
								/>
							</div>
						</div>
					))}
				</div>
			</section>

			<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				<h2 className="font-semibold text-[#576363]">Important alerts</h2>
				<p className="mt-2 text-sm leading-6 text-[#5d6163]">
					Security alerts and sensitive withdrawal updates stay enabled in-app
					to help protect your account.
				</p>
			</section>
		</aside>
	);
}

function ChannelToggle({
	checked,
	label,
	onClick,
}: {
	checked: boolean;
	label: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-pressed={checked}
			className={cn(
				"min-h-9 rounded-md border px-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15",
				checked
					? "border-[#5F9EA0] bg-[#eef6f5] text-[#3c7f80]"
					: "border-[#d7e5e3] bg-white text-[#5d6163] hover:bg-[#f7faf9]",
			)}
		>
			{label}
		</button>
	);
}
