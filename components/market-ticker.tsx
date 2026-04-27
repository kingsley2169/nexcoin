"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
	fallbackMarketAssets,
	formatMarketChange,
	formatMarketPrice,
	type MarketAsset,
} from "@/lib/market-data";

function buildSparklineSeries(asset: MarketAsset) {
	const basePrice = Math.max(asset.price ?? 0.01, 0.01);
	const change = asset.change24h ?? 0;
	const direction = change >= 0 ? 1 : -1;
	const volatility = Math.min(Math.abs(change) / 100, 0.6);

	return Array.from({ length: 7 }, (_, index) => {
		const progress = index / 6;
		const trend = direction * progress * volatility * basePrice;
		const wiggle = Math.sin(index * 1.6) * basePrice * 0.01;
		const baseLevel = basePrice * (1 - volatility * 0.45);

		return Math.max(baseLevel + trend + wiggle, 0.001);
	});
}

function buildSparklinePath(series: number[]) {
	if (series.length === 0) {
		return { areaPath: "", linePath: "" };
	}

	const minValue = Math.min(...series);
	const maxValue = Math.max(...series);
	const range = Math.max(maxValue - minValue, 0.01);
	const stepX = 100 / Math.max(series.length - 1, 1);

	const points = series.map((value, index) => {
		const x = index * stepX;
		const y = 36 - ((value - minValue) / range) * 28;

		return { x, y };
	});

	const linePath = points
		.map((point, index) =>
			`${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
		)
		.join(" ");

	const first = points[0];
	const last = points[points.length - 1];
	const areaPath = `${linePath} L${last.x.toFixed(1)} 36 L${first.x.toFixed(1)} 36 Z`;

	return { linePath, areaPath };
}

function MarketTickerCard({ asset }: { asset: MarketAsset }) {
	const isPositive = (asset.change24h ?? 0) >= 0;
	const series = useMemo(() => buildSparklineSeries(asset), [asset]);
	const { linePath, areaPath } = useMemo(
		() => buildSparklinePath(series),
		[series],
	);
	const chartColor = isPositive ? "#2e8f5b" : "#b54848";
	const chartFill = isPositive ? "rgba(46, 143, 91, 0.18)" : "rgba(181, 72, 72, 0.14)";

	return (
		<article className="group relative min-w-[18rem] max-w-[18rem] shrink-0 rounded-3xl border border-[#d7e5e3] bg-gradient-to-br from-white to-[#f7faf9] p-4 shadow-[0_18px_50px_rgba(87,99,99,0.08)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(87,99,99,0.14)]">
			<div className="absolute right-4 top-4 hidden w-44 rounded-2xl border border-[#d7e5e3] bg-white/95 p-3 text-[11px] text-[#394141] shadow-lg backdrop-blur-sm group-hover:block">
				<p className="font-semibold text-[#263236]">Quick market view</p>
				<p className="mt-1 text-xs text-[#5d6163]">{asset.name}</p>
				<p className="mt-2 text-xs leading-5">
					{formatMarketPrice(asset.price)} • {formatMarketChange(asset.change24h)}
				</p>
				<p className="mt-2 text-xs text-[#5d6163]">
					{isPositive ? "Upward momentum" : "Downward momentum"}
				</p>
			</div>

			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-sm font-semibold text-[#576363]">{asset.symbol}</p>
					<p className="mt-1 text-xs text-[#5d6163]">{asset.name}</p>
				</div>
				<span
					className={cn(
						"rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
						isPositive
							? "bg-[#ebf7f0] text-[#2e8f5b]"
							: "bg-[#fde8e8] text-[#b54848]",
					)}
				>
					{formatMarketChange(asset.change24h)}
				</span>
			</div>

			<div className="mt-4 flex items-end justify-between gap-4">
				<div className="min-w-0">
					<p className="text-2xl font-semibold tracking-tight text-[#2a3638]">
						{formatMarketPrice(asset.price)}
					</p>
					<p className="mt-1 text-xs text-[#7d8c8b]">24h trend</p>
				</div>

				<div className="h-16 w-32 rounded-2xl bg-white/90 p-2 shadow-inner shadow-[#ffffff80]">
					<svg viewBox="0 0 100 40" className="h-full w-full" aria-hidden="true">
						<path d={areaPath} fill={chartFill} />
						<path
							d={linePath}
							fill="none"
							stroke={chartColor}
							strokeWidth="2"
							strokeLinecap="round"
							pathLength="100"
							strokeDasharray="100"
							strokeDashoffset="100"
							className="sparkline-animate"
						/>
					</svg>
				</div>
			</div>
		</article>
	);
}

export function MarketTicker() {
	const [assets, setAssets] = useState<MarketAsset[]>(fallbackMarketAssets);

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
				};

				if (isMounted && data.assets?.length) {
					setAssets(data.assets);
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

	return (
		<section className="border-y border-[#d7e5e3] bg-white">
			<div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex flex-col gap-2 rounded-3xl border border-[#e4efed] bg-[#f6fbfa] px-4 py-3 shadow-sm sm:px-5 sm:py-4">
						<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#576363]">
							Market updates
						</p>
						
					</div>
					<div className="-mx-4 overflow-hidden px-4 lg:mx-0 lg:px-0">
						<div className="ticker-scroll flex w-max gap-3 motion-reduce:animate-none">
							{[...assets, ...assets].map((asset, index) => (
								<MarketTickerCard key={`${asset.id}-${index}`} asset={asset} />
							))}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

