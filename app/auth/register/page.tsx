import Link from "next/link";

export const metadata = {
  title: "Signup | Nexcoin",
  description: "Create a Nexcoin investment account.",
};

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7faf9] px-6 py-10 text-[#576363]">
      <section className="w-full max-w-md rounded-lg border border-[#d7e5e3] bg-white p-8 text-center shadow-[0_24px_80px_rgba(87,99,99,0.12)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
          Nexcoin
        </p>
        <h1 className="mt-5 text-3xl font-semibold text-[#576363]">
          Signup page coming soon
        </h1>
        <p className="mt-4 text-sm leading-6 text-[#5d6163]">
          This route is ready for the full signup form when it is selected for
          the build.
        </p>
        <Link
          href="/auth/login"
          className="mt-8 flex h-12 w-full items-center justify-center rounded-md bg-[#5F9EA0] px-5 text-base font-semibold text-white transition hover:bg-[#548f91] focus:outline-none focus:ring-4 focus:ring-[#5F9EA0]/25"
        >
          Back to login
        </Link>
      </section>
    </main>
  );
}
