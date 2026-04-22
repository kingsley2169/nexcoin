"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
	type DocumentStatus,
	type VerificationData,
	type VerificationDocument,
	type VerificationStatus,
} from "@/lib/verification";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AccountVerificationProps = {
	data: VerificationData;
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
	day: "numeric",
	hour: "numeric",
	minute: "2-digit",
	month: "short",
	year: "numeric",
});

const statusClasses: Record<VerificationStatus, string> = {
	"Action required": "bg-[#fde8e8] text-[#b1423a]",
	Approved: "bg-[#e6f3ec] text-[#2e8f5b]",
	"In review": "bg-[#fff1e0] text-[#a66510]",
	"Not submitted": "bg-[#eef1f1] text-[#5d6163]",
};

const documentStatusClasses: Record<DocumentStatus, string> = {
	Approved: "bg-[#e6f3ec] text-[#2e8f5b]",
	"In review": "bg-[#fff1e0] text-[#a66510]",
	"Needs update": "bg-[#fde8e8] text-[#b1423a]",
	"Not uploaded": "bg-[#eef1f1] text-[#5d6163]",
};

function formatDateTime(iso: string) {
	return dateTimeFormatter.format(new Date(iso));
}

function ShieldIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			className={className}
			aria-hidden="true"
			fill="none"
			stroke="currentColor"
			strokeLinejoin="round"
			strokeWidth="2"
		>
			<path d="M12 3 5 6v5c0 4.5 2.8 8 7 10 4.2-2 7-5.5 7-10V6z" />
			<path d="m9 12 2 2 4-5" strokeLinecap="round" />
		</svg>
	);
}

function UploadIcon({ className }: { className?: string }) {
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
			<path d="M12 16V5M8 9l4-4 4 4M5 20h14" />
		</svg>
	);
}

function FileIcon({ className }: { className?: string }) {
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
			<path d="M6 3h8l4 4v14H6zM14 3v5h5M9 13h6M9 17h4" />
		</svg>
	);
}

function ClockIcon({ className }: { className?: string }) {
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
			<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2" />
		</svg>
	);
}

