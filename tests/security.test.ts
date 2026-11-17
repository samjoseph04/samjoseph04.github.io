import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, exportJWK, createLocalJWKSet, SignJWT } from 'jose';
import {
  verifyAccess,
  assertMutationOrigin,
  inspectUpload,
  limitedBody,
  HttpError,
} from '../apps/worker/src/security';

test('Access verification requires a valid RS256 signature, issuer, audience, identity, and non-expired token', async () => {
  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const jwk = await exportJWK(publicKey);
  jwk.kid = 'test-key';
  const key = createLocalJWKSet({ keys: [jwk] });
  const sign = (
    aud = 'portfolio',
    issuer = 'https://test.cloudflareaccess.com',
    expires: string | number = '2m',
  ) =>
    new SignJWT({ email: 'test@example.com' })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
      .setIssuer(issuer)
      .setAudience(aud)
      .setSubject('test-user')
      .setIssuedAt()
      .setExpirationTime(expires)
      .sign(privateKey);
  const req = (token?: string) =>
    new Request('https://admin.example.com/api/content', {
      headers: token ? { 'Cf-Access-Jwt-Assertion': token } : {},
    });
  const payload = await verifyAccess(
    req(await sign()),
    'test.cloudflareaccess.com',
    'portfolio',
    key,
  );
  assert.equal(payload.sub, 'test-user');
  for (const token of [
    undefined,
    'fake.jwt.token',
    await sign('other'),
    await sign('portfolio', 'https://attacker.example'),
    await sign(
      'portfolio',
      'https://test.cloudflareaccess.com',
      Math.floor(Date.now() / 1000) - 60,
    ),
  ]) {
    await assert.rejects(
      () => verifyAccess(req(token), 'test.cloudflareaccess.com', 'portfolio', key),
      (error) => error instanceof HttpError && error.status === 401,
    );
  }
  await assert.rejects(
    () => verifyAccess(req(), 'REPLACE_WITH_TEAM.cloudflareaccess.com', 'portfolio'),
    (error) => error instanceof HttpError && error.status === 503,
  );
});
test('mutations reject missing, foreign, and same-site-but-not-same-origin requests', () => {
  const origin = 'https://admin.example.com';
  assert.doesNotThrow(() =>
    assertMutationOrigin(
      new Request(origin, { headers: { Origin: origin, 'Sec-Fetch-Site': 'same-origin' } }),
      origin,
    ),
  );
  for (const headers of [
    {},
    { Origin: 'https://attacker.example' },
    { Origin: origin, 'Sec-Fetch-Site': 'same-site' },
  ])
    assert.throws(() => assertMutationOrigin(new Request(origin, { headers }), origin), HttpError);
});
test('uploads require type/signature agreement and reject active formats, oversized files, and empty payloads', () => {
  assert.equal(inspectUpload(new Uint8Array([255, 216, 255, 224]), 'image/jpeg'), 'jpg');
  assert.equal(inspectUpload(new TextEncoder().encode('%PDF-1.7\n'), 'application/pdf'), 'pdf');
  assert.equal(
    inspectUpload(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), 'image/png'),
    'png',
  );
  assert.equal(inspectUpload(new TextEncoder().encode('RIFFxxxxWEBP'), 'image/webp'), 'webp');
  assert.throws(
    () => inspectUpload(new TextEncoder().encode('<svg onload="alert(1)"/>'), 'image/svg+xml'),
    HttpError,
  );
  assert.throws(() => inspectUpload(new TextEncoder().encode('<html>'), 'image/jpeg'), HttpError);
  assert.throws(() => inspectUpload(new Uint8Array(0), 'image/png'), HttpError);
  assert.throws(() => inspectUpload(new Uint8Array(5_000_001), 'image/png'), HttpError);
});
test('streaming payload limits apply even without trustworthy Content-Length', async () => {
  const request = new Request('https://admin.example.com', {
    method: 'POST',
    body: 'oversized payload',
  });
  await assert.rejects(
    () => limitedBody(request, 4),
    (error) => error instanceof HttpError && error.status === 413,
  );
});
