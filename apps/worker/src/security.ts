import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const resolvers = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
export async function verifyAccess(
  request: Request,
  team: string,
  audience: string,
  key?: JWTVerifyGetKey,
) {
  if (
    !/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(team) ||
    !audience ||
    audience.startsWith('REPLACE_')
  )
    throw new HttpError(503, 'Cloudflare Access is not configured.');
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) throw new HttpError(401, 'Cloudflare Access authentication required.');
  if (!key) {
    if (!resolvers.has(team))
      resolvers.set(team, createRemoteJWKSet(new URL(`https://${team}/cdn-cgi/access/certs`)));
    key = resolvers.get(team)!;
  }
  try {
    const result = await jwtVerify(token, key, {
      issuer: `https://${team}`,
      audience,
      algorithms: ['RS256'],
      requiredClaims: ['exp', 'iat', 'sub'],
    });
    if (!result.payload.sub) throw new Error('Missing identity');
    return result.payload;
  } catch {
    throw new HttpError(401, 'Invalid or expired Cloudflare Access session.');
  }
}

export function assertMutationOrigin(request: Request, origin: string) {
  if (!origin || origin.includes('REPLACE_'))
    throw new HttpError(503, 'Admin origin is not configured.');
  if (request.headers.get('Origin') !== new URL(origin).origin)
    throw new HttpError(403, 'Cross-origin mutations are forbidden.');
  const site = request.headers.get('Sec-Fetch-Site');
  if (site && site !== 'same-origin') throw new HttpError(403, 'Same-origin request required.');
}

export async function limitedBody(request: Request, limit: number): Promise<Uint8Array> {
  const length = request.headers.get('Content-Length');
  if (length && Number(length) > limit) throw new HttpError(413, 'Payload is too large.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'Request body is required.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new HttpError(413, 'Payload is too large.');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export async function jsonBody(request: Request) {
  if (request.headers.get('Content-Type')?.split(';')[0] !== 'application/json')
    throw new HttpError(415, 'Use application/json.');
  try {
    return JSON.parse(new TextDecoder().decode(await limitedBody(request, 500_000)));
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, 'Invalid JSON.');
  }
}

export function inspectUpload(bytes: Uint8Array, mime: string): string {
  if (!bytes.length || bytes.length > 5_000_000)
    throw new HttpError(413, 'Files must be between 1 byte and 5 MB.');
  const prefix = new TextDecoder().decode(bytes.slice(0, 12));
  if (mime === 'image/jpeg' && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return 'jpg';
  if (mime === 'image/png' && [137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => bytes[i] === n))
    return 'png';
  if (mime === 'image/webp' && prefix.slice(0, 4) === 'RIFF' && prefix.slice(8, 12) === 'WEBP')
    return 'webp';
  if (mime === 'application/pdf' && prefix.startsWith('%PDF-')) return 'pdf';
  throw new HttpError(
    415,
    'Upload a JPEG, PNG, WebP image, or PDF with a matching file signature.',
  );
}

export function toBase64(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192)
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
}
