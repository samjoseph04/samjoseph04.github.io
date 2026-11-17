# Hosting configuration and remaining admin setup

Hosting was authorized on 17 November 2026. The public site is deployed at https://samjoseph.me/ from main using the existing Pages workflow, with PORTFOLIO_DEPLOY_BRANCH=main and HTTPS enforcement enabled. The legacy master branch remains unchanged for rollback. The private admin is not deployed; Cloudflare/registrar setup below remains pending.

## Public repository and Pages

1. Use `samjoseph04/samjoseph04.github.io`. At the initial audit, master held the legacy site and main only had README.md. Main now contains this implementation; master still holds the legacy rollback. Confirm the real Pages source/branch in repository settings. Do not replace a branch or history blindly. Integrate these source files and preserve original game paths before changing hosting.
2. The initial hosting push and merge have been authorized and completed. The Worker needs this new project, `content/portfolio.json`, original public games/assets, and `.github/workflows/pages.yml` on the chosen deployment branch before its first content load.
3. Configure Pages source as **GitHub Actions**. Set repository Actions variable `PORTFOLIO_DEPLOY_BRANCH` to that exact branch. Without it, the workflow verifies/builds but deliberately skips deployment.
4. Configure the `github-pages` environment to permit deployment from the selected branch. Keep any desired environment approval policy; a publish may wait for it.
5. Keep the custom domain `samjoseph.me`, CNAME, .nojekyll, domain ownership verification, DNS and HTTPS configuration intact. Validate existing DNS through the owner's settings before any changes.
6. A Worker-created commit changes `content/portfolio.json` and any referenced uploads under `apps/web/public/assets/`; this triggers the push workflow. It builds/checks both applications, verifies the static export/game hashes, and deploys only `apps/web/out/`.
7. Use a GitHub App installation token or fine-grained personal access token restricted to this repository with Contents read/write and Actions read. The implemented adapter accepts a token through a Worker secret named `GITHUB_TOKEN`; it does not implement GitHub App token minting. An App-based setup must supply/rotate short-lived installation tokens separately. A fine-grained PAT works directly, with owner-managed expiration/rotation. Do not use an Actions-issued `GITHUB_TOKEN` for this integration: its push events normally do not start another workflow.
8. Branch rules must permit the publishing identity's intended direct commits. If they require PRs only, this direct-publish design will reject the write; choose a compatible policy or explicitly redesign publishing. Never weaken branch rules automatically.

## Private admin and API

The separate React admin and `/api/*` are served from the **same private origin** by one Cloudflare Worker Static Assets deployment. The public GitHub Pages app never hosts or calls the private API.

Resume publishing uses the existing commit-triggered workflow: a replacement updates `apps/web/public/resume.pdf` and `content/portfolio.json` together, both covered by `pages.yml` push filters. The Worker secret named `GITHUB_TOKEN` must hold the configured PAT or supplied GitHub App installation token, not a workflow-issued Actions token. The deployment branch variable/environment requirements above still apply. No extra server or public Next.js API route is needed. `/api/resume` privately reports the repository version and last verified deployment, while `/api/asset` supports authenticated inline preview or attachment download at an exact commit. No D1 migration or new binding is required for resume metadata; it lives inside the existing validated content document.

1. The owner chose admin.samjoseph.me. Prepare its Cloudflare zone and preserve every existing Namecheap DNS record before changing nameservers. Wrangler is signed in, but browser-side Access/R2/zone setup is still pending.
2. Provision D1 `portfolio-drafts` and a private R2 bucket `portfolio-private-uploads`. Disable public bucket access and public object URLs.
3. Replace every `REPLACE_...` field in `apps/worker/wrangler.jsonc`: D1 ID, admin origin, Access team domain, Access application audience, and confirmed deployment branch. Repository owner/name are prefilled from the user's confirmation. Resource names may be changed consistently.
4. Create a Cloudflare Access self-hosted application for the entire admin hostname, including `/api/*` and all static assets. Use an explicit owner identity/email allowlist. The owner explicitly confirmed sam.joseph04@gmail.com as the allowlisted sign-in identity. No Bypass or Allow Everyone policy.
5. Configure Access and the custom route **before enabling traffic**. Leave `workers_dev: false` and `preview_urls: false`; do not expose alternate origins outside Access. `run_worker_first: true` verifies Access JWTs on every request, including static assets, as defense in depth.
6. Set `GITHUB_TOKEN` exclusively through Cloudflare Worker secrets. Use the Cloudflare dashboard or, in a future authorized setup, `wrangler secret put GITHUB_TOKEN`. Never put its value in browser code, `VITE_*`, `NEXT_PUBLIC_*`, .env examples, source control, logs, screenshots, or chat.
7. Apply `apps/worker/migrations/0001_drafts.sql` to the real D1 database. A local migration can be tested separately with `wrangler d1 migrations apply portfolio-drafts --local`; production setup requires the owner's real database configuration and explicit authorization.
8. Build the admin (`npm run build -w @portfolio/admin`). Confirm `assets.directory` points at that bundle. After those prerequisites are verified, deploy the Worker with its protected custom route; hosting authorization is already present.
9. Verify unsigned/expired/wrong-audience Access requests fail for `/`, bundle JS, content, uploads, asset previews, publish, recovery and deployment endpoints. Verify allowed owner login and logout in a real browser; keep a recovery route through the Cloudflare dashboard.

