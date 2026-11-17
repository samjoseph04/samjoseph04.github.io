import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deploymentResult } from '../apps/worker/src/deployment';
test('a successful validation workflow with skipped or absent deploy job is never called deployed', () => {
  const run = {
    status: 'completed',
    conclusion: 'success',
    html_url: 'https://github.com/example/actions/runs/1',
  };
  assert.equal(
    deploymentResult(run, [{ name: 'deploy', conclusion: 'skipped' }]).conclusion,
    'skipped',
  );
  assert.equal(deploymentResult(run, []).conclusion, 'not-deployed');
  assert.equal(
    deploymentResult(run, [{ name: 'deploy', conclusion: 'success' }]).conclusion,
    'success',
  );
  assert.equal(deploymentResult({ ...run, status: 'in_progress' }, []).conclusion, null);
  assert.equal(deploymentResult({ ...run, conclusion: 'failure' }, []).conclusion, 'failure');
});
