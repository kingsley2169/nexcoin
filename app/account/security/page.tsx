import { AccountSecurity } from "@/components/account/account-security";
import { securityData } from "@/lib/security";

export const metadata = {
	title: "Security Settings | Nexcoin",
	description:
		"Manage password access, two-factor authentication, trusted devices, withdrawal protection, and login activity.",
};

export default function SecurityPage() {
	return <AccountSecurity data={securityData} />;
}
