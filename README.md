# Sam Joseph — portfolio & private studio

Public portfolio: https://samjoseph.me/ — deployed through GitHub Actions from `main` in `samjoseph04/samjoseph04.github.io` on 17 November 2026. The legacy `master` branch remains available for rollback. The separate private Worker is deployed at https://admin.samjoseph.me/ with owner-only Cloudflare Access, private D1/R2 and an encrypted GitHub publishing secret. DNS propagation is incomplete: Cloudflare's resolver sees the new hostname, while Google and this network still see the old nameservers. Owner login and live publishing are not verified yet.

Read [PROJECT_BRIEF.md](PROJECT_BRIEF.md) for requirements, audited content, decisions, and the implementation plan; [AGENTS.md](AGENTS.md) records repository rules. See [docs/SETUP.md](docs/SETUP.md) for future cloud configuration and [docs/VERIFICATION.md](docs/VERIFICATION.md) for verification and limitations.

## Private admin updates

After DNS propagation completes, open https://admin.samjoseph.me/ and sign in through Cloudflare using the confirmed owner account. Edit the existing content sections, upload assets or a PDF in Resume, preview, and save the draft. **Review & publish** requires an explicit confirmation before committing to GitHub. Check the matching Actions deployment status before treating a change as live. The public PDF URL stays `/resume.pdf`. Saving a draft alone does not publish it.

The owner generated and saved the repository-scoped publishing token directly in Cloudflare; no credential value belongs in this repository or chat. The reviewed expiration is 15 February 2027. Rotate the Worker secret before expiry using the same repository and minimal permissions. First live upload/publish verification is still pending DNS and owner sign-in.

## Shared SJ branding

The approved `apps/web/public/assets/sj-logo.svg` is the only authored logo geometry. `BrandMark` uses its generated path data for the header, footer and loading indicator. The custom cursor contains no logo. Contextual cursor labels remain intact. Theme tokens tint the same SJ shapes and grey dot without changing their proportions.

`scripts/generate-brand.mjs` derives the component data and dark/light SVG plus 16/32/48px ICO browser icons from that source and `apps/web/app/theme.css`. It runs automatically before public development/build commands; run `node scripts/generate-brand.mjs` after editing the source or palette during an existing session. Do not hand-edit generated `brand/monogram.json` or browser icons. Bootstrap selects the saved-theme icons before paint; the theme control synchronizes subsequent changes. Legacy icon URLs remain valid.

## Run locally

Node 22.12+ is required; Node 24 is the configured CI version. Dependencies are pinned in package-lock.json. On Windows, use `npm.cmd` if PowerShell blocks the `npm.ps1` shim.

Install dependencies once before starting the servers. If reinstalling, first stop this project's web/admin/Worker development processes with Ctrl+C. `npm ci` replaces node_modules; running it while a dev server is using native CSS modules can cause Windows EPERM file-lock errors and temporarily break Next.js package resolution.

```powershell
npm.cmd ci
npm.cmd run dev
```

Public portfolio: http://127.0.0.1:3000/. In another terminal:

```powershell
npm.cmd run dev:admin
```

Private studio local development: http://127.0.0.1:5173/. Its banner explicitly says local mode, and publishing is disabled. No authentication is implied for this loopback development server. Do not expose it to a public network.

Development game links include `index.html` so Next/Vite can serve the original public files directly. The production export preserves the original `/game-name/` destinations unchanged; use the static server command below to test those exact URLs.

## Local editing

While `npm.cmd run dev` is running, edit and save `content/portfolio.json`; the website reloads automatically. **Do not run npm install or npm ci for content edits.** Those commands are only needed for dependency installation/changes. Keep valid JSON syntax and the existing schema fields. The public resume uses `/resume.pdf`, backed by `apps/web/public/resume.pdf`.

