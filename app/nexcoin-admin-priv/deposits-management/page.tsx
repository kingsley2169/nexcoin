import { AdminDepositsManagement } from "@/components/neocoin-admin-priv/admin-deposits-management";
import { adminDepositsManagementData } from "@/lib/admin-deposits-management";

export const metadata = {
	title: "Deposits Management | Nexcoin Admin",
	description:
		"Review incoming deposits, confirmations, manual payments, risk notes, and funding activity.",
};

export default function AdminDepositsManagementPage() {
    return <AdminDepositsManagement data={adminDepositsManagementData} />;
}
