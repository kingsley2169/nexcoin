import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function PublicLayout({
  	children,
}: Readonly<{
  	children: React.ReactNode;
}>) {
	return (
		<>
			<SiteHeader />
			<main className="flex-1 bg-[#f7faf9] text-[#576363]">{children}</main>
			<SiteFooter />
		</>
	);
}