The public app reads `content/portfolio.json` at build time. The local studio saves draft content in this browser's localStorage and uploads in IndexedDB. Saving a studio draft does **not** modify this JSON or the public website. Use **Export content JSON** to download the edited draft, then replace `content/portfolio.json` after reviewing it. Uploaded local images also need copying into `apps/web/public/assets/` under their generated filenames before a local build; the resume goes to `apps/web/public/resume.pdf`. Use **Download staged file** in the relevant editor. Local draft uploads are not included in the JSON download. The studio deliberately does not pretend to write to your folder or GitHub.

For later cloud use, authenticated Worker endpoints persist private drafts/uploads in D1/R2 and publish confirmed changes through the GitHub API. Production builds have no local authentication bypass or frontend GitHub token.

## Resume management

Use the existing Resume editor to upload a PDF (maximum 5,000,000 bytes), check its filename/date/size, preview it, and save the draft. In the configured private studio, **Review & publish** still requires explicit confirmation. Uploads use immutable private staging keys; publishing replaces `apps/web/public/resume.pdf` and updates the content metadata in one non-forced Git commit. Older legacy resume paths are migrated and removed from the current tree; Git history is retained. The public button always uses `/resume.pdf` with a native download link, including on mobile browsers.

The editor distinguishes the selected draft, current repository PDF and last verified successfully deployed PDF. Refresh status checks the matching Actions run and deploy job; pending, failed or skipped deployment is never labeled live. It searches up to five recent successful workflow runs, so older deployment history may be reported as unverified. Upload dates are recorded when uploading/importing; older files without that metadata explicitly show an unknown date.

Local mode remains browser-only and cannot push or publish. After uploading, **Download staged file** saves it as `resume.pdf`; copy it to `apps/web/public/resume.pdf`. **Export content JSON** removes the private staging reference while preserving the stable URL and metadata; replace the reviewed `content/portfolio.json` and build. Other images still use `apps/web/public/assets/`. A production preflight verifies the PDF structure, size and recorded SHA-256, rejecting missing/mismatched files or private staging references before export. PDF checks cover signature, end marker and cross-reference consistency; they are not antivirus scanning or a complete PDF parser.

## Cinematic motion

The navigation has an accessible 44px theme toggle. First-time visitors start dark regardless of OS preference. `sj-portfolio-theme` stores the explicit dark/light choice; the fixed `theme-boot` head script validates and applies it before body paint. Storage failures leave the toggle usable in memory. Storage events synchronize other tabs, and a bfcache pageshow reconciles changes while a page was frozen. No public server or cookie is required.

Both palettes are centralized in `apps/web/app/theme.css`: dark background/surface/muted/text are #070100 / #1E1817 / #70726D / #D1CDC8; light values are #EAE6E0 / #D8D1C9 / #706B65 / #171311. Semantic colors, gradients, cursor, lighting, controls, concepts, logo and native color-scheme derive from them. A single registered `--theme-progress` number interpolates the palette for 320ms only after initialization; it does not override hover transforms or run a JS animation loop. Reduced motion disables interpolation and icon rotation; browsers without registered-property transitions switch instantly. No inversion filter is used. The portrait file, geometry and dark glaze are constant across themes; only the surrounding edge fade adapts.

Without JavaScript the site is readable in dark mode and the toggle is honestly disabled. The separate admin editor is not recolored; its isolated portfolio preview can use the same control. The standalone favicon remains neutral dark for legibility in browser chrome. Legacy games keep their independent styles and bytes.

`CinematicText` preserves an unsplit accessible string while animating visual words or grapheme-safe characters. `CinematicMotion` shares one persistent intersection observer and the timing tokens in `apps/web/lib/cinematic.ts`. Opt into `data-reveal="enter"`, `image` or `accent` on appropriate elements; moving groups guard against image descendants. Observe stationary frames and animate their contents, so the reveal never changes its own trigger geometry. Images reveal only through clipping/opacity, never transforms. Do not animate whole sections or the background-boundary pseudo-elements. New game search results register through one scoped mutation observer. Entrances replay after full viewport exits in either direction, with bounded stagger delays and cleanup of completed styles.

