"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
	addKycSubmissionNote,
	updateKycSubmissionStatus,
} from "@/app/nexcoin-admin-priv/kyc-review/actions";
import {
	type AdminKycCheckStatus,
	type AdminKycDocumentType,
	type AdminKycReviewData,
	type AdminKycStatus,
	type AdminKycSubmission,
} from "@/lib/admin-kyc-review";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type KycSubmissionStatusInput =
	| "pending"
	| "in_review"
	| "needs_resubmission"
	| "approved"
	| "rejected";

const statusToDbValue: Record<AdminKycStatus, KycSubmissionStatusInput> = {
	Approved: "approved",
	"In Review": "in_review",
	"Needs Resubmission": "needs_resubmission",
	Pending: "pending",
	Rejected: "rejected",
};

type AdminKycReviewProps = {
	data: AdminKycReviewData;
};

type StatusFilter = AdminKycStatus | "all";
type DocumentFilter = AdminKycDocumentType | "all";
type DateFilter = "7d" | "30d" | "90d" | "all";

const statusFilters: { label: string; value: StatusFilter }[] = [
	{ label: "All status", value: "all" },
	{ label: "Pending", value: "Pending" },
	{ label: "In Review", value: "In Review" },
	{ label: "Approved", value: "Approved" },
	{ label: "Rejected", value: "Rejected" },
	{ label: "Needs Resubmission", value: "Needs Resubmission" },
];

const documentFilters: { label: string; value: DocumentFilter }[] = [
	{ label: "All documents", value: "all" },
	{ label: "Passport", value: "Passport" },
	{ label: "National ID", value: "National ID" },
	{ label: "Driver License", value: "Driver License" },
];

const dateFilters: { label: string; value: DateFilter }[] = [
	{ label: "7D", value: "7d" },
	{ label: "30D", value: "30d" },
	{ label: "90D", value: "90d" },
	{ label: "All", value: "all" },
];

const statusClasses: Record<AdminKycStatus, string> = {
	Approved: "bg-[#e6f3ec] text-[#2e8f5b]",
	"In Review": "bg-[#eef6f5] text-[#3c7f80]",
	"Needs Resubmission": "bg-[#fff1e0] text-[#a66510]",
	Pending: "bg-[#fff1e0] text-[#a66510]",
	Rejected: "bg-[#fde8e8] text-[#b1423a]",
};

const checkClasses: Record<AdminKycCheckStatus, string> = {
	Failed: "bg-[#fde8e8] text-[#b1423a]",
	Passed: "bg-[#e6f3ec] text-[#2e8f5b]",
	Review: "bg-[#fff1e0] text-[#a66510]",
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
	day: "numeric",
	hour: "numeric",
	minute: "2-digit",
	month: "short",
	year: "numeric",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
	day: "numeric",
	month: "short",
	year: "numeric",
});

function formatDateTime(iso: string) {
	return dateTimeFormatter.format(new Date(iso));
}

function formatDate(iso: string) {
	return dateFormatter.format(new Date(iso));
}

function getInitials(name: string) {
	return name
		.split(" ")
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

function getWaitingLabel(iso: string) {
	const now = new Date("2026-04-22T12:00:00Z");
	const hours = Math.max(
		1,
		Math.round((now.getTime() - new Date(iso).getTime()) / (1000 * 60 * 60)),
	);

	return hours >= 24 ? `${Math.round(hours / 24)}d waiting` : `${hours}h waiting`;
}

function SearchIcon({ className }: { className?: string }) {
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
			<path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16ZM21 21l-4.35-4.35" />
		</svg>
	);
}

