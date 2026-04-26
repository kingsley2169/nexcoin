"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
	addManualInvestment,
	fetchAvailableInvestmentPlans,
} from "@/app/nexcoin-admin-priv/users/transaction-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
	onClose: () => void;
	user: { id: string; name: string; email: string };
};

const statusOptions: { label: string; value: string }[] = [
	{ label: "Active", value: "active" },
	{ label: "Matured", value: "matured" },
	{ label: "Cancelled", value: "cancelled" },
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
	currency: "USD",
	maximumFractionDigits: 2,
	style: "currency",
});

function formatUsd(value: number) {
	return currencyFormatter.format(value);
}

export function AdminUserInvestmentModal({ onClose, user }: Props) {
	const router = useRouter();
	const [notice, setNotice] = useState<
		{ tone: "error" | "success"; message: string } | null
	>(null);
	const [isSaving, startSavingTransition] = useTransition();
	const [plans, setPlans] = useState<
		{
			durationHours: number;
			id: string;
			name: string;
			returnRatePercent: number;
			status: string;
		}[]
	>([]);
	const [plansLoading, setPlansLoading] = useState(false);
	const [plansError, setPlansError] = useState<string | null>(null);

	const [planId, setPlanId] = useState("");
	const [amountUsd, setAmountUsd] = useState("");
	const [projectedProfitUsd, setProjectedProfitUsd] = useState("");
	const [profitCreditedUsd, setProfitCreditedUsd] = useState("0");
	const [status, setStatus] = useState("active");
	const [startAt, setStartAt] = useState(new Date().toISOString().slice(0, 16));
	const [endAt, setEndAt] = useState(
		new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString().slice(0, 16),
	);
	const [reason, setReason] = useState("");

	useEffect(() => {
		let cancelled = false;
		const loadPlans = async () => {
			setPlansLoading(true);
			setPlansError(null);
			const result = await fetchAvailableInvestmentPlans();
			if (cancelled) return;
			if (!result.ok) {
				setPlansError(result.error);
				setPlansLoading(false);
				return;
			}
			setPlans(result.data ?? []);
			setPlansLoading(false);
		};
		void loadPlans();
		return () => {
			cancelled = true;
		};
	}, []);

	const parsedAmountUsd = Number(amountUsd);
	const parsedProjectedProfit = Number(projectedProfitUsd);
	const parsedCreditedProfit = Number(profitCreditedUsd);
	const canSubmit =
		!isSaving &&
		planId.length > 0 &&
		Number.isFinite(parsedAmountUsd) &&
		parsedAmountUsd > 0 &&
		Number.isFinite(parsedProjectedProfit) &&
		parsedProjectedProfit >= 0 &&
		Number.isFinite(parsedCreditedProfit) &&
		parsedCreditedProfit >= 0 &&
		parsedCreditedProfit <= parsedProjectedProfit;

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		if (!canSubmit) return;

		startSavingTransition(async () => {
			const result = await addManualInvestment(
				user.id,
				planId,
				parsedAmountUsd,
				parsedProjectedProfit,
				parsedCreditedProfit,
				status,
				startAt,
				endAt,
				reason.trim(),
			);

			if (!result.ok) {
				setNotice({ tone: "error", message: result.error });
				return;
			}

			setNotice({
				tone: "success",
				message: "Investment added successfully.",
			});

			// Reset form
			setPlanId("");
			setAmountUsd("");
			setProjectedProfitUsd("");
			setProfitCreditedUsd("0");
			setStatus("active");
			setStartAt(new Date().toISOString().slice(0, 16));
			setEndAt(
				new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString().slice(0, 16),
			);
			setReason("");

			setTimeout(() => {
				onClose();
				router.refresh();
			}, 1500);
		});
	};

	return (
		<div
			className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1f2b2b]/55 p-4 backdrop-blur-sm sm:p-6"
			role="dialog"
			aria-modal="true"
			aria-labelledby="investment-modal-title"
			onMouseDown={(event) => {
				if (event.currentTarget === event.target) onClose();
			}}
		>
			<section className="w-full max-w-md rounded-lg border border-[#d7e5e3] bg-white shadow-[0_24px_70px_rgba(31,43,43,0.24)]">
				<header className="border-b border-[#d7e5e3] px-5 py-4">
					<h3
						id="investment-modal-title"
						className="text-lg font-semibold text-[#576363]"
					>
						Add Manual Investment for {user.name}
					</h3>
					<p className="mt-1 text-sm text-[#5d6163]">{user.email}</p>
				</header>

				<form
					onSubmit={handleSubmit}
					className="max-h-[70vh] overflow-y-auto px-5 py-4"
				>
					{notice ? (
						<div
							role="status"
							aria-live="polite"
							className={cn(
								"mb-4 rounded-md border px-4 py-3 text-sm font-semibold",
								notice.tone === "success"
									? "border-[#c7ebd2] bg-[#e6f3ec] text-[#2e8f5b]"
									: "border-[#f2c5c0] bg-[#fff7f6] text-[#b1423a]",
							)}
						>
							{notice.message}
						</div>
					) : null}

					<label className="block text-sm font-semibold text-[#576363]">
						Investment Plan
					</label>
					<select
						value={planId}
						onChange={(event) => setPlanId(event.target.value)}
						disabled={plansLoading}
						className="mt-1 h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15 disabled:bg-gray-100"
					>
						<option value="">
							{plansLoading
								? "Loading plans…"
								: plans.length === 0
									? "No plans configured"
									: "Select a plan"}
						</option>
						{plans.map((plan) => (
							<option key={plan.id} value={plan.id}>
								{plan.name} ({plan.returnRatePercent}% return)
								{plan.status !== "active" ? ` · ${plan.status}` : ""}
							</option>
						))}
					</select>
					{plansError ? (
						<p className="mt-1 text-xs text-[#b1423a]">{plansError}</p>
					) : null}

					<label className="mt-4 block text-sm font-semibold text-[#576363]">
						Investment Amount (USD)
					</label>
					<input
						type="number"
						step="0.01"
						min="0"
						value={amountUsd}
						onChange={(event) => setAmountUsd(event.target.value)}
						className="mt-1 h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
					/>

					<label className="mt-4 block text-sm font-semibold text-[#576363]">
						Projected Profit (USD)
					</label>
					<input
						type="number"
						step="0.01"
						min="0"
						value={projectedProfitUsd}
						onChange={(event) => setProjectedProfitUsd(event.target.value)}
						className="mt-1 h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
					/>

					<label className="mt-4 block text-sm font-semibold text-[#576363]">
						Profit Already Credited (USD)
					</label>
					<input
						type="number"
						step="0.01"
						min="0"
						value={profitCreditedUsd}
						onChange={(event) => setProfitCreditedUsd(event.target.value)}
						className="mt-1 h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
					/>
					{parsedCreditedProfit > parsedProjectedProfit ? (
						<p className="mt-1 text-xs text-[#b1423a]">
							Cannot exceed projected profit
						</p>
					) : null}

					<label className="mt-4 block text-sm font-semibold text-[#576363]">
						Status
					</label>
					<select
						value={status}
						onChange={(event) => setStatus(event.target.value)}
						className="mt-1 h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
					>
						{statusOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>

					<label className="mt-4 block text-sm font-semibold text-[#576363]">
						Start Date
					</label>
					<input
						type="datetime-local"
						value={startAt}
						onChange={(event) => setStartAt(event.target.value)}
						className="mt-1 h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
					/>

					<label className="mt-4 block text-sm font-semibold text-[#576363]">
						End Date
					</label>
					<input
						type="datetime-local"
						value={endAt}
						onChange={(event) => setEndAt(event.target.value)}
						className="mt-1 h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
					/>

					<label className="mt-4 block text-sm font-semibold text-[#576363]">
						Reason (optional)
					</label>
					<textarea
						value={reason}
						onChange={(event) => setReason(event.target.value)}
						placeholder="Why is this investment being added?"
						rows={3}
						className="mt-1 w-full rounded-md border border-[#cfdcda] bg-white px-3 py-2 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
					/>

					<footer className="mt-5 flex flex-wrap justify-end gap-3">
						<Button type="button" variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" disabled={!canSubmit}>
							{isSaving ? "Adding…" : "Add Investment"}
						</Button>
					</footer>
				</form>
			</section>
		</div>
	);
}
