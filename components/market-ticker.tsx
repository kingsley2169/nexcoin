"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
	fallbackMarketAssets,
	formatMarketChange,
	formatMarketPrice,
	type MarketAsset,
} from "@/lib/market-data";

function MarketTickerCard({ asset }: { asset: MarketAsset }) {
	const isPositive = (asset.change24h ?? 0) >= 0;

	return (
		<article className="min-w-44 rounded-lg border border-[#d7e5e3] bg-[#f7faf9] px-4 py-3">
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-sm font-semibold text-[#576363]">
						{asset.symbol}
					</p>
					<p className="mt-1 text-xs text-[#5d6163]">{asset.name}</p>
				</div>
				<p
					className={cn(
						"rounded-md px-2 py-1 text-xs font-semibold",
						isPositive
							? "bg-[#e5f3f1] text-[#3c7f80]"
							: "bg-[#fbeaea] text-[#b54848]",
					)}
				>
					{formatMarketChange(asset.change24h)}
				</p>
			</div>
			<p className="mt-4 text-lg font-semibold text-[#576363]">
				{formatMarketPrice(asset.price)}
			</p>
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
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center">
					<div className="flex shrink-0 items-center justify-between gap-4 lg:w-48 lg:flex-col lg:items-start">
						<div>
							<p className="text-sm font-semibold text-[#576363]">
								Market updates
							</p>
						</div>
						<div className="h-2.5 w-2.5 rounded-full bg-[#5F9EA0]" />
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