`RevealCycle` tracks pending/revealing/revealed states and invalidates cancelled completions. Targets stay observed after finishing, including those above an initially restored bottom/middle position. Upward entrances mirror the vertical offset/image wipe. Native navigation/restoration, window/image load, font readiness, disclosure/content changes and resize request one coalesced fresh observation; there is no reveal scroll listener. Focused controls stay visible. Lifecycle guards and teardown prevent duplicate observers and stale callbacks after Strict Mode, reduced-motion changes or back/forward cache restoration.

The existing native smooth scroll remains the only scroll controller. The Projects heading uses a CSS sticky hold only on roomy desktop screens; it adds no pin spacers or scroll length and is disabled for reduced motion. Native details animate progressively through `::details-content`; unsupported browsers retain immediate native disclosures. A cross-document dissolve is progressive enhancement for documents that both opt in. The site currently has one portfolio page and in-place project details; no new project routes were invented. Legacy games remain independent documents with unchanged code.

The fixed first-paint boot script skips reduced motion and fails open after 1.8 seconds if hydration is slow or unavailable. Without JavaScript, content is visible immediately. With reduced motion, content is visible without entrances or sticky holds. Keyboard focus releases pending entrance effects. The shared driver is absent in admin previews. See `docs/VERIFICATION.md` for measured checks and remaining device/browser limits.

## Commands

```powershell
npm.cmd run check
npm.cmd test
npm.cmd run build
npm.cmd run verify:export
npm.cmd run bundle -w @portfolio/worker
```

`build` produces the static public site in `apps/web/out/` and the separate admin bundle in `apps/admin/dist/`. The Worker `bundle` command is a **dry run** that packages locally; it does not deploy. The public site has no API/runtime server requirement. To inspect its actual export:

```powershell
python -m http.server 8765 --bind 127.0.0.1 --directory apps/web/out
```

## Layout

```text
apps/web/          Next.js App Router public portfolio, static export
apps/web/public/  Original games, supplied portrait, optimized images, domain files
apps/admin/        Separate React/TypeScript content studio (Vite)
apps/worker/       Access-authenticated API, D1 migration, Cloudflare template
packages/content/ Shared schema, types, categories and content validation
content/           Git-backed public JSON
scripts/           Migration audit, portrait encoding and export verification
tests/             Content, security, Git publishing and deployment-status checks
docs/audit/        Legacy source evidence, game hashes and portrait provenance
```

## Content and assets

Pointer interactions are shared in `apps/web/components/InteractionLayer.tsx` and `apps/web/app/interactions.css`. Motion drives the contextual cursor, its subtle trail and click feedback; one delegated pointer handler schedules work only when needed. To add magnetic feedback, mark a native control with `data-magnetic="3"` and wrap its text/icons in `MagneticContent` (or mark an existing inner element with `data-magnetic-content`). Its hit area stays fixed, and image-containing content is refused. Major-heading sheen does not move glyphs. `SectionLight` is used only in Games and Contact, clipped inside their content area so the horizontal section gradients remain unchanged.

Enhancements activate only for fine hovering mouse pointers without a reduced-motion preference. Touch/pen input is ignored; keyboard use, blur, scrolling and resize clear active effects. Native cursors, touch interactions, focus outlines, links and disclosures are retained. Mobile viewport emulation is not the same as testing physical touch hardware. The local admin preview does not mount the pointer manager.

Section backgrounds share `apps/web/app/surfaces.css`. Apply `section-surface` plus `surface-dark` or `surface-light` to direct sibling sections. One static 180-degree vertical gradient spans the empty padding on both sides of every opposite-tone boundary; matching tones stay solid. Its full-width color rows remain perfectly horizontal at every breakpoint. Solid ends frame a restrained central blend of the actual ink/paper tokens. There are no diagonal layers, masks, blur or fog overlays. The gradient sits behind content and ignores pointer input. Keep its outgoing/incoming lengths within the existing empty padding; no spacer, blur or scroll effect is needed. Decorative section eyebrows and the hero scroll-label/footer are removed while actual headings remain.

