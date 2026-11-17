import { readFile } from 'node:fs/promises';
import { portfolioSchema, resumeUrl, resumeDigest, validateResumePdf } from '../packages/content/schema';

const root = new URL('../', import.meta.url);
const content = portfolioSchema.parse(JSON.parse(await readFile(new URL('content/portfolio.json', root), 'utf8')));
if (content.resume.stagedFile) throw new Error('The public content still references a private staged resume. Export/publish the reviewed content first.');
if (content.resume.file) {
  if (content.resume.file !== resumeUrl) throw new Error('The public resume must use /resume.pdf. Copy the real PDF to apps/web/public/resume.pdf and update the resume reference.');
  let bytes: Uint8Array;
  try { bytes = await readFile(new URL('apps/web/public/resume.pdf', root)); }
  catch { throw new Error('Resume PDF is missing: add the real file at apps/web/public/resume.pdf or clear resume.file until one is available.'); }
  validateResumePdf(bytes);
  if (content.resume.sha256 && await resumeDigest(bytes) !== content.resume.sha256)
    throw new Error('Resume PDF does not match its content metadata. Upload/export the current version again.');
  if (content.resume.size && bytes.length !== content.resume.size) throw new Error('Resume size metadata does not match the PDF.');
  console.log('Validated the published PDF at /resume.pdf.');
} else console.log('No public resume selected; the public download remains unavailable.');