export function AccountVerification({ data }: AccountVerificationProps) {
	const [documents, setDocuments] = useState(data.documents);
	const [submissionNotice, setSubmissionNotice] = useState(false);

	const summary = useMemo(() => {
		const approved = documents.filter((item) => item.status === "Approved").length;
		const needsUpdate = documents.filter(
			(item) => item.status === "Needs update",
		).length;
		const missing = documents.filter(
			(item) => item.status === "Not uploaded",
		).length;

		return {
			approved,
			missing,
			needsUpdate,
		};
	}, [documents]);

	const handleUploaded = (id: string) => {
		setDocuments((current) =>
			current.map((document) =>
				document.id === id
					? {
							...document,
							lastUpdatedAt: new Date("2026-04-22T09:00:00Z").toISOString(),
							status: "In review",
						}
					: document,
			),
		);
	};

	const handleSubmit = () => {
		setSubmissionNotice(true);
		window.setTimeout(() => setSubmissionNotice(false), 3000);
	};

	return (
		<div className="space-y-6">
			<header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="text-2xl font-semibold text-[#576363]">
						KYC Verification
					</h1>
					<p className="mt-1 max-w-2xl text-sm leading-6 text-[#5d6163]">
						Submit identity documents, track review status, and unlock higher
						account limits for sensitive withdrawals.
					</p>
				</div>
				<div className="flex flex-wrap gap-3">
					<Button type="button" onClick={handleSubmit}>
						Submit for Review
					</Button>
					<Link
						href="/account/support"
						className={buttonVariants({ size: "md", variant: "outline" })}
					>
						Contact Support
					</Link>
				</div>
			</header>

			{submissionNotice ? (
				<div className="rounded-lg border border-[#d7e5e3] bg-white p-4 text-sm font-medium text-[#3c7f80] shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
					Verification submission flow is ready for backend connection.
				</div>
			) : null}

			<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<SummaryCard
					hint={data.overview.tier}
					label="Verification status"
					value={data.overview.status}
					tone={data.overview.status === "Action required" ? "danger" : "neutral"}
				/>
				<SummaryCard
					hint="Documents accepted"
					label="Approved"
					value={`${summary.approved}/${documents.length}`}
					tone="positive"
				/>
				<SummaryCard
					hint="Documents requiring attention"
					label="Needs update"
					value={String(summary.needsUpdate)}
					tone={summary.needsUpdate > 0 ? "danger" : "neutral"}
				/>
				<SummaryCard
					hint={data.overview.nextReviewEta}
					label="Review ETA"
					value={summary.missing > 0 ? "Pending docs" : "Queued"}
					tone={summary.missing > 0 ? "warning" : "neutral"}
				/>
			</section>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_370px]">
				<div className="space-y-6">
					<ProgressCard data={data} />
					<DocumentsCard documents={documents} onUploaded={handleUploaded} />
					<LimitsCard limits={data.limits} />
				</div>
				<div className="space-y-6">
					<TimelineCard timeline={data.timeline} />
					<NotesCard notes={data.notes} />
				</div>
			</div>
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

function ProgressCard({ data }: { data: VerificationData }) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex gap-3">
					<IconFrame tone="warning">
						<ShieldIcon className="h-5 w-5" />
					</IconFrame>
					<div>
						<h2 className="text-lg font-semibold text-[#576363]">
							Verification review
						</h2>
						<p className="mt-1 text-sm leading-6 text-[#5d6163]">
							Reference {data.overview.reference}
							{data.overview.submittedAt
								? ` - submitted ${formatDateTime(data.overview.submittedAt)}`
								: ""}
						</p>
					</div>
				</div>
				<span
					className={cn(
						"self-start rounded-full px-3 py-1.5 text-xs font-semibold",
						statusClasses[data.overview.status],
					)}
				>
					{data.overview.status}
				</span>
			</div>

			<div className="mt-6 grid gap-4 md:grid-cols-3">
				{data.steps.map((step, index) => (
					<div key={step.id} className="relative rounded-lg border border-[#eef1f1] p-4">
						<div className="flex items-center justify-between gap-3">
							<span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#eef6f5] text-sm font-semibold text-[#3c7f80]">
								{index + 1}
							</span>
							<span
								className={cn(
									"rounded-full px-2.5 py-1 text-xs font-semibold",
									statusClasses[step.status],
								)}
							>
								{step.status}
							</span>
						</div>
						<p className="mt-4 font-semibold text-[#576363]">{step.title}</p>
						<p className="mt-2 text-sm leading-6 text-[#5d6163]">
							{step.description}
						</p>
					</div>
				))}
			</div>
		</section>
	);
}

function DocumentsCard({
	documents,
	onUploaded,
}: {
	documents: VerificationDocument[];
	onUploaded: (id: string) => void;
}) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="border-b border-[#d7e5e3] p-5">
				<h2 className="text-lg font-semibold text-[#576363]">
					Required documents
				</h2>
				<p className="mt-1 text-sm leading-6 text-[#5d6163]">
					Upload clear files in JPG, PNG, or PDF format.
				</p>
			</div>
			<div className="divide-y divide-[#eef1f1]">
				{documents.map((document) => (
					<DocumentRow
						key={document.id}
						document={document}
						onUploaded={onUploaded}
					/>
				))}
			</div>
		</section>
	);
}

