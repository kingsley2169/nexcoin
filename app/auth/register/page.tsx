import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CountryCombobox } from "@/components/ui/country-combobox";
import { PasswordInput } from "@/components/ui/password-input";
import { countryOptions } from "@/lib/profile";
import { signUp } from "./actions";

export const metadata = {
	title: "Signup | Nexcoin",
	description: "Create a Nexcoin investment account.",
};

type RegisterPageProps = {
	searchParams?: Promise<{
		error?: string;
		success?: string;
	}>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
	const params = await searchParams;
	const errorMessage = params?.error;
	const successMessage = params?.success;

	return (
		<main className="min-h-screen bg-[#f7faf9] text-[#576363]">
			<section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-8 px-6 py-10 lg:px-10">
				<div className="grid w-full items-center gap-10 lg:grid-cols-[1fr_500px]">
					<div className="hidden flex-col gap-10 lg:flex">
						<div className="max-w-xl">
							<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
								Start your account
							</p>
							<h1 className="mt-5 text-5xl font-semibold text-[#576363]">
								Create your Nexcoin profile.
							</h1>
							<p className="mt-5 max-w-lg text-lg leading-8 text-[#5d6163]">
								Set up secure access and provide the basic profile details
								Nexcoin needs for account records, support, verification, and
								withdrawal reviews.
							</p>
						</div>

						<div className="grid max-w-xl grid-cols-3 gap-4">
							<div className="border-l-2 border-[#5F9EA0] pl-4">
								<p className="text-2xl font-semibold text-[#576363]">KYC</p>
								<p className="mt-1 text-sm text-[#5d6163]">Ready profile</p>
							</div>
							<div className="border-l-2 border-[#5F9EA0] pl-4">
								<p className="text-2xl font-semibold text-[#576363]">USD</p>
								<p className="mt-1 text-sm text-[#5d6163]">Account ledger</p>
							</div>
							<div className="border-l-2 border-[#5F9EA0] pl-4">
								<p className="text-2xl font-semibold text-[#576363]">2FA</p>
								<p className="mt-1 text-sm text-[#5d6163]">Security ready</p>
							</div>
						</div>
					</div>

					<div className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_24px_80px_rgba(87,99,99,0.12)] sm:p-8">
						<div>
							<h2 className="text-2xl font-semibold text-[#576363]">
								Create account
							</h2>
							<p className="mt-2 text-sm leading-6 text-[#5d6163]">
								These details create your login and the profile row used across
								your dashboard.
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

						<form action={signUp} className="mt-8 space-y-5">
							<div>
								<label
									htmlFor="full_name"
									className="block text-sm font-medium text-[#576363]"
								>
									Full legal name
								</label>
								<input
									id="full_name"
									name="full_name"
									type="text"
									autoComplete="name"
									required
									placeholder="Alex Morgan"
									className="mt-2 h-12 w-full rounded-md border border-[#cfdcda] bg-white px-4 text-base text-[#576363] outline-none transition focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
								/>
							</div>

							<div>
								<label
									htmlFor="email"
									className="block text-sm font-medium text-[#576363]"
								>
									Email address
								</label>
								<input
									id="email"
									name="email"
									type="email"
									autoComplete="email"
									required
									placeholder="you@example.com"
									className="mt-2 h-12 w-full rounded-md border border-[#cfdcda] bg-white px-4 text-base text-[#576363] outline-none transition focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
								/>
							</div>

							<div className="grid gap-5 sm:grid-cols-2">
								<div>
									<label
										htmlFor="phone_number"
										className="block text-sm font-medium text-[#576363]"
									>
										Phone number
									</label>
									<input
										id="phone_number"
										name="phone_number"
										type="tel"
										autoComplete="tel"
										required
										placeholder="+1 555 0100"
										className="mt-2 h-12 w-full rounded-md border border-[#cfdcda] bg-white px-4 text-base text-[#576363] outline-none transition focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
									/>
								</div>

								<div>
									<label
										htmlFor="country"
										className="block text-sm font-medium text-[#576363]"
									>
										Country
									</label>
									<div className="mt-2">
										<CountryCombobox
											id="country"
											name="country"
											countries={countryOptions}
											placeholder="Search country"
											required
										/>
									</div>
								</div>
							</div>

							<div className="grid gap-5 sm:grid-cols-2">
								<div>
									<label
										htmlFor="password"
										className="block text-sm font-medium text-[#576363]"
									>
										Password
									</label>
									<div className="mt-2">
										<PasswordInput
											id="password"
											name="password"
											autoComplete="new-password"
											required
											minLength={8}
											placeholder="Create password"
										/>
									</div>
								</div>

								<div>
									<label
										htmlFor="confirm_password"
										className="block text-sm font-medium text-[#576363]"
									>
										Confirm password
									</label>
									<div className="mt-2">
										<PasswordInput
											id="confirm_password"
											name="confirm_password"
											autoComplete="new-password"
											required
											minLength={8}
											placeholder="Repeat password"
										/>
									</div>
								</div>
							</div>

							<div className="flex items-start gap-3">
								<input
									id="terms"
									name="terms"
									type="checkbox"
									required
									className="mt-1 h-4 w-4 rounded border-[#cfdcda] accent-[#5F9EA0]"
								/>
								<label htmlFor="terms" className="text-sm leading-6 text-[#5d6163]">
									I confirm that my signup information is accurate and agree to
									Nexcoin account, verification, and withdrawal review rules.
								</label>
							</div>

							<Button type="submit" size="lg" className="w-full">
								Create account
							</Button>
						</form>

						<p className="mt-6 text-center text-sm text-[#5d6163]">
							Already have an account?{" "}
							<Link
								href="/auth/login"
								className="font-semibold text-[#5F9EA0] transition hover:text-[#4f8587]"
							>
								Sign in
							</Link>
						</p>
					</div>
				</div>
			</section>
		</main>
	);
}
