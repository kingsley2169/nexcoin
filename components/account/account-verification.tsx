"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
	type DocumentStatus,
	type VerificationData,
	type VerificationDocument,
	type VerificationStatus,
} from "@/lib/verification";
import {
	attachKycDocument,
	createKycSubmission,
	resubmitKyc,
} from "@/app/account/verification/actions";
import { createClient } from "@/utils/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AccountVerificationProps = {
	data: VerificationData;
	userId: string;
};

type UploadKind =
	| "government_id_front"
	| "government_id_back"
	| "proof_of_address"
	| "selfie";

type DocumentType = "passport" | "national_id" | "driver_license";
type DocumentQuality = "clear" | "blurry" | "poor";

const documentKindToUploadKind: Record<string, UploadKind> = {
	government_id: "government_id_front",
	proof_of_address: "proof_of_address",
	selfie: "selfie",
};

async function uploadKycFile(
	userId: string,
	kind: UploadKind,
	file: File,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
	const supabase = createClient();
	const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
	const safeExt = extension.replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
	const path = `${userId}/${kind}-${Date.now()}.${safeExt}`;

	const { error } = await supabase.storage
		.from("kyc-documents")
		.upload(path, file, {
			cacheControl: "3600",
			contentType: file.type || undefined,
			upsert: false,
		});

	if (error) {
		return { ok: false, error: error.message };
	}

	return { ok: true, path };
}

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