export function AdminKycReview({ data }: AdminKycReviewProps) {
	const router = useRouter();
	const submissions = data.submissions;
	const [selectedId, setSelectedId] = useState(data.submissions[0]?.id ?? "");
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [documentFilter, setDocumentFilter] = useState<DocumentFilter>("all");
	const [dateFilter, setDateFilter] = useState<DateFilter>("30d");
	const [note, setNote] = useState("");
	const [noteSaved, setNoteSaved] = useState(false);
	const [isReviewOpen, setIsReviewOpen] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const selectedSubmission =
		submissions.find((submission) => submission.id === selectedId) ??
		submissions[0];

	const filteredSubmissions = useMemo(() => {
		const trimmed = query.trim().toLowerCase();
		const now = new Date("2026-04-22T12:00:00Z");
		const dayWindow =
			dateFilter === "7d"
				? 7
				: dateFilter === "30d"
					? 30
					: dateFilter === "90d"
						? 90
						: null;

		return submissions.filter((submission) => {
			if (statusFilter !== "all" && submission.status !== statusFilter) {
				return false;
			}

			if (
				documentFilter !== "all" &&
				submission.documentType !== documentFilter
			) {
				return false;
			}

			if (dayWindow) {
				const ageMs = now.getTime() - new Date(submission.createdAt).getTime();
				const ageDays = ageMs / (1000 * 60 * 60 * 24);

				if (ageDays > dayWindow) {
					return false;
				}
			}

			if (trimmed) {
				const haystack = [
					submission.reference,
					submission.userName,
					submission.userEmail,
					submission.documentNumber,
					submission.address,
					...submission.flags,
					...submission.internalNotes,
				]
					.join(" ")
					.toLowerCase();

				if (!haystack.includes(trimmed)) {
					return false;
				}
			}

			return true;
		});
	}, [
		dateFilter,
		documentFilter,
		query,
		statusFilter,
		submissions,
	]);

	const updateStatus = (id: string, status: AdminKycStatus) => {
		setErrorMessage(null);
		startTransition(async () => {
			const result = await updateKycSubmissionStatus({
				status: statusToDbValue[status],
				submissionId: id,
			});

			if (!result.ok) {
				setErrorMessage(result.error);
				return;
			}

			if (status === "Approved" || status === "Rejected") {
				setIsReviewOpen(false);
			}

			router.refresh();
		});
	};

	const saveNote = () => {
		const trimmed = note.trim();

		if (!selectedSubmission || !trimmed) {
			return;
		}

		setErrorMessage(null);
		startTransition(async () => {
			const result = await addKycSubmissionNote(
				selectedSubmission.id,
				trimmed,
			);

			if (!result.ok) {
				setErrorMessage(result.error);
				return;
			}

			setNote("");
			setNoteSaved(true);
			window.setTimeout(() => setNoteSaved(false), 2500);
			router.refresh();
		});
	};

	const resetFilters = () => {
		setQuery("");
		setStatusFilter("all");
		setDocumentFilter("all");
		setDateFilter("30d");
	};

	const openReview = (id: string) => {
		setSelectedId(id);
		setIsReviewOpen(true);
		setNoteSaved(false);
	};

	return (
		<div className="space-y-6">
			<header className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
				<div className="min-w-0">
					<h1 className="text-2xl font-semibold text-[#576363]">KYC Review</h1>
					<p className="mt-1 max-w-3xl text-sm leading-6 text-[#5d6163]">
						Review identity submissions, document quality, verification status,
						and account limits before approving withdrawals or higher tiers.
					</p>
				</div>
				<div className="flex flex-wrap gap-3">
					<Button type="button" onClick={() => setStatusFilter("Pending")}>
						Pending Reviews
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={() => window.alert("KYC report export is ready for backend wiring.")}
					>
						Export Report
					</Button>
				</div>
			</header>

			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
				<SummaryCard
					hint="Waiting for admin action"
					label="Pending review"
					value={data.summary.pendingReview.toString()}
					tone="warning"
				/>
				<SummaryCard
					hint="Completed today"
					label="Approved today"
					value={data.summary.approvedToday.toString()}
					tone="positive"
				/>
				<SummaryCard
					hint="Failed checks today"
					label="Rejected today"
					value={data.summary.rejectedToday.toString()}
					tone="danger"
				/>
				<SummaryCard
					hint="Review desk speed"
					label="Average review"
					value={data.summary.averageReviewTime}
				/>
				<SummaryCard
					hint="Renewal needed soon"
					label="Docs expiring"
					value={data.summary.documentsExpiring.toString()}
				/>
			</section>

			<div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_390px]">
				<section className="rounded-lg border border-[#d7e5e3] bg-white shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
					<div className="border-b border-[#d7e5e3] p-5">
						<div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
							<div className="min-w-0">
								<h2 className="text-lg font-semibold text-[#576363]">
									Review queue
								</h2>
								<p className="mt-1 text-sm leading-6 text-[#5d6163]">
									{filteredSubmissions.length} submissions match current
									filters.
								</p>
							</div>
							<div className="flex h-10 w-full min-w-0 items-center rounded-md border border-[#cfdcda] bg-white px-3 focus-within:border-[#5F9EA0] focus-within:ring-4 focus-within:ring-[#5F9EA0]/15 sm:max-w-md xl:w-96">
								<SearchIcon className="h-4 w-4 text-[#5d6163]" />
								<label className="sr-only" htmlFor="admin-kyc-search">
									Search KYC submissions
								</label>
								<input
									id="admin-kyc-search"
									type="search"
									value={query}
									onChange={(event) => setQuery(event.target.value)}
									placeholder="Search user, email, reference"
									className="ml-2 h-full min-w-0 flex-1 bg-transparent text-sm text-[#576363] outline-none placeholder:text-[#9aa5a4]"
								/>
							</div>
						</div>

						<FilterGroup
							filters={statusFilters}
							onChange={setStatusFilter}
							value={statusFilter}
						/>
						<FilterGroup
							filters={documentFilters}
							onChange={setDocumentFilter}
							value={documentFilter}
						/>
						<div className="mt-3 flex flex-wrap items-center gap-2">
							<FilterGroup
								filters={dateFilters}
								onChange={setDateFilter}
								value={dateFilter}
								wrapperClassName="mt-0"
							/>
							<Button type="button" variant="outline" onClick={resetFilters}>
								Reset filters
							</Button>
						</div>
					</div>

					<div className="divide-y divide-[#eef1f1]">
						{filteredSubmissions.length === 0 ? (
							<div className="p-8 text-center">
								<p className="font-semibold text-[#576363]">
									No KYC submissions found
								</p>
								<p className="mt-2 text-sm text-[#5d6163]">
									Adjust filters or search terms.
								</p>
							</div>
						) : (
							filteredSubmissions.map((submission) => (
								<KycRow
									key={submission.id}
									onReview={openReview}
									selected={selectedSubmission?.id === submission.id}
									submission={submission}
								/>
							))
						)}
					</div>
				</section>

				<div className="space-y-6 2xl:sticky 2xl:top-24 2xl:self-start">
					<ComplianceFlagsCard flags={data.flags} />
				</div>
			</div>

			{isReviewOpen && selectedSubmission ? (
				<KycReviewModal
					onClose={() => setIsReviewOpen(false)}
					submission={selectedSubmission}
				>
					<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
						<DocumentWorkspace submission={selectedSubmission} />
						<div className="xl:sticky xl:top-0 xl:self-start">
							<KycDecisionPanel
								errorMessage={errorMessage}
								isPending={isPending}
								note={note}
								noteSaved={noteSaved}
								onNoteChange={setNote}
								onSaveNote={saveNote}
								onStatusChange={updateStatus}
								submission={selectedSubmission}
							/>
						</div>
					</div>
				</KycReviewModal>
			) : null}
		</div>
	);
}

