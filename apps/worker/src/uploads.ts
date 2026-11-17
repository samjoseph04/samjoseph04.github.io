import { resumeDigest, resumeName, validateResumePdf } from '@portfolio/content';
import { HttpError, inspectUpload, limitedBody } from './security';

export async function stageUpload(request: Request, uploads: Pick<R2Bucket, 'put'>) {
  const bytes = await limitedBody(request, 5_000_000);
  const mime = request.headers.get('Content-Type')?.split(';')[0] || '';
  const isResume = new URL(request.url).searchParams.get('purpose') === 'resume';
  if (isResume) {
    try { validateResumePdf(bytes, mime); }
    catch (error) { throw new HttpError(415, (error as Error).message); }
  }
  const extension = inspectUpload(bytes, mime);
  const name = `${crypto.randomUUID()}.${extension}`;
  const uploadedAt = new Date().toISOString();
  let originalName = 'resume.pdf';
  try { originalName = resumeName(decodeURIComponent(request.headers.get('X-Upload-Name') || 'resume.pdf')); }
  catch { throw new HttpError(400, 'The upload filename is invalid.'); }
  const metadata = isResume ? {
    uploadedAt,
    originalName,
    size: bytes.length,
    sha256: await resumeDigest(bytes),
  } : undefined;
  await uploads.put(`staged/${name}`, bytes, {
    httpMetadata: { contentType: mime },
    customMetadata: { createdAt: uploadedAt, ...(metadata ? {
      originalName: metadata.originalName, sha256: metadata.sha256,
    } : {}) },
  });
  return { path: `/assets/${name}`, bytes: bytes.length, ...(metadata ? { resume: metadata } : {}) };
}
