import { cn } from "@/lib/utils";

type SpinnerSize = "sm" | "md" | "lg";
type SpinnerTone = "default" | "inverse";

const sizeClasses: Record<SpinnerSize, string> = {
	sm: "h-4 w-4 border-2",
	md: "h-6 w-6 border-2",
	lg: "h-10 w-10 border-[3px]",
};

const toneClasses: Record<SpinnerTone, string> = {
	default: "border-[#cfdcda] border-t-[#5F9EA0]",
	inverse: "border-white/30 border-t-white",
};

export function Spinner({
	className,
	label = "Loading…",
	size = "md",
	tone = "default",
}: {
	className?: string;
	label?: string;
	size?: SpinnerSize;
	tone?: SpinnerTone;
}) {
	return (
		<span
			role="status"
			aria-live="polite"
			className={cn("inline-flex items-center justify-center", className)}
		>
			<span
				aria-hidden="true"
				className={cn(
					"inline-block animate-spin rounded-full",
					sizeClasses[size],
					toneClasses[tone],
				)}
			/>
			<span className="sr-only">{label}</span>
		</span>
	);
}
