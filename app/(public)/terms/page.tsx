import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Terms | Nexcoin",
	description:
		"Review Nexcoin terms covering registration, deposits, investment procedures, withdrawals, representatives, and account requirements.",
};

const basicInformation = [
	"Registration requires each user to provide accurate personal information. This helps prevent account access issues and loss of account information.",
	"Nexcoin provides a password recovery system for users who need to regain access to their accounts.",
	"During a loan request, users are not expected to withdraw or invest loan funds immediately after receiving them from Nexcoin without first contacting customer support. If a user does so, the account may be automatically deactivated, and Nexcoin will not be responsible for any related loss or damage.",
	"To withdraw loan funds, users must submit valid documents, such as a National ID or passport and a utility bill.",
	"Deposits are accepted in Bitcoin, Ethereum, cash payment, PayPal, and Dogecoin. Cash and PayPal deposits are available for investors in the United States. Other e-currencies may be accepted outside the United States.",
	"Once funds are deposited into a Nexcoin account, they cannot be withdrawn back unless they have first been invested. A funded account cannot withdraw the funded amount until it has gone through the investment process.",
];

const investmentProcedures = [
	"Deposits into any investment package are available to members. Reinvestment is limited in the Beginner Plan because it is a starter plan.",
	"If a user wants to continue investing in the Beginner Plan after reinvesting twice, the user must either top up the account with an additional amount or request a withdrawal.",
	"Nexcoin is not responsible for account issues or losses caused by repeated reinvestment outside the stated plan rules.",
	"The Amateur Plan offers 10% in 24 hours. This is a bonus package, which means investors using this package may be more likely to earn system bonuses. An investor may only invest in this package three times.",
	"The Advanced Plan is a 15% generating package with multiple offers and higher jackpot earning opportunities. This package has no limitation and may include bonuses and higher referral commission opportunities. This is Nexcoin's VIP plan.",
	"The Pro Plan offers 20% in 72 hours. This is a bonus package, which means investors using this package may be more likely to earn system bonuses. This package has no reinvestment limit.",
	"Nexcoin offers Dogecoin investments and long-term investment programs. For more information, users should contact customer support. Customer support is available 24/7 for questions and assistance.",
	"Referral commission is 4%. There is no indirect commission. This means a user cannot earn commission from people referred by their own referral. Users also earn no commission if their referral does not have an active investment.",
	"Users are not allowed to create multiple accounts. This rule helps prevent abuse and cheating. If a user is found operating multiple accounts, the user may be penalized and the accounts may be blocked.",
	"Nexcoin offers shareholder contracts that allow eligible users to become co-owners. The shareholder contract offers a profit rate of 18% plus 2% gross profit from total income and profit generated from market trading activity, including American cannabis stock, ETFs, cryptocurrencies, and smart contract services provided to other corporations.",
	"Shareholder contract investments are accumulated and paid to investors after 180 days, which is approximately six months.",
	"If an account is abandoned for a period of time, it may become dormant and be deactivated. If the account is not reactivated in due time, the system may automatically delete the account. Nexcoin is not responsible for losses connected to abandoned, dormant, deactivated, or deleted accounts.",
];

const withdrawalProcedures = [
	"Withdrawals are processed through the same payment mode used for deposit. For example, if a user deposits with Bitcoin, the withdrawal option will be Bitcoin. This requirement supports Nexcoin's Anti-Money Laundering policy.",
	"Withdrawals are handled by the automated system and are not processed manually by an individual.",
	"Withdrawals may take up to 24 hours to process. Further delays may occur because of blockchain traffic.",
	"If a withdrawal delay continues, users may contact customer support for more information.",
	"For security reasons, Nexcoin does not send transaction hashes to users through unofficial channels.",
];

const representativeOpportunities = [
	"Nexcoin offers representative opportunities that allow eligible users to become licensed agents working with the company in their country or region.",
	"Representatives may receive monthly payments.",
	"Nexcoin may offer tourism visas for seminars.",
	"Nexcoin may provide full security support for approved representatives.",
	"Nexcoin may offer loans to top investors.",
];

const representativeRequirements = [
	"Applicants must be pro traders with professional experience.",
	"Applicants must have at least twenty registered referral accounts, including 20 investors and more than 100 active group members.",
	"Applicants must have at least fifteen active investing accounts under them, with each active investment account above $100.00.",
	"Applicants must be educated, fluent in English, confident in expression, and capable of teaching others as leaders.",
	"Approved applicants will obtain a trading license and partnership certificates from Nexcoin. To avoid complications, Nexcoin will issue the license and debit card after the applicant's work has been supervised.",
];

function TermsSection({
	items,
	title,
}: {
	items: string[];
	title: string;
}) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)] sm:p-8">
			<h2 className="text-2xl font-semibold text-[#576363]">{title}</h2>
			<div className="mt-6 space-y-4">
				{items.map((item) => (
					<p key={item} className="text-sm leading-7 text-[#5d6163] sm:text-base">
						{item}
					</p>
				))}
			</div>
		</section>
	);
}

export default function TermsPage() {
	return (
		<>
			<section className="border-b border-[#d7e5e3] bg-white">
				<div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
					<div className="max-w-3xl">
						<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
							Terms and conditions
						</p>
						<h1 className="mt-5 text-4xl font-semibold text-[#576363] sm:text-5xl">
							Nexcoin platform terms.
						</h1>
						<p className="mt-5 text-base leading-7 text-[#5d6163] sm:text-lg">
							These terms outline important rules for account registration,
							deposits, investments, withdrawals, loan requests, representative
							opportunities, and account activity on Nexcoin.
						</p>
					</div>
				</div>
			</section>

			<section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
				<div className="grid gap-6">
					<TermsSection title="Basic Information" items={basicInformation} />
					<TermsSection
						title="Investment Procedures and Guides"
						items={investmentProcedures}
					/>
					<TermsSection
						title="Withdrawal Procedures and Guides"
						items={withdrawalProcedures}
					/>
					<section className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)] sm:p-8">
						<h2 className="text-2xl font-semibold text-[#576363]">
							Important Notice
						</h2>
						<p className="mt-6 text-sm leading-7 text-[#5d6163] sm:text-base">
							Nexcoin system upgrades are performed twice every month. If users
							experience challenges accessing their accounts during an upgrade,
							they should contact support and allow time for the system to be
							restored. Nexcoin performs upgrades to improve platform security
							and user protection.
						</p>
					</section>
					<TermsSection
						title="Representatives and Opportunities"
						items={representativeOpportunities}
					/>
					<TermsSection
						title="Representative Requirements"
						items={representativeRequirements}
					/>
				</div>
			</section>
		</>
	);
}
