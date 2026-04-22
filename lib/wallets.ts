export type WalletStatus = "Active" | "Confirming" | "Maintenance";

export type WalletAsset = {
	address: string;
	availableBalance: number;
	balance: number;
	color: string;
	confirmationsRequired: number;
	holdBalance: number;
	id: string;
	lastUpdatedAt: string;
	minDeposit: number;
	name: string;
	network: string;
	pendingDeposit: number;
	rateUsd: number;
	status: WalletStatus;
	symbol: string;
};

export type WalletActivityStatus = "Completed" | "Credited" | "Pending";

export type WalletActivity = {
	amount: number;
	assetSymbol: string;
	createdAt: string;
	id: string;
	label: string;
	reference: string;
	status: WalletActivityStatus;
	type: "Deposit" | "Fee" | "Transfer" | "Withdrawal";
};

export type WalletsData = {
	activities: WalletActivity[];
	assets: WalletAsset[];
	notes: string[];
};

export const walletsData: WalletsData = {
	assets: [
		{
			address: "bc1qnxcn92h8r6m4q7ty3f5jz0wkvnlua62rdg8f7s",
			availableBalance: 0.2,
			balance: 0.218,
			color: "#f0a33a",
			confirmationsRequired: 3,
			holdBalance: 0.018,
			id: "btc",
			lastUpdatedAt: "2026-04-20T14:08:00Z",
			minDeposit: 0.0005,
			name: "Bitcoin",
			network: "Bitcoin",
			pendingDeposit: 0,
			rateUsd: 64820.5,
			status: "Active",
			symbol: "BTC",
		},
		{
			address: "0x92A71f31F20bF8d3aD8Cb244a3280317151b1D62",
			availableBalance: 1.62,
			balance: 2.04,
			color: "#667eea",
			confirmationsRequired: 12,
			holdBalance: 0.42,
			id: "eth",
			lastUpdatedAt: "2026-04-20T13:42:00Z",
			minDeposit: 0.01,
			name: "Ethereum",
			network: "Ethereum (ERC-20)",
			pendingDeposit: 0,
			rateUsd: 3180.25,
			status: "Active",
			symbol: "ETH",
		},
		{
			address: "TXv9m6JnF4qH81sKc2Bx7RwzP5uE3aLq9Nc",
			availableBalance: 1500,
			balance: 1500,
			color: "#26a17b",
			confirmationsRequired: 20,
			holdBalance: 0,
			id: "usdt-trc20",
			lastUpdatedAt: "2026-04-20T12:15:00Z",
			minDeposit: 10,
			name: "Tether USD",
			network: "Tron (TRC-20)",
			pendingDeposit: 250,
			rateUsd: 1,
			status: "Confirming",
			symbol: "USDT",
		},
		{
			address: "0x5B723a6A89A91FeC0bD5D8B2Fa823F3b998D39Df",
			availableBalance: 720,
			balance: 720,
			color: "#20b486",
			confirmationsRequired: 12,
			holdBalance: 0,
			id: "usdt-erc20",
			lastUpdatedAt: "2026-04-19T17:24:00Z",
			minDeposit: 25,
			name: "Tether USD",
			network: "Ethereum (ERC-20)",
			pendingDeposit: 0,
			rateUsd: 1,
			status: "Active",
			symbol: "USDT",
		},
		{
			address: "D8bR8L8xG9QVnBSPyS4Y1R6oVYzGJq8H77",
			availableBalance: 3200,
			balance: 3200,
			color: "#c2a633",
			confirmationsRequired: 6,
			holdBalance: 0,
			id: "doge",
			lastUpdatedAt: "2026-04-18T11:10:00Z",
			minDeposit: 25,
			name: "Dogecoin",
			network: "Dogecoin",
			pendingDeposit: 0,
			rateUsd: 0.16,
			status: "Active",
			symbol: "DOGE",
		},
		{
			address: "ltc1qzt0jqx6lh8nh2r3a5yc8tpypl6l7pnkx2w54y4",
			availableBalance: 0,
			balance: 0,
			color: "#77808c",
			confirmationsRequired: 6,
			holdBalance: 0,
			id: "ltc",
			lastUpdatedAt: "2026-04-17T09:35:00Z",
			minDeposit: 0.1,
			name: "Litecoin",
			network: "Litecoin",
			pendingDeposit: 0,
			rateUsd: 86.45,
			status: "Maintenance",
			symbol: "LTC",
		},
	],
	activities: [
		{
			amount: 0.018,
			assetSymbol: "BTC",
			createdAt: "2026-04-20T14:02:00Z",
			id: "wa-1008",
			label: "Withdrawal hold placed",
			reference: "WD-1041",
			status: "Pending",
			type: "Withdrawal",
		},
		{
			amount: 250,
			assetSymbol: "USDT",
			createdAt: "2026-04-20T12:15:00Z",
			id: "wa-1007",
			label: "TRC-20 deposit confirming",
			reference: "DP-2294",
			status: "Pending",
			type: "Deposit",
		},
		{
			amount: 0.42,
			assetSymbol: "ETH",
			createdAt: "2026-04-18T09:45:00Z",
			id: "wa-1006",
			label: "Withdrawal completed",
			reference: "WD-1039",
			status: "Completed",
			type: "Withdrawal",
		},
		{
			amount: 2500,
			assetSymbol: "USDT",
			createdAt: "2026-04-17T15:18:00Z",
			id: "wa-1005",
			label: "TRC-20 deposit credited",
			reference: "DP-2287",
			status: "Credited",
			type: "Deposit",
		},
		{
			amount: 0.05,
			assetSymbol: "BTC",
			createdAt: "2026-04-10T10:12:00Z",
			id: "wa-1004",
			label: "Bitcoin deposit credited",
			reference: "DP-2252",
			status: "Credited",
			type: "Deposit",
		},
	],
	notes: [
		"Send only the selected asset to its matching network address.",
		"Deposits are credited after the required number of blockchain confirmations.",
		"Nexcoin staff will never ask for your private keys, seed phrase, or wallet recovery phrase.",
		"Deposit addresses can change after system upgrades, so confirm the address before each transfer.",
	],
};
