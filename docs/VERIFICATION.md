# Local verification — updated 17 November 2026

## Private admin provisioning in progress — 17 November 2026

Later checkpoint: the owner completed R2 and Zero Trust Free activation and explicitly confirmed activation of the exact owner-only Access application. Cloudflare now reports the zone active. R2 portfolio-private-uploads was created in APAC; CLI verifies r2.dev disabled and no bucket custom domains. The Access application covers all admin.samjoseph.me paths with one email-Allow rule for sam.joseph04@gmail.com and a 24-hour session, using the organization's default Cloudflare identity provider. Actual team/audience and custom domain are configured in Wrangler. Worker version 3f2178a1-7c38-4608-9c4c-df59d8e5e9b7 deployed successfully with D1/R2/static assets. Alternate workers.dev and preview URLs remain disabled.

TLS-verified requests using curl --resolve with the actual Cloudflare-resolved edge address returned Access login redirects (302) for root, bundle JavaScript, content, resume, asset preview, publish, recovery, publish-state and deployment endpoints. A forged assertion header also returned 302. No certificate verification was disabled. Local recursive DNS still returns the old nameservers, so normal browser access is not yet verified. All 17 public game routes still return 200, and the public PDF remains the exact 360049-byte original hash. The dedicated fine-grained GitHub token form was prepared with only the portfolio repository, Contents write, Actions read, Metadata read, and 15 February 2027 expiration. The owner must generate and enter it directly into the prepared encrypted Worker secret field. No token value is read or stored by the agent. Real owner login/draft persistence/publishing remain pending.

Continued through the owner's signed-in supported in-app browser after their Namecheap device verification. Created Cloudflare's Free zone for samjoseph.me and preserved 11 scanned records. Explicitly set all public A/CNAME records to DNS-only, retaining direct GitHub Pages hosting. Inspected Namecheap: no email/domain redirects configured, DNSSEC already off. Saved assigned nameservers garrett.ns.cloudflare.com and pam.ns.cloudflare.com in Namecheap and observed the saved Custom DNS values. Propagation remains pending. Direct assigned-nameserver queries match the original four GitHub IPs, www alias, all five MX targets/priorities and SPF. Ignored artifacts retain before/after DNS snapshots. Public apex HTTPS still returns 200; the www alias produced a TLS failure and is not claimed as verified HTTPS.

Created remote D1 portfolio-drafts (1ea09dce-fd6e-42bc-8439-b3f6d6a5774e), applied 0001_drafts.sql, and queried sqlite_master to verify drafts/publishes tables. Configured actual nonsecret account/database IDs, admin origin and main branch locally. All 48 tests, admin production build and Worker dry-run packaging pass. No public content or layout was changed.

R2 is not enabled (Cloudflare error 10042); its subscription page requires owner acceptance of usage billing and terms. Zero Trust Free similarly reaches a billing/terms activation page. Both were handed to the owner without entering payment details or accepting agreements. Access organization/policy, R2 bucket, repository-scoped GitHub secret and actual protected Worker deployment are pending. No online admin authentication or live CMS publish is claimed. The earlier production-hosting entry below records the preceding checkpoint and is superseded by this provisioning status.

## Public production hosting — 17 November 2026

Public hosting is now authorized and verified. The source-only checkout was based on the existing main branch; master and its legacy history were not rewritten. Verified all pinned GitHub Action refs exist, enabled PORTFOLIO_DEPLOY_BRANCH=main, preserved the existing main/master deployment branch policies, changed Pages from legacy branch publishing to workflow deployment, and enabled HTTPS using the already approved certificate. PR #1 was merged after branch verification. Production run https://github.com/samjoseph04/samjoseph04.github.io/actions/runs/44040897895 completed with both verify and deploy successful at commit 0db41d898905c2747e74b5bebe44025ebc107196. Linux verification includes all 48 tests, builds and 49 legacy-file hashes. Committed public assets retain exact bytes through .gitattributes.

Live HTTPS GET / returned 200 with the new portfolio title and games/resume markup. All 17 audited game destinations returned 200. Live /resume.pdf returned 360049 bytes with SHA-256 420afd949f989cc93feed569b0cb7f31dc02ce41fe1398917f3da291d8cdb29e, identical to the supplied original. This checks reachability and file integrity, not fresh full gameplay runs or a production visual/accessibility audit.

Private admin remains unhosted. The owner completed Wrangler device authorization; credentials are encrypted with their key in Windows Credential Manager. The chosen custom hostname is admin.samjoseph.me and the confirmed Access identity is sam.joseph04@gmail.com. Domain nameservers are still at Namecheap. The attempted limited-token Access/R2 reads returned 403; no Cloudflare zone/resources or DNS were changed. Native computer use stopped because it could not establish Brave's browser URL with enough confidence. No alternative UI mechanism was used to bypass that guard. Account/registrar setup and secure repository-scoped Worker credentials are required before completing admin deployment. No new public screenshot was captured after the browser stop; production verification used the GitHub API and direct HTTP checks.

## Resume management repair — 17 November 2026

Inspected the original editor, IndexedDB/R2 upload storage, shared schema, Access checks, Git tree publisher, D1 publish/recovery records, deployment status and Pages workflow before editing. Uploads previously changed the public URL to a UUID under /assets, PDFs were always served as attachments even for preview, and the referenced initial PDF was outside the public folder. The user supplied its actual folder. Copied `assets/Sam_Joseph_Resume.pdf` unchanged to `apps/web/public/resume.pdf` and changed only the resume record in content. Source, public file, exported PDF and browser downloads are **360,049 bytes**, SHA-256 **420afd949f989cc93feed569b0cb7f31dc02ce41fe1398917f3da291d8cdb29e**. Its recorded initial upload/import date is this local import, not an inferred historic date.

The existing Resume section now shows the selected draft and upload metadata, validated inline preview, stable read-only public URL, current repository file and last verified deployed file/status. Local mode correctly labels its workspace version and keeps publishing disabled. Uploads get private immutable staging keys, PDF size/MIME/structure checks and server-side digest metadata. Publishing validates selected bytes again, atomically replaces the one canonical PDF and content, clears staging references, and removes only the previous legacy resume from the current Git tree. D1 and recovery use the committed normalized document. Unrelated assets and Git history survive. Asset previews use inline PDF responses; explicit download uses an attachment response. No public API/server feature was added to Next; the public button is a native same-origin named download at /resume.pdf. The build/export preflight rejects missing, malformed, private-staged or checksum-mismatched PDFs.

