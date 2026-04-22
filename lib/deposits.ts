export type DepositMethodType = "cash" | "crypto" | "ecurrency" | "paypal";

export type DepositAssetStatus = "Active" | "Maintenance";

export type DepositStatus = "Confirming" | "Credited" | "Pending" | "Rejected";

export type CryptoDepositAsset = {
	address: string;
	color: string;
	confirmationsRequired: number;
	id: string;
	minDeposit: number;
	name: string;
	network: string;
	rateUsd: number;
	status: DepositAssetStatus;
	symbol: string;
};

export type DepositMethod = {
	description: string;
	id: DepositMethodType;
	label: string;
	minUsd: number;
	reviewTime: string;
};

export type RecentDeposit = {
	amount: number;
	amountUsd: number;
	assetSymbol: string;
	createdAt: string;
	id: string;
	method: string;
	reference: string;
	status: DepositStatus;
};

export type DepositData = {
	assets: CryptoDepositAsset[];
	methods: DepositMethod[];
	recentDeposits: RecentDeposit[];
	rules: string[];
	summary: {
		availableBalanceUsd: number;
		lastDepositLabel: string;
		pendingDepositsUsd: number;
		supportedMethods: number;
	};
};

export const depositData: DepositData = {
	summary: {
		availableBalanceUsd: 6850,
		lastDepositLabel: "0.05 BTC",
		pendingDepositsUsd: 250,
		supportedMethods: 6,
	},
	methods: [
		{
			description: "Send supported crypto to a Nexcoin deposit address.",
			id: "crypto",
			label: "Crypto",
			minUsd: 25,
			reviewTime: "Credited after network confirmations",
		},
		{
			description: "PayPal deposits for supported investors in the United States.",
			id: "paypal",
			label: "PayPal",
			minUsd: 100,
			reviewTime: "Usually reviewed within 12 hours",
		},
		{
			description: "Cash payment instructions issued through support review.",
			id: "cash",
			label: "Cash Payment",
			minUsd: 500,
			reviewTime: "Manual review within 1 business day",
		},
		{
			description: "Supported e-currency deposits outside the United States.",
			id: "ecurrency",
			label: "E-currency",
			minUsd: 50,
			reviewTime: "Usually reviewed within 24 hours",
		},
	],
	assets: [
		{
			address: "bc1qnxcn92h8r6m4q7ty3f5jz0wkvnlua62rdg8f7s",
			color: "#f0a33a",
			confirmationsRequired: 3,
			id: "btc",
			minDeposit: 0.0005,
			name: "Bitcoin",
			network: "Bitcoin",
			rateUsd: 64820.5,
			status: "Active",
			symbol: "BTC",
		},
		{
			address: "0x92A71f31F20bF8d3aD8Cb244a3280317151b1D62",
			color: "#667eea",
			confirmationsRequired: 12,
			id: "eth",
			minDeposit: 0.01,
			name: "Ethereum",
			network: "Ethereum (ERC-20)",
			rateUsd: 3180.25,
			status: "Active",
			symbol: "ETH",
		},
		{
			address: "TXv9m6JnF4qH81sKc2Bx7RwzP5uE3aLq9Nc",
			color: "#26a17b",
			confirmationsRequired: 20,
			id: "usdt-trc20",
			minDeposit: 10,
			name: "Tether USD",
			network: "Tron (TRC-20)",
			rateUsd: 1,
			status: "Active",
			symbol: "USDT",
		},
		{
			address: "0x5B723a6A89A91FeC0bD5D8B2Fa823F3b998D39Df",
			color: "#20b486",
			confirmationsRequired: 12,
			id: "usdt-erc20",
			minDeposit: 25,
			name: "Tether USD",
			network: "Ethereum (ERC-20)",
			rateUsd: 1,
			status: "Active",
			symbol: "USDT",
		},
		{
			address: "D8bR8L8xG9QVnBSPyS4Y1R6oVYzGJq8H77",
			color: "#c2a633",
			confirmationsRequired: 6,
			id: "doge",
			minDeposit: 25,
			name: "Dogecoin",
			network: "Dogecoin",
			rateUsd: 0.16,
			status: "Active",
			symbol: "DOGE",
		},
		{
			address: "ltc1qzt0jqx6lh8nh2r3a5yc8tpypl6l7pnkx2w54y4",
			color: "#77808c",
			confirmationsRequired: 6,
			id: "ltc",
			minDeposit: 0.1,
			name: "Litecoin",
			network: "Litecoin",
			rateUsd: 86.45,
			status: "Maintenance",
			symbol: "LTC",
		},
	],
	recentDeposits: [
		{
			amount: 250,
			amountUsd: 250,
			assetSymbol: "USDT",
			createdAt: "2026-04-20T12:15:00Z",
			id: "deposit-2294",
			method: "TRC-20",
			reference: "DP-2294",
			status: "Confirming",
		},
		{
			amount: 2500,
			amountUsd: 2500,
			assetSymbol: "USDT",
			createdAt: "2026-04-17T15:18:00Z",
			id: "deposit-2287",
			method: "TRC-20",
			reference: "DP-2287",
			status: "Credited",
		},
		{
			amount: 0.05,
			amountUsd: 3241.03,
			assetSymbol: "BTC",
			createdAt: "2026-04-10T10:12:00Z",
			id: "deposit-2252",
			method: "Bitcoin",
			reference: "DP-2252",
			status: "Credited",
		},
		{
			amount: 300,
			amountUsd: 300,
			assetSymbol: "USD",
			createdAt: "2026-04-05T18:40:00Z",
			id: "deposit-2238",
			method: "PayPal",
			reference: "DP-2238",
			status: "Rejected",
		},
	],
	rules: [
		"Send only the selected asset through the matching network.",
		"Crypto deposits are credited after the required number of confirmations.",
		"Cash and PayPal deposits may require support review before funds are credited.",
		"Nexcoin staff will never ask for private keys, seed phrases, or wallet recovery details.",
		"Deposited funds must follow platform investment and withdrawal rules.",
	],
};
