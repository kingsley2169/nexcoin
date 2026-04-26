import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AccountVerification } from "@/components/account/account-verification";
import { getVerificationData } from "@/lib/verification";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
	title: "KYC Verification | Nexcoin",
	description:
		"Submit identity documents, review verification status, and track compliance review requirements.",
};

export default async function VerificationPage() {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/auth/login?error=Sign in to access your account dashboard.");
	}

	const data = await getVerificationData(supabase, user.id);

	return <AccountVerification data={data} userId={user.id} />;
}
