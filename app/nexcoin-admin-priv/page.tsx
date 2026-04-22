import { AdminDashboard } from "@/components/neocoin-admin-priv/admin-dashboard";
import { adminDashboardData } from "@/lib/admin-dashboard";

export default function AdminDashboardPage() {
	return <AdminDashboard data={adminDashboardData} />;
}
  