function SummaryCard({
	hint,
	label,
	tone = "neutral",
	value,
}: {
	hint: string;
	label: string;
	tone?: "danger" | "neutral" | "positive" | "warning";
	value: string;
}) {
	return (
		<div className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<p className="text-sm text-[#5d6163]">{label}</p>
			<p className="mt-2 text-2xl font-semibold text-[#576363]">{value}</p>
			<p
				className={cn(
					"mt-2 text-sm",
					tone === "danger" && "text-[#b1423a]",
					tone === "positive" && "text-[#2e8f5b]",
					tone === "warning" && "text-[#a66510]",
					tone === "neutral" && "text-[#5d6163]",
				)}
			>
				{hint}
			</p>
		</div>
	);
}

function FilterGroup<T extends string>({
	filters,
	onChange,
	value,
	wrapperClassName,
}: {
	filters: { label: string; value: T }[];
	onChange: (value: T) => void;
	value: T;
	wrapperClassName?: string;
}) {
	return (
		<div className={cn("mt-3 flex flex-wrap gap-2", wrapperClassName)}>
			{filters.map((filter) => (
				<button
					key={filter.value}
					type="button"
					onClick={() => onChange(filter.value)}
					className={cn(
						"rounded-full px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15",
						value === filter.value
							? "bg-[#5F9EA0] text-white"
							: "bg-[#f7faf9] text-[#576363] hover:bg-[#eef6f5] hover:text-[#5F9EA0]",
					)}
				>
					{filter.label}
				</button>
			))}
		</div>
	);
}

