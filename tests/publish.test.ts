import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GitHub, PublishUncertain } from '../apps/worker/src/github';
import { portfolioSchema } from '../packages/content/schema';
import { HttpError } from '../apps/worker/src/security';
const fixture = JSON.parse(
  readFileSync(new URL('../content/portfolio.json', import.meta.url), 'utf8'),
);
const content = portfolioSchema.parse({
  ...fixture,
  personal: { ...fixture.personal, portrait: '/assets/test-portrait.webp' },
  resume: { file: '', label: 'Download resume' },
  projects: [],
});
const base = 'a'.repeat(40),
  next = 'b'.repeat(40);
const config = {
  GITHUB_OWNER: 'owner',
  GITHUB_REPO: 'repo',
  GITHUB_BRANCH: 'master',
  GITHUB_TOKEN: 'TEST_ONLY_NOT_A_CREDENTIAL',
};
test('publishing creates an atomic content/assets tree and non-forced commit without writing arbitrary paths', async () => {
  const calls: { path: string; method: string; body: any }[] = [];
  const transport = async (url: string | URL | Request, options?: RequestInit) => {
    const path = new URL(String(url)).pathname;
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.parse(String(options.body)) : null;
    calls.push({ path, method, body });
    let result = {};
    if (path.endsWith('/contents/content/portfolio.json')) result = { encoding: 'base64', content: Buffer.from(JSON.stringify(content)).toString('base64') };
    else if (path.includes('/git/ref/')) result = { object: { sha: base } };
    else if (path.endsWith(`/git/commits/${base}`)) result = { tree: { sha: 'tree-base' } };
    else if (path.endsWith('/git/blobs')) result = { sha: `blob-${calls.length}` };
    else if (path.endsWith('/git/trees')) result = { sha: 'tree-next' };
    else if (path.endsWith('/git/commits')) result = { sha: next };
    return Response.json(result);
  };
  const result = await new GitHub(config, transport as typeof fetch).publish(
    content,
    base,
    {
      get: async () => ({ arrayBuffer: async () => new Uint8Array([255, 216, 255]).buffer }),
    } as any,
    'content: test',
  );
  assert.equal(result.sha, next);
  const tree = calls.find((c) => c.path.endsWith('/git/trees'))!.body;
  assert.equal(tree.base_tree, 'tree-base');
  assert.deepEqual(
    tree.tree.map((e: { path: string }) => e.path),
    ['apps/web/public/assets/test-portrait.webp', 'content/portfolio.json'],
  );
  const commit = calls.find((c) => c.path.endsWith('/git/commits'))!.body;
  assert.deepEqual(commit.parents, [base]);
  const ref = calls.find((c) => c.method === 'PATCH')!.body;
  assert.equal(ref.force, false);
  assert.equal(ref.sha, next);
});
test('stale repository heads abort before creating blobs or commits', async () => {
  let calls = 0;
  const github = new GitHub(config, (async () => {
    calls++;
    return Response.json({ object: { sha: next } });
  }) as typeof fetch);
  await assert.rejects(
    () => github.publish(content, base, { get: async () => null } as any, 'test'),
    (error) => error instanceof HttpError && error.status === 409,
  );
  assert.equal(calls, 1);
});
test('a rejected non-fast-forward ref update is not reported as a successful publish', async () => {
  let headCalls = 0;
  const transport = async (url: string | URL | Request, options?: RequestInit) => {
    const path = String(url);
    if (path.includes('/contents/content/portfolio.json')) return Response.json({ encoding: 'base64', content: Buffer.from(JSON.stringify(content)).toString('base64') });
    if (options?.method === 'PATCH') return Response.json({}, { status: 422 });
    if (path.includes('/git/ref/'))
      return Response.json({ object: { sha: ++headCalls === 1 ? base : 'c'.repeat(40) } });
    if (path.endsWith(`/git/commits/${base}`)) return Response.json({ tree: { sha: 'tree' } });
    return Response.json({ sha: next });
  };
  const github = new GitHub(config, transport as typeof fetch);
  await assert.rejects(
    () => github.publish(content, base, { get: async () => null } as any, 'test'),
    (error) => error instanceof HttpError && error.status === 409,
  );
});
test('unknown branch-update outcomes retain the commit reference for recovery rather than permitting blind retries', async () => {
  let heads = 0;
  const transport = async (url: string | URL | Request, options?: RequestInit) => {
    const path = String(url);
    if (path.includes('/contents/content/portfolio.json')) return Response.json({ encoding: 'base64', content: Buffer.from(JSON.stringify(content)).toString('base64') });
    if (options?.method === 'PATCH') throw new Error('connection lost');
    if (path.includes('/git/ref/')) {
      if (++heads > 1) throw new Error('still offline');
      return Response.json({ object: { sha: base } });
    }
    if (path.endsWith(`/git/commits/${base}`)) return Response.json({ tree: { sha: 'tree' } });
    return Response.json({ sha: next });
  };
  await assert.rejects(
    () =>
      new GitHub(config, transport as typeof fetch).publish(
        content,
        base,
        { get: async () => null } as any,
        'test',
      ),
    (error) => error instanceof PublishUncertain && error.commitSha === next,
  );
});