Passed: all workspace type checks, **48 tests**, both production builds, public export integrity (**17 games / 49 original game-file hashes**) and Worker dry-run packaging. New tests use the real Worker request handlers and signed Access JWTs with test JWKS, plus isolated D1/R2/GitHub/Actions doubles: invalid type/truncated/oversized rejection, cross-origin/unauthenticated denial, upload/save/explicit confirmed commit, missing/tampered staging rejection, replacement, legacy migration, older private-draft migration, removal, stale revision, idempotent retry, large-file Git Blob fallback, inline/attachment headers, exact bytes, pending versus skipped versus successful deployment, and retention of the prior verified live snapshot. These are account-independent integration tests, not real GitHub commits or real Actions executions.

Browser checks on an isolated local admin origin (5174; existing 5173 drafts were not changed): invalid PDF rejected; actual PDF uploaded, previewed, saved and reloaded from IndexedDB; staged download bytes matched; exported JSON retained /resume.pdf and metadata but cleared its private staging reference. The public static export downloaded the matching actual PDF at desktop size and inside a **measured 390px** frame through native keyboard activation. Both admin/public 390px documents had no horizontal overflow; exactly one Resume editor was present. The browser viewport override did not change the measured viewport, so an ignored local HTML frame harness was used instead. Physical iOS/Android behavior was not tested; those browsers may present their native PDF viewer/Save to Files controls. The global unpublished-portfolio iframe's blob download did not produce a browser download event in this IAB; its staged-file download and the actual public download were verified independently. This extra embedded-preview download is not claimed as verified. Screenshots: `resume-admin-updated.jpg`, `resume-mobile-verification.jpg` under docs/previews.

No dependency, cloud tenant, DNS, credential, Git branch or deployment setting changed. Nothing was pushed/deployed. Real Cloudflare Access/D1/R2, GitHub token permissions, branch rules, matching Actions run and domain/CDN refresh still require later authorized account testing; existing manual setup requirements in SETUP.md remain. Public PDF cache behavior on the real domain and cross-browser native PDF rendering were not tested. Structural PDF checks are not malware scanning or a full PDF parser.

## Reinstall while editing content — 17 November 2026

The reported `npm ci` EPERM failure was a Windows lock on the Lightning CSS native module held by the running project dev server. Logs also captured Next package resolution failures while npm was replacing node_modules. Stopped the project server through its retained process session, completed `npm.cmd ci --include=dev` without EPERM, then restarted `npm.cmd run dev`. The current JSON passes the shared schema; workspace type checks and all **46 tests** pass. SHA-256 before/after repair is identical (`698a13bd24a5ab0dee7e34ec5360317c2d4fa52ff2e175434aea0163c9476b74`). No user content was rewritten.

HTTP 200 serves the latest coursework and resume reference. A fresh browser preview hydrated without captured errors/warnings; expanding MCA displayed the user's current subjects and concepts. Evidence: `docs/previews/json-update-recovered.jpg`. README now distinguishes normal JSON editing (save while dev runs) from dependency reinstallation (stop project processes first). No push or deployment occurred.

Separate unresolved asset: `content/portfolio.json` references `/assets/Sam_Joseph_Resume.pdf`, but that PDF is absent from `apps/web/public/assets/`. The owner must supply/copy the real file at that path; the download currently returns 404. Schema validation alone does not verify asset existence, and no new production-export integrity success is claimed for this missing-asset state.

## Missing dependency startup repair — 17 November 2026

Reproduced the reported missing `sharp` package: it was declared in package.json/package-lock.json but absent from the installed root dependency graph. Ran `npm.cmd install --include=dev` to restore the declared workspace dependencies. `sharp@0.35.5` now resolves; `npm.cmd run dev` successfully generates the approved SJ assets and starts Next on 127.0.0.1:3000 using the installed Node 26.4.0. Workspace type checks and all **46 tests** pass. The public page returns HTTP 200 and renders after hydration without captured browser console warnings/errors. Opened a working preview at port 3000; port 8765 was an earlier stopped static-preview server. Screenshot: `docs/previews/dev-startup-repaired.jpg`.

No portfolio content or design changes were required. npm reported cleanup warnings for old loaded native-module copies; installation completed successfully and did not require deleting files or stopping the existing admin server. No cloud deployment or Git push was performed.

## Cursor refinement — 16 November 2026

Supersedes the idle-cursor branding recorded below: the custom cursor now contains no SJ SVG/logo. Ring, center dot, trail, Motion springs, contextual labels and click pulse remain. Native pointer hiding is scoped to the public portfolio and only enabled once the eligible mouse cursor is positioned and visible. Text fields receive custom I-beam feedback, disabled controls retain a DISABLED label and explicitly draggable elements support DRAG. Scrolling/resize re-hit-test through the existing shared RAF, without hiding the cursor. Reset/cleanup restores native behavior for keyboard, pointer exit, blur, non-mouse input and reduced-motion changes. No new mouse trackers or animation libraries; legacy game CSS/source remain unchanged.

Passed: workspace type checks, **46 tests**, both builds and static export integrity (**17 games / 49 unchanged source-file hashes**). Production-export browser checks confirmed no SVG inside cursor overlays, native computed `cursor: none` on the active root/links/buttons/input, visible ring during page scrolling, FILTER feedback and text I-beam state. Tab restored native behavior and focused the next game-navigation button; Enter activated a category filter. At 390 × 844, there was no horizontal document overflow; the mobile menu opened and Escape closed it/restored focus. Existing automated eligibility tests cover coarse/non-hover, reduced-motion, touch and pen rejection. Physical touch hardware, OS reduced-motion changes and native drag/drop were not exercised. Screenshot: `docs/previews/cursor-refinement-desktop.jpg`.

## Approved SJ branding — 16 November 2026

The approved source SVG is now the single authored geometry for `BrandMark`, generated component data and browser icons. Exact path strings, viewBox and dot coordinates are checked against that SVG. Header, footer, loading indicator and idle desktop cursor use the same component; interactive cursor labels are retained. SVG and 16/32/48px PNG-backed ICO assets are generated from the source and centralized theme primitives before public dev/build commands. Existing `/icon.svg` and `/favicon.ico` paths display the approved mark too.

