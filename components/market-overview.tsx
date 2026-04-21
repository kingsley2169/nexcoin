"use client";

import { useEffect, useMemo, useState } from "react";
import {
	fallbackMarketAssets,
	formatMarketChange,
	formatMarketPrice,
	formatMarketTimestamp,
	type MarketAsset,
} from "@/lib/market-data";
import { cn } from "@/lib/utils";

function getChangeValue(asset: MarketAsset) {
	return asset.change24h ?? 0;
}

function getStatus(change: number | null) {
	if (change === null) {
		return "Pending";
	}

	if (change > 0.25) {
		return "Positive";
	}

	if (change < -0.25) {
		return "Negative";
	}

	return "Stable";
}

export function MarketOverview() {
	const [assets, setAssets] = useState<MarketAsset[]>(fallbackMarketAssets);
	const [source, setSource] = useState("Indicative data");

	useEffect(() => {
		let isMounted = true;

		async function loadMarketData() {
			try {
				const response = await fetch("/api/market-ticker");

				if (!response.ok) {
					return;
				}

				const data = (await response.json()) as {
					assets?: MarketAsset[];
					source?: string;
				};

				if (isMounted && data.assets?.length) {
					setAssets(data.assets);
					setSource(data.source ?? "CoinGecko");
				}
			} catch {}
		}

		loadMarketData();
		const interval = window.setInterval(loadMarketData, 60000);

		return () => {
			isMounted = false;
			window.clearInterval(interval);
		};
	}, []);

	const snapshot = useMemo(() => {
		const positive = assets.filter((asset) => getChangeValue(asset) > 0).length;
		const negative = assets.filter((asset) => getChangeValue(asset) < 0).length;
		const sorted = [...assets].sort(
			(a, b) => getChangeValue(b) - getChangeValue(a),
		);
		const stable = [...assets].sort(
			(a, b) => Math.abs(getChangeValue(a)) - Math.abs(getChangeValue(b)),
		)[0];

		return {
			best: sorted[0],
			negative,
			positive,
			stable,
			worst: sorted[sorted.length - 1],
		};
	}, [assets]);

	const snapshotCards = [
		{ label: "Assets tracked", value: String(assets.length) },
		{ label: "Positive movers", value: String(snapshot.positive) },
		{ label: "Negative movers", value: String(snapshot.negative) },
		{ label: "Data source", value: source },
	];

	return (
		<div className="space-y-10">
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{snapshotCards.map((card) => (
					<div
						key={card.label}
						className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]"
					>
						<p className="text-sm text-[#5d6163]">{card.label}</p>
						<p className="mt-2 text-2xl font-semibold text-[#576363]">
							{card.value}
						</p>
					</div>
				))}
			</div>

			<div className="grid gap-5 lg:grid-cols-3">
				{[
					{ asset: snapshot.best, label: "Best 24h performer" },
					{ asset: snapshot.worst, label: "Weakest 24h performer" },
					{ asset: snapshot.stable, label: "Most stable movement" },
				].map((item) => (
					<div
						key={item.label}
						className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]"
					>
						<p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#5F9EA0]">
							{item.label}
						</p>
						<p className="mt-4 text-2xl font-semibold text-[#576363]">
							{item.asset?.symbol ?? "N/A"}
						</p>
						<p className="mt-2 text-sm text-[#5d6163]">
							{item.asset?.name ?? "Pending market update"}
						</p>
						<p
							className={cn(
								"mt-4 inline-flex rounded-md px-2.5 py-1 text-sm font-semibold",
								getChangeValue(item.asset ?? fallbackMarketAssets[0]) >= 0
									? "bg-[#e5f3f1] text-[#3c7f80]"
									: "bg-[#fbeaea] text-[#b54848]",
							)}
						>
							{formatMarketChange(item.asset?.change24h ?? null)}
						</p>
					</div>
				))}
			</div>

			<div className="overflow-hidden rounded-lg border border-[#d7e5e3] bg-white shadow-[0_24px_80px_rgba(87,99,99,0.12)]">
				<div className="hidden overflow-x-auto lg:block">
					<table className="w-full min-w-[900px] border-collapse text-left">
						<thead className="bg-[#f7faf9] text-sm text-[#576363]">
							<tr>
								<th className="px-5 py-4 font-semibold">Asset</th>
								<th className="px-5 py-4 font-semibold">Symbol</th>
								<th className="px-5 py-4 font-semibold">Price</th>
								<th className="px-5 py-4 font-semibold">24h Change</th>
								<th className="px-5 py-4 font-semibold">Market Status</th>
								<th className="px-5 py-4 font-semibold">Last Updated</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-[#e3ecea]">
							{assets.map((asset) => {
								const isPositive = getChangeValue(asset) >= 0;

								return (
									<tr key={asset.id}>
										<td className="px-5 py-4">
											<p className="font-semibold text-[#576363]">
												{asset.name}
											</p>
										</td>
										<td className="px-5 py-4 text-sm font-semibold text-[#5F9EA0]">
											{asset.symbol}
										</td>
										<td className="px-5 py-4 text-sm text-[#5d6163]">
											{formatMarketPrice(asset.price)}
										</td>
										<td className="px-5 py-4">
											<span
												className={cn(
													"rounded-md px-2.5 py-1 text-sm font-semibold",
													isPositive
														? "bg-[#e5f3f1] text-[#3c7f80]"
														: "bg-[#fbeaea] text-[#b54848]",
												)}
											>
												{formatMarketChange(asset.change24h)}
											</span>
										</td>
										<td className="px-5 py-4 text-sm text-[#5d6163]">
											{getStatus(asset.change24h)}
										</td>
										<td className="px-5 py-4 text-sm text-[#5d6163]">
											{formatMarketTimestamp(asset.lastUpdatedAt)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>

				<div className="grid gap-3 p-4 lg:hidden">
					{assets.map((asset) => {
						const isPositive = getChangeValue(asset) >= 0;

						return (
							<article
								key={asset.id}
								className="rounded-lg border border-[#e3ecea] bg-[#f7faf9] p-4"
							>
								<div className="flex items-start justify-between gap-4">
									<div>
										<p className="font-semibold text-[#576363]">
											{asset.name}
										</p>
										<p className="mt-1 text-sm font-semibold text-[#5F9EA0]">
											{asset.symbol}
										</p>
									</div>
									<span
										className={cn(
											"rounded-md px-2.5 py-1 text-sm font-semibold",
											isPositive
												? "bg-[#e5f3f1] text-[#3c7f80]"
												: "bg-[#fbeaea] text-[#b54848]",
										)}
									>
										{formatMarketChange(asset.change24h)}
									</span>
								</div>
								<div className="mt-4 grid gap-2 text-sm text-[#5d6163]">
									<p>Price: {formatMarketPrice(asset.price)}</p>
									<p>Status: {getStatus(asset.change24h)}</p>
									<p>Updated: {formatMarketTimestamp(asset.lastUpdatedAt)}</p>
								</div>
							</article>
						);
					})}
				</div>
			</div>
		</div>
	);
}
