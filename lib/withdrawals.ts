export type WithdrawableAsset = {
	balance: number;
	feeFlat: number;
	feePercent: number;
	id: string;
	minWithdrawal: number;
	name: string;
	network: string;
	rateUsd: number;
	symbol: string;
};

export type SavedAddress = {
	address: string;
	assetId: string;
	id: string;
	isDefault: boolean;
	label: string;
	network: string;
};

export type WithdrawalStatus =
	| "Completed"
	| "Pending"
	| "Processing"
	| "Rejected";

export type WithdrawalRequest = {
	addressMasked: string;
	amount: number;
	assetSymbol: string;
	createdAt: string;
	id: string;
	reference: string;
	status: WithdrawalStatus;
};

export type WithdrawalLimits = {
	availableBalanceUsd: number;
	dailyLimitUsd: number;
	dailyUsedUsd: number;
	monthlyLimitUsd: number;
	monthlyUsedUsd: number;
	pendingUsd: number;
	processingTime: string;
};

export type WithdrawalData = {
	assets: WithdrawableAsset[];
	limits: WithdrawalLimits;
	recentWithdrawals: WithdrawalRequest[];
	savedAddresses: SavedAddress[];
	securityNotes: string[];
};

export const withdrawalData: WithdrawalData = {
	assets: [
		{
			balance: 0.218,
			feeFlat: 0.0005,
			feePercent: 0.5,
			id: "btc",
			minWithdrawal: 0.001,
			name: "Bitcoin",
			network: "Bitcoin",
			rateUsd: 64820.5,
			symbol: "BTC",
		},
		{
			balance: 2.04,
			feeFlat: 0.003,
			feePercent: 0.5,
			id: "eth",
			minWithdrawal: 0.01,
			name: "Ethereum",
			network: "Ethereum (ERC-20)",
			rateUsd: 3180.25,
			symbol: "ETH",
		},
		{
			balance: 28.6,
			feeFlat: 0.01,
			feePercent: 0.5,
			id: "sol",
			minWithdrawal: 0.1,
			name: "Solana",
			network: "Solana",
			rateUsd: 148.16,
			symbol: "SOL",
		},
		{
			balance: 1500,
			feeFlat: 1,
			feePercent: 0.1,
			id: "usdt",
			minWithdrawal: 10,
			name: "Tether USD",
			network: "Tron (TRC-20)",
			rateUsd: 1,
			symbol: "USDT",
		},
	],
	limits: {
		availableBalanceUsd: 6850,
		dailyLimitUsd: 50000,
		dailyUsedUsd: 1200,
		monthlyLimitUsd: 250000,
		monthlyUsedUsd: 12500,
		pendingUsd: 1200,
		processingTime: "Up to 24 hours on business days",
	},
	recentWithdrawals: [
		{
			addressMasked: "bc1qxy...0wlh",
			amount: 0.018,
			assetSymbol: "BTC",
			createdAt: "2026-04-20T14:02:00Z",
			id: "wd-1041",
			reference: "WD-1041",
			status: "Pending",
		},
		{
			addressMasked: "0xa1b2...9f3d",
			amount: 0.42,
			assetSymbol: "ETH",
			createdAt: "2026-04-18T09:45:00Z",
			id: "wd-1039",
			reference: "WD-1039",
			status: "Completed",
		},
		{
			addressMasked: "TXy4Nn...4aBc",
			amount: 320,
			assetSymbol: "USDT",
			createdAt: "2026-04-15T17:18:00Z",
			id: "wd-1033",
			reference: "WD-1033",
			status: "Completed",
		},
		{
			addressMasked: "5TxRx7...k8nP",
			amount: 4.2,
			assetSymbol: "SOL",
			createdAt: "2026-04-12T11:30:00Z",
			id: "wd-1027",
			reference: "WD-1027",
			status: "Processing",
		},
		{
			addressMasked: "bc1qxy...0wlh",
			amount: 0.025,
			assetSymbol: "BTC",
			createdAt: "2026-04-09T08:21:00Z",
			id: "wd-1019",
			reference: "WD-1019",
			status: "Rejected",
		},
	],
	savedAddresses: [
		{
			address: "bc1qxyz2r9xk7t8h4ydp3qmn6v8tw2l9j5s7d3f0wlh",
			assetId: "btc",
			id: "addr-1",
			isDefault: true,
			label: "Ledger Hardware",
			network: "Bitcoin",
		},
		{
			address: "0xa1b2c3d4e5f67890abcdef1234567890abcd9f3d",
			assetId: "eth",
			id: "addr-2",
			isDefault: true,
			label: "Main ETH Wallet",
			network: "Ethereum (ERC-20)",
		},
		{
			address: "TXy4NnFv8qK2j9Rp7sL3uD6gH1mA5zXp4aBc",
			assetId: "usdt",
			id: "addr-3",
			isDefault: true,
			label: "Binance Exchange",
			network: "Tron (TRC-20)",
		},
		{
			address: "5TxRx7pQmL9vN3kJ4sR8fD2zH6yC1bW5aG9vBk8nP",
			assetId: "sol",
			id: "addr-4",
			isDefault: true,
			label: "Cold Storage",
			network: "Solana",
		},
	],
	securityNotes: [
		"Withdrawals use the same asset and network as your most recent deposit when AML review is required.",
		"A 24-hour cool-down applies after any password change or new 2FA device.",
		"Nexcoin staff will never ask for your private keys, seed phrase, or 2FA codes.",
		"Save addresses to reduce typos and pre-approve destinations for faster payouts.",
	],
};
