export type MarketAsset = {
	change24h: number | null;
	id: string;
	lastUpdatedAt: number | null;
	name: string;
	price: number | null;
	symbol: string;
};

export const fallbackMarketAssets: MarketAsset[] = [
	{
		change24h: 2.14,
		id: "bitcoin",
		lastUpdatedAt: null,
		name: "Bitcoin",
		price: 64820.5,
		symbol: "BTC",
	},
	{
		change24h: -0.42,
		id: "ethereum",
		lastUpdatedAt: null,
		name: "Ethereum",
		price: 3180.25,
		symbol: "ETH",
	},
	{
		change24h: 1.08,
		id: "binancecoin",
		lastUpdatedAt: null,
		name: "BNB",
		price: 592.4,
		symbol: "BNB",
	},
	{
		change24h: 3.62,
		id: "solana",
		lastUpdatedAt: null,
		name: "Solana",
		price: 148.16,
		symbol: "SOL",
	},
	{
		change24h: -1.35,
		id: "dogecoin",
		lastUpdatedAt: null,
		name: "Dogecoin",
		price: 0.16,
		symbol: "DOGE",
	},
	{
		change24h: 0.74,
		id: "ripple",
		lastUpdatedAt: null,
		name: "XRP",
		price: 0.54,
		symbol: "XRP",
	},
	{
		change24h: 1.92,
		id: "cardano",
		lastUpdatedAt: null,
		name: "Cardano",
		price: 0.46,
		symbol: "ADA",
	},
	{
		change24h: -0.88,
		id: "avalanche-2",
		lastUpdatedAt: null,
		name: "Avalanche",
		price: 35.27,
		symbol: "AVAX",
	},
	{
		change24h: 2.47,
		id: "chainlink",
		lastUpdatedAt: null,
		name: "Chainlink",
		price: 14.91,
		symbol: "LINK",
	},
	{
		change24h: -0.31,
		id: "polkadot",
		lastUpdatedAt: null,
		name: "Polkadot",
		price: 6.82,
		symbol: "DOT",
	},
	{
		change24h: 0.58,
		id: "litecoin",
		lastUpdatedAt: null,
		name: "Litecoin",
		price: 82.34,
		symbol: "LTC",
	},
	{
		change24h: 1.16,
		id: "tron",
		lastUpdatedAt: null,
		name: "TRON",
		price: 0.12,
		symbol: "TRX",
	},
	{
		change24h: -1.04,
		id: "the-open-network",
		lastUpdatedAt: null,
		name: "Toncoin",
		price: 5.64,
		symbol: "TON",
	},
	{
		change24h: 0.39,
		id: "polygon-ecosystem-token",
		lastUpdatedAt: null,
		name: "Polygon",
		price: 0.42,
		symbol: "POL",
	},
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
	currency: "USD",
	maximumFractionDigits: 2,
	minimumFractionDigits: 2,
	style: "currency",
});

export function formatMarketPrice(price: number | null) {
	if (price === null) {
		return "Unavailable";
	}

	if (price < 1) {
		return `$${price.toFixed(4)}`;
	}

	return currencyFormatter.format(price);
}

export function formatMarketChange(change: number | null) {
	if (change === null) {
		return "0.00%";
	}

	return `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`;
}

export function formatMarketTimestamp(timestamp: number | null) {
	if (timestamp === null) {
		return "Pending update";
	}

	return new Intl.DateTimeFormat("en-US", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(timestamp * 1000));
}
