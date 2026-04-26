import Link from "next/link";
import { cookies } from "next/headers";
import { buttonVariants } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { PasswordInput } from "@/components/ui/password-input";
import { createClient } from "@/utils/supabase/server";
import { updatePassword } from "./actions";

export const metadata = {
  title: "Reset Password | Nexcoin",
  description: "Choose a new password for your Nexcoin account.",
};

type ResetPasswordPageProps = {
  searchParams?: Promise<{
    code?: string;
    error?: string;
    success?: string;
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const errorMessage = params?.error;
  const successMessage = params?.success;
  const code = params?.code;

  // The reset link from the email lands here with ?code=xxx. Exchange it for
  // a session so the user is authenticated when they submit the new password.
  // After that, the URL still shows ?code=xxx but the cookie carries the
  // session — so we don't re-exchange on subsequent reloads (it would error).
  let exchangeError: string | null = null;
  if (code) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        exchangeError =
          "This reset link is invalid or expired. Please request a new one.";
      }
    }
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hasSession = Boolean(user);

  return (
    <main className="min-h-screen bg-[#f7faf9] text-[#576363]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-8 px-6 py-10 lg:px-10">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1fr_440px]">
          <div className="hidden flex-col gap-10 lg:flex">
            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
                Set a new password
              </p>
              <h1 className="mt-5 text-5xl font-semibold text-[#576363]">
                Choose your new password.
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-8 text-[#5d6163]">
                Pick a strong password of at least 8 characters. Avoid reusing
                old passwords from other sites.
              </p>
            </div>

            <div className="max-w-xl rounded-lg border border-[#d7e5e3] bg-white/70 p-5">
              <p className="text-sm font-semibold text-[#576363]">
                Security reminder
              </p>
              <p className="mt-2 text-sm leading-6 text-[#5d6163]">
                Nexcoin will never ask for your password, private keys, or seed
                phrase via email or chat.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_24px_80px_rgba(87,99,99,0.12)] sm:p-8">
            <div>
              <h2 className="text-2xl font-semibold text-[#576363]">
                Reset password
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#5d6163]">
                Enter and confirm your new password to finish the reset.
              </p>
            </div>

            {exchangeError ? (
              <p className="mt-6 rounded-md border border-[#f2c5c0] bg-[#fff7f6] px-4 py-3 text-sm font-medium text-[#b1423a]">
                {exchangeError}
              </p>
            ) : null}

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

            {hasSession && !exchangeError ? (
              <form action={updatePassword} className="mt-8 space-y-5">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-[#576363]"
                  >
                    New password
                  </label>
                  <div className="mt-2">
                    <PasswordInput
                      id="password"
                      name="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      placeholder="At least 8 characters"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirm_password"
                    className="block text-sm font-medium text-[#576363]"
                  >
                    Confirm new password
                  </label>
                  <div className="mt-2">
                    <PasswordInput
                      id="confirm_password"
                      name="confirm_password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      placeholder="Repeat new password"
                    />
                  </div>
                </div>

                <FormSubmitButton size="lg" className="w-full" pendingLabel="Updating password…">
                  Update password
                </FormSubmitButton>
              </form>
            ) : (
              <div className="mt-8 rounded-md bg-[#f7faf9] p-4 text-sm leading-6 text-[#5d6163]">
                Your reset link is invalid or has expired. Request a fresh
                link below.
              </div>
            )}

            <div className="mt-6 border-t border-[#e3ecea] pt-6 space-y-3">
              <Link
                href="/auth/forgot-password"
                className={buttonVariants({
                  className: "w-full",
                  size: "lg",
                  variant: "outline",
                })}
              >
                Request a new reset link
              </Link>
              <Link
                href="/auth/login"
                className={buttonVariants({
                  className: "w-full",
                  size: "lg",
                  variant: "ghost",
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