function KycRow({
	onReview,
	selected,
	submission,
}: {
	onReview: (id: string) => void;
	selected: boolean;
	submission: AdminKycSubmission;
}) {
	const issueCount = submission.checks.filter(
		(check) => check.status !== "Passed",
	).length;

	return (
		<div
			role="button"
			tabIndex={0}
			onClick={() => onReview(submission.id)}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					onReview(submission.id);
				}
			}}
			className={cn(
				"cursor-pointer p-4 transition hover:bg-[#f7faf9] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15",
				selected && "bg-[#eef6f5]",
			)}
		>
			<div className="flex gap-3">
				<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#5F9EA0] text-sm font-semibold text-white">
					{getInitials(submission.userName)}
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex items-start justify-between gap-2">
						<div className="min-w-0">
							<p className="truncate font-semibold text-[#576363]">
								{submission.userName}
							</p>
							<p className="mt-0.5 truncate text-xs text-[#5d6163]">
								{submission.reference}
							</p>
						</div>
					</div>
					<div className="mt-3 flex flex-wrap gap-2">
						<span
							className={cn(
								"rounded-full px-2.5 py-1 text-xs font-semibold",
								statusClasses[submission.status],
							)}
						>
							{submission.status}
						</span>
						<span className="rounded-full bg-[#f7faf9] px-2.5 py-1 text-xs font-semibold text-[#5F9EA0]">
							{issueCount} issues
						</span>
						<span className="rounded-full bg-[#f7faf9] px-2.5 py-1 text-xs font-semibold text-[#5d6163]">
							{getWaitingLabel(submission.createdAt)}
						</span>
					</div>
					<div className="mt-3 flex flex-wrap items-center justify-between gap-3">
						<p className="min-w-0 truncate text-xs text-[#5d6163]">
							{submission.documentType} - {submission.documentQuality} -{" "}
							{submission.accountStatus}
						</p>
						<Button
							type="button"
							size="sm"
							variant="outline"
							onClick={(event) => {
								event.stopPropagation();
								onReview(submission.id);
							}}
						>
							Review
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

