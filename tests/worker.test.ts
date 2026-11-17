import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker, { type Env } from '../apps/worker/src/index';

test('API and static admin assets both fail closed without Access, before touching storage or GitHub', async () => {
  const env = {
    ACCESS_TEAM_DOMAIN: 'test.cloudflareaccess.com',
    ACCESS_AUD: 'private-portfolio',
  } as Env;
  for (const path of [
    '/',
    '/assets/index.js',
    '/api/content',
    '/api/resume',
    '/api/uploads?purpose=resume',
    '/api/publish',
    '/api/asset?path=/assets/test.png',
  ]) {
    const response = await worker.fetch(new Request(`https://admin.example.com${path}`), env);
    assert.equal(response.status, 401);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(
      ((await response.json()) as { error: string }).error,
      'Cloudflare Access authentication required.',
    );
  }
});
test('unconfigured production authentication never silently activates local demo mode', async () => {
  const response = await worker.fetch(new Request('https://admin.example.com/'), {
    ACCESS_TEAM_DOMAIN: 'REPLACE_WITH_TEAM.cloudflareaccess.com',
    ACCESS_AUD: 'REPLACE_WITH_AUDIENCE',
  } as Env);
  assert.equal(response.status, 503);
});
