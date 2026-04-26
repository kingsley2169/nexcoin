import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AccountProfile } from "@/components/account/account-profile";
import { getProfileData } from "@/lib/profile";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
	title: "Profile | Nexcoin",
	description:
		"Update your personal information, address, and display preferences.",
};
 
export default async function AccountProfilePage() {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);
	const profile = await getProfileData(supabase);

	return <AccountProfile profile={profile} />;
}
