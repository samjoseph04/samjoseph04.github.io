import { portfolioSchema, assetPath, resumeUrl } from '@portfolio/content';
import { z } from 'zod';
import { GitHub, PublishUncertain, type GitHubConfig } from './github';
import {
  HttpError,
  assertMutationOrigin,
  jsonBody,
  verifyAccess,
} from './security';
import { stageUpload } from './uploads';

export interface Env extends GitHubConfig {
  DB: D1Database;
  UPLOADS: R2Bucket;
  ASSETS: Fetcher;
  ADMIN_ORIGIN: string;
  ACCESS_TEAM_DOMAIN: string;
  ACCESS_AUD: string;
}
interface Draft {
  content: string;
  revision: number;
  base_sha: string;
  updated_at: string;
  publish_lock: string | null;
  lock_time: number | null;
}
const headers = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
};
const json = (body: unknown, status = 200) => Response.json(body, { status, headers });
const revisionBody = z.object({
  revision: z.number().int().nonnegative(),
  content: portfolioSchema,
});
async function draft(env: Env): Promise<Draft> {
  let result = await env.DB.prepare("SELECT * FROM drafts WHERE id = 'portfolio'").first<Draft>();
  if (!result) {
    const github = new GitHub(env);
    const head = await github.head();
    const file = await github.file('content/portfolio.json', head.object.sha);
    if (file.encoding !== 'base64' || !file.content)
      throw new HttpError(502, 'Invalid content response from GitHub.');
    const decoded = new TextDecoder().decode(
      Uint8Array.from(atob(file.content.replace(/\s/g, '')), (c) => c.charCodeAt(0)),
    );
    const content = portfolioSchema.parse(JSON.parse(decoded));
    await env.DB.prepare(
      "INSERT OR IGNORE INTO drafts (id, content, revision, base_sha, updated_at) VALUES ('portfolio', ?, 0, ?, ?)",
    )
      .bind(JSON.stringify(content), head.object.sha, new Date().toISOString())
      .run();
    result = await env.DB.prepare("SELECT * FROM drafts WHERE id = 'portfolio'").first<Draft>();
  }
  if (!result) throw new HttpError(503, 'Unable to initialize the private draft.');
  return result;
}
function present(row: Draft) {
  return {
    content: JSON.parse(row.content),
    revision: row.revision,
    baseSha: row.base_sha,
    updatedAt: row.updated_at,
    publishing: Boolean(row.publish_lock),
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      await verifyAccess(request, env.ACCESS_TEAM_DOMAIN, env.ACCESS_AUD);
      const url = new URL(request.url);
      if (url.origin !== new URL(env.ADMIN_ORIGIN).origin)
        throw new HttpError(403, 'Use the configured private admin origin.');
      if (!['GET', 'HEAD'].includes(request.method))
        assertMutationOrigin(request, env.ADMIN_ORIGIN);
      const github = new GitHub(env);
      if (url.pathname === '/api/content' && request.method === 'GET')
        return json(present(await draft(env)));
      if (url.pathname === '/api/resume' && request.method === 'GET')
        return json(await github.resumeStatus());
      if (url.pathname === '/api/publish-state' && request.method === 'GET') {
        const row = await draft(env);
        const recent = await env.DB.prepare(
          'SELECT id, revision, commit_sha, status, created_at FROM publishes ORDER BY created_at DESC LIMIT 10',
        ).all();
        return json({
          requestId: row.publish_lock,
          lockTime: row.lock_time,
          revision: row.revision,
          baseSha: row.base_sha,
          recent: recent.results,
        });
      }
      if (url.pathname === '/api/recover' && request.method === 'POST') {
        const body = z
          .object({
            confirmation: z.literal('RECOVER PUBLISH'),
            revision: z.number().int().nonnegative(),
          })
          .parse(await jsonBody(request));
        const row = await draft(env);
        if (row.revision !== body.revision)
          throw new HttpError(409, 'Draft changed. Reload before recovery.');
        if (!row.publish_lock) return json({ message: 'No publish lock requires recovery.' });
        if (!row.lock_time || Date.now() - row.lock_time < 600_000)
          throw new HttpError(
            409,
            'Allow ten minutes for the original request to finish before recovery.',
          );
        const head = await github.head();
        const commits = await github.call(
          `/commits?sha=${encodeURIComponent(env.GITHUB_BRANCH)}&per_page=100`,
        );
        const found = commits.find((item: { sha: string; commit: { message: string } }) =>
          item.commit.message.includes(`[${row.publish_lock}]`),
        );
        if (!found && head.object.sha !== row.base_sha)
          throw new HttpError(
            409,
            'Repository history changed and the publish cannot be safely reconciled automatically. Inspect the request ID in GitHub history before manual recovery.',
          );
        const recoveredContent = found ? await github.contentAt(found.sha) : JSON.parse(row.content);
        await env.DB.batch([
          env.DB.prepare('UPDATE publishes SET commit_sha = ?, status = ? WHERE id = ?').bind(
            found?.sha || null,
            found ? 'committed' : 'failed',
            row.publish_lock,
          ),
          env.DB.prepare(
            "UPDATE drafts SET content = ?, base_sha = ?, revision = revision + 1, publish_lock = NULL, lock_time = NULL WHERE id = 'portfolio' AND publish_lock = ? AND revision = ?",
          ).bind(JSON.stringify(recoveredContent), found?.sha || row.base_sha, row.publish_lock, row.revision),
        ]);
        return json({
          message: found
            ? 'Confirmed the commit in branch history and recovered the draft.'
            : 'Confirmed that the branch did not change and released the failed publish.',
          commitSha: found?.sha || null,
        });
      }
      if (url.pathname === '/api/content' && request.method === 'PUT') {
        const body = revisionBody.parse(await jsonBody(request));
        await draft(env);
        const result = await env.DB.prepare(
          "UPDATE drafts SET content = ?, revision = revision + 1, updated_at = ? WHERE id = 'portfolio' AND revision = ? AND publish_lock IS NULL",
        )
          .bind(JSON.stringify(body.content), new Date().toISOString(), body.revision)
          .run();
        if (!result.meta.changes)
          throw new HttpError(409, 'Draft changed or is publishing. Reload before saving.');
        return json(present(await draft(env)));
      }
      if (url.pathname === '/api/rebase' && request.method === 'POST') {
        const body = z
          .object({
            revision: z.number().int().nonnegative(),
            confirmation: z.literal('REBASE SAVED DRAFT'),
          })
          .parse(await jsonBody(request));
        const head = await github.head();
        const result = await env.DB.prepare(
          "UPDATE drafts SET base_sha = ?, revision = revision + 1, updated_at = ? WHERE id = 'portfolio' AND revision = ? AND publish_lock IS NULL",
        )
          .bind(head.object.sha, new Date().toISOString(), body.revision)
          .run();
        if (!result.meta.changes)
          throw new HttpError(409, 'Draft changed. Reload before rebasing.');
        return json(present(await draft(env)));
      }
      if (url.pathname === '/api/uploads' && request.method === 'POST') {
        return json(await stageUpload(request, env.UPLOADS), 201);
      }
      if (url.pathname === '/api/asset' && request.method === 'GET') {
        const path = z.union([assetPath, z.literal(resumeUrl)]).parse(url.searchParams.get('path'));
        const ref = url.searchParams.get('ref');
        if (ref) z.string().regex(/^[a-f0-9]{40}$/).parse(ref);
        const staged = !ref && path.startsWith('/assets/') ? await env.UPLOADS.get(`staged/${path.slice('/assets/'.length)}`) : null;
        const mime = /\.pdf$/i.test(path)
          ? 'application/pdf'
          : path.endsWith('.png')
            ? 'image/png'
            : path.endsWith('.webp')
              ? 'image/webp'
              : 'image/jpeg';
        const fileHeaders = {
          ...headers,
          'Content-Type': mime,
          ...(mime === 'application/pdf'
            ? { 'Content-Disposition': `${url.searchParams.get('download') === '1' ? 'attachment' : 'inline'}; filename="Sam-Joseph-Resume.pdf"` }
            : {}),
        };
        if (staged) return new Response(staged.body, { headers: fileHeaders });
        const sha = ref || (await draft(env)).base_sha;
        return new Response(
          await github.bytes(`apps/web/public${path}`, sha),
          { headers: fileHeaders },
        );
      }
      if (url.pathname === '/api/publish' && request.method === 'POST') {
        const body = z
          .object({
            revision: z.number().int().nonnegative(),
            confirmation: z.literal('PUBLISH TO GITHUB'),
            requestId: z.uuid(),
          })
          .parse(await jsonBody(request));
        const previous = await env.DB.prepare('SELECT * FROM publishes WHERE id = ?')
          .bind(body.requestId)
          .first<{ commit_sha: string | null; status: string; revision: number }>();
        if (previous) {
          if (previous.revision !== body.revision)
            throw new HttpError(409, 'Publish request ID was already used for another revision.');
          return json(
            { commitSha: previous.commit_sha, status: previous.status },
            previous.commit_sha ? 200 : 409,
          );
        }
        const row = await draft(env);
        if (row.revision !== body.revision)
          throw new HttpError(409, 'Draft changed after confirmation. Review it again.');
        const content = portfolioSchema.parse(JSON.parse(row.content));
        const lock = await env.DB.prepare(
          "UPDATE drafts SET publish_lock = ?, lock_time = ? WHERE id = 'portfolio' AND revision = ? AND publish_lock IS NULL",
        )
          .bind(body.requestId, Date.now(), body.revision)
          .run();
        if (!lock.meta.changes)
          throw new HttpError(409, 'A publish is in progress. Check status before retrying.');
        let commitSha: string | undefined;
        try {
          await env.DB.prepare(
            'INSERT INTO publishes (id, revision, status, created_at) VALUES (?, ?, ?, ?)',
          )
            .bind(body.requestId, body.revision, 'publishing', new Date().toISOString())
            .run();
          const committed = await github.publish(
            content,
            row.base_sha,
            env.UPLOADS,
            `content: publish portfolio revision ${row.revision} [${body.requestId}]`,
          );
          commitSha = committed.sha;
          await env.DB.prepare('UPDATE publishes SET commit_sha = ?, status = ? WHERE id = ?')
            .bind(commitSha, 'committed', body.requestId)
            .run();
          await env.DB.prepare(
            "UPDATE drafts SET content = ?, base_sha = ?, revision = revision + 1, publish_lock = NULL, lock_time = NULL WHERE id = 'portfolio' AND publish_lock = ?",
          )
            .bind(JSON.stringify(committed.content), commitSha, body.requestId)
            .run();
          return json(
            {
              commitSha,
              status: 'committed',
              message: 'Git commit created. Deployment has not been verified.',
            },
            201,
          );
        } catch (error) {
          if (error instanceof PublishUncertain) {
            await env.DB.prepare('UPDATE publishes SET commit_sha = ?, status = ? WHERE id = ?')
              .bind(error.commitSha, 'uncertain', body.requestId)
              .run();
            return json(
              { commitSha: error.commitSha, status: 'uncertain', warning: error.message },
              202,
            );
          }
          if (commitSha)
            return json(
              {
                commitSha,
                status: 'committed',
                warning:
                  'Commit exists, but draft bookkeeping failed. Reconcile before another publish.',
              },
              202,
            );
          await env.DB.prepare('UPDATE publishes SET status = ? WHERE id = ?')
            .bind('failed', body.requestId)
            .run();
          await env.DB.prepare(
            "UPDATE drafts SET publish_lock = NULL, lock_time = NULL WHERE id = 'portfolio' AND publish_lock = ?",
          )
            .bind(body.requestId)
            .run();
          throw error;
        }
      }
      if (url.pathname === '/api/deployment' && request.method === 'GET') {
        const sha = z
          .string()
          .regex(/^[a-f0-9]{40}$/)
          .parse(url.searchParams.get('sha'));
        return json(await github.deployment(sha));
      }
      if (url.pathname.startsWith('/api/')) throw new HttpError(404, 'API route not found.');
      if (!['GET', 'HEAD'].includes(request.method))
        throw new HttpError(405, 'Method not allowed.');
      const response = await env.ASSETS.fetch(request);
      const secured = new Response(response.body, response);
      for (const [key, value] of Object.entries(headers)) secured.headers.set(key, value);
      secured.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
      secured.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'; form-action 'self'",
      );
      return secured;
    } catch (error) {
      if (error instanceof z.ZodError)
        return json(
          {
            error: 'Validation failed.',
            issues: error.issues.map(({ path, message }) => ({ path: path.join('.'), message })),
          },
          400,
        );
      if (error instanceof HttpError) return json({ error: error.message }, error.status);
      return json(
        {
          error:
            'The request could not be completed. Check the private Worker logs and resource configuration.',
        },
        500,
      );
    }
  },
};