function KycReviewModal({
	children,
	onClose,
	submission,
}: {
	children: React.ReactNode;
	onClose: () => void;
	submission: AdminKycSubmission;
}) {
	return (
		<div
			className="fixed inset-0 z-[70] bg-[#1f2929]/45 p-3 backdrop-blur-sm sm:p-5"
			role="dialog"
			aria-modal="true"
			aria-labelledby="admin-kyc-review-modal-title"
		>
			<div
				className="absolute inset-0"
				aria-hidden="true"
				onClick={onClose}
			/>
			<section className="relative mx-auto flex max-h-[calc(100vh-24px)] max-w-7xl flex-col overflow-hidden rounded-lg border border-[#d7e5e3] bg-[#f7faf9] shadow-[0_28px_90px_rgba(31,41,41,0.28)] sm:max-h-[calc(100vh-40px)]">
				<header className="flex items-start justify-between gap-4 border-b border-[#d7e5e3] bg-white px-4 py-4 sm:px-6">
					<div className="min-w-0">
						<p className="text-sm text-[#5d6163]">KYC review</p>
						<h2
							id="admin-kyc-review-modal-title"
							className="mt-1 truncate text-xl font-semibold text-[#576363]"
						>
							{submission.userName} - {submission.reference}
						</h2>
					</div>
					<Button type="button" variant="outline" onClick={onClose}>
						Close
					</Button>
				</header>
				<div className="overflow-y-auto p-4 sm:p-6">{children}</div>
			</section>
		</div>
	);
}

function DocumentWorkspace({ submission }: { submission: AdminKycSubmission }) {
	const failedChecks = submission.checks.filter(
		(check) => check.status === "Failed",
	).length;
	const reviewChecks = submission.checks.filter(
		(check) => check.status === "Review",
	).length;

	return (
		<section className="space-y-6">
			<div className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div>
						<p className="text-sm text-[#5d6163]">Verification workspace</p>
						<h2 className="mt-1 text-xl font-semibold text-[#576363]">
							{submission.userName}
						</h2>
						<p className="mt-1 text-sm text-[#5d6163]">
							{submission.userEmail} - submitted{" "}
							{formatDateTime(submission.createdAt)}
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						<span
							className={cn(
								"rounded-full px-2.5 py-1 text-xs font-semibold",
								statusClasses[submission.status],
							)}
						>
							{submission.status}
						</span>
					</div>
				</div>

				<div className="mt-5 grid gap-4 md:grid-cols-3">
					<InsightTile label="Failed checks" value={failedChecks.toString()} />
					<InsightTile label="Needs review" value={reviewChecks.toString()} />
					<InsightTile
						label="Blocked limit"
						value={submission.accountLimits.current}
					/>
				</div>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<DocumentPreview
					detail={`${submission.documentType} - ${submission.documentNumber}`}
					label="ID front"
					src={submission.documentFrontUrl}
					status={
						submission.documentQuality === "Clear"
							? "Readable"
							: "Needs resubmission"
					}
					tone={submission.documentQuality === "Clear" ? "positive" : "warning"}
				/>
				<DocumentPreview
					detail={`Expires ${formatDate(submission.documentExpiry)}`}
					label="ID back"
					src={submission.documentBackUrl}
					status={
						submission.checks.some(
							(check) =>
								check.label === "Document not expired" &&
								check.status === "Failed",
						)
							? "Expired"
							: "Valid"
					}
					tone="positive"
				/>
				<DocumentPreview
					detail={`Liveness ${submission.livenessStatus}`}
					label="Selfie match"
					src={submission.selfieUrl}
					status={submission.livenessStatus}
					tone={
						submission.livenessStatus === "Passed"
							? "positive"
							: submission.livenessStatus === "Failed"
								? "danger"
								: "warning"
					}
				/>
				<DocumentPreview
					detail={submission.address}
					label="Proof of address"
					src={submission.proofOfAddressUrl}
					status={submission.proofOfAddressStatus}
					tone={
						submission.proofOfAddressStatus === "Passed"
							? "positive"
							: submission.proofOfAddressStatus === "Failed"
								? "danger"
								: "warning"
					}
				/>
			</div>

			<div className="grid gap-6 xl:grid-cols-2">
				<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
					<h2 className="text-lg font-semibold text-[#576363]">
						Identity details
					</h2>
					<div className="mt-5 grid gap-3 text-sm">
						<DetailLine label="Date of birth" value={formatDate(submission.dateOfBirth)} />
						<DetailLine label="Address" value={submission.address} />
						<DetailLine label="Document" value={submission.documentType} />
						<DetailLine label="Document no." value={submission.documentNumber} />
						<DetailLine label="Expiry" value={formatDate(submission.documentExpiry)} />
					</div>
				</section>

				<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
					<h2 className="text-lg font-semibold text-[#576363]">Audit trail</h2>
					<div className="mt-4 space-y-3">
						{submission.timeline.map((item) => (
							<div key={item.id} className="border-l-2 border-[#d7e5e3] pl-3">
								<p className="text-sm font-medium text-[#576363]">
									{item.label}
								</p>
								<p className="mt-1 text-xs text-[#5d6163]">
									{formatDateTime(item.createdAt)}
								</p>
							</div>
						))}
					</div>
				</section>
			</div>
		</section>
	);
}

