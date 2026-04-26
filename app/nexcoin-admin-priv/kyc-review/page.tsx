import { cookies } from "next/headers";
import { AdminKycReview } from "@/components/neocoin-admin-priv/admin-kyc-review";
import { getAdminKycReviewData } from "@/lib/admin-kyc-review";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
	title: "KYC Review | Nexcoin Admin",
	description:
		"Review identity submissions, document quality, verification status, and account limits.",
};

export default async function AdminKycReviewPage() {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);
	const data = await getAdminKycReviewData(supabase);

	return <AdminKycReview data={data} />;
}