## API and publishing semantics

| Endpoint | Purpose |
| --- | --- |
| GET /api/content | Load/initialize the private saved draft from the repository |
| PUT /api/content | Save validated content using an exact expected draft revision |
| POST /api/uploads | Stage a JPEG/PNG/WebP/PDF, 5 MB maximum, signature/type checked |
| GET /api/asset?path=... | Authenticated preview of a safe staged/published asset |
| POST /api/publish | Confirm exact saved revision with `PUBLISH TO GITHUB` and unique request ID |
| GET /api/deployment?sha=... | Report the matching Pages workflow and deploy-job outcome |
| POST /api/rebase | Explicitly move the saved draft's base to the current repository head |
| GET /api/publish-state | Read lock state and recent publish records |
| POST /api/recover | Reconcile an interrupted/uncertain publish from branch history |

All API calls require a verified Cloudflare Access session. Every mutation requires the configured same Origin (and same-origin Fetch Metadata when present). No public CORS bypass or development auth flag exists in the Worker. The local Vite studio is a visibly separate browser-only mode selected by Vite's build-time DEV flag.

Draft content is one revision-controlled D1 record. Projects, games, skills, personal information, education, achievements, experience and resume CRUD operations edit that validated document. R2 stores draft uploads privately. A publish checks the expected repository head, confirms internal game destinations exist, validates referenced assets, creates Git blobs and one tree based on the original tree, creates one commit, and updates the branch **without force**. Existing files outside the allowlisted content/assets paths are preserved. Workflows and game code cannot be uploaded through the CMS API.

The studio distinguishes saved draft, committed change, pending workflow, skipped deploy, failure and actual successful deploy job. An overall workflow success with deployment skipped is not reported as deployed. No deployment result has been tested against the owner's account yet.

## Conflicts, failures and recovery

- A stale draft revision is rejected; reload rather than overwriting another editor's save.
- A changed repository head is rejected. Export/back up the draft, inspect remote changes, then use **Review repository rebase** if the saved document should intentionally replace the latest content. This keeps the saved draft and does not automatically merge content differences.
- Publishing locks that draft and records a unique request ID. Duplicate requests cannot silently create duplicate commits. A failed ref update is checked against the actual branch head. If its outcome is unknown, keep the lock and commit reference; do not retry blindly.
- After ten minutes, **Recover interrupted publish** searches the last 100 commits for the request marker, or verifies the original branch head is unchanged. It releases the lock only when the outcome is established. If history is ambiguous, inspect `GET /api/publish-state`, GitHub history, and D1 records manually. Never clear a lock merely because time elapsed.
- If GitHub accepted a commit but D1 bookkeeping failed, preserve the returned SHA and recover before another publish. If D1 itself is unavailable, use GitHub history with the unique request ID and private Worker logs. Logs must not contain credentials or raw drafts.
- A failed build/deployment leaves the last successful Pages deployment available. Fix content in a new commit or revert the relevant content commit; never force-push the deployment branch as a routine rollback.
- Versioned uploads deliberately remain in Git history. Deleting a content reference does not erase old public versions. Unreferenced staged R2 files are retained; the owner should periodically clean confirmed-unused staging objects after checking active drafts and recovery records. No destructive automatic bucket cleanup is configured.

## What remains manual

Real email, resume PDF, education institutions/completion dates, experience/employers/dates, Carpooling source/demo and real project screenshots. The owner may leave these empty to retain clearly labeled public placeholders. The supplied portrait and audited source content already work locally. Live Access sign-in, D1/R2 persistence, token permissions, branch rules, workflow triggering, custom domain HTTPS and live rollback all need owner-account verification after a later authorized setup.
