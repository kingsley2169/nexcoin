import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { getAdminAccess } from "@/lib/admin-auth";
import { createClient } from "@/utils/supabase/server";
import { signIn } from "./actions";

export const metadata = {
	title: "Admin Login | Nexcoin",
	description: "Log in to the Nexcoin admin console.",
};

type AdminLoginPageProps = {
	searchParams?: Promise<{
		error?: string;
		success?: string;
	}>;
};

export default async function AdminLoginPage({
	searchParams,
}: AdminLoginPageProps) {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);
	const { isAdmin } = await getAdminAccess(supabase);

	if (isAdmin) {
		redirect("/nexcoin-admin-priv");
	}

	const params = await searchParams;
	const errorMessage = params?.error;
	const successMessage = params?.success;

	return (
		<main className="min-h-screen bg-[#f7faf9] text-[#576363]">
			<section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-8 px-6 py-10 lg:px-10">
				<div className="grid w-full items-center gap-10 lg:grid-cols-[1fr_440px]">
					<div className="hidden flex-col gap-10 lg:flex">
						<div className="max-w-xl">
							<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
								Restricted admin access
							</p>
							<h1 className="mt-5 text-5xl font-semibold text-[#576363]">
								Sign in to the Nexcoin admin console.
							</h1>
							<p className="mt-5 max-w-lg text-lg leading-8 text-[#5d6163]">
								Use an approved staff account to review users, KYC activity,
								deposits, withdrawals, and support work from one place.
							</p>
						</div>

						<div className="grid max-w-xl grid-cols-3 gap-4">
							<div className="border-l-2 border-[#5F9EA0] pl-4">
								<p className="text-2xl font-semibold text-[#576363]">Users</p>
								<p className="mt-1 text-sm text-[#5d6163]">Account oversight</p>
							</div>
							<div className="border-l-2 border-[#5F9EA0] pl-4">
								<p className="text-2xl font-semibold text-[#576363]">Queues</p>
								<p className="mt-1 text-sm text-[#5d6163]">Operational review</p>
							</div>
							<div className="border-l-2 border-[#5F9EA0] pl-4">
								<p className="text-2xl font-semibold text-[#576363]">Audit</p>
								<p className="mt-1 text-sm text-[#5d6163]">Controlled actions</p>
							</div>
						</div>

						<div className="max-w-xl rounded-lg border border-[#d7e5e3] bg-white/75 p-5">
							<p className="text-sm font-semibold text-[#576363]">
								Admin access note
							</p>
							<p className="mt-2 text-sm leading-6 text-[#5d6163]">
								There is no public admin signup. Only staff accounts approved by
								Nexcoin should continue here.
							</p>
						</div>
					</div>

					<div className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_24px_80px_rgba(87,99,99,0.12)] sm:p-8">
						<div>
							<h2 className="text-2xl font-semibold text-[#576363]">
								Admin login
							</h2>
							<p className="mt-2 text-sm leading-6 text-[#5d6163]">
								Sign in with the email address assigned to your admin account.
							</p>
						</div>

						{errorMessage ? (
							<p className="mt-6 rounded-md border border-[#f2c5c0] bg-[#fff7f6] px-4 py-3 text-sm font-medium text-[#b1423a]">
								{errorMessage}
							</p>
						) : null}

						{successMessage ? (
							<p className="mt-6 rounded-md border border-[#c7e4d5] bg-[#f1fbf6] px-4 py-3 text-sm font-medium text-[#2e8f5b]">
								{successMessage}
							</p>
						) : null}

						<form action={signIn} className="mt-8 space-y-5">
							<div>
								<label
									htmlFor="email"
									className="block text-sm font-medium text-[#576363]"
								>
									Admin email
								</label>
								<input
									id="email"
									name="email"
									type="email"
									autoComplete="email"
									required
									placeholder="admin@nexcoin.example"
									className="mt-2 h-12 w-full rounded-md border border-[#cfdcda] bg-white px-4 text-base text-[#576363] outline-none transition focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
								/>
							</div>

							<div>
								<div className="flex items-center justify-between gap-4">
									<label
										htmlFor="password"
										className="block text-sm font-medium text-[#576363]"
									>
										Password
									</label>
									<Link
										href="/auth/forgot-password"
										className="text-sm font-semibold text-[#5F9EA0] transition hover:text-[#4f8587]"
									>
										Forgot password?
									</Link>
								</div>
								<div className="mt-2">
									<PasswordInput
										id="password"
										name="password"
										autoComplete="current-password"
										required
										placeholder="Enter your password"
									/>
								</div>
							</div>

							<div className="rounded-lg bg-[#f7faf9] p-4 text-sm leading-6 text-[#5d6163]">
								Admin authorization is checked after sign-in. Having a Nexcoin
								account alone does not grant admin access.
							</div>

							<Button type="submit" size="lg" className="w-full">
								Sign in to admin
							</Button>
						</form>

						<div className="mt-6 border-t border-[#e3ecea] pt-6">
							<Link
								href="/auth/login"
								className={buttonVariants({
									className: "w-full",
									size: "lg",
									variant: "outline",
								})}
							>
								Go to user login
							</Link>
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
