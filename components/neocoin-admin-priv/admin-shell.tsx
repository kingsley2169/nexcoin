"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";
import { AdminSidebar } from "@/components/neocoin-admin-priv/admin-sidebar";
import { cn } from "@/lib/utils";

function MenuIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			className={className}
			aria-hidden="true"
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeWidth="2"
		>
			<path d="M4 7h16M4 12h16M4 17h16" />
		</svg>
	);
}


function SidebarToggleIcon({
	className,
	collapsed,
}: {
	className?: string;
	collapsed: boolean;
}) {
	return (
		<svg
			viewBox="0 0 24 24"
			className={className}
			aria-hidden="true"
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2"
		>
			<path d="M4 5h16v14H4zM9 5v14" />
			{collapsed ? <path d="m14 9 3 3-3 3" /> : <path d="m17 9-3 3 3 3" />}
		</svg>
	);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();

    if (pathname.startsWith("/nexcoin-admin-priv/login")) {
        return <div className="min-h-screen bg-[#f7faf9] text-[#576363]">{children}</div>;
    }

    return (
        <div className="min-h-screen overscroll-none bg-[#f7faf9] text-[#576363]">
            <div
                className={cn(
                    "hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col lg:border-r lg:border-[#d7e5e3] lg:transition-[width]",
                    isCollapsed ? "lg:w-20" : "lg:w-72",
                )}
            >
                <AdminSidebar collapsed={isCollapsed} />
            </div>

            <div
                className={cn(
                    "fixed inset-0 z-50 lg:hidden",
                    isOpen ? "pointer-events-auto" : "pointer-events-none",
                )}
                aria-hidden={!isOpen}
            >
                <div
                    className={cn(
                        "absolute inset-0 bg-black/30 transition-opacity",
                        isOpen ? "opacity-100" : "opacity-0",
                    )}
                    onClick={() => setIsOpen(false)}
                />
                <div
                    className={cn(
                        "absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-[#d7e5e3] bg-white transition-transform",
                        isOpen ? "translate-x-0" : "-translate-x-full",
                    )}
                >
                    <AdminSidebar onNavigate={() => setIsOpen(false)} />
                </div>
            </div>

            <div
                className={cn(
                    "transition-[padding] lg:min-h-screen",
                    isCollapsed ? "lg:pl-20" : "lg:pl-72",
                )}
            >
                <header className="sticky top-0 z-30 border-b border-[#d7e5e3] bg-white/95 backdrop-blur">
                    <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-2">
                            <div className="lg:hidden">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    aria-label="Open admin menu"
                                    onClick={() => setIsOpen(true)}
                                >
                                    <MenuIcon className="h-5 w-5" />
                                </Button>
                            </div>

                            <div className="hidden lg:block">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                                    onClick={() => setIsCollapsed((current) => !current)}
                                >
                                    <SidebarToggleIcon
                                        className="h-5 w-5"
                                        collapsed={isCollapsed}
                                    />
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="hidden text-right sm:block">
                                <p className="text-sm font-semibold leading-5 text-[#576363]">
                                    Admin User
                                </p>
                                <p className="text-xs leading-4 text-[#5d6163]">
                                    Admin console
                                </p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5F9EA0] text-sm font-semibold text-white">
                                AD
                            </div>
                        </div>
                    </div>
                </header>

                <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
            </div>
        </div>
    );
}
