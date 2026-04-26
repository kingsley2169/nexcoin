import { cookies } from "next/headers";
import { AdminUsers } from "@/components/neocoin-admin-priv/admin-users";
import { getAdminUsersData } from "@/lib/admin-users";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
	title: "User Management | Nexcoin Admin",
	description:
		"Search, filter, review, flag, suspend, and manage Nexcoin user accounts.",
};

export default async function AdminUsersPage() {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);
	const data = await getAdminUsersData(supabase);

	return <AdminUsers data={data} />;
}
