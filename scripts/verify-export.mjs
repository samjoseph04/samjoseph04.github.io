import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const audit = JSON.parse(await readFile(new URL('docs/audit/games.json', root), 'utf8'));
const content = JSON.parse(await readFile(new URL('content/portfolio.json', root), 'utf8'));
const html = await readFile(new URL('apps/web/out/index.html', root), 'utf8');
for (const id of ['home', 'about', 'projects', 'games', 'experience', 'education', 'contact'])
  assert(html.includes(`id="${id}"`), `Missing section ${id}`);
for (const id of ['tech-stack', 'fundamentals', 'achievements', 'skills'])
  assert(!html.includes(`id="${id}"`), `Prohibited section ${id}`);
for (const item of content.games) {
  if (item.destination.startsWith('/'))
    await access(new URL(`apps/web/out${item.destination}index.html`, root));
}
for (const path of [
  content.personal.portrait,
  content.resume.file,
  ...content.projects.map((p) => p.image),
].filter(Boolean))
  await access(new URL(`apps/web/out${path}`, root));
if (content.resume.file) {
  assert.equal(content.resume.file, '/resume.pdf', 'Resume URL must remain stable.');
  assert(!content.resume.stagedFile, 'Private staged resume references must not be exported.');
  const exported = await readFile(new URL('apps/web/out/resume.pdf', root));
  const original = await readFile(new URL('apps/web/public/resume.pdf', root));
  assert(exported.equals(original), 'Exported resume bytes changed.');
  if (content.resume.sha256) assert.equal(createHash('sha256').update(exported).digest('hex'), content.resume.sha256);
  assert(html.includes('href="/resume.pdf"'));
  assert(html.includes('download="Sam-Joseph-Resume.pdf"'));
}
for (const file of audit.files) {
  const bytes = await readFile(new URL(`apps/web/out/${file.path}`, root));
  assert.equal(
    createHash('sha256').update(bytes).digest('hex'),
    file.sha256,
    `Legacy file changed: ${file.path}`,
  );
}
// CMS owners may change or remove listings; the original game URLs/files survive.
for (const game of audit.games)
  await access(new URL(`apps/web/out${game.destination}index.html`, root));
assert.equal((await readFile(new URL('apps/web/out/CNAME', root), 'utf8')).trim(), 'samjoseph.me');
await access(new URL('apps/web/out/.nojekyll', root));
for (const theme of ['dark', 'light'])
  for (const format of ['svg', 'ico']) {
    const path = `/brand/favicon-${theme}.${format}`;
    await access(new URL(`apps/web/out${path}`, root));
    assert(html.includes(path), `Missing browser icon configuration: ${path}`);
  }
await access(new URL('apps/web/out/favicon.ico', root));
assert(html.includes('class="footer-monogram"'), 'Footer must use the approved shared mark');
assert(!html.includes('sam.joseph@example.com'));
assert(!html.includes('/api/contact'));
assert(html.includes('PDF to be added') || content.resume.file);
console.log(
  `Static export verified: 7 sections, ${audit.games.length} preserved games, ${audit.files.length} unchanged game files, themed SJ icons, CNAME, .nojekyll, and truthful missing-content states.`,
);
