import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { portfolioSchema, courseworkSchema, emptyCoursework } from '../packages/content/schema';
import EducationTimeline from '../apps/web/components/EducationTimeline';

const seed = JSON.parse(
  readFileSync(new URL('../content/portfolio.json', import.meta.url), 'utf8'),
);
const degree = {
  id: 'qa-degree',
  title: 'QA degree fixture',
  organization: '',
  period: '',
  description: '',
};

test('legacy education drafts gain empty coursework fields without inventing subjects', () => {
  const legacy = { ...structuredClone(seed), education: [degree] };
  const parsed = portfolioSchema.parse(legacy);
  assert.deepEqual(parsed.education[0].coursework, emptyCoursework());
  parsed.education.push({ ...degree, id: 'qa-second-degree', coursework: emptyCoursework() });
  parsed.education[0].coursework.subjects.push('Temporary QA subject');
  assert.deepEqual(parsed.education[1].coursework.subjects, []);
});

test('all coursework categories survive validation and JSON draft/publish round trips independently', () => {
  const content = {
    ...structuredClone(seed),
    education: [
      {
        ...degree,
        coursework: {
          subjects: ['  QA subject  '],
          programmingLanguages: ['QA language'],
          technologies: ['QA technology'],
          concepts: ['QA concept'],
          note: 'QA context',
        },
      },
    ],
  };
  const parsed = portfolioSchema.parse(content);
  const roundTrip = portfolioSchema.parse(JSON.parse(JSON.stringify(parsed)));
  assert.deepEqual(roundTrip.education[0].coursework, {
    subjects: ['QA subject'],
    programmingLanguages: ['QA language'],
    technologies: ['QA technology'],
    concepts: ['QA concept'],
    note: 'QA context',
  });
  for (const invalid of [
    { ...emptyCoursework(), subjects: 'not a list' },
    { ...emptyCoursework(), programmingLanguages: [''] },
    { ...emptyCoursework(), concepts: [123] },
    { ...emptyCoursework(), technologies: Array(51).fill('QA item') },
  ])
    assert(!courseworkSchema.safeParse(invalid).success);
});

test('education retains native keyboard/no-JS disclosures and timeline information with honest empty states', () => {
  const entry = { ...degree, period: 'QA dates', coursework: emptyCoursework() };
  const markup = renderToStaticMarkup(createElement(EducationTimeline, { items: [entry] }));
  assert(markup.includes('<details'));
  assert(markup.includes('<summary'));
  assert(!markup.includes('<details open'));
  assert(markup.includes('QA dates'));
  assert(markup.includes('Institution / organization to be added'));
  for (const label of ['Subjects', 'Programming languages', 'Technologies', 'Concepts'])
    assert(markup.includes(label));
  assert(markup.includes('Coursework details will be added once confirmed.'));
  assert(!markup.includes('height:0'));
});

test('entered coursework displays as escaped text and stops showing the overall pending note', () => {
  const coursework = { ...emptyCoursework(), subjects: ['<script>QA</script>'] };
  const markup = renderToStaticMarkup(
    createElement(EducationTimeline, { items: [{ ...degree, coursework }] }),
  );
  assert(markup.includes('&lt;script&gt;QA&lt;/script&gt;'));
  assert(!markup.includes('<script>'));
  assert(!markup.includes('Coursework details will be added once confirmed.'));
});
