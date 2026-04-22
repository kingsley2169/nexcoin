import { AdminWithdrawalsManagement } from "@/components/neocoin-admin-priv/admin-withdrawals-management";
import { adminWithdrawalsManagementData } from "@/lib/admin-withdrawals-management";

export const metadata = {
	title: "Withdrawals Management | Nexcoin Admin",
	description:
		"Review withdrawal requests, AML checks, payout status, and destination wallet risk.",
};

export default function AdminWithdrawalsManagementPage() {
	return <AdminWithdrawalsManagement data={adminWithdrawalsManagementData} />;
}
