import { NextResponse } from "next/server";

const coins = [
	{ id: "bitcoin", name: "Bitcoin", symbol: "BTC" },
	{ id: "ethereum", name: "Ethereum", symbol: "ETH" },
	{ id: "binancecoin", name: "BNB", symbol: "BNB" },
	{ id: "solana", name: "Solana", symbol: "SOL" },
	{ id: "dogecoin", name: "Dogecoin", symbol: "DOGE" },
	{ id: "ripple", name: "XRP", symbol: "XRP" },
	{ id: "cardano", name: "Cardano", symbol: "ADA" },
	{ id: "avalanche-2", name: "Avalanche", symbol: "AVAX" },
	{ id: "chainlink", name: "Chainlink", symbol: "LINK" },
	{ id: "polkadot", name: "Polkadot", symbol: "DOT" },
	{ id: "litecoin", name: "Litecoin", symbol: "LTC" },
	{ id: "tron", name: "TRON", symbol: "TRX" },
	{ id: "the-open-network", name: "Toncoin", symbol: "TON" },
	{ id: "polygon-ecosystem-token", name: "Polygon", symbol: "POL" },
];

type CoinGeckoPrice = {
	last_updated_at?: number;
	usd?: number;
	usd_24h_change?: number;
};

export async function GET() {
	const ids = coins.map((coin) => coin.id).join(",");
	const params = new URLSearchParams({
		ids,
		include_24hr_change: "true",
		include_last_updated_at: "true",
		precision: "2",
		vs_currencies: "usd",
	});

	const proApiKey = process.env.COINGECKO_PRO_API_KEY;
	const demoApiKey = process.env.COINGECKO_API_KEY;
	const baseUrl = proApiKey
		? "https://pro-api.coingecko.com/api/v3/simple/price"
		: "https://api.coingecko.com/api/v3/simple/price";

	const headers = new Headers({
		accept: "application/json",
	});

	if (proApiKey) {
		headers.set("x-cg-pro-api-key", proApiKey);
	}

	if (!proApiKey && demoApiKey) {
		headers.set("x-cg-demo-api-key", demoApiKey);
	}

	try {
		const response = await fetch(`${baseUrl}?${params.toString()}`, {
			headers,
			next: { revalidate: 60 },
		});

		if (!response.ok) {
			return NextResponse.json(
				{ error: "Unable to load market prices." },
				{ status: response.status },
			);
		}

		const data = (await response.json()) as Record<string, CoinGeckoPrice>;
		const assets = coins.map((coin) => ({
			change24h: data[coin.id]?.usd_24h_change ?? null,
			id: coin.id,
			lastUpdatedAt: data[coin.id]?.last_updated_at ?? null,
			name: coin.name,
			price: data[coin.id]?.usd ?? null,
			symbol: coin.symbol,
		}));

		return NextResponse.json(
			{
				assets,
				source: "CoinGecko",
			},
			{
				headers: {
					"Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
				},
			},
		);
	} catch {
		return NextResponse.json(
			{ error: "Unable to load market prices." },
			{ status: 503 },
		);
	}
}
