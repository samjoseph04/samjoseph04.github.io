import { portfolioSchema, referencedAssets, resumeUrl, resumeDigest, resumeName, validateResumePdf, type Portfolio } from '@portfolio/content';
import { HttpError, toBase64 } from './security';
import { deploymentResult } from './deployment';

export interface GitHubConfig {
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  GITHUB_BRANCH: string;
  GITHUB_TOKEN: string;
}
export class PublishUncertain extends HttpError {
  constructor(public commitSha: string) {
    super(
      503,
      'A commit was created, but the branch update could not be verified. Recover this publish before retrying.',
    );
  }
}
export class GitHub {
  constructor(
    private config: GitHubConfig,
    private transport: typeof fetch = fetch,
  ) {}
  async call(path: string, method = 'GET', body?: unknown): Promise<any> {
    if (!this.config.GITHUB_TOKEN || this.config.GITHUB_BRANCH.includes('REPLACE_'))
      throw new HttpError(503, 'GitHub publishing is not configured.');
    const response = await this.transport(
      `https://api.github.com/repos/${encodeURIComponent(this.config.GITHUB_OWNER)}/${encodeURIComponent(this.config.GITHUB_REPO)}${path}`,
      {
        method,
        signal: AbortSignal.timeout(20_000),
        headers: {
          Authorization: `Bearer ${this.config.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2026-03-10',
          'User-Agent': 'SamJoseph-PrivateStudio',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      },
    );
    if (!response.ok) {
      if (response.status === 404)
        throw new HttpError(
          404,
          'Repository, branch, or file was not found. Verify bootstrap configuration.',
        );
      if (response.status === 409 || response.status === 422)
        throw new HttpError(
          409,
          'Repository changed during publishing. Refresh the draft before trying again.',
        );
      throw new HttpError(
        502,
        `GitHub rejected the request (${response.status}). Check Worker credentials and repository permissions.`,
      );
    }
    return response.json();
  }
  head() {
    return this.call(`/git/ref/heads/${encodeURIComponent(this.config.GITHUB_BRANCH)}`);
  }
  async file(path: string, sha: string) {
    return this.call(
      `/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(sha)}`,
    );
  }
  async bytes(path: string, sha: string) {
    let file = await this.file(path, sha);
    if (file.type && file.type !== 'file') throw new HttpError(415, 'Expected a file, not a directory.');
    if (file.size > 5_000_000) throw new HttpError(413, 'File exceeds the 5 MB limit.');
    if (file.encoding !== 'base64') file = await this.call(`/git/blobs/${file.sha}`);
    if (file.encoding !== 'base64' || !file.content)
      throw new HttpError(502, 'File could not be read from GitHub.');
    const bytes = Uint8Array.from(atob(file.content.replace(/\s/g, '')), c => c.charCodeAt(0));
    if (bytes.length > 5_000_000) throw new HttpError(413, 'File exceeds the 5 MB limit.');
    return bytes;
  }
  async contentAt(sha: string) {
    return portfolioSchema.parse(JSON.parse(new TextDecoder().decode(await this.bytes('content/portfolio.json', sha))));
  }
  async deployment(sha: string) {
    const runs = await this.call(`/actions/workflows/pages.yml/runs?head_sha=${sha}&per_page=5`);
    const run = runs.workflow_runs?.find((item: { head_sha: string }) => item.head_sha === sha);
    if (!run) return { status: 'not-started', conclusion: null, message: 'No deployment run found for this commit.' };
    const jobs = run.status === 'completed' ? await this.call(`/actions/runs/${run.id}/jobs?per_page=100`) : { jobs: [] };
    return deploymentResult(run, jobs.jobs || []);
  }
  async resumeSnapshot(sha: string) {
    const content = await this.contentAt(sha);
    if (!content.resume.file) return { sha, exists: false, resume: content.resume };
    try {
      const bytes = await this.bytes(`apps/web/public${content.resume.file}`, sha);
      validateResumePdf(bytes);
      const digest = await resumeDigest(bytes);
      if (content.resume.sha256 && content.resume.sha256 !== digest)
        throw new Error('Resume metadata does not match the repository PDF.');
      return { sha, exists: true, resume: { ...content.resume, size: bytes.length, sha256: digest } };
    } catch (error) {
      if (error instanceof HttpError && error.status !== 404) throw error;
      return { sha, exists: false, resume: content.resume, error: error instanceof HttpError ? 'The referenced PDF is missing from the repository.' : (error as Error).message };
    }
  }
  async resumeStatus() {
    const head = await this.head();
    const repository = await this.resumeSnapshot(head.object.sha);
    const deployment = await this.deployment(head.object.sha);
    let live = deployment.status === 'completed' && deployment.conclusion === 'success' ? repository : null;
    if (!live) {
      // A successful workflow may have skipped deployment. Check the deploy job
      // before calling a repository version live; never assume branch head is live.
      const runs = await this.call(`/actions/workflows/pages.yml/runs?branch=${encodeURIComponent(this.config.GITHUB_BRANCH)}&status=success&per_page=5`);
      for (const run of runs.workflow_runs || []) {
        const jobs = await this.call(`/actions/runs/${run.id}/jobs?per_page=100`);
        if (deploymentResult(run, jobs.jobs || []).conclusion === 'success') {
          live = await this.resumeSnapshot(run.head_sha);
          break;
        }
      }
    }
    return { repository, live, deployment };
  }
  async publish(content: Portfolio, base: string, uploads: Pick<R2Bucket, 'get'>, message: string) {
    const current = await this.head();
    if (current.object.sha !== base)
      throw new HttpError(
        409,
        'The repository changed since this draft was loaded. Rebase the draft first.',
      );
    const parent = await this.call(`/git/commits/${base}`);
    const previous = await this.contentAt(base);
    const publishedContent = structuredClone(content);
    publishedContent.resume.stagedFile = '';
    // Listings may be edited freely, but new local destinations need real game files.
    for (const game of content.games)
      if (game.destination.startsWith('/'))
        await this.file(`apps/web/public${game.destination}index.html`, base);
    const entries: { path: string; mode: string; type: string; sha: string | null }[] = [];
    for (const asset of referencedAssets(content).filter(path => path !== content.resume.file)) {
      const name = asset.slice('/assets/'.length);
      const staged = await uploads.get(`staged/${name}`);
      if (staged) {
        const blob = await this.call('/git/blobs', 'POST', {
          content: toBase64(new Uint8Array(await staged.arrayBuffer())),
          encoding: 'base64',
        });
        entries.push({
          path: `apps/web/public${asset}`,
          mode: '100644',
          type: 'blob',
          sha: blob.sha,
        });
      } else {
        await this.file(`apps/web/public${asset}`, base);
      }
    }
    if (content.resume.file) {
      const source = content.resume.stagedFile || content.resume.file;
      let bytes: Uint8Array;
      if (content.resume.stagedFile) {
        const staged = await uploads.get(`staged/${source.slice('/assets/'.length)}`);
        if (!staged) throw new HttpError(409, 'The staged PDF is missing. Upload it again before publishing.');
        bytes = new Uint8Array(await staged.arrayBuffer());
        const metadata = staged.customMetadata;
        if (!metadata || metadata.createdAt !== content.resume.uploadedAt || metadata.originalName !== content.resume.originalName || metadata.sha256 !== content.resume.sha256)
          throw new HttpError(409, 'Resume upload metadata changed. Upload the PDF again.');
      } else {
        // Older saved drafts used their staged path as resume.file. Read those
        // private bytes before falling back to a previously committed asset.
        const legacyUpload = source.startsWith('/assets/') ? await uploads.get(`staged/${source.slice('/assets/'.length)}`) : null;
        if (legacyUpload) {
          bytes = new Uint8Array(await legacyUpload.arrayBuffer());
          const createdAt = legacyUpload.customMetadata?.createdAt || '';
          publishedContent.resume.uploadedAt = Number.isFinite(Date.parse(createdAt)) ? new Date(createdAt).toISOString() : '';
          publishedContent.resume.originalName = resumeName(legacyUpload.customMetadata?.originalName || 'resume.pdf');
        } else bytes = await this.bytes(`apps/web/public${source}`, base);
      }
      try { validateResumePdf(bytes); }
      catch (error) { throw new HttpError(415, (error as Error).message); }
      const digest = await resumeDigest(bytes);
      if ((content.resume.sha256 && digest !== content.resume.sha256) || (content.resume.size && content.resume.size !== bytes.length))
        throw new HttpError(409, 'Resume bytes differ from the selected upload. Reload or upload again.');
      publishedContent.resume = { ...publishedContent.resume, file: resumeUrl, size: bytes.length, sha256: digest };
      const blob = await this.call('/git/blobs', 'POST', { content: toBase64(bytes), encoding: 'base64' });
      entries.push({ path: `apps/web/public${resumeUrl}`, mode: '100644', type: 'blob', sha: blob.sha });
    } else {
      // Removal is explicit and is committed atomically with its content change.
      if (previous.resume.file === resumeUrl) {
        try {
          await this.file(`apps/web/public${resumeUrl}`, base);
          entries.push({ path: `apps/web/public${resumeUrl}`, mode: '100644', type: 'blob', sha: null });
        } catch (error) { if (!(error instanceof HttpError && error.status === 404)) throw error; }
      }
    }
    // Migration deletes only the previous, verified resume reference. Never
    // delete arbitrary staged files, unrelated assets, or Git history.
    if (previous.resume.file && previous.resume.file !== resumeUrl) {
      try {
        await this.file(`apps/web/public${previous.resume.file}`, base);
        entries.push({ path: `apps/web/public${previous.resume.file}`, mode: '100644', type: 'blob', sha: null });
      } catch (error) { if (!(error instanceof HttpError && error.status === 404)) throw error; }
    }
    const blob = await this.call('/git/blobs', 'POST', {
      content: JSON.stringify(publishedContent, null, 2) + '\n',
      encoding: 'utf-8',
    });
    entries.push({ path: 'content/portfolio.json', mode: '100644', type: 'blob', sha: blob.sha });
    const tree = await this.call('/git/trees', 'POST', {
      base_tree: parent.tree.sha,
      tree: entries,
    });
    const commit = await this.call('/git/commits', 'POST', {
      message,
      tree: tree.sha,
      parents: [base],
    });
    try {
      await this.call(`/git/refs/heads/${encodeURIComponent(this.config.GITHUB_BRANCH)}`, 'PATCH', {
        sha: commit.sha,
        force: false,
      });
    } catch (error) {
      // A timed-out response may still have updated the ref. Reconcile before reporting failure.
      let actual;
      try {
        actual = await this.head();
      } catch {
        throw new PublishUncertain(commit.sha);
      }
      if (actual.object.sha !== commit.sha) throw error;
    }
    return { sha: commit.sha as string, content: publishedContent };
  }
}
