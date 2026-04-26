import Link from "next/link";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { PasswordInput } from "@/components/ui/password-input";
import { signIn } from "./actions";

export const metadata = {
  title: "Login | Nexcoin",
  description: "Log in to your Nexcoin investment account.",
};

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
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
                Secure account access
              </p>
              <h1 className="mt-5 text-5xl font-semibold text-[#576363]">
                Welcome back to Nexcoin.
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-8 text-[#5d6163]">
                Sign in with your email and password to review your portfolio,
                manage deposits, and track investment activity.
              </p>
            </div>

            <div className="grid max-w-xl grid-cols-3 gap-4">
              <div className="border-l-2 border-[#5F9EA0] pl-4">
                <p className="text-2xl font-semibold text-[#576363]">24/7</p>
                <p className="mt-1 text-sm text-[#5d6163]">Account access</p>
              </div>
              <div className="border-l-2 border-[#5F9EA0] pl-4">
                <p className="text-2xl font-semibold text-[#576363]">2FA</p>
                <p className="mt-1 text-sm text-[#5d6163]">Ready security</p>
              </div>
              <div className="border-l-2 border-[#5F9EA0] pl-4">
                <p className="text-2xl font-semibold text-[#576363]">Live</p>
                <p className="mt-1 text-sm text-[#5d6163]">Portfolio view</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_24px_80px_rgba(87,99,99,0.12)] sm:p-8">
            <div>
              <h2 className="text-2xl font-semibold text-[#576363]">
                Login
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#5d6163]">
                Use the email address connected to your Nexcoin account.
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

              <div className="flex items-center gap-3">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  className="h-4 w-4 rounded border-[#cfdcda] accent-[#5F9EA0]"
                />
                <label htmlFor="remember" className="text-sm text-[#5d6163]">
                  Keep me signed in on this device
                </label>
              </div>

              <FormSubmitButton size="lg" className="w-full" pendingLabel="Signing in…">
                Sign in
              </FormSubmitButton>
            </form>

            <p className="mt-6 text-center text-sm text-[#5d6163]">
              New to Nexcoin?{" "}
              <Link
                href="/auth/register"
                className="font-semibold text-[#5F9EA0] transition hover:text-[#4f8587]"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
