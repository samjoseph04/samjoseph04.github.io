import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  portfolioSchema,
  assetPath,
  externalUrl,
  referencedAssets,
} from '../packages/content/schema';
const seed = JSON.parse(
  readFileSync(new URL('../content/portfolio.json', import.meta.url), 'utf8'),
);
test('current content validates and the migration audit retains the original game inventory', () => {
  const content = portfolioSchema.parse(seed);
  const audit = JSON.parse(
    readFileSync(new URL('../docs/audit/games.json', import.meta.url), 'utf8'),
  );
  assert.equal(audit.games.length, 17);
  assert.equal(
    new Set(audit.games.map((game: { destination: string }) => game.destination)).size,
    17,
  );
  assert.equal(referencedAssets(content).length, new Set(referencedAssets(content)).size);
  const missing = structuredClone(content);
  missing.personal.email = '';
  missing.resume.file = '';
  assert(portfolioSchema.safeParse(missing).success);
});
test('validation rejects duplicate record IDs, script URLs, unsafe asset paths, invalid contact and non-PDF resumes', () => {
  const duplicate = structuredClone(seed);
  duplicate.games = [
    {
      id: 'test',
      name: 'Test',
      description: 'Test',
      category: 'Arcade',
      tags: [],
      destination: '/test/',
    },
    {
      id: 'test',
      name: 'Test',
      description: 'Test',
      category: 'Arcade',
      tags: [],
      destination: '/test/',
    },
  ];
  assert(!portfolioSchema.safeParse(duplicate).success);
  for (const url of [
    '',
    'javascript:alert(1)',
    'http://unsafe.example',
    'https://user:secret@example.com',
  ])
    assert(!externalUrl.safeParse(url).success);
  for (const path of [
    '/assets/../.github/workflows/pages.yml',
    '/assets/a.svg',
    '/assets/a.js',
    '/assets/nested/a.jpg',
    '//outside/a.png',
    '/assets/a.png?x=1',
  ])
    assert(!assetPath.safeParse(path).success);
  const invalid = structuredClone(seed);
  invalid.personal.email = 'not-an-email';
  assert(!portfolioSchema.safeParse(invalid).success);
  invalid.personal.email = '';
  invalid.resume.file = '/assets/resume.png';
  assert(!portfolioSchema.safeParse(invalid).success);
});
test('empty optional links do not throw and untrusted text remains plain text data', () => {
  const content = structuredClone(seed);
  content.personal.about = '<script>alert(1)</script>';
  assert.equal(portfolioSchema.parse(content).personal.about, content.personal.about);
});
