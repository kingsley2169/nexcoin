"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cancelInvestment, startInvestment } from "@/app/account/plans/actions";
import type {
	AccountPlan as InvestmentPlan,
	AccountPlansSummary as AccountSummary,
	ActiveAccountPlan as ActivePlan,
} from "@/lib/account-plans";
import { cn } from "@/lib/utils";

type AccountPlansProps = {
	accountSummary: AccountSummary;
	activePlans: ActivePlan[];
	plans: InvestmentPlan[];
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
	currency: "USD",
	maximumFractionDigits: 2,
	style: "currency",
});

const summaryItems = [
	{ key: "availableBalance", label: "Available Balance" },
	{ key: "activeInvestment", label: "Active Investment" },
	{ key: "projectedProfit", label: "Projected Profit" },
	{ key: "activePlans", label: "Current Active Plans" },
] as const;

function formatCurrency(value: number) {
	return currencyFormatter.format(value);
}

function formatLimit(value: number | null) {
	return value === null ? "Custom" : formatCurrency(value);
}

function getMaturityDate(durationDays: number) {
	const date = new Date();
	date.setDate(date.getDate() + durationDays);

	return date.toLocaleDateString("en-US", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

export function AccountPlans({
	accountSummary,
	activePlans,
	plans,
}: AccountPlansProps) {
	const [isPending, startTransition] = useTransition();
	const [selectedPlanId, setSelectedPlanId] = useState(plans[1]?.id ?? plans[0].id);
	const selectedPlan =
		plans.find((plan) => plan.id === selectedPlanId) ?? plans[0];
	const [amount, setAmount] = useState(
		selectedPlan ? String(selectedPlan.minInvestment) : "",
	);
	const [acceptedTerms, setAcceptedTerms] = useState(false);
	const [notice, setNotice] = useState<{
		message: string;
		tone: "error" | "success";
	} | null>(null);

	const numericAmount = Number(amount);
	const isValidAmount =
		selectedPlan !== undefined &&
		Number.isFinite(numericAmount) &&
		numericAmount >= selectedPlan.minInvestment &&
		(selectedPlan.maxInvestment === null ||
			numericAmount <= selectedPlan.maxInvestment) &&
		numericAmount <= accountSummary.availableBalance;

	const calculator = useMemo(() => {
		if (!selectedPlan) {
			return {
				availableAfterInvestment: accountSummary.availableBalance,
				expectedReturn: 0,
				maturityDate: "",
				totalPayout: 0,
			};
		}

		const safeAmount = Number.isFinite(numericAmount) ? numericAmount : 0;
		const expectedReturn = safeAmount * (selectedPlan.rate / 100);

		return {
			availableAfterInvestment: Math.max(
				accountSummary.availableBalance - safeAmount,
				0,
			),
			expectedReturn,
			maturityDate: getMaturityDate(selectedPlan.durationDays),
			totalPayout: safeAmount + expectedReturn,
		};
	}, [
		accountSummary.availableBalance,
		numericAmount,
		selectedPlan,
	]);

	if (!selectedPlan) {
		return (
			<div className="rounded-lg border border-[#d7e5e3] bg-white p-6 text-sm text-[#5d6163] shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				No investment plans are available right now.
			</div>
		);
	}

	function selectPlan(plan: InvestmentPlan) {
		setSelectedPlanId(plan.id);
		setAmount(String(plan.minInvestment));
		setAcceptedTerms(false);
		setNotice(null);
	}

	function handleStartInvestment() {
		setNotice(null);
		startTransition(async () => {
			const result = await startInvestment({
				amountUsd: numericAmount,
				planId: selectedPlan.id,
			});

			if (!result.ok) {
				setNotice({ message: result.error, tone: "error" });
				return;
			}

			setAcceptedTerms(false);
			setAmount(String(selectedPlan.minInvestment));
			setNotice({
				message: "Investment started. Your plan summary is refreshing now.",
				tone: "success",
			});
		});
	}

	return (
		<div className="space-y-8">
			<section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
				<div className="max-w-2xl">
					<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
						Plans
					</p>
					<h1 className="mt-3 text-3xl font-semibold text-[#576363] sm:text-4xl">
						Investment Plans
					</h1>
					<p className="mt-3 text-sm leading-6 text-[#5d6163] sm:text-base">
						Choose a plan, review the expected return, and start a new
						investment from your account balance.
					</p>
				</div>
				<div className="flex flex-wrap gap-3">
					<Link
						href="/account/deposit"
						className={buttonVariants({ size: "md" })}
					>
						Deposit Funds
					</Link>
					<Link
						href="/account"
						className={buttonVariants({ size: "md", variant: "outline" })}
					>
						View Active Plans
					</Link>
				</div>
			</section>

			<section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
				{summaryItems.map((item) => {
					const value = accountSummary[item.key];
					const displayValue =
						item.key === "activePlans" ? String(value) : formatCurrency(value);

					return (
						<div
							key={item.key}
							className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]"
						>
							<p className="text-sm text-[#5d6163]">{item.label}</p>
							<p className="mt-2 text-2xl font-semibold text-[#576363]">
								{displayValue}
							</p>
						</div>
					);
				})}
			</section>

			<div className="grid gap-6 xl:grid-cols-[1fr_380px]">
				<section className="space-y-5">
					<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
						<div>
							<h2 className="text-xl font-semibold text-[#576363]">
								Compare plans
							</h2>
							<p className="mt-1 text-sm text-[#5d6163]">
								Review limits, duration, and payout schedule before selecting a
								plan.
							</p>
						</div>
					</div>

					<div className="grid gap-5 lg:grid-cols-2">
						{plans.map((plan) => {
							const isSelected = plan.id === selectedPlan.id;

							return (
								<article
									key={plan.id}
									className={cn(
										"flex h-full flex-col rounded-lg border bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)] transition",
										isSelected
											? "border-[#5F9EA0] ring-4 ring-[#5F9EA0]/10"
											: "border-[#d7e5e3]",
									)}
								>
									<div className="flex items-start justify-between gap-4">
										<div>
											<p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5F9EA0]">
												{plan.tag}
											</p>
											<h3 className="mt-2 text-2xl font-semibold text-[#576363]">
												{plan.name}
											</h3>
											<p className="mt-2 text-sm text-[#5d6163]">
												Best for {plan.bestFor.toLowerCase()}.
											</p>
										</div>
										<span className="rounded-md bg-[#e5f3f1] px-2.5 py-1 text-xs font-semibold text-[#3c7f80]">
											{plan.availability}
										</span>
									</div>

									<div className="mt-6 grid gap-3 sm:grid-cols-2">
										<div className="rounded-md bg-[#f7faf9] p-3">
											<p className="text-xs uppercase tracking-[0.14em] text-[#5F9EA0]">
												Min
											</p>
											<p className="mt-1 font-semibold text-[#576363]">
												{formatCurrency(plan.minInvestment)}
											</p>
										</div>
										<div className="rounded-md bg-[#f7faf9] p-3">
											<p className="text-xs uppercase tracking-[0.14em] text-[#5F9EA0]">
												Max
											</p>
											<p className="mt-1 font-semibold text-[#576363]">
												{formatLimit(plan.maxInvestment)}
											</p>
										</div>
										<div className="rounded-md bg-[#f7faf9] p-3">
											<p className="text-xs uppercase tracking-[0.14em] text-[#5F9EA0]">
												Return
											</p>
											<p className="mt-1 font-semibold text-[#576363]">
												{plan.rate}%
											</p>
										</div>
										<div className="rounded-md bg-[#f7faf9] p-3">
											<p className="text-xs uppercase tracking-[0.14em] text-[#5F9EA0]">
												Duration
											</p>
											<p className="mt-1 font-semibold text-[#576363]">
												{plan.durationDays}{" "}
												{plan.durationDays === 1 ? "day" : "days"}
											</p>
										</div>
									</div>

									<div className="mt-5 text-sm text-[#5d6163]">
										<p>
											<span className="font-semibold text-[#576363]">
												Payout:
											</span>{" "}
											{plan.payoutSchedule}
										</p>
										{plan.description ? (
											<p className="mt-2">{plan.description}</p>
										) : null}
									</div>

									<div className="mt-auto pt-6">
										<Button
											className="w-full"
											onClick={() => selectPlan(plan)}
											variant={isSelected ? "secondary" : "primary"}
										>
											{isSelected ? "Selected Plan" : "Select Plan"}
										</Button>
									</div>
								</article>
							);
						})}
					</div>
				</section>

				<aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
					<section className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
						<p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5F9EA0]">
							Calculator
						</p>
						<h2 className="mt-2 text-xl font-semibold text-[#576363]">
							Estimate payout
						</h2>
						<p className="mt-2 text-sm leading-6 text-[#5d6163]">
							Selected plan:{" "}
							<span className="font-semibold text-[#576363]">
								{selectedPlan.name}
							</span>
						</p>

						<label
							htmlFor="investment-amount"
							className="mt-5 block text-sm font-semibold text-[#576363]"
						>
							Investment amount
						</label>
						<div className="mt-2 flex h-12 items-center rounded-md border border-[#cfdcda] bg-white px-3 focus-within:border-[#5F9EA0] focus-within:ring-4 focus-within:ring-[#5F9EA0]/15">
							<span className="text-sm font-semibold text-[#5d6163]">$</span>
							<input
								id="investment-amount"
								min={selectedPlan.minInvestment}
								max={selectedPlan.maxInvestment ?? undefined}
								onChange={(event) => setAmount(event.target.value)}
								type="number"
								value={amount}
								className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm font-semibold text-[#576363] outline-none"
							/>
						</div>
						{!isValidAmount ? (
							<p className="mt-2 text-sm text-red-600">
								Enter an amount within the plan limits and your available
								balance.
							</p>
						) : null}
						{notice ? (
							<p
								className={cn(
									"mt-2 text-sm",
									notice.tone === "error" ? "text-red-600" : "text-[#2e8f5b]",
								)}
							>
								{notice.message}
							</p>
						) : null}

						<div className="mt-5 space-y-3 rounded-md bg-[#f7faf9] p-4">
							<div className="flex justify-between gap-4 text-sm">
								<span className="text-[#5d6163]">Expected return</span>
								<span className="font-semibold text-[#576363]">
									{formatCurrency(calculator.expectedReturn)}
								</span>
							</div>
							<div className="flex justify-between gap-4 text-sm">
								<span className="text-[#5d6163]">Total payout</span>
								<span className="font-semibold text-[#576363]">
									{formatCurrency(calculator.totalPayout)}
								</span>
							</div>
							<div className="flex justify-between gap-4 text-sm">
								<span className="text-[#5d6163]">Maturity date</span>
								<span className="font-semibold text-[#576363]">
									{calculator.maturityDate}
								</span>
							</div>
							<div className="flex justify-between gap-4 text-sm">
								<span className="text-[#5d6163]">Balance after</span>
								<span className="font-semibold text-[#576363]">
									{formatCurrency(calculator.availableAfterInvestment)}
								</span>
							</div>
						</div>

						<label className="mt-5 flex items-start gap-3 text-sm leading-6 text-[#5d6163]">
							<input
								checked={acceptedTerms}
								onChange={(event) => setAcceptedTerms(event.target.checked)}
								type="checkbox"
								className="mt-1 h-4 w-4 rounded border-[#cfdcda] accent-[#5F9EA0]"
							/>
							I have reviewed the selected plan details before starting this
							investment.
						</label>

						<Button
							className="mt-5 w-full"
							disabled={!isValidAmount || !acceptedTerms || isPending}
							onClick={handleStartInvestment}
						>
							{isPending ? "Starting..." : "Start Investment"}
						</Button>
					</section>

					<section className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
						<h2 className="text-xl font-semibold text-[#576363]">
							Active plans
						</h2>
						<p className="mt-2 text-sm text-[#5d6163]">
							Investments can be cancelled only during the first 15 minutes
							after they are started.
						</p>
						<div className="mt-5 space-y-4">
							{activePlans.length === 0 ? (
								<div className="rounded-md bg-[#f7faf9] p-4 text-sm text-[#5d6163]">
									You do not have any active plans yet.
								</div>
							) : (
								activePlans.map((plan) => (
									<div key={plan.id} className="rounded-md bg-[#f7faf9] p-4">
										<div className="flex items-start justify-between gap-4">
											<div>
												<p className="font-semibold text-[#576363]">
													{plan.name}
												</p>
												<p className="mt-1 text-sm text-[#5d6163]">
													{formatCurrency(plan.amount)} invested
												</p>
											</div>
											<span className="rounded-md bg-[#e5f3f1] px-2.5 py-1 text-xs font-semibold text-[#3c7f80]">
												{plan.status}
											</span>
										</div>
										<div className="mt-4 h-2 rounded-full bg-white">
											<div
												className="h-2 rounded-full bg-[#5F9EA0]"
												style={{ width: `${plan.progress}%` }}
											/>
										</div>
										<p className="mt-3 text-sm text-[#5d6163]">
											Matures {plan.maturityDate}
										</p>
										{plan.canCancel ? (
											<Button
												className="mt-3"
												size="sm"
												variant="outline"
												disabled={isPending}
												onClick={() => {
													setNotice(null);
													startTransition(async () => {
														const result = await cancelInvestment(plan.id);

														if (!result.ok) {
															setNotice({
																message: result.error,
																tone: "error",
															});
															return;
														}

														setNotice({
															message:
																"Investment cancelled during the grace window. Your balance is refreshing now.",
															tone: "success",
														});
													});
												}}
											>
												{isPending ? "Updating..." : "Cancel Investment"}
											</Button>
										) : (
											<p className="mt-3 text-xs font-medium text-[#5d6163]">
												Cancel window expired
											</p>
										)}
									</div>
								))
							)}
						</div>
					</section>
				</aside>
			</div>
		</div>
	);
}
