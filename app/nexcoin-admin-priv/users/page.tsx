import { AdminUsers } from "@/components/neocoin-admin-priv/admin-users";
import { adminUsersData } from "@/lib/admin-users";

export const metadata = {
	title: "User Management | Nexcoin Admin",
	description:
		"Search, filter, review, flag, suspend, and manage Nexcoin user accounts.",
};

export default function AdminUsersPage() {
	return <AdminUsers data={adminUsersData} />;
}
