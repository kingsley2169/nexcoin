"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function RouteProgress() {
	const pathname = usePathname();
	const [progress, setProgress] = useState(0);
	const [visible, setVisible] = useState(false);

	const startTimer = useRef<number | null>(null);
	const tickTimer = useRef<number | null>(null);
	const finishTimer = useRef<number | null>(null);
	const previousPathname = useRef(pathname);
	const isAnimating = useRef(false);

	const clearAllTimers = () => {
		if (startTimer.current) {
			window.clearTimeout(startTimer.current);
			startTimer.current = null;
		}
		if (tickTimer.current) {
			window.clearInterval(tickTimer.current);
			tickTimer.current = null;
		}
		if (finishTimer.current) {
			window.clearTimeout(finishTimer.current);
			finishTimer.current = null;
		}
	};

	const beginAnimation = () => {
		if (isAnimating.current) return;
		isAnimating.current = true;
		setProgress(8);
		setVisible(true);

		tickTimer.current = window.setInterval(() => {
			setProgress((current) => {
				if (current >= 85) return current;
				const delta = (85 - current) * 0.08;
				return Math.min(current + Math.max(delta, 0.5), 85);
			});
		}, 200);
	};

	const finishAnimation = () => {
		if (!isAnimating.current) return;
		if (tickTimer.current) {
			window.clearInterval(tickTimer.current);
			tickTimer.current = null;
		}
		setProgress(100);

		finishTimer.current = window.setTimeout(() => {
			setVisible(false);
			finishTimer.current = window.setTimeout(() => {
				setProgress(0);
				isAnimating.current = false;
			}, 250);
		}, 200);
	};

	useEffect(() => {
		const handleClick = (event: MouseEvent) => {
			if (event.defaultPrevented) return;
			if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
				return;
			}
			if (event.button !== 0) return;

			const target = event.target as HTMLElement | null;
			if (!target) return;
			const link = target.closest("a");
			if (!link) return;

			const href = link.getAttribute("href");
			if (!href) return;

			if (link.target === "_blank") return;
			if (link.hasAttribute("download")) return;

			const isExternal =
				href.startsWith("http://") ||
				href.startsWith("https://") ||
				href.startsWith("//") ||
				href.startsWith("mailto:") ||
				href.startsWith("tel:");
			if (isExternal) return;

			if (href.startsWith("#")) return;

			const targetUrl = new URL(href, window.location.href);
			if (targetUrl.origin !== window.location.origin) return;
			if (
				targetUrl.pathname === window.location.pathname &&
				targetUrl.search === window.location.search
			) {
				return;
			}

			clearAllTimers();
			startTimer.current = window.setTimeout(beginAnimation, 120);
		};

		document.addEventListener("click", handleClick);
		return () => {
			document.removeEventListener("click", handleClick);
			clearAllTimers();
		};
	}, []);

	useEffect(() => {
		if (previousPathname.current === pathname) return;
		previousPathname.current = pathname;

		if (startTimer.current) {
			window.clearTimeout(startTimer.current);
			startTimer.current = null;
		}

		if (isAnimating.current) {
			finishAnimation();
		}
	}, [pathname]);

	return (
		<div
			aria-hidden="true"
			className={cn(
				"pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5",
				visible ? "opacity-100" : "opacity-0",
				visible
					? "transition-opacity duration-150"
					: "transition-opacity duration-300",
			)}
		>
			<div
				className="h-full bg-[#5F9EA0] shadow-[0_0_8px_rgba(95,158,160,0.6)] transition-[width] duration-200 ease-out"
				style={{ width: `${progress}%` }}
			/>
		</div>
	);
}
