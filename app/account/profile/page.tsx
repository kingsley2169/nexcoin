import type { Metadata } from "next";
import { AccountProfile } from "@/components/account/account-profile";
import { mockProfile } from "@/lib/profile";

export const metadata: Metadata = {
	title: "Profile | Nexcoin",
	description:
		"Update your personal information, address, and display preferences.",
};

export default function AccountProfilePage() {
	return <AccountProfile profile={mockProfile} />;
}
