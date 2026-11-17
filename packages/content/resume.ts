import { z } from 'zod';

export const resumeUrl = '/resume.pdf';
export const maxResumeBytes = 5_000_000;
export const stagedResumePath = z.string().regex(/^\/assets\/[a-zA-Z0-9][a-zA-Z0-9._-]*\.pdf$/i);
export const resumeSchema = z.object({
  // Legacy references remain readable while old drafts are migrated on publish.
  file: z.union([z.literal(''), z.literal(resumeUrl), stagedResumePath]),
  label: z.string().trim().min(1).max(180),
  stagedFile: z.union([z.literal(''), stagedResumePath]).default(''),
  uploadedAt: z.union([z.literal(''), z.iso.datetime()]).default(''),
  originalName: z.string().max(200).default(''),
  size: z.number().int().min(0).max(maxResumeBytes).default(0),
  sha256: z.union([z.literal(''), z.string().regex(/^[a-f0-9]{64}$/)]).default(''),
}).superRefine((resume, context) => {
  if (resume.stagedFile && (resume.file !== resumeUrl || !resume.uploadedAt || !resume.sha256 || !resume.size))
    context.addIssue({ code: 'custom', message: 'A staged resume requires /resume.pdf and complete upload metadata.' });
  if (!resume.file && resume.stagedFile)
    context.addIssue({ code: 'custom', message: 'Remove the staged resume when removing its public reference.' });
});
export type Resume = z.infer<typeof resumeSchema>;

/** Structural checks, not a claim of antivirus scanning or full PDF parsing. */
export function validateResumePdf(bytes: Uint8Array, mime = 'application/pdf') {
  if (!bytes.length || bytes.length > maxResumeBytes)
    throw new Error('Choose a PDF between 1 byte and 5 MB.');
  if (mime !== 'application/pdf') throw new Error('Choose a PDF resume.');
  const start = new TextDecoder('latin1').decode(bytes.slice(0, 16));
  const end = new TextDecoder('latin1').decode(bytes.slice(-2048));
  const xref = /startxref\s+(\d+)\s+%%EOF\s*$/.exec(end);
  if (!/^%PDF-(?:1\.[0-7]|2\.0)[\r\n]/.test(start) || !xref || +xref[1] >= bytes.length)
    throw new Error('The PDF is incomplete or invalid. Export a complete PDF and try again.');
  const reference = new TextDecoder('latin1').decode(bytes.slice(+xref[1], +xref[1] + 80));
  if (!/^(?:xref\b|\d+\s+\d+\s+obj\b)/.test(reference))
    throw new Error('The PDF cross-reference is invalid. Export the PDF again.');
}
export async function resumeDigest(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest('SHA-256', new Uint8Array(bytes));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
export function resumeName(name: string) {
  return name.split(/[\\/]/).at(-1)!.replace(/[\x00-\x1f\x7f]/g, '').slice(0, 200) || 'resume.pdf';
}
