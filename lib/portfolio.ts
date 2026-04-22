export type PortfolioRange = "30D" | "90D" | "1Y";

export type PortfolioSummary = {
	bestPlan: { name: string; returnPercent: number };
	profitChangePercent: number;
	totalInvested: number;
	totalProfit: number;
	totalValue: number;
};

export type PortfolioAllocationSegment = {
	amount: number;
	color: string;
	name: string;
};

export type PortfolioPosition = {
	amount: number;
	id: string;
	maturityDate: string;
	planName: string;
	progress: number;
	projectedReturn: number;
	startDate: string;
	status: "Active" | "Maturing" | "Near completion" | "Pending";
};

export type PortfolioHolding = {
	amount: number;
	change24h: number;
	name: string;
	symbol: string;
	valueUsd: number;
};

export type PortfolioProfitEntry = {
	amount: number;
	date: string;
	id: string;
	planName: string;
	status: "Accruing" | "Credited" | "Pending";
};

export type PortfolioData = {
	allocation: PortfolioAllocationSegment[];
	holdings: PortfolioHolding[];
	performance: Record<PortfolioRange, number[]>;
	positions: PortfolioPosition[];
	profitHistory: PortfolioProfitEntry[];
	summary: PortfolioSummary;
};

export const portfolioData: PortfolioData = {
	allocation: [
		{ amount: 2000, color: "#9fc8c9", name: "Beginner" },
		{ amount: 3000, color: "#5F9EA0", name: "Amateur" },
		{ amount: 10000, color: "#3c7f80", name: "Advanced" },
		{ amount: 3000, color: "#1f5556", name: "Pro" },
	],
	holdings: [
		{
			amount: 0.218,
			change24h: 2.14,
			name: "Bitcoin",
			symbol: "BTC",
			valueUsd: 14120,
		},
		{
			amount: 2.04,
			change24h: -0.42,
			name: "Ethereum",
			symbol: "ETH",
			valueUsd: 6480,
		},
		{
			amount: 28.6,
			change24h: 3.62,
			name: "Solana",
			symbol: "SOL",
			valueUsd: 4240,
		},
	],
	performance: {
		"1Y": [
			9800, 10400, 11100, 12000, 12800, 13500, 14200, 15100, 16000, 17200,
			18400, 20050,
		],
		"30D": [
			17800, 17950, 18100, 18240, 18500, 18700, 18650, 18980, 19200, 19480,
			19700, 20050,
		],
		"90D": [
			15200, 15800, 16200, 16700, 17100, 17400, 17900, 18200, 18700, 19100,
			19500, 20050,
		],
	},
	positions: [
		{
			amount: 5000,
			id: "pos-1",
			maturityDate: "2026-04-24",
			planName: "Advanced Plan",
			progress: 62,
			projectedReturn: 750,
			startDate: "2026-04-12",
			status: "Active",
		},
		{
			amount: 1250,
			id: "pos-2",
			maturityDate: "2026-04-22",
			planName: "Amateur Plan",
			progress: 88,
			projectedReturn: 125,
			startDate: "2026-04-19",
			status: "Near completion",
		},
		{
			amount: 5000,
			id: "pos-3",
			maturityDate: "2026-04-21",
			planName: "Advanced Plan",
			progress: 97,
			projectedReturn: 750,
			startDate: "2026-04-05",
			status: "Maturing",
		},
		{
			amount: 3000,
			id: "pos-4",
			maturityDate: "2026-04-30",
			planName: "Pro Plan",
			progress: 42,
			projectedReturn: 600,
			startDate: "2026-04-18",
			status: "Active",
		},
	],
	profitHistory: [
		{
			amount: 480,
			date: "2026-04-17",
			id: "pr-1",
			planName: "Advanced Plan",
			status: "Credited",
		},
		{
			amount: 125,
			date: "2026-04-16",
			id: "pr-2",
			planName: "Amateur Plan",
			status: "Credited",
		},
		{
			amount: 320,
			date: "2026-04-15",
			id: "pr-3",
			planName: "Advanced Plan",
			status: "Accruing",
		},
		{
			amount: 600,
			date: "2026-04-14",
			id: "pr-4",
			planName: "Pro Plan",
			status: "Pending",
		},
		{
			amount: 80,
			date: "2026-04-13",
			id: "pr-5",
			planName: "Beginner Plan",
			status: "Credited",
		},
	],
	summary: {
		bestPlan: { name: "Advanced", returnPercent: 21.4 },
		profitChangePercent: 18.6,
		totalInvested: 18000,
		totalProfit: 6850,
		totalValue: 24850,
	},
};