The header utility strip displays current India time (`Asia/Kolkata`, IST), updated each second. **SOUND OFF/ON** starts an original quiet Web Audio soundscape only after a click. Preference storage is best-effort: even a saved ON preference never starts playback on a new visit. Audio pauses when the tab is hidden, a game is launched, the page exits or the browser suspends the context; click to resume. Disabling releases the audio resources. No audio download or external service is required.

The Games collection uses one minimal horizontal row on desktop and mobile, with generous vertical spacing. Cards keep their narrow widths and show the actual title, full existing description, category and PLAY action, with restrained category accents. Each content group is vertically centered inside an equal-height row with a responsive 320–360px minimum card height. Future longer content can expand the cards instead of being clipped. Section padding scales from 80 to 120px, with larger gaps between the heading, controls and carousel. Swipe, use the native scrollbar/trackpad, or press the labeled navigation arrows. Focus the collection and press Left/Right or Home/End; Tab still reaches every game. Filters reset the row, edge states update after scroll/resize, and reduced motion disables smooth navigation. Mobile category filters are also horizontally scrollable. The public featured panel, decorative icon artwork, tag badges, numbering and extra progress strip are removed.

Search matches names, descriptions, categories and stored tags. Category counts reflect the current search; result counts reflect both search and category selection. All 17 original descriptions, categories and destinations are preserved. The `featured` boolean remains stored and editable for backward compatibility but has no public display effect; the studio states this. Shared accents live in `apps/web/app/accents.css`, with Games styling in `apps/web/app/games.css`.

Education entries include a `coursework` object with `subjects`, `programmingLanguages`, `technologies`, and `concepts` arrays plus an optional `note`. Both degrees expand within the existing timeline. These lists are deliberately empty until you add verified coursework; the examples discussed in chat are not treated as confirmed subjects.

Edit these fields in **Studio → Education → select a degree → Coursework details**, or directly in `content/portfolio.json`. Enter one item per line in each studio field. Native disclosure controls support keyboard/touch and work without JavaScript; Motion adds a reduced-motion-aware entrance and the chevron indicates expansion. Older drafts without coursework fields receive empty lists when validated. The Experience timeline is unchanged.

For future GitHub-based updates, commit changes to `content/portfolio.json`; the configured GitHub Actions workflow rebuilds and deploys the public site. GitHub Actions performs the build/deployment rather than editing coursework for you. Nothing is pushed from the local studio before its publishing connection is configured.

All 17 legacy games are preserved at their original root paths. There are 49 original game files, verified against an immutable GitHub revision and live bytes. Game listings use the existing names/categories; several descriptions were corrected against each game's actual instructions. Removing a listing later does not remove the original game files or break direct links.

The user-supplied portrait is retained unchanged as `apps/web/public/assets/sam-joseph-portrait.jpeg`. WebP derivatives have normal resizing/encoding only, without cropping, retouching, generated content, warping, or motion. The hero uses responsive delivery (approximately 128 / 281 / 497 KB). The original is 2,675,351 bytes. Run `node scripts/optimize-portrait.mjs` to regenerate these initial portrait derivatives. The hero supports opening the full, uncropped portrait.

Project visuals are explicitly labeled interface/system concepts, not screenshots or claims of actual project UI. Replace them through the studio when real screenshots are available. The resume, email, experience, education institutions/dates, and Carpooling links remain truthful placeholders where details are missing. No fake contact form or fabricated PDF is included.

## Architecture references

- [Next.js static export](https://nextjs.org/docs/app/guides/static-exports)
- [Motion accessibility](https://motion.dev/docs/react-accessibility)
- [Cloudflare Access JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)
- [Cloudflare Worker Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [GitHub Git database API](https://docs.github.com/en/rest/git)
- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