Passed: workspace TypeScript checks, **46 tests**, public static export, admin build and export verification including both themed icon formats, **17 game routes / 49 original game-file hashes**. New tests verify exact geometry, generated palettes and ICO dimensions, validated first-paint theme selection, live icon synchronization, blocked storage and repeated bootstrap without duplicate nodes. No dependencies were added. Content and portrait assets were not edited.

Production-export browser checks at 1440 × 900 and 320 × 740 confirmed matching header/footer shapes and theme fills, no document overflow, mobile menu navigation, idle-cursor SJ geometry and retained contextual labels. Saved-light refresh was checked after hydration: exactly two live icon links (one SVG and one ICO), both light; toggling updates both to dark. Saved-dark refresh also retains exactly two icons. A pre-hydration read observed the boot indicator controlled by the existing initialization gate; it disappeared after initialization. No console warning/error entries were captured during these checks. Screenshots are in `docs/previews/sj-logo-*.jpg`. Browser tab-chrome rasterization across other browsers was not tested. The static site resolves immediately, so the route-loading fallback was verified through shared-component tests rather than an artificially delayed navigation. Reduced-motion CSS disables the new indicator pulse; no pointer or scroll listeners were added.

## Four-tone visual theme — 16 November 2026

Public styles now derive from four primitives in theme.css: #1E1817, #070100, #70726D and #D1CDC8. Old blue/cyan/violet variables, component fallbacks and visible public color literals were removed. Semantic colors cover both text polarities, muted text, borders, inset/raised/hover surfaces, gradients, cursor/pulses, pointer lighting and heading sheen. Native selection/focus states use contrasting palette pairs. Masks retain alpha-only black where needed; these do not add visible colors. Independent legacy game files retain their original visuals and bytes.

Dark sections blend surface-to-deep-to-surface; light sections use a restrained paper/secondary mixture and return to paper at both edges. The shared full-viewport boundary gradients retain their existing straight 180-degree geometry and use the new exact surface endpoints. Hero masks now blend into the warm primary surface without altering the portrait. The supplied SJ mark retains both exact path strings and dot geometry; an inline component lets global tokens tint its letters/dot. The original source SVG stays intact. The separate favicon uses surface/paper literals.

Passed: workspace type checks, **38 tests**, public static export, admin build and preservation of **17 routes / 49 original game-file hashes**. Content JSON is byte-identical to the pre-theme snapshot. No animation/scroll driver changes or new dependencies. Static source audit finds no prior accent variables or blue/cyan/violet literals in public app styles/components.

Contrast calculations using sRGB relative luminance: paper on primary surface **11.08:1**; deep on paper **13.10:1**; derived dark muted text on the brightest raised/hover panel **6.65:1**; derived light muted text on the darkest light inset **4.81:1** (ordinary coursework inset **5.53:1**). Exact secondary on primary is only 3.60:1, so it is used for decorative/secondary details rather than small body text. These measurements validate the configured role pairs, not every possible pixel over the portrait or every transient animation frame.

Browser checks: all seven desktop section heights are unchanged at 1440×960; logo dimensions and stationary portrait geometry remain intact. Computed colors/gradients confirm new surface endpoints, readable text and tonal cards/cursor. Puzzle plus `maze` gives one Color Maze result; clearing/All restores 17. Native MCA disclosure opens/closes and retains a visible keyboard outline with the light-surface text/panel tokens. Responsive viewport inspection at 320px checks overflow and the retained layout. Physical touch hardware, OS reduced-motion toggles and formal screen-reader/performance audits were not exercised in this color-only pass; existing motion/reduced-motion code is preserved.

Previews: [tonal desktop](previews/tonal-desktop.jpg), [tonal Games](previews/tonal-games.jpg), [tonal mobile](previews/tonal-mobile.jpg). The user-owned local dev server is preserved. Nothing pushed, deployed or changed on the live site.

## Bidirectional scroll replay — 15 November 2026

The audit found two one-shot paths in CinematicMotion: finishing removed the target from observation, and targets above the initial viewport were immediately finished. Both prevented upward replay, particularly after bottom/middle restoration. No GSAP/ScrollTrigger or `whileInView`/`once` configuration remains in the public components; there is no second scroll controller to synchronize.

The existing driver now keeps all targets registered and observed until removal/teardown. Full exits cancel/reset; re-entry plays with mirrored upward text offsets and image wipes. RevealCycle revisions and playback identity checks invalidate cancelled completions. Observer instance guards and lifecycle cleanup prevent stale callbacks or duplicate setup. Image clipping/fading applies to the existing children inside observed stationary frames; group slides also affect contents rather than observed bounds. This avoids self-induced intersection changes at viewport edges. The small About symbol alone gains an inner span for the same reason. Focused controls stay visible. The existing reduced-motion/no-JS policies remain intact.

Window/image load, font readiness, content/disclosure changes, resize, hash/history navigation and pageshow restoration share one queued observation refresh. IntersectionObserver tracks ongoing layout changes natively; no cached document offsets, reveal scroll listener, extra animation layer or idle RAF loop was added. There are no transformations on images, section surfaces or background blends.

Passed: all workspace type checks, **38 tests**, both production builds and static export preservation of **17 destinations / 49 unchanged game files**. New regression tests cover repeated up/down cycles, initial above/below/inside positions, duplicate entry observations, cancelled/stale completions, focused visibility and symmetric viewport/rail edges. Content JSON and surfaces.css match their pre-fix snapshots byte for byte.

Explicit exported-site browser scenarios at 1440×960:

1. **Down through every section:** page-key steps at y≈0, 756, 1512, 2268, 3024, 3780 and 4510 show every section's visible targets revealing/completing downward. Fully departed targets become pending without inline overrides.
2. **Up through every section:** native End followed by PageUp reaches y≈4510, 3754, 2998, 2242, 1486, 730 and 0. All seven sections show upward re-entry; targets that never fully left stay revealed. Image transforms remain none.
3. **Fresh bottom load:** reload at `#contact` initializes at y≈4510. Every Hero target is pending with no previous direction; upward steps show Experience/Education, Games and Projects replaying upward. This confirms that initially above-viewport content stays armed.
4. **Midway refresh:** refresh at y≈2242 while URL remains `#contact` restores that actual scroll position. Visible Projects/Games targets finish normally; PageUp to ≈1486 shows upward About/Projects, and PageDown to ≈2242 shows downward Projects/Games.
5. **Section links then both directions:** clicking Play reaches `#games` at y≈2789. PageUp to ≈2033 replays Projects upward; PageDown returns to Games with downward replay. The native BACK TO TOP link returns to `#home` at y≈51 (section offset minus the existing 95px scroll padding); Hero replays upward. Subsequent scrolling remains functional.

