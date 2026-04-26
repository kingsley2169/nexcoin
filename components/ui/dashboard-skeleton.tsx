import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
				<div className="space-y-2">
					<Skeleton className="h-7 w-56" />
					<Skeleton className="h-4 w-80" />
				</div>
				<div className="flex gap-3">
					<Skeleton className="h-10 w-32" />
					<Skeleton className="h-10 w-32" />
				</div>
			</div>

			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{Array.from({ length: 4 }).map((_, index) => (
					<div
						key={index}
						className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]"
					>
						<Skeleton className="h-4 w-24" />
						<Skeleton className="mt-3 h-8 w-32" />
						<Skeleton className="mt-3 h-3 w-40" />
					</div>
				))}
			</section>

			<section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
				<div className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
					<Skeleton className="h-5 w-40" />
					<Skeleton className="mt-2 h-4 w-72" />
					<div className="mt-5 space-y-3">
						{Array.from({ length: 5 }).map((_, index) => (
							<div
								key={index}
								className="flex items-center justify-between border-b border-[#eef1f1] py-3 last:border-b-0"
							>
								<div className="space-y-2">
									<Skeleton className="h-4 w-48" />
									<Skeleton className="h-3 w-32" />
								</div>
								<Skeleton className="h-6 w-20" />
							</div>
						))}
					</div>
				</div>

				<div className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
					<Skeleton className="h-5 w-32" />
					<div className="mt-5 space-y-3">
						{Array.from({ length: 4 }).map((_, index) => (
							<div key={index} className="space-y-2">
								<Skeleton className="h-4 w-3/4" />
								<Skeleton className="h-3 w-1/2" />
							</div>
						))}
					</div>
				</div>
			</section>
		</div>
	);
}
