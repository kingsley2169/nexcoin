import { cookies } from "next/headers";
import { AdminDashboard } from "@/components/neocoin-admin-priv/admin-dashboard";
import { getAdminDashboardData } from "@/lib/admin-dashboard";
import { createClient } from "@/utils/supabase/server";

export default async function AdminDashboardPage() {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);
	const data = await getAdminDashboardData(supabase);

	return <AdminDashboard data={data} />;
}
  
