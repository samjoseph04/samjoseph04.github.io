import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowDownToLine, ArrowUpRight, FileText, Trash2 } from 'lucide-react';
import { resumeDigest, resumeSchema, resumeUrl, validateResumePdf, type Resume } from '@portfolio/content';
import { api } from './api';

type Snapshot = { sha: string; exists: boolean; resume: Resume; error?: string };
type Status = { repository: Snapshot; live: Snapshot | null; deployment: { status: string; conclusion: string | null; url?: string } };
const date = (value: string) => value ? new Date(value).toLocaleString() : 'Upload date not recorded';
const size = (bytes: number) => bytes ? `${(bytes / 1024).toFixed(1)} KB` : 'Size not recorded';
export function resumeDeploymentLabel(deployment: Status['deployment']) {
  return deployment.status === 'completed'
    ? deployment.conclusion === 'success' ? 'Deployment succeeded' : `Deployment ${deployment.conclusion || 'not verified'}`
    : deployment.status === 'not-started' ? 'Deployment has not started' : `Deployment ${deployment.status}`;
}

export default function ResumeManager({ resume, workspaceResume, local, refreshKey, busy, sourceUrl, uploadControl, stagedDownload, onChange }: {
  resume: Resume; workspaceResume: Resume; local: boolean; refreshKey: string; busy: boolean;
  sourceUrl: string; uploadControl: ReactNode; stagedDownload: ReactNode;
  onChange: (resume: Resume) => void;
}) {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [previewBusy, setPreviewBusy] = useState(false);
  const previewGeneration = useRef(0);
  const generation = useRef(0);
  async function refresh() {
    const id = ++generation.current;
    setChecking(true); setError('');
    try {
      let result: Status;
      if (local) {
        const current = resumeSchema.parse(workspaceResume);
        let exists = false;
        let issue: string | undefined;
        if (current.file) {
          const response = await fetch(current.file, { cache: 'no-store' });
          if (response.ok) {
            try {
              const bytes = new Uint8Array(await response.arrayBuffer());
              validateResumePdf(bytes);
              if (current.sha256 && await resumeDigest(bytes) !== current.sha256) throw new Error('Workspace PDF differs from its metadata.');
              exists = true;
            } catch (reason) { issue = (reason as Error).message; }
          } else issue = 'The workspace PDF is missing.';
        }
        result = { repository: { sha: 'LOCAL ONLY', exists, resume: current, error: issue }, live: null,
          deployment: { status: 'local-only', conclusion: null } };
      } else result = await api('/resume');
      if (id === generation.current) setStatus(result);
    } catch (reason) { if (id === generation.current) { setStatus(null); setError((reason as Error).message); } }
    finally { if (id === generation.current) setChecking(false); }
  }
  useEffect(() => { void refresh(); return () => { generation.current++; }; }, [local, refreshKey]);
  useEffect(() => {
    previewGeneration.current++; setPreview(false); setPreviewError(''); setPreviewBusy(false);
    return () => { previewGeneration.current++; };
  }, [sourceUrl]);
  async function togglePreview() {
    if (preview) { setPreview(false); return; }
    const id = ++previewGeneration.current;
    setPreviewBusy(true); setPreviewError('');
    try {
      const response = await fetch(sourceUrl, { credentials: 'same-origin', cache: 'no-store', redirect: 'error' });
      if (!response.ok) throw new Error('The selected PDF could not be loaded. Upload it again or refresh your Access session.');
      const bytes = new Uint8Array(await response.arrayBuffer());
      validateResumePdf(bytes);
      if (resume.sha256 && await resumeDigest(bytes) !== resume.sha256) throw new Error('The PDF no longer matches the selected upload. Upload it again.');
      if (id === previewGeneration.current) setPreview(true);
    } catch (reason) { if (id === previewGeneration.current) setPreviewError((reason as Error).message); }
    finally { if (id === previewGeneration.current) setPreviewBusy(false); }
  }
  const snapshotLink = (snapshot: Snapshot, download = false) => local ? snapshot.resume.file
    : `/api/asset?path=${encodeURIComponent(snapshot.resume.file)}&ref=${snapshot.sha}${download ? '&download=1' : ''}`;
  const showSnapshot = (title: string, snapshot: Snapshot | null) => (
    <div className="resume-status-block">
      <h3>{title}</h3>
      {snapshot ? <>
        <p>{snapshot.resume.originalName || (snapshot.resume.file ? 'Resume PDF' : 'No resume selected')}</p>
        <p className="studio-muted">{date(snapshot.resume.uploadedAt)} · {size(snapshot.resume.size)}</p>
        {snapshot.error && <p role="alert">{snapshot.error}</p>}
        {snapshot.exists && <div className="studio-row">
          <a className="studio-button" href={snapshotLink(snapshot)} target="_blank" rel="noopener noreferrer">Preview current PDF <ArrowUpRight size={14} /></a>
          <a className="studio-button" href={snapshotLink(snapshot, true)} download="resume.pdf">Download current PDF <ArrowDownToLine size={14} /></a>
        </div>}
      </> : <p className="studio-muted">No successful deployment verified in the recent workflow history.</p>}
    </div>
  );
  return <section className="studio-panel form-stack resume-editor">
    <FileText size={44} strokeWidth={1} />
    <h2>Your resume</h2>
    <p>Upload a PDF, preview it, then save and explicitly publish. Publishing replaces the previous PDF at <code>{resumeUrl}</code>.</p>
    <div className="resume-status" aria-busy={checking}>
      <div className="studio-row"><h3>Publishing status</h3><button type="button" className="studio-button" onClick={() => void refresh()} disabled={checking || busy}>{checking ? 'Checking…' : 'Refresh status'}</button></div>
      <p role="status">{local ? 'Local only — GitHub publishing is disabled.' : status ? resumeDeploymentLabel(status.deployment) : 'Publishing status not verified.'}</p>
      {error && <p role="alert">{error}</p>}
      {status && <>
        {showSnapshot(local ? 'Current workspace PDF' : 'Current repository PDF', status.repository)}
        {!local && showSnapshot('Last verified deployed PDF', status.live)}
        {!local && status.deployment.url && <a href={status.deployment.url} target="_blank" rel="noopener noreferrer">View deployment workflow <ArrowUpRight size={14} /></a>}
      </>}
    </div>
    {uploadControl}
    <label className="studio-field"><span>Download label</span><input value={resume.label} onChange={event => onChange({ ...resume, label: event.target.value })} /></label>
    <label className="studio-field"><span>Public resume URL</span><input readOnly value={resumeUrl} /><small>The public URL stays the same after replacement.</small></label>
    {resume.file && <div className="resume-status-block">
      <h3>{resume.stagedFile ? 'Selected replacement · not published' : 'Selected resume'}</h3>
      <p>{resume.originalName || 'Resume PDF'}</p>
      <p className="studio-muted">{date(resume.uploadedAt)} · {size(resume.size)}</p>
      <div className="studio-row">
        <button type="button" className="studio-button" disabled={previewBusy} onClick={() => void togglePreview()}>{previewBusy ? 'Checking PDF…' : preview ? 'Close preview' : 'Preview PDF'}</button>
        {!previewError && <a className="studio-button" href={sourceUrl} target="_blank" rel="noopener noreferrer">Open PDF <ArrowUpRight size={14} /></a>}
        {stagedDownload}
        <button type="button" className="studio-button danger" disabled={busy} onClick={() => onChange(resumeSchema.parse({ file: '', label: resume.label }))}><Trash2 size={14} /> Remove resume</button>
      </div>
      {previewError && <p role="alert">{previewError}</p>}
      {preview && <>
        <iframe className="resume-pdf-preview" title="Selected resume PDF preview" src={sourceUrl} />
        <p className="studio-muted">If your browser does not show PDFs here, use Open PDF or Download current PDF.</p>
      </>}
    </div>}
    <p className="studio-muted">{local ? 'Local uploads stay in this browser. Download the staged file as resume.pdf, copy it to apps/web/public/resume.pdf, and export the reviewed content for a local build.' : 'An upload is private until you save the draft and confirm Review & publish. GitHub Actions then rebuilds the public website.'}</p>
  </section>;
}