export function AccountVerification({
	data,
	userId,
}: AccountVerificationProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const documents = data.documents;
	const [notice, setNotice] = useState<
		{ tone: "success" | "error" | "info"; message: string } | null
	>(null);
	const [initialModalOpen, setInitialModalOpen] = useState(false);

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

	const needsInitialSubmission = !data.submission.id;
	const canResubmit = data.overview.status === "Action required";

	const handleDocumentUpload = async (
		documentId: string,
		file: File,
	): Promise<{ ok: true } | { ok: false; error: string }> => {
		const kind = documentKindToUploadKind[documentId];
		if (!kind) {
			return { ok: false, error: "Unknown document kind." };
		}

		setNotice({
			tone: "info",
			message: `Uploading ${file.name}…`,
		});

		const upload = await uploadKycFile(userId, kind, file);
		if (!upload.ok) {
			setNotice({ tone: "error", message: upload.error });
			return upload;
		}

		const attach = await attachKycDocument(kind, upload.path);
		if (!attach.ok) {
			setNotice({ tone: "error", message: attach.error });
			return attach;
		}

		setNotice({
			tone: "success",
			message: `${file.name} uploaded and attached to your submission.`,
		});
		router.refresh();
		return { ok: true };
	};

	const handleSubmit = () => {
		if (isPending) return;

		if (needsInitialSubmission) {
			setInitialModalOpen(true);
			return;
		}

		if (!canResubmit) {
			setNotice({
				tone: "info",
				message:
					data.overview.status === "Approved"
						? "Your verification is already approved."
						: "Your submission is already with compliance review.",
			});
			return;
		}

		startTransition(async () => {
			const result = await resubmitKyc();

			if (!result.ok) {
				setNotice({ tone: "error", message: result.error });
				return;
			}

			setNotice({
				tone: "success",
				message: "Verification resubmitted for compliance review.",
			});
			router.refresh();
		});
	};

	const submitLabel = isPending
		? "Submitting…"
		: needsInitialSubmission
			? "Start Verification"
			: "Submit for Review";

	const submitDisabled =
		isPending ||
		(!needsInitialSubmission && !canResubmit);

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
					<Button
						type="button"
						onClick={handleSubmit}
						disabled={submitDisabled}
					>
						{submitLabel}
					</Button>
					<Link
						href="/account/support"
						className={buttonVariants({ size: "md", variant: "outline" })}
					>
						Contact Support
					</Link>
				</div>
			</header>

			{notice ? (
				<div
					className={cn(
						"rounded-lg border p-4 text-sm font-medium shadow-[0_18px_50px_rgba(87,99,99,0.08)]",
						notice.tone === "success"
							? "border-[#c7e4d5] bg-[#f1fbf6] text-[#2e8f5b]"
							: notice.tone === "error"
								? "border-[#f2c5c0] bg-[#fff7f6] text-[#b1423a]"
								: "border-[#d7e5e3] bg-white text-[#3c7f80]",
					)}
				>
					{notice.message}
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
					<DocumentsCard
						disabled={needsInitialSubmission}
						documents={documents}
						onUpload={handleDocumentUpload}
					/>
					<LimitsCard limits={data.limits} />
				</div>
				<div className="space-y-6">
					<TimelineCard timeline={data.timeline} />
					<NotesCard notes={data.notes} />
				</div>
			</div>

			{initialModalOpen ? (
				<InitialSubmissionModal
					afterApprovalLimitLabel={data.submission.afterApprovalLimitLabel}
					currentLimitLabel={data.submission.currentLimitLabel}
					onClose={() => setInitialModalOpen(false)}
					onError={(message) => setNotice({ tone: "error", message })}
					onSuccess={(message) => {
						setNotice({ tone: "success", message });
						setInitialModalOpen(false);
						router.refresh();
					}}
					userId={userId}
				/>
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
	disabled,
	documents,
	onUpload,
}: {
	disabled: boolean;
	documents: VerificationDocument[];
	onUpload: (
		id: string,
		file: File,
	) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="border-b border-[#d7e5e3] p-5">
				<h2 className="text-lg font-semibold text-[#576363]">
					Required documents
				</h2>
				<p className="mt-1 text-sm leading-6 text-[#5d6163]">
					{disabled
						? "Start verification first — once submitted, upload the required documents here."
						: "Upload clear files in JPG, PNG, or PDF format."}
				</p>
			</div>
			<div className="divide-y divide-[#eef1f1]">
				{documents.map((document) => (
					<DocumentRow
						key={document.id}
						disabled={disabled}
						document={document}
						onUpload={onUpload}
					/>
				))}
			</div>
		</section>
	);
}

function DocumentRow({
	disabled,
	document,
	onUpload,
}: {
	disabled: boolean;
	document: VerificationDocument;
	onUpload: (
		id: string,
		file: File,
	) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
	const inputRef = useRef<HTMLInputElement | null>(null);
	const [fileName, setFileName] = useState("");
	const [isUploading, setIsUploading] = useState(false);

	const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		event.target.value = "";

		if (!file) {
			return;
		}

		setFileName(file.name);
		setIsUploading(true);
		try {
			await onUpload(document.id, file);
		} finally {
			setIsUploading(false);
		}
	};

	const rowDisabled = disabled || isUploading;

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
					{isUploading && fileName
						? `Uploading ${fileName}…`
						: fileName
							? `Last selected: ${fileName}`
							: document.lastUpdatedAt
								? `Last updated ${formatDateTime(document.lastUpdatedAt)}`
								: "No file uploaded yet"}
				</p>
			</div>
			<div className="flex items-start gap-2">
				<input
					ref={inputRef}
					type="file"
					accept=".jpg,.jpeg,.png,.pdf,.webp"
					className="sr-only"
					onChange={handleChange}
				/>
				<Button
					type="button"
					variant={document.status === "Approved" ? "outline" : "primary"}
					className="gap-2"
					disabled={rowDisabled}
					onClick={() => inputRef.current?.click()}
				>
					<UploadIcon className="h-4 w-4" />
					{isUploading
						? "Uploading…"
						: document.status === "Not uploaded"
							? "Upload"
							: "Replace"}
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

type InitialSubmissionDraft = {
	address: string;
	dateOfBirth: string;
	documentExpiry: string;
	documentNumber: string;
	documentQuality: DocumentQuality;
	documentType: DocumentType;
};

function InitialSubmissionModal({
	afterApprovalLimitLabel,
	currentLimitLabel,
	onClose,
	onError,
	onSuccess,
	userId,
}: {
	afterApprovalLimitLabel: string;
	currentLimitLabel: string;
	onClose: () => void;
	onError: (message: string) => void;
	onSuccess: (message: string) => void;
	userId: string;
}) {
	const [draft, setDraft] = useState<InitialSubmissionDraft>({
		address: "",
		dateOfBirth: "",
		documentExpiry: "",
		documentNumber: "",
		documentQuality: "clear",
		documentType: "passport",
	});
	const [frontFile, setFrontFile] = useState<File | null>(null);
	const [backFile, setBackFile] = useState<File | null>(null);
	const [proofFile, setProofFile] = useState<File | null>(null);
	const [selfieFile, setSelfieFile] = useState<File | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const requiresBack = draft.documentType !== "passport";

	const canSubmit =
		!isSubmitting &&
		draft.documentNumber.trim().length >= 4 &&
		draft.documentExpiry.length > 0 &&
		draft.dateOfBirth.length > 0 &&
		draft.address.trim().length > 0 &&
		frontFile !== null &&
		proofFile !== null &&
		selfieFile !== null &&
		(!requiresBack || backFile !== null);

	const handleSubmit = async () => {
		if (!canSubmit) return;
		setErrorMessage(null);
		setIsSubmitting(true);

		try {
			const frontUpload = await uploadKycFile(
				userId,
				"government_id_front",
				frontFile!,
			);
			if (!frontUpload.ok) {
				setErrorMessage(frontUpload.error);
				return;
			}

			let backPath: string | null = null;
			if (requiresBack && backFile) {
				const backUpload = await uploadKycFile(
					userId,
					"government_id_back",
					backFile,
				);
				if (!backUpload.ok) {
					setErrorMessage(backUpload.error);
					return;
				}
				backPath = backUpload.path;
			}

			const proofUpload = await uploadKycFile(
				userId,
				"proof_of_address",
				proofFile!,
			);
			if (!proofUpload.ok) {
				setErrorMessage(proofUpload.error);
				return;
			}

			const selfieUpload = await uploadKycFile(userId, "selfie", selfieFile!);
			if (!selfieUpload.ok) {
				setErrorMessage(selfieUpload.error);
				return;
			}

			const result = await createKycSubmission({
				address: draft.address,
				afterApprovalLimitLabel,
				currentLimitLabel,
				dateOfBirth: draft.dateOfBirth,
				documentBackPath: backPath,
				documentExpiry: draft.documentExpiry,
				documentFrontPath: frontUpload.path,
				documentNumber: draft.documentNumber,
				documentQuality: draft.documentQuality,
				documentType: draft.documentType,
				proofOfAddressPath: proofUpload.path,
				selfiePath: selfieUpload.path,
			});

			if (!result.ok) {
				setErrorMessage(result.error);
				return;
			}

			onSuccess("Verification submitted for compliance review.");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unexpected upload error.";
			setErrorMessage(message);
			onError(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div
			className="fixed inset-0 z-[70] bg-[#1f2929]/45 p-3 backdrop-blur-sm sm:p-5"
			role="dialog"
			aria-modal="true"
			aria-labelledby="kyc-initial-submission-title"
		>
			<div className="absolute inset-0" aria-hidden="true" onClick={onClose} />
			<section className="relative mx-auto flex max-h-[calc(100vh-24px)] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-[#d7e5e3] bg-[#f7faf9] shadow-[0_28px_90px_rgba(31,41,41,0.28)] sm:max-h-[calc(100vh-40px)]">
				<header className="flex items-start justify-between gap-4 border-b border-[#d7e5e3] bg-white px-4 py-4 sm:px-6">
					<div className="min-w-0">
						<p className="text-sm text-[#5d6163]">KYC Verification</p>
						<h2
							id="kyc-initial-submission-title"
							className="mt-1 text-xl font-semibold text-[#576363]"
						>
							Start verification
						</h2>
					</div>
					<Button type="button" variant="outline" size="sm" onClick={onClose}>
						Close
					</Button>
				</header>

				<div className="overflow-y-auto p-4 sm:p-6">
					<div className="grid gap-5">
						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<label
									className="text-sm font-semibold text-[#576363]"
									htmlFor="kyc-document-type"
								>
									Document type
								</label>
								<select
									id="kyc-document-type"
									value={draft.documentType}
									onChange={(event) =>
										setDraft((current) => ({
											...current,
											documentType: event.target.value as DocumentType,
										}))
									}
									className="mt-2 h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm font-medium text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
								>
									<option value="passport">Passport</option>
									<option value="national_id">National ID</option>
									<option value="driver_license">Driver&apos;s license</option>
								</select>
							</div>

							<div>
								<label
									className="text-sm font-semibold text-[#576363]"
									htmlFor="kyc-document-number"
								>
									Document number
								</label>
								<input
									id="kyc-document-number"
									value={draft.documentNumber}
									onChange={(event) =>
										setDraft((current) => ({
											...current,
											documentNumber: event.target.value,
										}))
									}
									placeholder="Document reference number"
									className="mt-2 h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm font-medium text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
								/>
							</div>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<label
									className="text-sm font-semibold text-[#576363]"
									htmlFor="kyc-document-expiry"
								>
									Document expiry
								</label>
								<input
									id="kyc-document-expiry"
									type="date"
									value={draft.documentExpiry}
									onChange={(event) =>
										setDraft((current) => ({
											...current,
											documentExpiry: event.target.value,
										}))
									}
									className="mt-2 h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm font-medium text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
								/>
							</div>

							<div>
								<label
									className="text-sm font-semibold text-[#576363]"
									htmlFor="kyc-dob"
								>
									Date of birth
								</label>
								<input
									id="kyc-dob"
									type="date"
									value={draft.dateOfBirth}
									onChange={(event) =>
										setDraft((current) => ({
											...current,
											dateOfBirth: event.target.value,
										}))
									}
									className="mt-2 h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm font-medium text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
								/>
							</div>
						</div>

						<div>
							<label
								className="text-sm font-semibold text-[#576363]"
								htmlFor="kyc-address"
							>
								Residential address
							</label>
							<textarea
								id="kyc-address"
								value={draft.address}
								onChange={(event) =>
									setDraft((current) => ({
										...current,
										address: event.target.value,
									}))
								}
								placeholder="Street address, city, postal code, country"
								rows={3}
								className="mt-2 w-full rounded-md border border-[#cfdcda] bg-white px-3 py-2 text-sm font-medium text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
							/>
						</div>

						<div>
							<label
								className="text-sm font-semibold text-[#576363]"
								htmlFor="kyc-document-quality"
							>
								Document photo quality
							</label>
							<select
								id="kyc-document-quality"
								value={draft.documentQuality}
								onChange={(event) =>
									setDraft((current) => ({
										...current,
										documentQuality: event.target.value as DocumentQuality,
									}))
								}
								className="mt-2 h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm font-medium text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
							>
								<option value="clear">Clear and readable</option>
								<option value="blurry">Slightly blurry</option>
								<option value="poor">Poor quality</option>
							</select>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<FilePicker
								accept=".jpg,.jpeg,.png,.pdf,.webp"
								file={frontFile}
								label={
									requiresBack ? "Government ID (front)" : "Passport photo page"
								}
								onSelect={setFrontFile}
							/>
							{requiresBack ? (
								<FilePicker
									accept=".jpg,.jpeg,.png,.pdf,.webp"
									file={backFile}
									label="Government ID (back)"
									onSelect={setBackFile}
								/>
							) : null}
							<FilePicker
								accept=".jpg,.jpeg,.png,.pdf,.webp"
								file={proofFile}
								label="Proof of address"
								onSelect={setProofFile}
							/>
							<FilePicker
								accept=".jpg,.jpeg,.png,.webp"
								file={selfieFile}
								label="Selfie"
								onSelect={setSelfieFile}
							/>
						</div>

						<div className="rounded-lg bg-[#f1fbf6] p-4 text-sm leading-6 text-[#2e8f5b]">
							Current limit: {currentLimitLabel}. After approval:{" "}
							{afterApprovalLimitLabel}.
						</div>

						{errorMessage ? (
							<div className="rounded-lg border border-[#f2c5c0] bg-[#fff7f6] p-4 text-sm font-medium text-[#b1423a]">
								{errorMessage}
							</div>
						) : null}
					</div>
				</div>

				<footer className="flex items-center justify-end gap-3 border-t border-[#d7e5e3] bg-white px-4 py-4 sm:px-6">
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						disabled={isSubmitting}
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={handleSubmit}
						disabled={!canSubmit}
					>
						{isSubmitting ? "Submitting…" : "Submit for Review"}
					</Button>
				</footer>
			</section>
		</div>
	);
}

function FilePicker({
	accept,
	file,
	label,
	onSelect,
}: {
	accept: string;
	file: File | null;
	label: string;
	onSelect: (file: File | null) => void;
}) {
	const inputRef = useRef<HTMLInputElement | null>(null);

	return (
		<div className="rounded-lg border border-[#d7e5e3] bg-white p-4">
			<p className="text-sm font-semibold text-[#576363]">{label}</p>
			<p className="mt-1 text-xs text-[#5d6163]">
				{file ? `Selected: ${file.name}` : "No file selected"}
			</p>
			<input
				ref={inputRef}
				type="file"
				accept={accept}
				className="sr-only"
				onChange={(event) => {
					const selected = event.target.files?.[0] ?? null;
					event.target.value = "";
					onSelect(selected);
				}}
			/>
			<Button
				type="button"
				variant="outline"
				className="mt-3 w-full gap-2"
				onClick={() => inputRef.current?.click()}
			>
				<UploadIcon className="h-4 w-4" />
				{file ? "Replace" : "Choose file"}
			</Button>
		</div>
	);
}
