import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import worker, { type Env } from '../apps/worker/src/index';
import { portfolioSchema, resumeSchema, resumeDigest, validateResumePdf, resumeUrl } from '../packages/content/schema';
import { toBase64 } from '../apps/worker/src/security';

function pdf(text = 'Resume fixture', padding = 0) {
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Count 1 /Kids [3 0 R] >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R >>',
    `<< /Length ${text.length + 2} >>\nstream\n%${text}\nendstream`];
  let data = '%PDF-1.7\n';
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(data.length); data += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  if (padding) data += `%${' '.repeat(padding)}\n`;
  const xref = data.length;
  data += `xref\n0 5\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(data);
}

test('PDF validation accepts complete files and rejects fake, truncated, oversized and wrong-type uploads', () => {
  assert.doesNotThrow(() => validateResumePdf(pdf()));
  for (const bytes of [new Uint8Array(), new Uint8Array(5_000_001), new TextEncoder().encode('%PDF-1.7\n'), pdf().slice(0, -10), new TextEncoder().encode('<html>not PDF</html>')])
    assert.throws(() => validateResumePdf(bytes));
  assert.throws(() => validateResumePdf(pdf(), 'image/png'));
  const broken = new TextEncoder().encode(new TextDecoder().decode(pdf()).replace(/startxref\n\d+/, 'startxref\n9999999'));
  assert.throws(() => validateResumePdf(broken));
  assert(!resumeSchema.safeParse({ file: '/other.pdf', label: 'Resume' }).success);
  assert(!resumeSchema.safeParse({ file: '/resume.pdf', stagedFile: '/assets/staged.pdf', label: 'Resume' }).success);
  assert.equal(resumeSchema.parse({ file: '/assets/legacy.pdf', label: 'Resume' }).uploadedAt, '');
});

test('authenticated resume upload → save → atomic replacement → Actions status → exact PDF download; failures preserve the old file', async t => {
  const oldPdf = pdf('old published resume'), nextPdf = pdf('new published resume');
  const base = 'a'.repeat(40);
  const seed = portfolioSchema.parse({ ...JSON.parse(readFileSync(new URL('../content/portfolio.json', import.meta.url), 'utf8')),
    personal: { ...JSON.parse(readFileSync(new URL('../content/portfolio.json', import.meta.url), 'utf8')).personal, portrait: '' },
    projects: [], games: [], resume: { file: '/assets/legacy-resume.pdf', label: 'Download resume' } });
  const row = { content: JSON.stringify(seed), revision: 0, base_sha: base, updated_at: new Date().toISOString(), publish_lock: null as string | null, lock_time: null as number | null };
  const publishes = new Map<string, any>();
  const db = { prepare(sql: string) {
    let values: any[] = [];
    const statement = {
      bind(...args: any[]) { values = args; return statement; },
      async first() { return sql.includes('FROM publishes') ? publishes.get(values[0]) || null : { ...row }; },
      async all() { return { results: [...publishes.values()] }; },
      async run() {
        let changes = 1;
        if (sql.startsWith('INSERT INTO publishes')) publishes.set(values[0], { id: values[0], revision: values[1], status: values[2], created_at: values[3], commit_sha: null });
        else if (sql.startsWith('UPDATE publishes SET commit_sha')) Object.assign(publishes.get(values[2]), { commit_sha: values[0], status: values[1] });
        else if (sql.startsWith('UPDATE publishes SET status')) Object.assign(publishes.get(values[1]), { status: values[0] });
        else if (sql.startsWith('UPDATE drafts SET publish_lock = ?')) {
          if (row.publish_lock || row.revision !== values[2]) changes = 0;
          else { row.publish_lock = values[0]; row.lock_time = values[1]; }
        } else if (sql.startsWith('UPDATE drafts SET content = ?, base_sha')) {
          assert.equal(row.publish_lock, values[2]);
          row.content = values[0]; row.base_sha = values[1]; row.revision++; row.publish_lock = null; row.lock_time = null;
        } else if (sql.startsWith('UPDATE drafts SET content = ?')) {
          if (row.publish_lock || row.revision !== values[2]) changes = 0;
          else { row.content = values[0]; row.updated_at = values[1]; row.revision++; }
        } else if (sql.startsWith('UPDATE drafts SET publish_lock = NULL')) { row.publish_lock = null; row.lock_time = null; }
        else throw new Error(`Unexpected SQL in resume test: ${sql}`);
        return { meta: { changes } };
      },
    };
    return statement;
  } };
  const staged = new Map<string, { bytes: Uint8Array; customMetadata: Record<string, string> }>();
  const uploads = { async put(key: string, bytes: Uint8Array, options: any) { staged.set(key, { bytes: new Uint8Array(bytes), customMetadata: options.customMetadata }); },
    async get(key: string) { const value = staged.get(key); return value ? { ...value, body: value.bytes, arrayBuffer: async () => value.bytes.buffer } : null; } };
  const files = new Map<string, Uint8Array>([['content/portfolio.json', new TextEncoder().encode(JSON.stringify(seed))], ['apps/web/public/assets/legacy-resume.pdf', oldPdf], ['apps/web/public/assets/unrelated.webp', new Uint8Array([1, 2, 3])]]);
  const snapshots = new Map<string, Map<string, Uint8Array>>([[base, files]]);
  const blobs = new Map<string, Uint8Array>();
  const trees = new Map<string, Map<string, Uint8Array>>([['initial-tree', files]]);
  const commits = new Map<string, string>([[base, 'initial-tree']]);
  const runs: any[] = [{ id: 1, head_sha: base, status: 'completed', conclusion: 'success', html_url: 'https://github.com/test/test/actions/runs/1', deploy: 'success' }];
  let head = base, counter = 1, creates = 0;
  const { privateKey, publicKey } = await generateKeyPair('RS256');
  const jwk = { ...await exportJWK(publicKey), kid: 'resume-test', alg: 'RS256', use: 'sig' };
  const token = await new SignJWT({}).setProtectedHeader({ alg: 'RS256', kid: jwk.kid }).setIssuer('https://resume-tests.cloudflareaccess.com').setAudience('resume-studio').setSubject('test-owner').setIssuedAt().setExpirationTime('1h').sign(privateKey);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, options) => {
    const url = new URL(String(input));
    if (url.hostname === 'resume-tests.cloudflareaccess.com') return Response.json({ keys: [jwk] });
    assert.equal(url.hostname, 'api.github.com', 'Tests never contact real external services.');
    const path = url.pathname.replace('/repos/test/test', '');
    const body = options?.body ? JSON.parse(String(options.body)) : null;
    const method = options?.method || 'GET';
    if (path === '/git/ref/heads/main') return Response.json({ object: { sha: head } });
    if (path.startsWith('/contents/')) {
      const bytes = snapshots.get(url.searchParams.get('ref')!)?.get(decodeURIComponent(path.slice('/contents/'.length)));
      if (!bytes) return Response.json({}, { status: 404 });
      const sha = `read-${++counter}`; blobs.set(sha, bytes);
      return Response.json({ type: 'file', size: bytes.length, sha, encoding: bytes.length > 1_000_000 ? 'none' : 'base64', content: bytes.length > 1_000_000 ? '' : toBase64(bytes) });
    }
    if (path.startsWith('/git/blobs/')) return Response.json({ encoding: 'base64', content: toBase64(blobs.get(path.slice('/git/blobs/'.length))!) });
    if (path === '/git/blobs') {
      const sha = `blob-${++counter}`;
      blobs.set(sha, body.encoding === 'base64' ? Uint8Array.from(Buffer.from(body.content, 'base64')) : new TextEncoder().encode(body.content));
      return Response.json({ sha });
    }
    if (path.startsWith('/git/commits/')) return Response.json({ tree: { sha: commits.get(path.slice('/git/commits/'.length)) } });
    if (path === '/git/trees') {
      const tree = new Map(trees.get(body.base_tree)!);
      for (const entry of body.tree) { if (entry.sha === null) tree.delete(entry.path); else tree.set(entry.path, blobs.get(entry.sha)!); }
      const sha = `tree-${++counter}`; trees.set(sha, tree); return Response.json({ sha });
    }
    if (path === '/git/commits') {
      const sha = (++creates).toString(16).padStart(40, '0'); commits.set(sha, body.tree); snapshots.set(sha, trees.get(body.tree)!);
      return Response.json({ sha });
    }
    if (method === 'PATCH' && path === '/git/refs/heads/main') {
      assert.equal(body.force, false); head = body.sha;
      runs.unshift({ id: runs.length + 1, head_sha: head, status: 'queued', conclusion: null, html_url: `https://github.com/test/test/actions/runs/${runs.length + 1}`, deploy: null });
      return Response.json({ object: { sha: head } });
    }
    if (path === '/actions/workflows/pages.yml/runs') return Response.json({ workflow_runs: url.searchParams.has('head_sha') ? runs.filter(run => run.head_sha === url.searchParams.get('head_sha')) : runs.filter(run => run.conclusion === 'success') });
    const jobs = /\/actions\/runs\/(\d+)\/jobs/.exec(path);
    if (jobs) return Response.json({ jobs: [{ name: 'deploy', conclusion: runs.find(run => run.id === +jobs[1])?.deploy }] });
    throw new Error(`Unexpected GitHub request: ${method} ${path}`);
  };
  t.after(() => { globalThis.fetch = originalFetch; });
  const env = { DB: db, UPLOADS: uploads, GITHUB_OWNER: 'test', GITHUB_REPO: 'test', GITHUB_BRANCH: 'main', GITHUB_TOKEN: 'TEST_ONLY_NOT_A_CREDENTIAL', ADMIN_ORIGIN: 'https://admin.example.com', ACCESS_TEAM_DOMAIN: 'resume-tests.cloudflareaccess.com', ACCESS_AUD: 'resume-studio' } as unknown as Env;
  const request = (path: string, method = 'GET', body?: unknown, extra: Record<string, string> = {}) => worker.fetch(new Request(`https://admin.example.com/api${path}`, {
    method, headers: { 'Cf-Access-Jwt-Assertion': token, Origin: env.ADMIN_ORIGIN, 'Sec-Fetch-Site': 'same-origin', 'Content-Type': 'application/json', ...extra },
    ...(body === undefined ? {} : { body: body instanceof Uint8Array ? body : JSON.stringify(body) }),
  }), env);
  const upload = async (bytes: Uint8Array) => {
    const response = await request('/uploads?purpose=resume', 'POST', bytes, { 'Content-Type': 'application/pdf', 'X-Upload-Name': encodeURIComponent('Resume é.pdf') });
    assert.equal(response.status, 201); return await response.json() as any;
  };
  const save = async (content: unknown, revision = row.revision) => {
    const response = await request('/content', 'PUT', { content, revision }); assert.equal(response.status, 200); return await response.json() as any;
  };
  const publish = async (revision: number, requestId = crypto.randomUUID()) => {
    const response = await request('/publish', 'POST', { revision, requestId, confirmation: 'PUBLISH TO GITHUB' });
    return { response, requestId, result: await response.json() as any };
  };
  assert.equal((await worker.fetch(new Request('https://admin.example.com/api/resume'), env)).status, 401);
  assert.equal((await request('/uploads?purpose=resume', 'POST', nextPdf, { 'Content-Type': 'application/pdf', Origin: 'https://other.example' })).status, 403);
  for (const [bytes, mime, expected] of [[new TextEncoder().encode('%PDF-1.7\n'), 'application/pdf', 415], [nextPdf, 'image/png', 415], [new Uint8Array(5_000_001), 'application/pdf', 413]] as const)
    assert.equal((await request('/uploads?purpose=resume', 'POST', bytes, { 'Content-Type': mime })).status, expected);
  assert.equal(staged.size, 0);
  const uploaded = await upload(nextPdf);
  assert.equal(uploaded.resume.sha256, await resumeDigest(nextPdf));
  assert.equal(uploaded.resume.originalName, 'Resume é.pdf');
  let draft = await save({ ...seed, resume: { ...uploaded.resume, label: 'Download resume', file: resumeUrl, stagedFile: uploaded.path } });
  // A missing private upload must never silently retain/republish the old PDF.
  const savedObject = staged.get(`staged/${uploaded.path.slice('/assets/'.length)}`)!;
  staged.delete(`staged/${uploaded.path.slice('/assets/'.length)}`);
  assert.equal((await publish(draft.revision)).response.status, 409);
  assert.equal(head, base); assert.equal(creates, 0);
  staged.set(`staged/${uploaded.path.slice('/assets/'.length)}`, savedObject);
  const selected = JSON.parse(row.content);
  await save({ ...selected, resume: { ...selected.resume, sha256: 'f'.repeat(64) } });
  assert.equal((await publish(row.revision)).response.status, 409, 'Tampered metadata cannot publish.');
  draft = await save(selected);
  staged.set(`staged/${uploaded.path.slice('/assets/'.length)}`, { ...savedObject, bytes: pdf('changed after selection') });
  assert.equal((await publish(draft.revision)).response.status, 409, 'Changed staged bytes cannot publish.');
  assert.equal(head, base);
  staged.set(`staged/${uploaded.path.slice('/assets/'.length)}`, savedObject);
  const first = await publish(draft.revision);
  assert.equal(first.response.status, 201); assert.equal(creates, 1);
  assert.equal((await publish(draft.revision, first.requestId)).response.status, 200);
  assert.equal(creates, 1, 'Publish retry is idempotent.');
  assert.deepEqual(snapshots.get(head)!.get('apps/web/public/resume.pdf'), nextPdf);
  assert(!snapshots.get(head)!.has('apps/web/public/assets/legacy-resume.pdf'));
  assert(snapshots.get(head)!.has('apps/web/public/assets/unrelated.webp'));
  const committed = JSON.parse(new TextDecoder().decode(snapshots.get(head)!.get('content/portfolio.json')));
  assert.equal(committed.resume.file, '/resume.pdf'); assert.equal(committed.resume.stagedFile, '');
  assert.equal(JSON.parse(row.content).resume.stagedFile, '', 'Published draft drops its private staging reference.');
  let status = await (await request('/resume')).json() as any;
  assert.equal(status.repository.sha, head); assert.equal(status.live.sha, base); assert.equal(status.deployment.status, 'queued');
  runs[0].status = 'completed'; runs[0].conclusion = 'success'; runs[0].deploy = 'skipped';
  status = await (await request('/resume')).json() as any;
  assert.equal(status.live.sha, base); assert.equal(status.deployment.conclusion, 'skipped');
  runs[0].deploy = 'success';
  status = await (await request('/resume')).json() as any;
  assert.equal(status.live.sha, head); assert.equal(status.deployment.conclusion, 'success');
  // Replace again with a >1MB PDF: exercise GitHub Blob fallback and stable URL.
  const larger = pdf('second replacement', 1_100_000);
  const replacement = await upload(larger);
  draft = await save({ ...JSON.parse(row.content), resume: { ...replacement.resume, label: 'Download resume', file: resumeUrl, stagedFile: replacement.path } });
  const second = await publish(draft.revision); assert.equal(second.response.status, 201);
  const preview = await request(`/asset?path=/resume.pdf&ref=${head}`);
  assert.equal(preview.headers.get('Content-Type'), 'application/pdf');
  assert(preview.headers.get('Content-Disposition')?.startsWith('inline'));
  assert.equal(preview.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(new Uint8Array(await preview.arrayBuffer()), larger);
  const download = await request(`/asset?path=/resume.pdf&ref=${head}&download=1`);
  assert(download.headers.get('Content-Disposition')?.startsWith('attachment'));
  assert.equal(await resumeDigest(new Uint8Array(await download.arrayBuffer())), replacement.resume.sha256);
  assert.deepEqual([...snapshots.get(head)!.keys()].filter(path => path.endsWith('.pdf')), ['apps/web/public/resume.pdf']);
  const stale = await request('/content', 'PUT', { content: JSON.parse(row.content), revision: 0 }); assert.equal(stale.status, 409);
  draft = await save({ ...JSON.parse(row.content), resume: resumeSchema.parse({ file: '', label: 'Download resume' }) });
  assert.equal((await publish(draft.revision)).response.status, 201);
  assert(!snapshots.get(head)!.has('apps/web/public/resume.pdf'));
  assert.equal((await request(`/asset?path=/resume.pdf&ref=${head}`)).status, 404);
  const oldDraftUpload = await upload(pdf('legacy private draft'));
  draft = await save({ ...JSON.parse(row.content), resume: { file: oldDraftUpload.path, label: 'Download resume' } });
  assert.equal((await publish(draft.revision)).response.status, 201);
  assert.equal(JSON.parse(row.content).resume.file, '/resume.pdf');
  assert.equal(JSON.parse(row.content).resume.sha256, oldDraftUpload.resume.sha256);
  assert.equal(JSON.parse(row.content).resume.uploadedAt, oldDraftUpload.resume.uploadedAt);
  assert.deepEqual([...snapshots.get(head)!.keys()].filter(path => path.endsWith('.pdf')), ['apps/web/public/resume.pdf']);
  const workflow = readFileSync(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8');
  assert(workflow.includes("- 'apps/**'")); assert(workflow.includes("- 'content/**'"));
  assert(workflow.includes('npm run verify:export'));
});