function InsightTile({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-lg border border-[#eef1f1] bg-[#f7faf9] p-4">
			<p className="text-xs font-semibold uppercase text-[#5d6163]">{label}</p>
			<p className="mt-2 text-lg font-semibold text-[#576363]">{value}</p>
		</div>
	);
}

function DocumentPreview({
	detail,
	label,
	src,
	status,
	tone,
}: {
	detail: string;
	label: string;
	src: string | null;
	status: string;
	tone: "danger" | "positive" | "warning";
}) {
	return (
		<section className="overflow-hidden rounded-lg border border-[#d7e5e3] bg-white shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="flex items-center justify-between gap-3 border-b border-[#eef1f1] px-4 py-3">
				<div className="min-w-0">
					<h3 className="font-semibold text-[#576363]">{label}</h3>
					<p className="mt-0.5 truncate text-xs text-[#5d6163]">{detail}</p>
				</div>
				<span
					className={cn(
						"shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
						tone === "danger" && "bg-[#fde8e8] text-[#b1423a]",
						tone === "positive" && "bg-[#e6f3ec] text-[#2e8f5b]",
						tone === "warning" && "bg-[#fff1e0] text-[#a66510]",
					)}
				>
					{status}
				</span>
			</div>
			<div className="relative aspect-[16/10] bg-[#eef6f5]">
				{src ? (
					<a
						href={src}
						target="_blank"
						rel="noopener noreferrer"
						className="block h-full w-full"
					>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={src}
							alt={label}
							className="h-full w-full object-contain"
						/>
					</a>
				) : (
					<div className="flex h-full items-center justify-center p-5 text-center text-sm text-[#5d6163]">
						No file uploaded
					</div>
				)}
			</div>
		</section>
	);
}

function KycDecisionPanel({
	errorMessage,
	isPending,
	note,
	noteSaved,
	onNoteChange,
	onSaveNote,
	onStatusChange,
	submission,
}: {
	errorMessage: string | null;
	isPending: boolean;
	note: string;
	noteSaved: boolean;
	onNoteChange: (value: string) => void;
	onSaveNote: () => void;
	onStatusChange: (id: string, status: AdminKycStatus) => void;
	submission: AdminKycSubmission;
}) {
	const isTerminal =
		submission.status === "Approved" || submission.status === "Rejected";
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<p className="text-sm text-[#5d6163]">Decision panel</p>
					<h2 className="mt-1 text-lg font-semibold text-[#576363]">
						{submission.reference}
					</h2>
				</div>
				<span
					className={cn(
						"rounded-full px-2.5 py-1 text-xs font-semibold",
						statusClasses[submission.status],
					)}
				>
					{submission.status}
				</span>
			</div>

			<div className="mt-5 grid gap-3 text-sm">
				<DetailLine label="User" value={submission.userName} />
				<DetailLine label="Account" value={submission.accountStatus} />
				<DetailLine label="Current limit" value={submission.accountLimits.current} />
				<DetailLine label="After approval" value={submission.accountLimits.afterApproval} />
			</div>

			<div className="mt-5">
				<p className="text-sm font-semibold text-[#576363]">Review checklist</p>
				<div className="mt-3 grid gap-2">
					{submission.checks.map((check) => (
						<div
							key={check.label}
							className="flex items-center justify-between gap-3 rounded-md bg-[#f7faf9] px-3 py-2"
						>
							<span className="text-sm text-[#5d6163]">{check.label}</span>
							<span
								className={cn(
									"rounded-full px-2.5 py-1 text-xs font-semibold",
									checkClasses[check.status],
								)}
							>
								{check.status}
							</span>
						</div>
					))}
				</div>
			</div>

			<div className="mt-5">
				<p className="text-sm font-semibold text-[#576363]">Flags</p>
				<div className="mt-3 space-y-2">
					{submission.flags.map((flag) => (
						<p
							key={flag}
							className="rounded-md bg-[#fff7f6] px-3 py-2 text-sm leading-6 text-[#b1423a]"
						>
							{flag}
						</p>
					))}
				</div>
			</div>

			<div className="mt-5">
				<p className="text-sm font-semibold text-[#576363]">Internal notes</p>
				<div className="mt-3 space-y-2">
					{submission.internalNotes.map((item) => (
						<p
							key={item}
							className="rounded-md bg-[#f7faf9] px-3 py-2 text-sm leading-6 text-[#5d6163]"
						>
							{item}
						</p>
					))}
				</div>
				<label className="sr-only" htmlFor="admin-kyc-note">
					Add internal note
				</label>
				<textarea
					id="admin-kyc-note"
					value={note}
					onChange={(event) => onNoteChange(event.target.value)}
					placeholder="Add an internal review note"
					className="mt-3 min-h-24 w-full rounded-md border border-[#cfdcda] bg-white px-3 py-2 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
				/>
				<div className="mt-3 flex flex-wrap gap-3">
					<Button type="button" onClick={onSaveNote} disabled={isPending}>
						Save note
					</Button>
					<Button
						type="button"
						variant="outline"
						disabled={isPending || isTerminal}
						onClick={() => onStatusChange(submission.id, "In Review")}
					>
						Mark in review
					</Button>
					<Button
						type="button"
						variant="outline"
						disabled={isPending || isTerminal}
						onClick={() => onStatusChange(submission.id, "Needs Resubmission")}
					>
						Request resubmission
					</Button>
					<Button
						type="button"
						variant="outline"
						disabled={isPending || isTerminal}
						onClick={() => onStatusChange(submission.id, "Rejected")}
					>
						Reject
					</Button>
					<Button
						type="button"
						disabled={isPending || isTerminal}
						onClick={() => onStatusChange(submission.id, "Approved")}
					>
						Approve
					</Button>
				</div>
				{noteSaved ? (
					<p className="mt-2 text-sm font-semibold text-[#2e8f5b]">Note saved.</p>
				) : null}
				{errorMessage ? (
					<p className="mt-2 text-sm font-semibold text-[#b1423a]">
						{errorMessage}
					</p>
				) : null}
				{isTerminal ? (
					<p className="mt-2 text-sm text-[#5d6163]">
						Terminal submissions cannot be reopened — create a new submission
						instead.
					</p>
				) : null}
			</div>
		</section>
	);
}

function DetailLine({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-start justify-between gap-4 border-b border-[#eef1f1] pb-2 last:border-b-0">
			<span className="text-[#5d6163]">{label}</span>
			<span className="min-w-0 text-right font-semibold text-[#576363]">
				{value}
			</span>
		</div>
	);
}

function ComplianceFlagsCard({ flags }: { flags: AdminKycReviewData["flags"] }) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<h2 className="text-lg font-semibold text-[#576363]">
				Compliance flags
			</h2>
			<div className="mt-4 space-y-3">
				{flags.map((flag) => (
					<div key={flag.id} className="border-b border-[#eef1f1] pb-3 last:border-b-0 last:pb-0">
						<div className="flex flex-wrap items-center gap-2">
							<p className="font-semibold text-[#576363]">{flag.label}</p>
							<span className="rounded-full bg-[#f7faf9] px-2.5 py-1 text-xs font-semibold text-[#5F9EA0]">
								{flag.count}
							</span>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
