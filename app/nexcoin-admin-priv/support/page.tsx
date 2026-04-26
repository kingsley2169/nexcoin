import { cookies } from "next/headers";
import { AdminSupport } from "@/components/neocoin-admin-priv/admin-support";
import { getAdminSupportData } from "@/lib/admin-support";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
	title: "Support Management | Nexcoin Admin",
	description:
		"Review user tickets, respond to account issues, escalate urgent cases, and track support SLAs.",
};

export default async function AdminSupportPage() {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);
	const data = await getAdminSupportData(supabase);

	return <AdminSupport data={data} />;
}