function DocumentRow({
	document,
	onUploaded,
}: {
	document: VerificationDocument;
	onUploaded: (id: string) => void;
}) {
	const inputRef = useRef<HTMLInputElement | null>(null);
	const [fileName, setFileName] = useState("");

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];

		if (!file) {
			return;
		}

		setFileName(file.name);
		onUploaded(document.id);
	};

	return (
		<div className="grid gap-4 p-5 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
			<div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#eef6f5] text-[#3c7f80]">
				<FileIcon className="h-5 w-5" />
			</div>
			<div className="min-w-0">
				<div className="flex flex-wrap items-center gap-2">
					<p className="font-semibold text-[#576363]">{document.title}</p>
					<span
						className={cn(
							"rounded-full px-2.5 py-1 text-xs font-semibold",
							documentStatusClasses[document.status],
						)}
					>
						{document.status}
					</span>
				</div>
				<p className="mt-1 text-sm leading-6 text-[#5d6163]">
					{document.description}
				</p>
				<p className="mt-2 text-xs text-[#5d6163]">
					{fileName
						? `Selected: ${fileName}`
						: document.lastUpdatedAt
							? `Last updated ${formatDateTime(document.lastUpdatedAt)}`
							: "No file uploaded yet"}
				</p>
			</div>
			<div className="flex items-start gap-2">
				<input
					ref={inputRef}
					type="file"
					accept=".jpg,.jpeg,.png,.pdf"
					className="sr-only"
					onChange={handleChange}
				/>
				<Button
					type="button"
					variant={document.status === "Approved" ? "outline" : "primary"}
					className="gap-2"
					onClick={() => inputRef.current?.click()}
				>
					<UploadIcon className="h-4 w-4" />
					{document.status === "Not uploaded" ? "Upload" : "Replace"}
				</Button>
			</div>
		</div>
	);
}

function LimitsCard({ limits }: { limits: VerificationData["limits"] }) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="border-b border-[#d7e5e3] p-5">
				<h2 className="text-lg font-semibold text-[#576363]">
					Verification benefits
				</h2>
				<p className="mt-1 text-sm leading-6 text-[#5d6163]">
					Verified accounts can access higher limits and faster sensitive review.
				</p>
			</div>
			<div className="divide-y divide-[#eef1f1]">
				{limits.map((limit) => (
					<div
						key={limit.label}
						className="grid gap-3 p-5 sm:grid-cols-[minmax(0,1fr)_minmax(150px,0.6fr)_minmax(150px,0.6fr)]"
					>
						<p className="font-semibold text-[#576363]">{limit.label}</p>
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5d6163]">
								Current
							</p>
							<p className="mt-1 text-sm text-[#576363]">{limit.current}</p>
						</div>
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5F9EA0]">
								Verified
							</p>
							<p className="mt-1 text-sm font-semibold text-[#3c7f80]">
								{limit.verified}
							</p>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}

function TimelineCard({ timeline }: { timeline: VerificationData["timeline"] }) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="border-b border-[#d7e5e3] p-5">
				<h2 className="text-lg font-semibold text-[#576363]">
					Review timeline
				</h2>
				<p className="mt-1 text-sm leading-6 text-[#5d6163]">
					Latest compliance review activity.
				</p>
			</div>
			<div className="divide-y divide-[#eef1f1]">
				{timeline.map((item) => (
					<div key={item.id} className="p-5">
						<div className="flex flex-wrap items-center justify-between gap-2">
							<p className="font-semibold text-[#576363]">{item.title}</p>
							<span
								className={cn(
									"rounded-full px-2.5 py-1 text-xs font-semibold",
									statusClasses[item.status],
								)}
							>
								{item.status}
							</span>
						</div>
						<p className="mt-1 text-sm leading-6 text-[#5d6163]">
							{item.description}
						</p>
						<p className="mt-2 text-xs text-[#5d6163]">
							{formatDateTime(item.createdAt)}
						</p>
					</div>
				))}
			</div>
		</section>
	);
}

function NotesCard({ notes }: { notes: string[] }) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="flex items-center gap-3">
				<IconFrame tone="positive">
					<ClockIcon className="h-5 w-5" />
				</IconFrame>
				<h2 className="text-lg font-semibold text-[#576363]">
					Before uploading
				</h2>
			</div>
			<ul className="mt-4 space-y-3">
				{notes.map((note) => (
					<li key={note} className="flex gap-3 text-sm leading-6 text-[#5d6163]">
						<span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5F9EA0]" />
						<span>{note}</span>
					</li>
				))}
			</ul>
		</section>
	);
}

function IconFrame({
	children,
	tone,
}: {
	children: React.ReactNode;
	tone: "positive" | "warning";
}) {
	return (
		<div
			className={cn(
				"flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
				tone === "positive"
					? "bg-[#e5f3f1] text-[#3c7f80]"
					: "bg-[#fff1e0] text-[#a66510]",
			)}
		>
			{children}
		</div>
	);
}
