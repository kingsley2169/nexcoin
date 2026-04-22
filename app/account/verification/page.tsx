import { AccountVerification } from "@/components/account/account-verification";
import { verificationData } from "@/lib/verification";

export const metadata = {
	title: "KYC Verification | Nexcoin",
	description:
		"Submit identity documents, review verification status, and track compliance review requirements.",
};

export default function VerificationPage() {
	return <AccountVerification data={verificationData} />;
}
