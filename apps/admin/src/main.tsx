import React, { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Code2,
  Eye,
  FileText,
  Gamepad2,
  GraduationCap,
  ImagePlus,
  LayoutDashboard,
  Loader2,
  Monitor,
  Plus,
  Rocket,
  Save,
  Settings2,
  ShieldCheck,
  Smartphone,
  Trash2,
  Upload,
  UserRound,
  X,
} from 'lucide-react';
import {
  portfolioSchema,
  gameCategories,
  courseworkGroups,
  emptyCoursework,
  resumeUrl,
  resumeDigest,
  resumeName,
  validateResumePdf,
  type Portfolio as Content,
  type Collection,
} from '@portfolio/content';
import initialContent from '../../../content/portfolio.json';
import { api } from './api';
import ResumeManager from './ResumeManager';
import { readLocalDraft, saveLocalDraft, localFiles, storeLocalFile } from './storage';
import '../../web/app/globals.css';
import './studio.css';

const local = import.meta.env.DEV;
const Portfolio = lazy(() => import('../../web/components/Portfolio'));
type Page = 'overview' | 'personal' | Collection | 'resume';
type Draft = {
  content: Content;
  revision: number;
  baseSha: string;
  updatedAt?: string;
  publishing?: boolean;
};
const sections: { id: Page; label: string; icon: typeof Code2 }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'projects', label: 'Projects', icon: Code2 },
  { id: 'games', label: 'Games', icon: Gamepad2 },
  { id: 'personal', label: 'About & personal', icon: UserRound },
  { id: 'skills', label: 'Skills', icon: Settings2 },
  { id: 'experience', label: 'Experience', icon: FileText },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'achievements', label: 'Achievements', icon: CheckCircle2 },
  { id: 'resume', label: 'Resume', icon: ArrowDownToLine },
];
function Field({
  label,
  value,
  onChange,
  multiline = false,
  note = '',
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  note?: string;
  type?: string;
}) {
  return (
    <label className="studio-field">
      <span>{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
      {note && <small>{note}</small>}
    </label>
  );
}
function ListField({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const [text, setText] = useState(values.join('\n'));
  return (
    <label className="studio-field">
      <span>{label}</span>
      <textarea
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          onChange(
            event.target.value
              .split('\n')
              .map((value) => value.trim())
              .filter(Boolean),
          );
        }}
        rows={3}
      />
      <small>One item per line.</small>
    </label>
  );
}
function Dialog({
  title,
  onClose,
  children,
  className = '',
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog ref={ref} className={`studio-dialog ${className}`} onClose={onClose} aria-label={title}>
      <div className="dialog-bar">
        <h2>{title}</h2>
        <button className="icon-button" aria-label="Close dialog" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function displayContent(content: Content, files: Record<string, string>) {
  const asset = (path: string) =>
    !path ? '' : local ? files[path] || path : `/api/asset?path=${encodeURIComponent(path)}`;
  return {
    ...content,
    personal: { ...content.personal, portrait: asset(content.personal.portrait) },
    resume: { ...content.resume, file: asset(content.resume.stagedFile || content.resume.file) },
    projects: content.projects.map((p) => ({ ...p, image: asset(p.image) })),
  };
}
function PreviewWindow() {
  const [content, setContent] = useState<Content | null>(null);
  useEffect(() => {
    function receive(event: MessageEvent) {
      if (
        event.origin !== location.origin ||
        event.source !== parent ||
        event.data?.type !== 'PORTFOLIO_PREVIEW'
      )
        return;
      const parsed = portfolioSchema.safeParse(event.data.content);
      if (parsed.success) setContent(displayContent(parsed.data, event.data.files || {}));
    }
    window.addEventListener('message', receive);
    parent.postMessage({ type: 'PREVIEW_READY' }, location.origin);
    return () => window.removeEventListener('message', receive);
  }, []);
  return content ? (
    <Suspense fallback={<p className="studio-loading">Loading portfolio preview…</p>}>
      <Portfolio content={content} preview />
    </Suspense>
  ) : (
    <p className="studio-loading">Waiting for a valid content preview…</p>
  );
}
const templates: Record<Collection, () => Record<string, unknown>> = {
  projects: () => ({
    id: `project-${Date.now()}`,
    title: 'New project',
    category: 'Category to be added',
    description: 'Description to be added.',
    technologies: [],
    problem: '',
    approach: '',
    learning: [],
    repository: '',
    demo: '',
    image: '',
  }),
  games: () => ({
    id: `game-${Date.now()}`,
    name: 'New game',
    featured: false,
    description: 'Description to be added.',
    category: 'Arcade',
    tags: [],
    destination: '',
  }),
  skills: () => ({
    id: `skill-${Date.now()}`,
    name: 'New skill',
    category: 'Category to be added',
  }),
  experience: () => ({
    id: `experience-${Date.now()}`,
    title: 'Role to be added',
    organization: '',
    period: '',
    description: '',
  }),
  education: () => ({
    id: `education-${Date.now()}`,
    title: 'Qualification to be added',
    organization: '',
    period: '',
    description: '',
    coursework: emptyCoursework(),
  }),
  achievements: () => ({
    id: `achievement-${Date.now()}`,
    title: 'Achievement to be added',
    description: '',
  }),
};

function Studio() {
  const [content, setContent] = useState<Content>(portfolioSchema.parse(initialContent));
  const [saved, setSaved] = useState<Draft | null>(null);
  const [page, setPage] = useState<Page>('overview');
  const [selected, setSelected] = useState(0);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [preview, setPreview] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [publish, setPublish] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [deletion, setDeletion] = useState(false);
  const [maintenance, setMaintenance] = useState<'rebase' | 'recover' | null>(null);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [published, setPublished] = useState<{ sha: string; status: string; url?: string } | null>(
    null,
  );
  const frame = useRef<HTMLIFrameElement>(null);
  const publishRequest = useRef(crypto.randomUUID());
  const filesRef = useRef(files);
  filesRef.current = files;
  const dirty = saved ? JSON.stringify(saved.content) !== JSON.stringify(content) : false;
  const validation = portfolioSchema.safeParse(content);
  useEffect(() => {
    async function load() {
      try {
        const draft: Draft = local
          ? readLocalDraft() || { content: initialContent, revision: 0, baseSha: 'LOCAL ONLY' }
          : await api('/content');
        const parsed = portfolioSchema.parse(draft.content);
        setContent(parsed);
        setSaved({ ...draft, content: parsed });
        if (local) setFiles(await localFiles());
        setReady(true);
      } catch (reason) {
        setError(String(reason instanceof Error ? reason.message : reason));
      }
    }
    load();
    return () => Object.values(filesRef.current).forEach(URL.revokeObjectURL);
  }, []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.origin === location.origin &&
        event.source === frame.current?.contentWindow &&
        event.data?.type === 'PREVIEW_READY'
      )
        sendPreview();
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  });
  function sendPreview() {
    frame.current?.contentWindow?.postMessage(
      { type: 'PORTFOLIO_PREVIEW', content, files },
      location.origin,
    );
  }
  function navigate(id: Page) {
    setPage(id);
    setSelected(0);
    setError('');
    setNotice('');
  }
  function changePersonal(key: keyof Content['personal'], value: string) {
    setContent((c) => ({ ...c, personal: { ...c.personal, [key]: value } }));
  }
  function updateRecord(key: string, value: unknown) {
    if (!(page in templates)) return;
    setContent((c) => ({
      ...c,
      [page]: (c[page as Collection] as unknown as Record<string, unknown>[]).map((record, i) =>
        i === selected ? { ...record, [key]: value } : record,
      ),
    }));
  }
  function addRecord() {
    const key = page as Collection;
    const record = templates[key]();
    setSelected(content[key].length);
    setContent((c) => ({ ...c, [key]: [...c[key], record] }));
  }
  async function save() {
    if (!validation.success) {
      setError('Fix validation errors before saving.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result: Draft = local
        ? {
            content: validation.data,
            revision: (saved?.revision || 0) + 1,
            baseSha: 'LOCAL ONLY',
            updatedAt: new Date().toISOString(),
          }
        : await api('/content', {
            method: 'PUT',
            body: JSON.stringify({ content: validation.data, revision: saved?.revision }),
          });
      if (local) saveLocalDraft(result);
      setSaved(result);
      setContent(result.content);
      setNotice(
        local
          ? 'Draft saved in this browser. No GitHub changes.'
          : 'Private draft saved. Public website unchanged.',
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(false);
    }
  }
  async function upload(file: File, target: 'portrait' | 'image' | 'resume') {
    setBusy(true);
    setError('');
    try {
      const isResume = target === 'resume';
      const mime = isResume && ['', 'application/octet-stream'].includes(file.type) && /\.pdf$/i.test(file.name) ? 'application/pdf' : file.type;
      let resumeMetadata: { uploadedAt: string; originalName: string; size: number; sha256: string } | undefined;
      if (file.size > 5_000_000 || !file.size)
        throw new Error('Choose a file between 1 byte and 5 MB.');
      if (
        isResume
          ? mime !== 'application/pdf'
          : !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
      )
        throw new Error(isResume ? 'Choose a PDF resume.' : 'Choose JPEG, PNG, or WebP.');
      if (isResume) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        validateResumePdf(bytes, mime);
        resumeMetadata = { uploadedAt: new Date().toISOString(), originalName: resumeName(file.name), size: bytes.length, sha256: await resumeDigest(bytes) };
      }
      const extension = isResume
        ? 'pdf'
        : file.type === 'image/png'
          ? 'png'
          : file.type === 'image/webp'
            ? 'webp'
            : 'jpg';
      let path: string;
      if (local) {
        path = `/assets/${crypto.randomUUID()}.${extension}`;
        await storeLocalFile(path, file);
        setFiles((f) => ({ ...f, [path]: URL.createObjectURL(file) }));
      } else {
        const result = await api(isResume ? '/uploads?purpose=resume' : '/uploads', {
          method: 'POST',
          headers: { 'Content-Type': mime, ...(isResume ? { 'X-Upload-Name': encodeURIComponent(file.name) } : {}) },
          body: file,
        });
        path = result.path;
        if (isResume) {
          if (!result.resume) throw new Error('The upload response is missing resume metadata. Try again.');
          resumeMetadata = result.resume;
        }
      }
      if (target === 'portrait') changePersonal('portrait', path);
      else if (target === 'resume')
        setContent((c) => ({ ...c, resume: { ...c.resume, ...resumeMetadata!, file: resumeUrl, stagedFile: path } }));
      else updateRecord('image', path);
      setNotice('File staged. Save the draft to keep its content reference.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(false);
    }
  }
  const uploadControl = (target: 'portrait' | 'image' | 'resume') => (
    <label className="upload-control">
      <Upload size={18} />
      <span>
        {target === 'resume' ? 'Upload PDF resume' : 'Upload an image'}
        <small>{target === 'resume' ? 'PDF' : 'JPEG, PNG, WebP'} · maximum 5 MB</small>
      </span>
      <input
        type="file"
        disabled={busy}
        accept={target === 'resume' ? 'application/pdf' : 'image/jpeg,image/png,image/webp'}
        onChange={(event) => {
          if (event.target.files?.[0]) void upload(event.target.files[0], target);
          event.target.value = '';
        }}
      />
    </label>
  );
  const resolveAsset = (path: string) =>
    local ? files[path] || path : `/api/asset?path=${encodeURIComponent(path)}`;
  const stagedDownload = (path: string, name?: string) =>
    local && files[path] ? (
      <a className="studio-button" href={files[path]} download={name || path.split('/').at(-1)}>
        Download staged file <ArrowDownToLine size={14} />
      </a>
    ) : null;
  const record =
    page in templates
      ? (content[page as Collection] as unknown as Record<string, any>[])[selected]
      : null;
  const title = sections.find((s) => s.id === page)?.label || '';
  const changeSummary = saved
    ? (
        [
          'personal',
          'projects',
          'games',
          'skills',
          'experience',
          'education',
          'achievements',
          'resume',
        ] as const
      ).filter((key) => JSON.stringify(saved.content[key]) !== JSON.stringify(content[key]))
    : [];
  async function performPublish() {
    if (local || !saved || dirty || confirmation !== 'PUBLISH TO GITHUB') return;
    setBusy(true);
    setError('');
    try {
      const result = await api('/publish', {
        method: 'POST',
        body: JSON.stringify({
          revision: saved.revision,
          confirmation,
          requestId: publishRequest.current,
        }),
      });
      if (!result.commitSha)
        throw new Error('No commit was returned. Check publish status before retrying.');
      setPublished({
        sha: result.commitSha,
        status: result.warning || 'Commit created. Deployment not yet verified.',
      });
      setPublish(false);
      setConfirmation('');
      publishRequest.current = crypto.randomUUID();
      const next = await api('/content');
      setSaved(next);
      setContent(next.content);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(false);
    }
  }
  async function deployment() {
    if (!published) return;
    setBusy(true);
    try {
      const result = await api(`/deployment?sha=${published.sha}`);
      setPublished({
        ...published,
        status:
          result.status === 'completed'
            ? result.conclusion === 'success'
              ? 'Deployment succeeded.'
              : `Deployment ${result.conclusion}.`
            : result.status === 'not-started'
              ? 'Deployment has not started.'
              : `Deployment ${result.status}.`,
        url: result.url,
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(false);
    }
  }
  async function maintain() {
    if (local || !saved || !maintenance || dirty) return;
    setBusy(true);
    setError('');
    try {
      const result = await api(`/${maintenance}`, {
        method: 'POST',
        body: JSON.stringify({ revision: saved.revision, confirmation }),
      });
      const next = maintenance === 'rebase' ? result : await api('/content');
      if (result.commitSha)
        setPublished({
          sha: result.commitSha,
          status: 'Commit found during recovery. Check the matching deployment.',
        });
      setContent(next.content);
      setSaved(next);
      setNotice(
        result.message ||
          'Saved draft now uses the latest repository base. Review the preview before publishing.',
      );
      setMaintenance(null);
      setConfirmation('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(false);
    }
  }
  function exportDraft() {
    const exported = structuredClone(content);
    exported.resume.stagedFile = '';
    const blob = new Blob([JSON.stringify(exported, null, 2) + '\n'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'portfolio-draft.json';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="studio-root">
      <aside className="studio-sidebar">
        <a href="/" className="studio-brand">
          sj<span>.</span>
          <span>
            PRIVATE
            <br />
            STUDIO
          </span>
        </a>
        <span className="sidebar-caption">CONTENT MANAGEMENT</span>
        <nav aria-label="Content sections">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={page === id ? 'selected' : ''}
              aria-current={page === id ? 'page' : undefined}
              onClick={() => navigate(id)}
            >
              <Icon size={17} />
              {label}
              {id in templates && <span>{content[id as Collection].length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <ShieldCheck size={18} />
          <p>
            {local ? 'Local development' : 'Cloudflare Access'}
            <span>{local ? 'Publishing is disabled' : 'Protected private workspace'}</span>
          </p>
        </div>
      </aside>
      <div className="studio-main">
        <header className="studio-topbar">
          <span className="studio-breadcrumb">
            Portfolio <ChevronRight size={13} /> {title}
          </span>
          <div className="topbar-state">
            <Circle size={7} fill="currentColor" />
            {local ? 'LOCAL ONLY' : 'PRIVATE'}
          </div>
        </header>
        <div className="studio-body">
          <div className="studio-page-heading">
            <div>
              <span className="studio-kicker">YOUR PORTFOLIO, YOUR WAY</span>
              <h1>{title}</h1>
              <p>
                {page === 'overview'
                  ? 'A space to shape what the world sees.'
                  : page === 'skills' || page === 'achievements'
                    ? 'Managed here. No separate public section.'
                    : 'Edit privately. Preview carefully. Publish deliberately.'}
              </p>
            </div>
            <div className="studio-heading-actions">
              <button
                className="studio-button"
                onClick={() => {
                  setPreview(true);
                }}
                disabled={!ready || !validation.success}
              >
                <Eye size={15} />
                Preview
              </button>
              <button
                className="studio-button primary"
                onClick={save}
                disabled={!ready || busy || !validation.success || !dirty}
              >
                {busy ? <Loader2 size={15} className="spinning" /> : <Save size={15} />}Save draft
              </button>
            </div>
          </div>
          <div className="environment-banner">
            <ShieldCheck size={16} />
            <span>
              {local
                ? 'Local draft mode. Changes stay in this browser; no GitHub pushes or deployments.'
                : 'Private draft. Publishing creates a Git commit and starts GitHub Actions.'}
            </span>
            <span className="draft-revision">
              {saved ? `REV ${String(saved.revision).padStart(3, '0')}` : 'NOT LOADED'}
            </span>
          </div>
          <div aria-live="polite">
            {notice && (
              <p className="studio-notice">
                <Check size={15} />
                {notice}
              </p>
            )}
          </div>
          <div role="alert">{error && <p className="studio-error">{error}</p>}</div>
          {!ready ? (
            <div className="studio-panel">
              <h2>{error ? 'Unable to load content' : 'Loading content…'}</h2>
              <p>
                {error
                  ? 'Verify Access and Worker setup, then reload. The editor will not substitute an unverified cloud draft.'
                  : 'Preparing your private workspace.'}
              </p>
              <button className="studio-button" onClick={() => location.reload()}>
                Reload
              </button>
            </div>
          ) : (
            <>
              {!validation.success && (
                <div className="validation-panel" role="alert">
                  <strong>Resolve these fields before saving or previewing:</strong>
                  <ul>
                    {validation.error.issues.map((issue, i) => (
                      <li key={i}>
                        {issue.path.join('.')} — {issue.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {page === 'overview' && (
                <>
                  <div className="overview-grid">
                    {[
                      {
                        label: 'Selected projects',
                        value: content.projects.length,
                        page: 'projects',
                      },
                      { label: 'Browser games', value: content.games.length, page: 'games' },
                      {
                        label: 'Education entries',
                        value: content.education.length,
                        page: 'education',
                      },
                    ].map((item) => (
                      <button
                        className="overview-stat"
                        key={item.label}
                        onClick={() => navigate(item.page as Page)}
                      >
                        <span>
                          {item.label}
                          <ArrowUpRight size={17} />
                        </span>
                        <strong>{String(item.value).padStart(2, '0')}</strong>
                        <small>
                          Manage collection <ArrowRight size={13} />
                        </small>
                      </button>
                    ))}
                  </div>
                  <div className="overview-columns">
                    <section className="studio-panel">
                      <div className="panel-title">
                        <h2>Make it yours</h2>
                        <span className="studio-kicker">CONTENT CHECKLIST</span>
                      </div>
                      {[
                        { label: 'Portrait', done: !!content.personal.portrait, page: 'personal' },
                        {
                          label: 'Contact email',
                          done: !!content.personal.email,
                          page: 'personal',
                        },
                        { label: 'Resume PDF', done: !!content.resume.file, page: 'resume' },
                        {
                          label: 'Experience details',
                          done: !!content.experience.length,
                          page: 'experience',
                        },
                        {
                          label: 'Education institutions',
                          done:
                            content.education.length > 0 &&
                            content.education.every((e) => !!e.organization),
                          page: 'education',
                        },
                      ].map((item) => (
                        <button
                          className="checklist-item"
                          key={item.label}
                          onClick={() => navigate(item.page as Page)}
                        >
                          {item.done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                          <span>{item.label}</span>
                          <small>{item.done ? 'Added' : 'To be added'}</small>
                          <ChevronRight size={14} />
                        </button>
                      ))}
                    </section>
                    <section className="studio-panel publish-panel">
                      <Rocket size={28} strokeWidth={1} />
                      <h2>
                        A deliberate
                        <br />
                        publishing process.
                      </h2>
                      <p>
                        Save your changes, preview the portfolio, then confirm the exact revision
                        before publishing.
                      </p>
                      <button
                        className="studio-button"
                        disabled={
                          local || busy || dirty || saved?.publishing || !validation.success
                        }
                        onClick={() => {
                          setConfirmation('');
                          setPublish(true);
                          publishRequest.current = crypto.randomUUID();
                        }}
                      >
                        <Rocket size={15} />
                        {local ? 'Publishing disabled locally' : 'Review & publish'}
                      </button>
                      <small>
                        {local
                          ? 'Deployment is not enabled for this folder.'
                          : 'Only a confirmed publish changes the public repository.'}
                      </small>
                      <button className="text-link export-link" onClick={exportDraft}>
                        Export content JSON <ArrowDownToLine size={14} />
                      </button>
                      {local && (
                        <small>
                          JSON export excludes uploaded files. Copy staged images into
                          apps/web/public/assets/ and the staged resume into
                          apps/web/public/resume.pdf for a local build.
                        </small>
                      )}
                    </section>
                  </div>
                  <section className="studio-panel notes-panel">
                    <span className="studio-kicker">PRESERVED, NOT REINVENTED</span>
                    <h2>17 games. Every original destination.</h2>
                    <p>
                      The legacy game files are preserved separately from the portfolio. Editing a
                      game card changes its listing; it does not rewrite the game itself. Skills and
                      achievements remain editable without adding public grid sections.
                    </p>
                  </section>
                </>
              )}
              {page === 'personal' && (
                <div className="editor-columns">
                  <section className="studio-panel form-stack">
                    <h2>The person behind the code</h2>
                    {(
                      [
                        'name',
                        'role',
                        'introduction',
                        'about',
                        'portraitAlt',
                        'email',
                        'github',
                        'linkedin',
                      ] as const
                    ).map((key) => (
                      <Field
                        key={key}
                        label={
                          {
                            name: 'Full name',
                            role: 'Role / introduction line',
                            introduction: 'Hero introduction',
                            about: 'About me',
                            portraitAlt: 'Portrait alternative text',
                            email: 'Contact email',
                            github: 'GitHub URL',
                            linkedin: 'LinkedIn URL',
                          }[key]
                        }
                        value={content.personal[key]}
                        onChange={(value) => changePersonal(key, value)}
                        multiline={key === 'about' || key === 'introduction'}
                        note={
                          key === 'email'
                            ? 'Leave empty to show a clearly marked contact placeholder.'
                            : ''
                        }
                      />
                    ))}
                  </section>
                  <aside className="studio-panel portrait-editor">
                    <h2>Portrait</h2>
                    {content.personal.portrait && (
                      <img
                        src={resolveAsset(content.personal.portrait)}
                        alt={content.personal.portraitAlt}
                      />
                    )}
                    <p>
                      Keep the natural portrait. No warping, retouching, parallax, or generated
                      replacements.
                    </p>
                    {uploadControl('portrait')}
                    {stagedDownload(content.personal.portrait)}
                    <Field
                      label="Image path"
                      value={content.personal.portrait}
                      onChange={(value) => changePersonal('portrait', value)}
                    />
                    {content.personal.portrait && (
                      <button
                        className="studio-button danger"
                        onClick={() => changePersonal('portrait', '')}
                      >
                        <Trash2 size={14} />
                        Clear portrait
                      </button>
                    )}
                    <button
                      className="text-link"
                      onClick={() =>
                        setContent((c) => ({
                          ...c,
                          personal: { ...portfolioSchema.parse(initialContent).personal },
                        }))
                      }
                    >
                      Reset personal information <ArrowLeft size={14} />
                    </button>
                  </aside>
                </div>
              )}
              {page === 'resume' && (
                <ResumeManager
                  resume={content.resume}
                  workspaceResume={portfolioSchema.parse(initialContent).resume}
                  local={local}
                  refreshKey={`${published?.sha || ''}:${published?.status || ''}`}
                  busy={busy}
                  sourceUrl={resolveAsset(content.resume.stagedFile || content.resume.file)}
                  uploadControl={uploadControl('resume')}
                  stagedDownload={stagedDownload(content.resume.stagedFile, 'resume.pdf')}
                  onChange={(resume) => setContent(c => ({ ...c, resume }))}
                />
              )}
              {page in templates && (
                <div className="collection-layout">
                  <section className="collection-list studio-panel">
                    <div className="panel-title">
                      <h2>
                        {title}
                        <small>{content[page as Collection].length}</small>
                      </h2>
                      <button
                        className="icon-button"
                        onClick={addRecord}
                        aria-label={`Add ${page === 'games' ? 'game' : 'record'}`}
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                    {(content[page as Collection] as unknown as Record<string, any>[]).map(
                      (item, index) => (
                        <button
                          key={index}
                          className={`record-item ${selected === index ? 'active' : ''}`}
                          onClick={() => setSelected(index)}
                        >
                          <span className="record-number">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span>
                            {item.title || item.name}
                            <small>{item.category || item.period || 'Draft entry'}</small>
                          </span>
                          <ChevronRight size={14} />
                        </button>
                      ),
                    )}
                    {!content[page as Collection].length && (
                      <div className="collection-empty">
                        <Plus size={25} />
                        <p>No entries yet.</p>
                        <button className="studio-button" onClick={addRecord}>
                          Add your first entry
                        </button>
                      </div>
                    )}
                  </section>
                  <section className="studio-panel form-stack record-editor">
                    {record ? (
                      <>
                        <div className="panel-title">
                          <h2>Edit entry</h2>
                          <div className="studio-row">
                            <button
                              className="icon-button"
                              disabled={selected === 0}
                              aria-label="Move entry up"
                              onClick={() => {
                                const key = page as Collection;
                                const records = [...content[key]];
                                [records[selected - 1], records[selected]] = [
                                  records[selected],
                                  records[selected - 1],
                                ];
                                setContent((c) => ({ ...c, [key]: records }));
                                setSelected(selected - 1);
                              }}
                            >
                              ↑
                            </button>
                            <button
                              className="icon-button"
                              disabled={selected === content[page as Collection].length - 1}
                              aria-label="Move entry down"
                              onClick={() => {
                                const key = page as Collection;
                                const records = [...content[key]];
                                [records[selected + 1], records[selected]] = [
                                  records[selected],
                                  records[selected + 1],
                                ];
                                setContent((c) => ({ ...c, [key]: records }));
                                setSelected(selected + 1);
                              }}
                            >
                              ↓
                            </button>
                            <button
                              className="icon-button danger"
                              aria-label="Delete entry"
                              onClick={() => setDeletion(true)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        {Object.entries(record).map(([key, value]) =>
                          key === 'coursework' && page === 'education' ? null : key ===
                              'category' && page === 'games' ? (
                            <label className="studio-field" key={key}>
                              <span>Category</span>
                              <select
                                value={value}
                                onChange={(e) => updateRecord(key, e.target.value)}
                              >
                                {gameCategories.map((category) => (
                                  <option key={category}>{category}</option>
                                ))}
                              </select>
                            </label>
                          ) : key === 'featured' && page === 'games' ? (
                            <label className="studio-field" key={key}>
                              <span>Featured game</span>
                              <input
                                type="checkbox"
                                checked={Boolean(value)}
                                onChange={(e) => updateRecord(key, e.target.checked)}
                              />
                              <small>
                                Retained for compatibility with older drafts. The public game
                                collection does not display a featured panel.
                              </small>
                            </label>
                          ) : Array.isArray(value) ? (
                            <ListField
                              key={`${page}-${selected}-${key}`}
                              label={
                                key === 'technologies'
                                  ? 'Project technologies'
                                  : key === 'learning'
                                    ? 'What I learned'
                                    : 'Tags'
                              }
                              values={value}
                              onChange={(values) => updateRecord(key, values)}
                            />
                          ) : (
                            <Field
                              key={`${page}-${selected}-${key}`}
                              label={
                                {
                                  id: 'Unique ID (slug)',
                                  title: 'Title',
                                  name: 'Name',
                                  category: 'Category',
                                  description: 'Description',
                                  problem: 'The problem',
                                  approach: 'The approach',
                                  repository: 'Repository URL',
                                  demo: 'Live demo URL',
                                  image: 'Image path',
                                  destination: 'Game destination',
                                  organization:
                                    page === 'education' ? 'Institution' : 'Organization',
                                  period: 'Period / dates',
                                }[key] || key
                              }
                              value={String(value)}
                              onChange={(text) => updateRecord(key, text)}
                              multiline={['description', 'problem', 'approach'].includes(key)}
                              note={
                                key === 'destination'
                                  ? 'Keep original paths such as /archery/. A new path needs an actual game file or HTTPS destination.'
                                  : key === 'repository' || key === 'demo'
                                    ? 'HTTPS URL, or leave empty when unavailable.'
                                    : ''
                              }
                            />
                          ),
                        )}
                        {page === 'education' && (
                          <fieldset className="coursework-editor">
                            <legend>Coursework details</legend>
                            <p>
                              List only confirmed coursework for this degree. Leave fields empty
                              until verified; the public panel will show a clear placeholder.
                            </p>
                            {courseworkGroups.map(({ key, label }) => (
                              <ListField
                                key={`${record.id}-coursework-${key}`}
                                label={label}
                                values={record.coursework?.[key] || []}
                                onChange={(values) =>
                                  updateRecord('coursework', {
                                    ...(record.coursework || emptyCoursework()),
                                    [key]: values,
                                  })
                                }
                              />
                            ))}
                            <Field
                              label="Coursework note (optional)"
                              value={record.coursework?.note || ''}
                              onChange={(note) =>
                                updateRecord('coursework', {
                                  ...(record.coursework || emptyCoursework()),
                                  note,
                                })
                              }
                              multiline
                              note="Optional context for this degree's coursework. Leaving this empty shows the pending message only while all lists are empty."
                            />
                          </fieldset>
                        )}
                        {page === 'projects' && (
                          <>
                            {record.image && (
                              <img
                                className="project-preview-image"
                                src={resolveAsset(record.image)}
                                alt="Project image preview"
                              />
                            )}
                            {uploadControl('image')}
                            {stagedDownload(record.image)}
                          </>
                        )}
                      </>
                    ) : (
                      <div className="editor-empty">
                        <FileText size={30} strokeWidth={1} />
                        <h2>Room for your next chapter.</h2>
                        <p>
                          Add an entry to get started. Missing information stays clearly marked.
                        </p>
                      </div>
                    )}
                  </section>
                </div>
              )}
              {page !== 'overview' && (
                <div className="editor-footer">
                  <span>{dirty ? 'You have unsaved changes.' : 'Draft is up to date.'}</span>
                  <span>
                    {changeSummary.length
                      ? `Changed: ${changeSummary.join(', ')}`
                      : 'No unsaved changes'}
                  </span>
                </div>
              )}
              {published && (
                <div className="studio-panel deployment-panel">
                  <h2>Publishing status</h2>
                  <p>{published.status}</p>
                  <code>{published.sha}</code>
                  <div className="studio-row">
                    <button className="studio-button" disabled={busy} onClick={deployment}>
                      Check deployment
                    </button>
                    {published.url && (
                      <a href={published.url} target="_blank" rel="noopener noreferrer">
                        View GitHub Actions ↗
                      </a>
                    )}
                  </div>
                </div>
              )}
              {!local && (
                <section className="studio-panel recovery-panel">
                  <h2>Repository & recovery</h2>
                  <p>
                    Base commit: <code>{saved?.baseSha}</code>
                    {saved?.publishing ? ' · Publish locked; check recovery before retrying.' : ''}
                  </p>
                  <div className="studio-row">
                    <button
                      className="studio-button"
                      disabled={busy || dirty || saved?.publishing}
                      onClick={() => {
                        setMaintenance('rebase');
                        setConfirmation('');
                      }}
                    >
                      Review repository rebase
                    </button>
                    <button
                      className="studio-button"
                      disabled={busy || dirty}
                      onClick={() => {
                        setMaintenance('recover');
                        setConfirmation('');
                      }}
                    >
                      Recover interrupted publish
                    </button>
                  </div>
                </section>
              )}
              {!local && page !== 'overview' && (
                <button
                  className="studio-button publish-bottom"
                  disabled={busy || dirty || saved?.publishing || !validation.success}
                  onClick={() => {
                    setConfirmation('');
                    setPublish(true);
                    publishRequest.current = crypto.randomUUID();
                  }}
                >
                  <Rocket size={15} />
                  Review & publish
                </button>
              )}
            </>
          )}
        </div>
        <footer className="studio-footer">
          <span>SAM JOSEPH / PRIVATE STUDIO</span>
          <span>{local ? 'NO EXTERNAL WRITES' : 'CONTENT → GIT COMMIT → GITHUB ACTIONS'}</span>
        </footer>
      </div>
      {deletion && (
        <Dialog title="Delete this entry?" onClose={() => setDeletion(false)}>
          <div className="dialog-content">
            <p>
              This removes the entry from your draft. The public website changes only after
              publishing.
            </p>
            {page === 'games' && (
              <p>Original game files are preserved; this only removes the listing.</p>
            )}
            <button
              className="studio-button danger"
              onClick={() => {
                const key = page as Collection;
                setContent((c) => ({
                  ...c,
                  [key]: c[key].filter((_, index) => index !== selected),
                }));
                setSelected(0);
                setDeletion(false);
              }}
            >
              Delete draft entry
            </button>
          </div>
        </Dialog>
      )}
      {preview && (
        <Dialog
          title="Portfolio preview"
          onClose={() => setPreview(false)}
          className="preview-dialog"
        >
          <div className="preview-toolbar">
            <span>UNPUBLISHED DRAFT</span>
            <div>
              <button
                className="icon-button"
                aria-pressed={!mobilePreview}
                aria-label="Desktop preview"
                onClick={() => setMobilePreview(false)}
              >
                <Monitor size={18} />
              </button>
              <button
                className="icon-button"
                aria-pressed={mobilePreview}
                aria-label="Mobile preview"
                onClick={() => setMobilePreview(true)}
              >
                <Smartphone size={18} />
              </button>
            </div>
            <span>{mobilePreview ? '390 PX' : 'DESKTOP'}</span>
          </div>
          <div className={`preview-frame-wrap ${mobilePreview ? 'mobile-preview' : ''}`}>
            <iframe
              ref={frame}
              title="Unpublished portfolio preview"
              src="/?preview=1"
              onLoad={sendPreview}
            />
          </div>
        </Dialog>
      )}
      {maintenance && (
        <Dialog
          title={maintenance === 'rebase' ? 'Rebase saved draft' : 'Recover interrupted publish'}
          onClose={() => !busy && setMaintenance(null)}
        >
          <div className="dialog-content">
            <p>
              {maintenance === 'rebase'
                ? 'This keeps your saved content and updates its base to the latest repository commit. A later publish can replace content edited outside this studio. Review the repository history and your draft before continuing.'
                : 'Recovery checks GitHub branch history for the unique publish request. It waits ten minutes after the original request, and releases a lock only when the outcome can be safely established. Ambiguous cases require manual inspection.'}
            </p>
            <Field
              label={maintenance === 'rebase' ? 'Type REBASE SAVED DRAFT' : 'Type RECOVER PUBLISH'}
              value={confirmation}
              onChange={setConfirmation}
            />
            <button
              className="studio-button primary"
              disabled={
                busy ||
                dirty ||
                confirmation !==
                  (maintenance === 'rebase' ? 'REBASE SAVED DRAFT' : 'RECOVER PUBLISH')
              }
              onClick={maintain}
            >
              Confirm {maintenance}
            </button>
          </div>
        </Dialog>
      )}
      {publish && (
        <Dialog title="Confirm publishing" onClose={() => !busy && setPublish(false)}>
          <div className="dialog-content">
            <p>
              Publish saved revision <strong>{saved?.revision}</strong> to GitHub. All saved content
              and referenced uploads will be included in one commit.
            </p>
            <p>
              Collections: {content.projects.length} projects, {content.games.length} games,{' '}
              {content.experience.length} experience entries, {content.education.length} education
              entries.
            </p>
            <p>
              Base commit: <code>{saved?.baseSha}</code>
            </p>
            <p>
              This starts the public GitHub Pages deployment. A commit does not guarantee a
              successful deployment.
            </p>
            <Field
              label="Type PUBLISH TO GITHUB to confirm"
              value={confirmation}
              onChange={setConfirmation}
            />
            <button
              className="studio-button primary"
              disabled={busy || dirty || confirmation !== 'PUBLISH TO GITHUB' || local}
              onClick={performPublish}
            >
              {busy ? <Loader2 size={15} className="spinning" /> : <Rocket size={15} />}Publish
              revision {saved?.revision}
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {new URLSearchParams(location.search).has('preview') ? <PreviewWindow /> : <Studio />}
  </React.StrictMode>,
);
