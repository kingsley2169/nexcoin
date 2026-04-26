"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export function FormSubmitButton({
	children,
	className,
	pendingLabel,
	size,
	variant,
}: {
	children: React.ReactNode;
	className?: string;
	pendingLabel?: string;
	size?: ButtonSize;
	variant?: ButtonVariant;
}) {
	const { pending } = useFormStatus();

	return (
		<Button
			type="submit"
			size={size}
			variant={variant}
			disabled={pending}
			className={cn("gap-2", className)}
		>
			{pending ? (
				<>
					<Spinner size="sm" tone="inverse" />
					<span>{pendingLabel ?? "Working…"}</span>
				</>
			) : (
				children
			)}
		</Button>
	);
}
