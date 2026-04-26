import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { requestPasswordReset } from "./actions";

export const metadata = {
  title: "Forgot Password | Nexcoin",
  description: "Recover access to your Nexcoin investment account.",
};

type ForgotPasswordPageProps = {
  searchParams?: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
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
                Account recovery
              </p>
              <h1 className="mt-5 text-5xl font-semibold text-[#576363]">
                Reset your Nexcoin password.
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-8 text-[#5d6163]">
                Enter your account email and we will send instructions for
                creating a new password.
              </p>
            </div>

            <div className="max-w-xl rounded-lg border border-[#d7e5e3] bg-white/70 p-5">
              <p className="text-sm font-semibold text-[#576363]">
                Security reminder
              </p>
              <p className="mt-2 text-sm leading-6 text-[#5d6163]">
                Nexcoin will never ask for your password, private keys, or seed
                phrase during account recovery.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_24px_80px_rgba(87,99,99,0.12)] sm:p-8">
            <div>
              <h2 className="text-2xl font-semibold text-[#576363]">
                Forgot password
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#5d6163]">
                We will send a reset link if the email matches an account.
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

            <form action={requestPasswordReset} className="mt-8 space-y-5">
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

              <FormSubmitButton size="lg" className="w-full" pendingLabel="Sending reset link…">
                Send reset link
              </FormSubmitButton>
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
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