Screenshots: [upward replay](previews/replay-upward-desktop.jpg), [mobile replay](previews/replay-mobile.jpg). Full DOM-state samples are kept in the ignored artifacts directory. Still frames show the preserved composition; the direction/reset assertions come from sampled DOM states and native interactions. Physical touch/pen hardware, live OS reduced-motion toggling, exhaustive browser combinations and a formal performance trace remain untested. Reduced-motion, focus and static fallback behavior have code/unit coverage. Native bfcache handlers are implemented, but the browser tool does not establish whether a history visit used bfcache, so that mechanism is not claimed as verified.

The user-owned dev server remains available; the owned static QA server is stopped after verification. No push, deployment or live configuration change occurred.

## Cinematic motion — 15 November 2026

Reference study: [Santalarch](https://santalarch.com/) was inspected in the browser for its oversized type, split word/line entrances, masked presentation and navigation cadence. Its immersive 3D sequences, assets and content were not imported. This portfolio adapts the pacing with restrained typography and stationary image reveals. The existing Motion dependency provides all animation; GSAP/ScrollTrigger and alternative scroll controllers were not added.

Shared CinematicText produces one unsplit accessible string plus aria-hidden visual tokens, preserves whitespace/punctuation, and keeps Unicode graphemes intact. CinematicMotion uses one IntersectionObserver plus a scoped child-list MutationObserver for filtered game results. No additional scroll listener/RAF loop is used. Word/character sequences have a maximum 0.36s stagger spread. Clip/opacity reveals never transform image frames or their images. Non-image entrances use a short fade/slide; the About symbol has a restrained scale entrance. Completed inline animation styles and temporary layer hints are released. Keyboard focus reveals pending controls immediately, hidden tabs finish running effects, and reduced-motion changes stop/reset the driver.

A fixed boot script prepares the first paint without a loader and fails open after 1.8 seconds if hydration never starts. Reduced motion skips the gate, no-JS markup stays visible, and delayed hydration does not re-hide visible content after expiry. Automated tests cover both preference paths, hydrated/failed startup, safe static markup, exact text/grapheme preservation and bounded sequence lengths. The development Strict Mode setup/cleanup/setup cycle was verified after fixing stale preparation state.

Native project and education disclosures now animate height/opacity through progressive CSS, without intercepting clicks or changing semantics. Unsupported browsers retain immediate native behavior. Only the Projects heading uses a CSS sticky hold, at desktop sizes of at least 1100×800 and without reduced motion; there are no pinned images, artificial scroll spacers or transforms on section surfaces. Native hash navigation/history is preserved. Cross-document dissolves are opt-in CSS enhancement; this site still has one portfolio page and in-place project details. Legacy games have no new motion code or cross-document opt-in.

Passed: workspace type checks, **34 tests**, public static export, admin production build and export preservation of **17 root destinations / 49 original game files**. The complete content JSON and shared straight-transition CSS are byte-identical to pre-change snapshots. No dependency changes were required.

Browser checks against the exported site:

- At **1440×960**, all seven section heights match the prior build exactly, and the portrait remains 743.55×590px with no transform. The 0.04px horizontal difference in one snapshot is subpixel rounding. No horizontal document overflow was observed.
- At **320×800** and **768×960**, no document overflow is present. Games remain in one horizontal row, with 17 accessible destinations and 320px consistent card heights at the narrow viewport. The project heading is static at both sizes. All four opposite-tone boundaries remain full-width vertical gradients with the actual ink/paper endpoints.
- Fresh initialization leaves below-fold targets pending and prepares only visible entrances; later sections reveal when reached. Stationary project-frame transforms remain none and completed clip paths clear to none. The Games heading remains readable with the existing pointer sheen active.
- Native project disclosure opens on click and closes on Enter; a nonzero closing height was observed while open=false, confirming the close transition. MCA disclosure remains keyboard operable with the truthful pending-coursework note. Focus remains on SUMMARY.
- Puzzle plus search `maze` produces one Color Maze result with the original `/color-maze/` destination. Clear/All restores 17. Keyboard End reaches the rail's approximately 3671px end with the next arrow disabled; Home restores its start. Keyboard focus exposes pending cards immediately.
- Mobile menu links animate, Play navigates to #games and the menu exits. The 404 document and its native return link remain available. Physical touch/pen hardware, OS reduced-motion preference toggling, formal screen-reader tests, cross-browser view-transition timing and a formal performance profile were not exercised. Reduced-motion/failed-startup policies and static accessibility are covered by tests/code, not claimed as physical-device verification.

Saved previews: [cinematic desktop](previews/cinematic-desktop.jpg), [cinematic mobile](previews/cinematic-mobile.jpg). These still frames document preserved composition; timing evidence comes from native interactions and DOM states, not the screenshots alone. The user-owned dev server was reused; only the owned static QA server is stopped after inspection. Nothing pushed, published, deployed or changed in live settings.

## Shared pointer, hover and click interactions — 13 November 2026

Replaced the original cursor with one delegated interaction layer. Motion springs independently animate the cursor dot, ring and faint trailing point; contextual states cover links, controls, project surfaces, filters, image viewing and native disclosures. Click feedback is a single short-lived ring. MagneticContent moves labels/icons inside stationary controls, with bounded displacement and a guard against moving image-containing content. Major headings use a subtle color sheen without displacement. Projects, games, navigation, buttons, disclosures and icons have lightweight hover/press/focus feedback. Portrait feedback changes frame/caption accents while the image stays stationary.

Games and Contact have a low-opacity gradient spot inside a clipped interior window. Its movement uses transforms, without repainting a full-page background or changing the straight section fades. The viewport-clipped pointer overlay prevents edge overflow. Tracking uses one root pointermove listener and at most one pending requestAnimationFrame; bounds are measured on active-target changes and reset after layout-affecting actions, scrolling or resize. There are no per-card pointer listeners, background idle tracking loops, image motion, scroll parallax, canvas effects or legacy-game modifications.

Passed: public/admin/Worker type checks, **30 tests**, both production builds and export integrity for **17 original game destinations / 49 unchanged files**. The three new tests cover pointer/reduced-motion eligibility, bounded magnetic offsets and degenerate/non-finite geometry. Content JSON and the straight-transition stylesheet are byte-identical to their pre-change snapshots.

Browser evidence:

- At actual widths **320, 768 and 1440px**, section heights and portrait/logo geometry match the previous build; no horizontal document overflow was observed.
- An off-center Arcade-filter click produced approximately **−2.08px / −2.47px** label displacement, selected three games and showed FILTER context. Native hit areas are not translated. A later click showed the short-lived pulse and localized lighting.
- After moving between two points, the dot/ring/trail had different intermediate positions, confirming the spring trail. For example, their horizontal positions were approximately **71.17 / 67.64 / 65.85px** during the same movement.
- Hovering a major heading activated the color sheen and interior lighting. Cursor/light overlays report pointer-events: none.
- Pointer movement onto the portrait produced VIEW context and a cyan caption; image transform and translate remained none, with unchanged geometry. Hero text remained present/readable during its sheen.
- Tab cleared magnetic/heading/light activity and hid the cursor. Space selected Puzzle and showed four games. Mobile menu Escape closed it, restored focus to Open navigation and left pointer effects cleared. The MCA native disclosure opened with truthful pending content and CLOSE context; Enter restored it closed. All 17 games were restored after testing.
- A viewport-edge pointer check confirmed document scrollWidth equals clientWidth (**1425px**), with the cursor visible and its overlay clipped. The console capture contains no errors.

Screenshots: [interactive Games](previews/interactive-games-desktop.jpg), [interactive hero](previews/interactive-hero-desktop.jpg), [mobile keyboard focus](previews/interactive-mobile-keyboard.jpg). Geometry evidence is in the ignored artifacts directory. Viewport overrides were reset and the owned server stopped after inspection.

Limits: physical touch/pen hardware, live OS reduced-motion preference changes, screen-reader sessions, formal performance tracing and exhaustive browser combinations were not exercised. Eligibility math and CSS media fallbacks are implemented/tested; viewport resizing alone still uses the desktop's fine pointer. The pointer manager is omitted from admin previews. Legacy gameplay and live cloud publishing were not changed or re-tested in this pass. No push, deployment, publication or live settings change occurred.

## Straight horizontal section transitions — 13 November 2026

Replaced both directional layers with one shared `linear-gradient(180deg, …)` in surfaces.css. About, Games, Experience and Contact all use the same gradient geometry and stops, with the endpoints reversed for the two directions. Solid endpoint areas frame a restrained central blend of the actual ink/paper colors. The secondary layer, masks, angle overrides and counter-direction effects are removed. No blur, transforms, extra color stops, spacers or animation are introduced. Matching-tone surfaces remain solid.

Only the transition stylesheet and documentation changed. Current Games sizing/centering, content, typography, spacing, focus behavior and animation code are preserved. Passed: public/admin/Worker type checks, all **27 tests**, both production builds and export integrity for **17 original game destinations / 49 unchanged files**. Content JSON remains byte-for-byte identical to the pre-change snapshot.

In-app browser verification at actual widths **320, 768 and 1440px** compares all seven sections before and after: widths, heights and padding are identical; document positions match within 0.01px floating-point tolerance. No horizontal document overflow is observed. Every opposite-tone transition spans left: 0 / right: 0, computes as a vertical gradient, and has no secondary layer, mask, filter or transform. The console capture contains no errors.

Desktop screenshot pixel spot-checks sample five columns across each of the four boundaries. In every case, the blend's midpoint occurs on exactly the same row at every sampled column (**zero vertical spread**), confirming horizontal alignment in the captured render. Mobile viewport inspection confirms straight transitions in both directions. These are browser/screenshot checks, not a guarantee about banding on every physical display or other rendering engine. The background gradients are static; OS reduced-motion settings were not toggled.

Screenshots: [straight desktop transition](previews/straight-transition-desktop.jpg), [straight mobile transition](previews/straight-transition-mobile.jpg). Geometry and desktop pixel evidence are in the ignored artifacts directory. Viewport overrides were reset and the owned server stopped after inspection. Nothing was pushed, published or deployed.

## Roomier Games and layered directional transitions — 13 November 2026

Increased Games section padding to a responsive 80–120px and expanded the heading/intro/control/carousel gaps. Card widths are unchanged. A content wrapper centers the title, original full description and category/PLAY group vertically inside cards with a responsive 320–360px minimum height and more internal spacing. Grid stretching keeps the row uniform; future longer content can increase its height without being clipped. Typography, accents, content and interaction code remain intact.

Replaced the broad uniform vertical fade with two static background layers at every opposite-tone boundary. The primary layer makes a shallow diagonal handoff between the actual adjoining ink/paper tokens; the secondary is a masked counter-direction gradient at 10% opacity. Responsive angle changes keep the overlap subtle on mobile and wide viewports. Both layers are behind content with pointer events disabled. There are no blur filters, explicit grey color stops, new spacers or scroll-linked effects. Matching-tone sections stay solid.

Passed: type checks, all **27 tests**, both production builds and static-export preservation of all **17 game destinations / 49 original game files**. Content JSON is byte-for-byte unchanged against a pre-change snapshot. No dependencies or cloud settings changed.

Browser measurements at actual widths **320 / 768 / 1440px**:

- Card widths remain approximately **233 / 248 / 280px**, identical to before the change. All 17 cards occupy one horizontal row.
- All card heights are **320 / 320 / 360px** respectively, increased from approximately 206 / 210 / 210px. Each content group's measured center is within 0.5px of its card center, including border rounding.
- Games section heights increase from approximately **687 / 643 / 621px** to **939 / 856 / 933px**. No horizontal document overflow is observed.
- Both gradient layers are present at About, Games, Experience and Contact, with a 0.1 secondary opacity and no filter. Additional checks at **2560 / 3840px** confirm the expected wide-screen angle variants and no page overflow.
- Next-arrow navigation advances the row. Searching Rally returns its single real link; clearing search while Puzzle is selected returns four games. All restores 17. Mobile Right scrolls the rail; Home restores offset zero. Console capture contains no errors. Temporary viewport overrides were reset and the owned preview server was stopped after inspection.

Screenshots: [roomier desktop Games](previews/games-roomier-desktop.jpg), [roomier mobile Games](previews/games-roomier-mobile.jpg), [mobile directional transition](previews/directional-transition-mobile.jpg). Detailed measurements are saved in the ignored artifacts directory. This is in-app browser evidence, not a physical-device, every-display banding assessment, OS reduced-motion or full gameplay test. Gradients themselves are static. Everything remains local; nothing was pushed, published or deployed.

## Minimal Games and refined section boundaries — 13 November 2026

Removed SCROLL TO EXPLORE with its footer wrapper/rule, numbered section eyebrow rows and crosses, redundant project count stamp, and contact eyebrow slogans/associated heading gap. Actual section headings, portrait caption, meaningful text, navigation and reveal animations remain. The public Games featured panel, decorative icon artwork/orbits, repeated tags, card ordinals, collection slogans and extra progress strip are removed. The remaining row shows titles, full unchanged descriptions, category labels and clear PLAY states. Filters/search/counts remain compact; native scrollbars and 44px arrows remain available. Mobile filters scroll horizontally so every category stays accessible without extra filter rows.

Opposite-tone boundaries now use one static, pointer-transparent gradient behind content, spanning the outgoing and incoming empty padding. Its eased color stops cover a nominal 52–112px total range, plus seam overscan. There is no added layout spacer, blur, image change or scroll-linked animation. Matching-tone surfaces remain solid.

Passed: `npm.cmd run check`, **27 tests**, both production builds and `npm.cmd run verify:export` with **17 original destinations and 49 unchanged source files**. Existing markup tests now verify all 17 accessible cards without the removed panel/artwork; content, URL, legacy metadata, audio and security tests still pass. A byte comparison confirms the entire content JSON is unchanged.

Browser evidence on the local static export:

- At actual widths 320, 768 and 1440px, all 17 cards occupy **one layout row**, with horizontal overflow confined to the scroll regions and no horizontal document overflow.
- Games section heights changed from approximately 1307/1197/1106px to **687/643/621px**, a reduction of **47%/46%/44%** respectively.
- Removed labels and featured panel are absent. All original h2 headings remain. Exactly About, Games, Experience and Contact receive the shared boundary gradient; measured fade extents fit the preceding and incoming padding, including the mobile Hero tail.
- Desktop next-arrow navigation advances the row; keyboard End reaches its final edge. Selecting Puzzle, then searching Archery, produces the truthful zero-result state; Reset filters restores all 17 games at offset zero. Searching memory finds the two matching Puzzle records. Mobile Casual returns three games, All restores 17, keyboard Right scrolls, and Home returns offset zero with the previous arrow disabled.
- Mobile navigation opens and its Play link closes the menu and returns to Games. The console capture contains no errors. The temporary viewport override was reset and the owned server stopped after inspection.

Screenshots: [minimal desktop Games](previews/games-minimal-desktop.jpg), [minimal mobile Games](previews/games-minimal-mobile.jpg), [cleaned mobile Hero/About boundary](previews/transition-minimal-mobile.jpg). Browser measurement evidence is in the ignored artifacts directory. These are viewport/browser checks, not physical touch-device or OS reduced-motion tests. Legacy gameplay internals were not changed or replayed in this pass. Work remains local-only; nothing was pushed, published or deployed.

## Continuous section backgrounds — 13 November 2026

Applied reusable `section-surface`, `surface-dark` and `surface-light` classes to all seven public sections. Shared adjacency selectors blend the four tone changes in both directions: Hero → About, Projects → Games, Games → Experience and Education → Contact. The same static gradient scales from 28 to 64px within existing top padding; its painted image includes one extra pixel of overscan. Exact adjoining color tokens and a one-pixel same-color underpaint address fractional-pixel joins. Matching-tone sections stay solid. No spacers, filters, waves, image changes, scroll listeners or added animation are used; content, typography, padding and existing animation code remain unchanged.

Passed: `npm.cmd run check`, all **27 existing tests**, both production builds and `npm.cmd run verify:export` (seven sections, all 17 original destinations and 49 unchanged game files). No new tests were added for this reversible presentation change.

The restored in-app browser tooling allowed local visual verification in this turn. Measurements before and after the change at actual CSS viewport widths **320, 768 and 1440px** show identical section heights and top/bottom padding, with maximum reported position differences below **0.001px** from floating-point scroll coordinates. No horizontal document overflow was observed. Exactly About, Games, Experience and Contact receive gradients; each fade ends before the first text. Desktop/mobile screenshots show both directions, same-tone sections stay continuous, internal heading/timeline rules remain intact, and anchor navigation still reaches the expected sections. The console capture contains no error entries. Temporary viewport overrides were reset and the owned preview server was stopped after inspection.

Screenshots: [desktop light-to-dark blend](previews/section-blend-desktop.jpg), [mobile dark-to-light blend](previews/section-blend-mobile.jpg). Local measurement evidence is saved in the ignored artifacts directory. The visual checks are from the in-app browser, not physical devices or every display/browser combination; an actual reduced-motion setting was not toggled. The background gradients themselves are static. This review does not replace the earlier outstanding full Games/audio interaction checks. Nothing was pushed, deployed, published or changed on a live account.

## Compact horizontal Games and accent palette — 13 November 2026

Replaced the multi-row grid with a single native horizontal rail at every breakpoint. Cards have smaller category-colored artwork, full untruncated descriptions and explicit PLAY states. Blue, muted violet and cyan accents extend to portfolio controls, project borders/tags, education disclosures, contact links and focus states while surfaces, typography, portrait and supplied logo remain predominantly monochrome. The featured panel is shallower, with compact icon placement on mobile. No content JSON or game source was edited.

The rail exposes labeled 44px arrow buttons, a focusable region with Left/Right/Home/End navigation, native touch/trackpad/scrollbar access and visible scroll progress. Scroll/resize observers update disabled edge states, filtering resets to the first result and reduced motion uses instant navigation. All game links remain rendered and accessible without JavaScript.

Passed: public/admin/Worker type checks, **27 automated tests**, public static export, admin build and export preservation of all **17 destinations / 49 unchanged source files**. New automated coverage verifies fractional edge positions, overscroll clamping, resizing to a non-overflowing row and accessible static navigation markup. Existing search/category/featured/audio/security tests still pass. A pre-change snapshot comparison confirms content is identical. The exported page returned HTTP 200 on a loopback server; opening a preview through the app was queued, which is not evidence of a rendered preview.

**Browser limitation:** native Computer Use captured browser state but stopped before local preview navigation because it could not establish the current URL with sufficient confidence. No further UI input was attempted after that stop. Desktop/mobile visual appearance, touch swiping, actual arrow/key navigation and focus scrolling still require browser verification; no new screenshot or overflow result is claimed. Earlier browser records below predate this redesign. Nothing was pushed, deployed, published or changed on a live account.

## IST clock, ambient audio and Games enhancement — 13 November 2026

The new header utility strip contains a hydration-safe, second-updating India clock and an opt-in audio button. Quiet original tones are generated through Web Audio after a user click; no external audio file, network request or autoplay is used. The saved preference never bypasses the gesture requirement. Disable, hidden tab, page exit, game launch and browser suspension stop the session and release its resources. Errors are announced through a status region. Rapid cancellation while `resume()` is pending cannot create delayed playback.

The Games section now has 17 distinct Lucide icons, responsive three/two/one-column cards, visible PLAY actions, focus/touch feedback, reduced-motion-aware entrance/hover/filter transitions, instant search, search-aware category counts and a manually selectable featured panel. `featured` is validated and editable in Studio, with false defaults for legacy records. Archery, Memory Grid and Rally are initial highlights; up to five matching highlighted games are offered, with a filtered-results fallback. Game artwork is decorative vector iconography, not a screenshot or invented gameplay state. No game source, portrait, logo or unrelated section was redesigned.

Current automated checks:

- `npm.cmd run check`: public, admin and Worker TypeScript pass.
- `npm.cmd test`: 26 tests pass, including IST midnight conversion, search/category/tag matches, featured fallback/legacy defaults, all 17 accessible static play cards and distinct icons, initially-off sound markup, lazy audio construction, resource cleanup, pending-resume cancellation, rejected playback and unexpected browser suspension.
- `npm.cmd run build`: Next static export and separate admin build pass.
- `npm.cmd run verify:export`: seven sections, 17 original root game routes, all 49 unchanged game file hashes, assets and domain files pass.
- One-off comparison against a local pre-change snapshot confirms every pre-existing content field, including all descriptions/categories/URLs, is unchanged. Only `featured` flags were added.
- `npm.cmd run bundle -w @portfolio/worker`: dry-run packaging passes; no deployment occurs.

**Current browser limitation:** native Computer Use stopped before preview testing because it could not determine the browser URL with sufficient confidence to enforce its policy. No further UI automation was attempted. These enhancements have not yet received a new desktop/mobile visual pass, real touch/keyboard interaction pass or audible speaker/headphone check. Audio tests use a deterministic mocked AudioContext; they verify lifecycle behavior, not perceived sound quality or actual browser playback. Previous browser evidence in this file applies to the earlier implementation. Local work only: no push, publish, deployment, account or DNS changes.

## Interactive education

Both degree entries now have independent native coursework disclosures within the original date/title timeline grid. A reduced-motion-aware Motion entrance and rotating chevron provide subtle feedback. The four list categories and optional note are stored under each education record's `coursework` object and edited in Studio → Education. All permanent coursework lists are empty at the user's request; no example subjects were inferred or added. The Bachelor's level follows the user's confirmation; its precise qualification/institution remains unspecified.

All **18 tests** pass, including new coverage for legacy draft defaults, JSON/schema round trips, list limits/types, native disclosure server markup, truthful pending messages and escaped coursework text. TypeScript checks, both production builds, the static export/game-integrity check and Worker dry-run packaging pass. No SQL migration is needed: coursework is an additive field in the existing JSON document.

Browser verification:

- Clicking MCA expands four clearly labeled pending categories; the Bachelor's entry expands independently with Enter. Space collapses MCA while leaving the other panel open.
- Desktop keeps the date column and existing timeline alignment. At 390 and 320px, details stack into one column with no horizontal overflow.
- An older browser-local draft loaded with empty coursework defaults. A clearly labeled temporary QA degree was created, filled across all four categories, saved and reloaded. Its actual portfolio preview displayed every entered item. That test entry was then deleted and the original two-entry draft restored; no test coursework remains in public content.
- Public and admin console captures showed no errors. Native server-rendered details/panel content was verified in automated tests; a JavaScript-disabled browser session and actual OS reduced-motion toggle were not exercised.

Screenshots: [desktop accordion](previews/education-desktop.jpg), [mobile accordion](previews/education-mobile.jpg). All work remains local-only; live cloud publishing and GitHub Actions deployment were not performed.

## Decorative label cleanup

Removed the DEVELOPER PORTFOLIO header tagline and the four specified hero labels. Deleted their unused wrappers, responsive styles and reserved composition margin. The name wordmark, logo, portrait caption, role/introduction, project link and scroll cue/arrow remain. Animation code, portrait blending and responsive grid sizes are unchanged.

TypeScript checks, both production builds and static-export/game-integrity verification pass. Browser checks at 320, 390, 768 and 1440px confirmed no horizontal overflow, no removed label elements, zero leftover composition margin, and successful portrait loading. Mobile menu open/Escape-close still works; the console capture contains no errors. Work remains local-only.

Screenshots: [cleaned desktop hero](previews/hero-cleaned-desktop.jpg), [cleaned mobile hero](previews/hero-cleaned-mobile.jpg).

## Supplied logo applied

The user-supplied SJ-and-grey-dot mark replaces the earlier geometric header logo. Its two letter shapes were faithfully traced into a 5.6 KB SVG; the original brand sheet is retained unchanged as audit evidence. The existing wordmark, header dimensions, home link and hero remain intact. TypeScript checks, both production builds and static-export/game-integrity verification pass. Browser checks confirmed the SVG loads, preserves its aspect ratio, and fits the header at desktop and 320px mobile widths without overflow or navigation overlap. See [updated header](previews/supplied-logo-header.jpg). No push or deployment was performed.

## Header and hero refinement

The public header now uses a geometric inline SVG SJ monogram with the SAM JOSEPH wordmark. The existing hero grid/heights are retained; the portrait extends slightly beneath the oversized text, with static gradient masking and a 3px backdrop blur limited to its left boundary. On stacked mobile layouts, the fade and 2px boundary blur run along the top edge instead. The actual image has no filter or transform; the face is outside the blurred boundary. Original portrait bytes are unchanged.

After this refinement, TypeScript checks, both production builds, all 14 existing tests, and static-export/game-integrity verification pass. Browser checks at widths from 320 to 1440, including mobile/tablet breakpoints, found no horizontal overflow or overlap between the brand and navigation. The wordmark stays visible, the portrait loads, the home link remains functional, and mobile menu open/Escape-close behavior passes. Browser console captures showed no errors. Work remains local; nothing was pushed or deployed.

Updated screenshots: [refined desktop hero](previews/hero-refined-desktop.jpg) and [refined mobile hero](previews/hero-refined-mobile.jpg). Earlier screenshots below document the initial implementation.

No GitHub push, cloud deployment, DNS change, remote database migration, or live publishing occurred. All GitHub integration tests use mocked transports. The source audit used read-only public HTTP requests. The local Git repository remains uncommitted with no configured remote.

## Passed

| Check | Result |
| --- | --- |
| `npm run check` | Next route type generation, public/admin/Worker TypeScript checks pass |
| `npm test` | 42 tests pass |
| `npm run build` | Next.js static export and separate Vite admin build succeed |
| `npm run verify:export` | Seven requested sections; 17 preserved original game routes; 49 unchanged game files; referenced assets; CNAME/.nojekyll; truthful missing-content states |
| `npm run bundle -w @portfolio/worker` | Wrangler dry-run packaging succeeds; no deployment |
| `wrangler d1 migrations apply portfolio-drafts --local` | Initial migration succeeds against local D1 only |
| Dependency install/audit | npm reports zero vulnerabilities for the installed lockfile |
| Original supplied JPEG | SHA-256 matches the user's original exactly: `f43ce3835d4912b69f4928f11e1994d4ea089c17b536dc1a1cce6fb6c2cbe7d9` |
| Responsive portrait | Full image retained, normally resized/encoded WebP files generated; mobile browser loads 720px derivative |

Toolchain used locally: Node 26.4.0 and npm 11.17.0 on Windows. CI is configured for Node 24; that CI environment itself has not run. Package engines require Node 22.12 or later. The lockfile records the resolved dependencies.

## Meaningful automated coverage

- Shared content schema accepts missing optional information, rejects invalid contact/URLs, embedded URL credentials, duplicate IDs, unsafe paths, wrong resume types, and preserves text as data.
- Access JWT verification checks RS256 signature, issuer, audience, required identity/time claims and expiry. Missing/invalid sessions fail. Unconfigured authentication fails closed rather than enabling demo mode.
- Unsigned requests to both API routes and admin static assets fail before accessing D1, R2 or GitHub.
- Cross-origin mutation requests and same-site requests from a different origin are rejected. Streaming payload limits also apply without a trustworthy Content-Length header.
- File uploads require supported MIME type and matching file signature, reject active formats, empty bodies and sizes above 5 MB.
- GitHub publishing uses an existing base tree, allowlisted content/assets paths, one commit, and a non-forced ref update. Stale heads and rejected ref updates fail; unknown outcomes retain their commit reference for recovery.
- Deployment status distinguishes an actual successful deploy job from an overall successful workflow with a skipped/absent deploy job.

## Browser checks

Checked the exported portfolio on a loopback static server and the local studio on Vite. Temporary tabs and viewport overrides were cleaned up after testing.

- Desktop layout at a 1440 × 900 viewport and mobile at 390 × 844; also inspected 320 × 740. No horizontal document overflow was observed at 390 or 320. Portrait loaded correctly at each checked size.
- The seven public sections, original social/source links, explicit missing resume/email/experience/institution states, and absence of prohibited standalone sections were confirmed.
- Puzzle category filter returns four games. Searching for an unmatched term shows a usable empty state; Reset filters restores the 17 listings.
- Mobile navigation opens; Escape closes it and restores focus. The project case-study disclosure opens with Enter.
- Local studio create/update/save/reload/delete flow passed with a temporary skill entry, which was removed; the original ten skills were restored.
- Local upload of the actual supplied JPEG succeeded, previewed at its original 2979 × 2383 dimensions, persisted through a saved draft and reload via IndexedDB, and was then replaced with the original optimized portrait reference. The QA upload remains an unreferenced browser-local staging object; no file was sent to a remote service.
- Desktop and 390px mobile previews render the actual shared portfolio inside a same-origin iframe. Local publishing is visibly disabled.
- Browser console captures for the public page, studio and Rally showed no error entries during the checks.
- Bus Game starts its original timed counter game. Glow responds to a cell click with a move increment and neighbouring toggles. Rally starts and advances its score. These are representative smoke tests, not complete playthroughs of all 17 games.
- All 17 live game destinations returned HTTP 200 at audit time; every corresponding source file returned live bytes equal to its immutable GitHub source revision. This verifies reachability/integrity, not every game mechanic or touch/browser combination.

Saved screenshots: [desktop portfolio](previews/portfolio-desktop.jpg), [mobile portfolio](previews/portfolio-mobile.jpg), [local studio](previews/studio-desktop.jpg).

## Implementation review and limits

Reduced motion is implemented through `MotionConfig reducedMotion="user"`, `useReducedMotion`, and CSS media rules. The custom cursor is disabled for reduced motion/coarse pointers and has pointer-events disabled. The portrait has no transforms, scroll coupling, pointer coupling, warping or distortion. Native disclosures, real links, server-rendered content and a noscript mobile navigation fallback support progressive enhancement. An actual OS reduced-motion toggle, JavaScript-disabled browser session, screen reader session and full automated accessibility/performance audit were not executed.

The portrait delivery uses roughly 128 / 281 / 497 KB WebP derivatives rather than loading the 2.6 MB original in the hero. The admin lazily loads portfolio preview code. No third-party font/script network request is required. No formal Lighthouse/Core Web Vitals score is claimed.

Cloudflare Access sign-in, real tenant JWKS, production D1/R2 persistence, live GitHub token permissions/branch rules, webhook-triggered Actions, custom-domain HTTPS, interrupted-publish recovery against real account history and live rollback still require a later owner-authorized setup and end-to-end account testing. The API code and configuration are prepared; **live publishing is not claimed to work before that configuration/testing**. See [SETUP.md](SETUP.md).

JSON export from the local studio contains content references, not uploaded binary files. Browser-only draft saving does not write into the project folder. This limitation is stated in README.md and the local UI. The owner must copy/export reviewed content and staged files for a local build, or later use the configured private Worker publishing flow.
