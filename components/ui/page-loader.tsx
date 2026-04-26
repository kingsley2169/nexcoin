import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function PageLoader({
	caption = "Loading…",
	className,
}: {
	caption?: string;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex min-h-[60vh] flex-col items-center justify-center gap-3 text-[#5d6163]",
				className,
			)}
		>
			<Spinner size="lg" label={caption} />
			<p className="text-sm font-medium">{caption}</p>
		</div>
	);
}
